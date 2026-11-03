import * as crypto from 'crypto';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import type { Device } from '../shared/types';

/**
 * 本机联动接口（给 MoteDeck 用）。
 *
 * 只监听 127.0.0.1，端口随机，每次启动换一个随机 token；启动后把
 * {host, port, token} 写到 userData/mote-deck.json，退出时删掉。
 * 这样别的程序既猜不到端口也拿不到 token，免开任何防火墙规则。
 */

export const DISCOVERY_FILE_NAME = 'mote-deck.json';
const PROTOCOL = 'openmexia-local-api';
const PROTOCOL_VERSION = 1;
const MAX_BODY_BYTES = 8 * 1024;

export interface ControlOption {
  op: string;
  label: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  model: string;
  roomName: string;
  online: boolean;
  on: boolean;
  controls: ControlOption[];
}

/** 设备源（MockProvider / MiioProvider 都满足这个形状）。 */
export interface DeviceDispatcher {
  snapshot: () => Device[];
  setPower: (id: string, on: boolean) => void;
  setBrightness: (id: string, value: number) => void;
  setColorTemperature: (id: string, value: number) => void;
  setSpeed: (id: string, value: number) => void;
  setField?: (id: string, field: string, value: any) => void;
  callAction?: (id: string, key: string) => void;
}

export interface LocalApiOptions {
  userDataDir: string;
  appVersion: string;
  appPid: number;
  /** 每次请求现取，设备源重建后自动跟上。 */
  dispatcher: () => DeviceDispatcher | null;
}

export interface LocalApiHandle {
  /** 监听成功后才会有值。 */
  port: () => number;
  close: () => void;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const POWER_TYPES = ['plug', 'light', 'fan', 'aircon', 'purifier'];

/** 按设备快照推导这台设备能被遥控器触发的操作。 */
export function controlsFor(device: Device): ControlOption[] {
  const out: ControlOption[] = [];
  const add = (op: string, label: string) => out.push({ op, label });

  if (POWER_TYPES.includes(device.type)) {
    add('power_toggle', '开关切换');
    add('power_on', '开机');
    add('power_off', '关机');
  }
  if (device.type === 'light') {
    add('brightness_up', '亮度 +');
    add('brightness_down', '亮度 −');
    add('color_temp_warm', '色温变暖');
    add('color_temp_cool', '色温变冷');
  }
  if (device.type === 'fan' || device.type === 'aircon') {
    add('speed_up', '风速 +');
    add('speed_down', '风速 −');
  }
  if (Array.isArray(device.modeList) && device.modeList.length) {
    add('mode_next', '模式切换');
  }
  if (Array.isArray(device.targetTempRange) && device.targetTempRange.length >= 2) {
    add('temp_up', '温度 +');
    add('temp_down', '温度 −');
  }
  if (device.type === 'fan' || device.type === 'aircon') {
    if (device.horizontalSwing !== null && device.horizontalSwing !== undefined) {
      add('swing_horizontal_toggle', '左右扫风切换');
    }
    if (device.verticalSwing !== null && device.verticalSwing !== undefined) {
      add('swing_vertical_toggle', '上下扫风切换');
    }
  }
  if (device.type === 'fan' && device.manualDir) {
    add('fan_turn_left', '风向向左');
    add('fan_turn_right', '风向向右');
    add('fan_turn_up', '风向向上');
    add('fan_turn_down', '风向向下');
  }
  return out;
}

function toDeviceInfo(device: Device): DeviceInfo {
  return {
    id: device.id,
    name: device.name,
    type: device.type,
    model: device.model,
    roomName: device.roomName || '',
    online: device.online !== false,
    on: device.on !== false,
    controls: controlsFor(device),
  };
}

/**
 * 多键开关的附加按键（双开右键 / 三开中键、右键）单独对外成一台「虚拟设备」，
 * id 形如「设备id#switch2On」，遥控器端不用改结构就能给每个按键单独绑动作。
 */
function extraSwitchInfos(device: Device): DeviceInfo[] {
  const keys = Array.isArray(device.extraSwitches) ? device.extraSwitches : [];
  return keys.map((key) => ({
    id: `${device.id}#${key.field}`,
    name: `${device.name} · ${key.label}`,
    type: 'plug',
    model: device.model,
    roomName: device.roomName || '',
    online: device.online !== false,
    on: key.on === true,
    controls: [
      { op: 'power_toggle', label: '开关切换' },
      { op: 'power_on', label: '开机' },
      { op: 'power_off', label: '关机' },
    ],
  }));
}

/** 房间级动作的前缀：一间屋子在多设备场景下当成一台「虚拟设备」对外提供。 */
const ROOM_PREFIX = 'room:';

interface RoomControl extends ControlOption {
  /** 只动哪一类设备；不填表示房间里所有能开关的设备。 */
  type?: string;
}

const ROOM_CONTROLS: RoomControl[] = [
  { op: 'room_power_on', label: '全部开机' },
  { op: 'room_power_off', label: '全部关机' },
  { op: 'room_lights_on', label: '灯光全开', type: 'light' },
  { op: 'room_lights_off', label: '灯光全关', type: 'light' },
];

interface RoomGroup {
  id: string;
  name: string;
  devices: Device[];
}

/** 按房间名把设备分组；没有房间归属的设备不参与。 */
function roomGroups(snapshot: Device[]): RoomGroup[] {
  const groups = new Map<string, RoomGroup>();
  for (const device of snapshot) {
    const name = String(device.roomName || '').trim();
    if (!name) continue;
    const group = groups.get(name);
    if (group) group.devices.push(device);
    else groups.set(name, { id: `${ROOM_PREFIX}${name}`, name, devices: [device] });
  }
  return [...groups.values()];
}

/** 只有一间屋里有两台以上能开关的设备时，才值得提供房间级动作。 */
function roomControls(devices: Device[]): ControlOption[] {
  const powerable = devices.filter((device) => POWER_TYPES.includes(device.type));
  if (powerable.length < 2) return [];
  const options = [ROOM_CONTROLS[0], ROOM_CONTROLS[1]];
  if (powerable.some((device) => device.type === 'light')) {
    options.push(ROOM_CONTROLS[2], ROOM_CONTROLS[3]);
  }
  return options.map(({ op, label }) => ({ op, label }));
}

function toRoomInfo(group: RoomGroup): DeviceInfo {
  const online = group.devices.filter((device) => device.online !== false);
  return {
    id: group.id,
    name: group.name,
    type: 'room',
    model: '',
    roomName: group.name,
    online: online.length > 0,
    on: online.some((device) => device.on !== false),
    controls: roomControls(group.devices),
  };
}

/** 一次性把某个房间（可再按类型缩小）的设备全部开机 / 关机。 */
function runRoomAction(dispatcher: DeviceDispatcher, roomId: string, op: string): void {
  const group = roomGroups(dispatcher.snapshot()).find((item) => item.id === roomId);
  if (!group) throw new HttpError(404, '找不到这个房间');
  const control = ROOM_CONTROLS.find((item) => item.op === op);
  if (!control) throw new HttpError(400, '这个房间不支持该操作');
  const targets = group.devices.filter(
    (device) =>
      device.online !== false &&
      POWER_TYPES.includes(device.type) &&
      (!control.type || device.type === control.type),
  );
  if (!targets.length) throw new HttpError(409, '这个房间没有可控制的设备');
  const isOn = op === 'room_power_on' || op === 'room_lights_on';
  for (const device of targets) {
    dispatcher.setPower(device.id, isOn);
    // 多键开关的附加按键一起开 / 关，整屋控制才不会漏掉右键、中键
    const keys = Array.isArray(device.extraSwitches) ? device.extraSwitches : [];
    for (const key of keys) dispatcher.setField?.(device.id, key.field, isOn);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function nextListItem(device: Device, current: any): any {
  const list = device.modeList || [];
  if (!list.length) return current;
  const index = list.findIndex((item) => item.value === current);
  return list[(index + 1) % list.length].value;
}

/** 多键开关的单个按键：只支持开 / 关 / 切换，直接写到对应的附加按键字段。 */
function runSwitchKeyAction(dispatcher: DeviceDispatcher, deviceKey: string, op: string): void {
  const cut = deviceKey.indexOf('#');
  const deviceId = deviceKey.slice(0, cut);
  const field = deviceKey.slice(cut + 1);
  const device = dispatcher.snapshot().find((item) => item.id === deviceId);
  if (!device) throw new HttpError(404, '找不到这台设备');
  const keys = Array.isArray(device.extraSwitches) ? device.extraSwitches : [];
  const key = keys.find((item) => item.field === field);
  if (!key) throw new HttpError(404, '找不到这个按键');
  if (device.online === false) throw new HttpError(409, '设备当前离线');
  if (!dispatcher.setField) throw new HttpError(501, '当前设备源不支持按键控制');
  if (op === 'power_on') {
    dispatcher.setField(device.id, field, true);
    return;
  }
  if (op === 'power_off') {
    dispatcher.setField(device.id, field, false);
    return;
  }
  if (op === 'power_toggle') {
    dispatcher.setField(device.id, field, !key.on);
    return;
  }
  throw new HttpError(400, '这个按键只支持开关');
}

async function runAction(dispatcher: DeviceDispatcher, deviceKey: string, op: string): Promise<void> {
  const snapshot = dispatcher.snapshot();
  const wanted = String(deviceKey || '').trim();
  if (wanted.startsWith(ROOM_PREFIX)) {
    runRoomAction(dispatcher, wanted, op);
    return;
  }
  if (wanted.includes('#')) {
    runSwitchKeyAction(dispatcher, wanted, op);
    return;
  }
  const device = snapshot.find((item) => item.id === wanted) ||
    snapshot.find((item) => item.name === wanted);
  if (!device) throw new HttpError(404, '找不到这台设备');
  if (device.online === false) throw new HttpError(409, '设备当前离线');
  if (!controlsFor(device).some((option) => option.op === op)) {
    throw new HttpError(400, '这台设备不支持该操作');
  }

  // 这两个方法挂在 dispatcher 上，取出来单独调用会丢掉 this（内部要用
  // this.binds），必须包一层继续以 dispatcher 为接收者。
  const setField = dispatcher.setField
    ? (id: string, field: string, value: unknown) =>
        dispatcher.setField!(id, field, value)
    : undefined;
  const callAction = dispatcher.callAction
    ? (id: string, key: string) => dispatcher.callAction!(id, key)
    : undefined;
  switch (op) {
    case 'power_on':
      dispatcher.setPower(device.id, true);
      return;
    case 'power_off':
      dispatcher.setPower(device.id, false);
      return;
    case 'power_toggle':
      dispatcher.setPower(device.id, !(device.on !== false));
      return;
    case 'brightness_up':
      dispatcher.setBrightness(device.id, (device.brightness || 0) + 10);
      return;
    case 'brightness_down':
      dispatcher.setBrightness(device.id, (device.brightness || 0) - 10);
      return;
    case 'color_temp_warm':
      dispatcher.setColorTemperature(device.id, (device.colorTemperature || 4000) - 500);
      return;
    case 'color_temp_cool':
      dispatcher.setColorTemperature(device.id, (device.colorTemperature || 4000) + 500);
      return;
    case 'speed_up':
      dispatcher.setSpeed(device.id, (device.speed || 0) + 1);
      return;
    case 'speed_down':
      dispatcher.setSpeed(device.id, (device.speed || 0) - 1);
      return;
    case 'mode_next':
      if (!setField) throw new HttpError(501, '当前设备源不支持模式切换');
      setField(device.id, 'mode', nextListItem(device, device.mode));
      return;
    case 'temp_up': {
      const range = device.targetTempRange || [16, 31];
      const current = device.targetTemperature ?? range[0];
      if (!setField) throw new HttpError(501, '当前设备源不支持温度调节');
      setField(device.id, 'targetTemperature', clamp(current + 1, range[0], range[1]));
      return;
    }
    case 'temp_down': {
      const range = device.targetTempRange || [16, 31];
      const current = device.targetTemperature ?? range[0];
      if (!setField) throw new HttpError(501, '当前设备源不支持温度调节');
      setField(device.id, 'targetTemperature', clamp(current - 1, range[0], range[1]));
      return;
    }
    case 'swing_horizontal_toggle':
      if (!setField) throw new HttpError(501, '当前设备源不支持扫风');
      setField(device.id, 'horizontalSwing', !(device.horizontalSwing === true));
      return;
    case 'swing_vertical_toggle':
      if (!setField) throw new HttpError(501, '当前设备源不支持扫风');
      setField(device.id, 'verticalSwing', !(device.verticalSwing === true));
      return;
    case 'fan_turn_left':
    case 'fan_turn_right':
    case 'fan_turn_up':
    case 'fan_turn_down': {
      if (!callAction) throw new HttpError(501, '当前设备源不支持风向动作');
      const actionKeys: Record<string, string> = {
        fan_turn_left: 'turnLeft',
        fan_turn_right: 'turnRight',
        fan_turn_up: 'turnUpward',
        fan_turn_down: 'turnDownward',
      };
      await callAction(device.id, actionKeys[op]);
      return;
    }
    default:
      throw new HttpError(400, '未知操作');
  }
}

/** 去掉空格和标点，方便做「说到的设备名 / 动作词」匹配。 */
function normalizeCommand(text: string): string {
  // 「·」用来分隔设备名和按键名（如「书房双开 · 右键」），口语里不会念出来，一并去掉
  return text.replace(/[\s，。！？、,.!?；;：:·｜|]/g, '');
}

/** 中文数字（零〇一二两三四五六七八九十百千万）转成整数。 */
function chineseNumber(value: string): number | null {
  const digits: Record<string, number> = {
    零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
    五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
  };
  const units: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };
  let total = 0;
  let section = 0;
  let current = 0;
  for (const char of value) {
    if (char in digits) {
      current = digits[char];
    } else if (char === '万') {
      total = (total + section + current) * 10000;
      section = 0;
      current = 0;
    } else if (char in units) {
      section += (current || 1) * units[char];
      current = 0;
    } else {
      return null;
    }
  }
  return total + section + current;
}

/** 一段文字里的第一个数字：阿拉伯数字优先，其次中文数字。 */
function spokenNumber(text: string): number | null {
  const arabic = /\d+(?:\.\d+)?/.exec(text);
  if (arabic) return Number(arabic[0]);
  const chinese = /[零〇一二两三四五六七八九十百千万]+/.exec(text);
  return chinese ? chineseNumber(chinese[0]) : null;
}

/** 关键词附近的数字（先看后面，再说前面），免得把设备名里的数字当目标值。 */
function numberNear(text: string, keyword: string): number | null {
  const index = text.indexOf(keyword);
  if (index < 0) return null;
  return spokenNumber(text.slice(index + keyword.length))
    ?? spokenNumber(text.slice(Math.max(0, index - 6), index));
}

interface NumericCommand {
  field: 'brightness' | 'colorTemperature' | 'targetTemperature';
  value: number;
}

/** 「亮度 50」「色温 3600」「温度 26 度」这类直接把数值说出来的说法。 */
function matchNumeric(device: Device, text: string): NumericCommand | null {
  if (text.includes('色温')) {
    if (device.type !== 'light' && !device.colorTempRange) return null;
    const value = numberNear(text, '色温');
    if (value === null) return null;
    const [min, max] = device.colorTempRange || [2700, 6500];
    return { field: 'colorTemperature', value: clamp(Math.round(value), min, max) };
  }
  if (text.includes('亮度') || text.includes('百分之') || text.includes('%')) {
    const value = text.includes('亮度')
      ? numberNear(text, '亮度')
      : spokenNumber(text);
    if (value === null) return null;
    return { field: 'brightness', value: clamp(Math.round(value), 0, 100) };
  }
  if (text.includes('温度') && Array.isArray(device.targetTempRange)
      && device.targetTempRange.length >= 2) {
    const value = numberNear(text, '温度');
    if (value === null) return null;
    const [min, max] = device.targetTempRange;
    return { field: 'targetTemperature', value: clamp(Math.round(value), min, max) };
  }
  return null;
}

function runNumeric(dispatcher: DeviceDispatcher, device: Device, command: NumericCommand): void {
  if (command.field === 'brightness') {
    dispatcher.setBrightness(device.id, command.value);
    return;
  }
  if (command.field === 'colorTemperature') {
    dispatcher.setColorTemperature(device.id, command.value);
    return;
  }
  if (!dispatcher.setField) throw new HttpError(501, '当前设备源不支持温度调节');
  dispatcher.setField(device.id, 'targetTemperature', command.value);
}

/** 没点名设备时用来兜底的类型词：说到某个类型、且这台设备唯一时就用它。 */
const TYPE_WORDS: Record<string, string[]> = {
  light: ['灯'],
  fan: ['风扇', '电扇', '扇子'],
  aircon: ['空调', '冷气'],
  purifier: ['净化器', '净饮机', '饮水机', '净水器'],
};

/**
 * 找句子里点名的「设备名 + 按键名」，如「书房双开右键」。
 * 必须先于 findDevice 判断：否则「书房双开右键」会先命中「书房双开」，只开左键。
 */
function findSwitchTarget(
  snapshot: Device[],
  text: string,
): { device: Device; field: string; label: string } | null {
  for (const device of snapshot) {
    const keys = Array.isArray(device.extraSwitches) ? device.extraSwitches : [];
    for (const key of keys) {
      const full = normalizeCommand(`${device.name}${key.label}`);
      if (full && text.includes(full)) {
        return { device, field: key.field, label: key.label };
      }
    }
  }
  return null;
}

/** 找句子提到的设备，多个命中时取名字最长的那台。 */
function findDevice(snapshot: Device[], text: string): Device | null {
  const hits = snapshot
    .filter((device) => device.name && text.includes(device.name))
    .sort((a, b) => b.name.length - a.name.length);
  if (hits.length) return hits[0];
  // 没点名：先按「灯 / 风扇 / 空调」这类类型词缩小范围；
  // 该类型只有一台就直接用，多台时再看句子里有没有房间名。
  const byType = snapshot.filter((device) =>
    (TYPE_WORDS[device.type] || []).some((word) => text.includes(word)),
  );
  if (byType.length === 1) return byType[0];
  const byRoom = byType.filter(
    (device) => device.roomName && text.includes(device.roomName),
  );
  return byRoom.length === 1 ? byRoom[0] : null;
}

/** 把一句话落到这台设备已有的某个操作上；认不出就返回 null。 */
function matchOp(device: Device, text: string): string | null {
  const ops = new Set(controlsFor(device).map((option) => option.op));
  const rules: Array<[string, string[]]> = [
    ['power_off', ['关闭', '关掉', '关机', '关灯', '停掉', '关']],
    ['power_on', ['打开', '开机', '启动', '开启', '开灯', '开']],
    ['power_toggle', ['切换开关', '开关切换', '反转']],
    ['brightness_up', ['亮一点', '调亮', '亮度加', '亮度提高', '提高亮度', '亮度调高', '调高亮度', '增亮', '亮些', '亮一些', '最亮', '亮起来']],
    ['brightness_down', ['暗一点', '调暗', '亮度减', '亮度降低', '降低亮度', '亮度调低', '调低亮度', '变暗', '暗些', '暗一些', '最暗']],
    ['color_temp_warm', ['暖白', '暖色', '偏暖', '暖一点', '暖', '黄光', '黄']],
    ['color_temp_cool', ['冷白', '冷色', '偏冷', '冷一点', '冷', '白光']],
    ['speed_up', ['风速加', '风大', '风大点', '风速提高', '加速']],
    ['speed_down', ['风速减', '风小', '风小点', '风速降低', '减速']],
    ['temp_up', ['温度调高', '调高温度', '温度加', '温度高', '升温', '热一点', '热些', '热']],
    ['temp_down', ['温度调低', '调低温度', '温度减', '温度低', '降温', '冷一点', '凉一点', '凉些', '冷', '凉']],
    ['swing_horizontal_toggle', ['左右扫风', '左右摆风']],
    ['swing_vertical_toggle', ['上下扫风', '上下摆风', '扫风', '摆风']],
    ['fan_turn_left', ['向左']],
    ['fan_turn_right', ['向右']],
    ['fan_turn_up', ['向上']],
    ['fan_turn_down', ['向下']],
    ['mode_next', ['模式']],
  ];
  for (const [op, words] of rules) {
    if (ops.has(op) && words.some((word) => text.includes(word))) return op;
  }
  return null;
}

/**
 * 「关掉书房所有灯」这类整屋指令：句子里点到房间名时，把该房间的设备
 * （可以再用「灯 / 风扇 / 空调」缩小范围）一起当目标。
 * 只有凑够两台才走批量，单台仍交给 findDevice，避免抢走精确指令。
 */
function findRoomTargets(
  snapshot: Device[],
  text: string,
): { group: RoomGroup; devices: Device[] } | null {
  const groups = roomGroups(snapshot)
    .filter((group) => text.includes(group.name))
    .sort((a, b) => b.name.length - a.name.length);
  if (!groups.length) return null;
  const group = groups[0];
  const type = Object.keys(TYPE_WORDS).find((key) =>
    (TYPE_WORDS[key] || []).some((word) => text.includes(word)),
  );
  const devices = group.devices.filter(
    (device) =>
      device.online !== false &&
      POWER_TYPES.includes(device.type) &&
      (!type || device.type === type),
  );
  return devices.length >= 2 ? { group, devices } : null;
}

/** 批量只做开关：句子里先找「关」，再找「开」。 */
function matchPowerOp(text: string): 'power_on' | 'power_off' | null {
  if (['关闭', '关掉', '关机', '关灯', '停掉', '关'].some((word) => text.includes(word))) {
    return 'power_off';
  }
  if (['打开', '开机', '启动', '开启', '开灯', '开'].some((word) => text.includes(word))) {
    return 'power_on';
  }
  return null;
}

/** 一句话 → 一次设备动作。 */
async function runCommand(
  dispatcher: DeviceDispatcher,
  text: string,
): Promise<{ device: string; op: string }> {
  const clean = normalizeCommand(text);
  if (!clean) throw new HttpError(400, '没有听到内容');
  const snapshot = dispatcher.snapshot();
  // 点名了具体按键（如「书房双开右键」）时直接落到那个按键，不能再当作整台设备处理
  const switchTarget = findSwitchTarget(snapshot, clean);
  if (switchTarget) {
    const keyOp = matchPowerOp(clean);
    if (!keyOp) throw new HttpError(400, '这个按键只支持开或关');
    runSwitchKeyAction(
      dispatcher,
      `${switchTarget.device.id}#${switchTarget.field}`,
      keyOp,
    );
    return { device: `${switchTarget.device.name} ${switchTarget.label}`, op: keyOp };
  }
  const device = findDevice(snapshot, clean);
  const room = findRoomTargets(snapshot, clean);
  // 说到「所有 / 全部」，或者命中的只是「灯」这类泛称时，整屋优先；
  // 点名了具体设备（比如「吸顶灯」）仍按单台走。
  const genericName =
    device !== null &&
    Object.values(TYPE_WORDS).some((words) => words.includes(device.name));
  if (room && (/所有|全部|都|整个/.test(clean) || !device || genericName)) {
    const wholeOp = matchPowerOp(clean);
    if (wholeOp) {
      for (const item of room.devices) {
        dispatcher.setPower(item.id, wholeOp === 'power_on');
      }
      return { device: `${room.group.name} ${room.devices.length} 台设备`, op: wholeOp };
    }
  }
  if (!device) throw new HttpError(404, '没有听出是哪台设备');
  const numeric = matchNumeric(device, clean);
  if (numeric) {
    runNumeric(dispatcher, device, numeric);
    return { device: device.name || device.id, op: `${numeric.field}_set` };
  }
  const op = matchOp(device, clean);
  if (!op) throw new HttpError(400, '没有听出要做什么');
  await runAction(dispatcher, device.id, op);
  return { device: device.name || device.id, op };
}

function readBody(request: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, '请求内容过大'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, '请求内容不是合法 JSON'));
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response: http.ServerResponse, status: number, payload: unknown): void {
  const text = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  });
  response.end(text);
}

function writeDiscovery(file: string, data: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(temp, file);
}

/** 启动本机联动接口；返回的 close() 会停服务并删除 discovery 文件。 */
export function startLocalApi(options: LocalApiOptions): LocalApiHandle {
  const token = crypto.randomBytes(24).toString('hex');
  const discoveryFile = path.join(options.userDataDir, DISCOVERY_FILE_NAME);

  const server = http.createServer(async (request, response) => {
    try {
      const authorization = String(request.headers.authorization || '');
      if (!authorization.startsWith('Bearer ') || authorization.slice(7) !== token) {
        throw new HttpError(401, '身份校验失败');
      }
      const url = new URL(request.url || '/', 'http://127.0.0.1');
      if (request.method === 'GET' && url.pathname === '/v1/status') {
        const dispatcher = options.dispatcher();
        sendJson(response, 200, {
          ok: true,
          protocol: PROTOCOL,
          version: PROTOCOL_VERSION,
          app: 'OpenMexia',
          appVersion: options.appVersion,
          deviceCount: dispatcher ? dispatcher.snapshot().length : 0,
        });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/v1/devices') {
        const dispatcher = options.dispatcher();
        const snapshot = dispatcher ? dispatcher.snapshot() : [];
        // 多设备房间额外挂一条「房间 · 动作」，遥控器那边不用改就能选到整屋控制。
        const rooms = roomGroups(snapshot)
          .filter((group) => roomControls(group.devices).length > 0)
          .map(toRoomInfo);
        // 多键开关的每个附加按键也当成一台独立设备，遥控器可单独绑定
        const devices = snapshot.flatMap((device) => [toDeviceInfo(device), ...extraSwitchInfos(device)]);
        sendJson(response, 200, { devices: [...devices, ...rooms] });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/v1/action') {
        const dispatcher = options.dispatcher();
        if (!dispatcher) throw new HttpError(503, 'OpenMexia 还没准备好设备');
        const body = await readBody(request);
        await runAction(dispatcher, body && body.device, body && body.op);
        sendJson(response, 200, { ok: true });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/v1/say') {
        const dispatcher = options.dispatcher();
        if (!dispatcher) throw new HttpError(503, 'OpenMexia 还没准备好设备');
        const body = await readBody(request);
        const text = String((body && body.text) || '').trim();
        if (!text) throw new HttpError(400, '没有听到内容');
        const result = await runCommand(dispatcher, text);
        sendJson(response, 200, { ok: true, device: result.device, op: result.op });
        return;
      }
      throw new HttpError(404, '没有这个接口');
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (!(error instanceof HttpError)) {
        console.error('[local-api] request failed:', error);
      }
      sendJson(response, status, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.on('error', (error) => {
    console.error('[local-api] server error:', error);
  });

  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    try {
      writeDiscovery(discoveryFile, {
        protocol: PROTOCOL,
        version: PROTOCOL_VERSION,
        host: '127.0.0.1',
        port,
        token,
        app: 'OpenMexia',
        appVersion: options.appVersion,
        pid: options.appPid,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[local-api] discovery file write failed:', error);
    }
  });

  const currentPort = (): number => {
    const address = server.address();
    return typeof address === 'object' && address ? address.port : 0;
  };

  return {
    port: currentPort,
    close: () => {
      try {
        server.close();
      } catch {
        /* 已关闭 */
      }
      try {
        if (fs.existsSync(discoveryFile)) fs.unlinkSync(discoveryFile);
      } catch {
        /* 删除失败不影响退出 */
      }
    },
  };
}
