'use strict';

/**
 * MiOT 规格（siid/piid）通用解析。
 *
 * 米家每台设备的可控属性都由「服务 siid + 属性 piid」定位，具体取值随型号而异。
 * 与其为每个型号写死映射，这里从 miot-spec（https://home.miot-spec.com）按 model
 * 拉取规格，再按**属性名**（on / brightness / temperature ...）自动匹配到本小组件的字段，
 * 因此天然支持任意型号设备。
 *
 * 该模块是「所有设备都能用」的关键：型号只是用来查规格，不需要在代码里枚举。
 */

let _mod = null;
const memCache = new Map();   // model -> DeviceInfo | null

async function loadMod() {
  if (!_mod) _mod = await import('@zythum02/mijia-api');
  return _mod;
}

let _diskCache = null;
async function diskCache(cacheDir) {
  if (!cacheDir) return null;
  if (!_diskCache) {
    const mod = await import('@zythum02/mijia-api/cache/disk-cache');
    _diskCache = new mod.DiskCache(cacheDir);
  }
  return _diskCache;
}

/**
 * 取设备规格（带内存 + 磁盘缓存）。
 * @param {string} model 设备型号，如 yeelink.light.lamp4
 * @param {string} [cacheDir] 规格缓存目录
 * @returns {Promise<object|null>}
 */
async function getSpec(model, cacheDir) {
  if (!model) return null;
  if (memCache.has(model)) return memCache.get(model);
  let info = null;
  try {
    const mod = await loadMod();
    info = await mod.getDeviceInfo(model, await diskCache(cacheDir));
  } catch {
    info = null;   // 未知型号 / 网络异常：不阻断，退回“仅开关”能力
  }
  memCache.set(model, info);
  return info;
}

// 字段 -> 候选 MiOT 属性名（按优先级）
const FIELD_ALIASES = {
  on: ['on'],
  brightness: ['brightness'],
  colorTemperature: ['color-temperature'],
  speed: ['fan-level', 'speed-level', 'wind-speed'],
  // 风扇无极风速（直吹风）：与档位风速（自然风）是两个不同属性
  speedStepless: ['fan-fan-level', 'stepless-fan-level'],
  temperature: ['temperature'],
  humidity: ['relative-humidity'],
  battery: ['battery-level'],
  power: ['power-consumption', 'electric-power'],
  todayKwh: ['electric-consumption'],
  // 空调 / 风扇通用
  mode: ['mode'],
  targetTemperature: ['target-temperature'],
  horizontalSwing: ['horizontal-swing'],
  horizontalSwingAngle: ['horizontal-swing-included-angle'],
  verticalSwing: ['vertical-swing'],
  verticalSwingAngle: ['vertical-swing-included-angle'],
  // 净饮机
  iceMakerOn: ['ice-maker-on'],
  iceMakerStatus: ['ice-maker-status'],
  status: ['status'],
  fault: ['fault'],
  filterLife: ['filter-life-level'],
  tdsIn: ['tds-in'],
  tdsOut: ['tds-out'],
  // 路由器 / 网关（只读指标，用于展示网络状态）
  connectedDeviceNumber: ['connected-device-number'],
  downloadSpeed: ['download-speed'],
  uploadSpeed: ['upload-speed'],
  onlineTime: ['online-time'],
};

/**
 * 型号品类（vendor.category.model 里的 category 段）→ 设备类型。
 *
 * 为什么不能只靠属性推断：路由器 / 网关 / 中继这类「网络设备」没有可用的开关，
 * 但规格里常带一个「指示灯」服务（on + brightness），只按属性判断会被误认成灯或插座。
 * 米家型号的第二段是稳定的品类标识，先按它定型，其余设备再走属性推断。
 */
const CATEGORY_TYPES = {
  router: 'router',      // 路由器
  wifi: 'router',
  repeater: 'router',    // WiFi 中继 / 放大器
  gateway: 'gateway',    // 网关
};

// 动作（action）-> 候选 MiOT 动作名（按优先级）。
// 注意：手动调节方向在米家规格里是 action 而非 property，需按 siid/aiid 调用。
const ACTION_ALIASES = {
  turnLeft: ['turn-left'],
  turnRight: ['turn-right'],
  turnUpward: ['turn-upward'],
  turnDownward: ['turn-downward'],
};

/**
 * 把规格解析为小组件可用的「读写绑定」。
 * @param {object} info 设备规格（含 model / properties / actions）
 * @param {string} [model] 设备型号；缺省时取 info.model
 * @returns {{
 *   type: 'sensor'|'plug'|'light'|'fan'|'aircon'|'purifier'|'router'|'gateway'|'other',
 *   props: Record<string, {siid:number, piid:number, rw:string, range:number[]|null, list:string[]|null}>,
 *   reads: {siid:number, piid:number}[],
 *   actions: Record<string, {siid:number, aiid:number}>
 * }}
 */
function analyze(info, model) {
  const props = {};
  const byName = new Map();
  if (info && Array.isArray(info.properties)) {
    for (const p of info.properties) byName.set(p.name, p);
  }

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const name of aliases) {
      const p = byName.get(name);
      if (p && p.method) {
        // 规格里取值范围键名不统一：可能是 value-range，也可能直接叫 range
        const range = p['value-range'] || p.valueRange || p.range || null;
        const rawList = p['value-list'] || p.valueList || p['value_list'] || null;
        // 枚举项既可能是字符串，也可能是 {value, description} 对象，统一成对象数组
        const list = Array.isArray(rawList)
          ? rawList.map((it) =>
              it && typeof it === 'object'
                ? { value: it.value, description: it.description || it.name || String(it.value) }
                : { value: it, description: String(it) }
            )
          : null;
        props[field] = {
          siid: p.method.siid,
          piid: p.method.piid,
          rw: p.rw || '',
          range: Array.isArray(range) ? range : null,
          list,
        };
        break;
      }
    }
  }

  // 动作解析（如风扇手动上下左右）：规格里作为 action 提供 siid/aiid
  const actions = {};
  const actByName = new Map();
  if (info && Array.isArray(info.actions)) {
    for (const a of info.actions) actByName.set(a.name, a);
  }
  for (const [key, names] of Object.entries(ACTION_ALIASES)) {
    for (const name of names) {
      const a = actByName.get(name);
      if (a && a.method) {
        actions[key] = { siid: a.method.siid, aiid: a.method.aiid };
        break;
      }
    }
  }

  const canWrite = (f) => props[f] && props[f].rw.includes('w');
  const canRead = (f) => props[f] && props[f].rw.includes('r');

  // 类型推断（顺序即优先级）：
  //   0. 品类优先：路由器 / 网关 / 中继等网络设备没有可用开关，规格里的「指示灯」
  //      (on + brightness) 会让纯属性推断把它们误认成灯或插座，故先按型号品类定型；
  //   1. 净饮机（含制冰）→ 制冰/水质字段独有；
  //   2. 空调 → 可写目标温度（须在 light 之前，因空调也带 brightness 指示灯）；
  //   3. 有可写 on + 风速档位 → 风扇；有可写 on + 亮度 → 灯；
  //   4. 其它有可写 on 的 → 插座/通用开关；
  //   5. 只读的温度 / 湿度 / 电量 → 传感器；
  //   6. 其余（无可控开关、无遥测，如计时器）→ 其它，避免被错认成插座。
  const category = String(model || (info && info.model) || '').split('.')[1] || '';
  const isPurifier = !!(props.iceMakerStatus || props.iceMakerOn || props.tdsIn || props.tdsOut);

  let type;
  if (CATEGORY_TYPES[category]) type = CATEGORY_TYPES[category];
  else if (isPurifier) type = 'purifier';
  else if (canWrite('targetTemperature') || (canWrite('mode') && canWrite('speed') && props.targetTemperature)) type = 'aircon';
  else if (canWrite('on') && props.speed) type = 'fan';
  else if (canWrite('on') && props.brightness) type = 'light';
  else if (canWrite('on')) type = 'plug';
  else if (canRead('temperature') || canRead('humidity') || canRead('battery')) type = 'sensor';
  else type = 'other';

  // 读属性列表（去重）
  const reads = [];
  const seen = new Set();
  for (const f of Object.keys(props)) {
    if (!canRead(f)) continue;
    const k = `${props[f].siid}.${props[f].piid}`;
    if (seen.has(k)) continue;
    seen.add(k);
    reads.push({ siid: props[f].siid, piid: props[f].piid });
  }

  return { type, props, reads, actions };
}

/** 从云端设备项推断一个可读的展示名（规格里带产品名） */
async function productName(model, cacheDir) {
  const info = await getSpec(model, cacheDir);
  return info && info.name ? info.name : '';
}

module.exports = { getSpec, analyze, productName };
