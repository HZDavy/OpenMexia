'use strict';

const ICONS = {
  sensor:
    '<svg viewBox="0 0 24 24"><path d="M12 2.6a2.9 2.9 0 0 0-2.9 2.9v6.9a5 5 0 1 0 5.8 0V5.5A2.9 2.9 0 0 0 12 2.6Zm1.2 4.9v6.6l.5.35a3.1 3.1 0 1 1-3.4 0l.5-.35V7.5a1.2 1.2 0 0 1 2.4 0Z" fill="currentColor"/></svg>',
  plug:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2.5v5M15 2.5v5M6.5 7.5h11v3.2a5.5 5.5 0 0 1-11 0V7.5Z"/><path d="M12 16.2v5.3"/></svg>',
  light:
    '<svg viewBox="0 0 24 24"><path d="M12 2.4a7.1 7.1 0 0 0-4.1 12.9v1.6h8.2v-1.6A7.1 7.1 0 0 0 12 2.4Zm-2.6 16.7h5.2v1.1a2.1 2.1 0 0 1-2.1 2.1h-1a2.1 2.1 0 0 1-2.1-2.1v-1.1Z" fill="currentColor"/></svg>',
  fan:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"/></svg>',
  aircon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="7.5" rx="2"/><path d="M6 7.75h12"/><path d="M6.5 15v4M12 15v4M17.5 15v4"/></svg>',
  purifier:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s5.6 6.1 5.6 10.2a5.6 5.6 0 1 1-11.2 0C6.4 9.1 12 3 12 3Z"/><path d="M9.4 13.6a2.7 2.7 0 0 0 2.6 2.7"/></svg>',
  router:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="13.8" width="19" height="6.7" rx="2"/><path d="M6.4 17.15h.02M9.4 17.15h.02"/><path d="M12 10.6v3.2"/><path d="M8.6 9.1a5 5 0 0 1 6.8 0"/><path d="M6 6.4a9 9 0 0 1 12 0"/></svg>',
  gateway:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.4" y="8.4" width="17.2" height="11" rx="2.4"/><path d="M7.4 12.2h3M7.4 15.4h6.2"/><path d="M12 8.4V5.4"/></svg>',
  other:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.4"/><path d="M7.4 9.4h9.2M7.4 14.4h5.6"/></svg>',
};

const BULB_ICON =
  '<svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

// 点阵拖拽把手图标（2 列 × 3 行）
const GRIP_ICON =
  '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="4" r="1.3"/><circle cx="10" cy="4" r="1.3"/><circle cx="6" cy="8" r="1.3"/><circle cx="10" cy="8" r="1.3"/><circle cx="6" cy="12" r="1.3"/><circle cx="10" cy="12" r="1.3"/></svg>';

// 色温滑杆图标（温度计）
const TEMP_ICON =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13.6V5a2 2 0 1 1 4 0v8.6a4 4 0 1 1-4 0Z"/><path d="M12 9v5"/></svg>';

// 右键菜单图标
const POWER_ICON =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 4v8"/><path d="M7.5 7.2a6 6 0 1 0 9 0"/></svg>';
const EYE_OFF_ICON =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><path d="M4 4l16 16"/></svg>';
const EYE_ICON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const COLLAPSE_ICON =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9.5 12 4.5l5 5"/><path d="M7 14.5 12 19.5l5-5"/></svg>';

const listEl = document.getElementById('devices');
const subtitleEl = document.getElementById('subtitle');
const updatedEl = document.getElementById('updated');
const statusDot = document.querySelector('.statusbar .dot');

const cards = new Map();
let ramping = false;
let sized = false;      // 窗口高度是否已按内容校准过一次
let drag = null;        // 当前拖动状态
let autoScrollRAF = null; // 拖动时边缘自动滚动的动画帧
let order = readOrder(); // 持久化的卡片顺序
let hiddenSet = readHidden(); // 被隐藏（不在列表显示）的设备 id
let collapsedSet = readCollapsed(); // 被收折（只留基本信息）的卡片 id
let allDevices = [];    // 最近一次拿到的完整设备列表（隐藏恢复面板需要）
let mockMode = false;   // 未登录、无真实设备时：显示欢迎引导，而不是演示数据
let groupByRoom = readGroupByRoom();     // 是否按房间分类显示
let showRoomName = readShowRoomName();   // 是否在设备代号前显示「房间名 | 」
let collapsedRooms = readCollapsedRooms(); // 被收折的房间 key
let roomOrder = readRoomOrder();           // 持久化的房间顺序（房间 key 数组）
let roomDrag = null;                       // 当前房间拖动状态
const roomSections = new Map(); // 房间 key -> { section, head, nameEl, countEl, list }

const h = (tag, cls, html) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
};

// 分组分割线（用于把不同类别的控件区隔开）
const sep = () => h('div', 'card-sep');

// 计算滑杆已划过的百分比并写入 --pct，供 .lit 做「左亮右暗」分段着色
function setFill(slider) {
  if (!slider) return;
  const min = Number(slider.min);
  const max = Number(slider.max);
  const v = Number(slider.value);
  const pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
  slider.style.setProperty('--pct', Math.min(100, Math.max(0, pct)).toFixed(2) + '%');
}

/* ---------------- 卡片构建 ---------------- */

// 开关按钮（plug / light / fan 共用）
function makeSwitch(device) {
  const sw = h('button', 'switch');
  sw.type = 'button';
  sw.title = '开关';
  sw.addEventListener('click', () => {
    const on = !sw.classList.contains('on');
    window.mijia.setPower(device.id, on);
  });
  return sw;
}

// 大号读数块：小标签 + 大数字（与传感器卡片的 .ro 保持同一视觉语言）
function makeHero(label, unit) {
  const hero = h('div', 'hero');
  hero.append(h('span', 'hero-label', label));
  const value = h('div', 'readout',
    `<span class="value">--</span><span class="unit">${unit || ''}</span>`);
  hero.append(value);
  return { hero, value };
}

// 把设备给的档位描述本地化（常见英文档位名 → 中文，LevelN → N 档）
function humanizeLevel(desc) {
  const s = String(desc == null ? '' : desc);
  const m = /^level\s*(\d+)$/i.exec(s.trim());
  if (m) return m[1] + ' 档';
  const map = {
    auto: '自动', low: '低', medium: '中', high: '高', silent: '静音', strong: '强', turbo: '强力',
    // 风扇 / 空调模式
    'straight wind': '直吹风', 'natural wind': '自然风',
    cool: '制冷', dry: '除湿', fan: '送风', heat: '制热',
    // 净饮机状态
    idle: '空闲', 'water coming out': '出水中', cleaning: '冲洗中', sleep: '休眠中',
    fault: '异常中', 'drain end': '排空完成',
    busy: '制冰中', appoint: '定时制冰中', full: '冰满', 'time full': '定时冰满',
    // 净饮机模式
    normal: '正常', quick: '快速',
  };
  const key = s.trim().toLowerCase();
  return map[key] || s;
}

// 净饮机故障码中文对照（规格里给的英文占位符不可读，这里补齐）
const PURIFIER_FAULT = {
  0: '', 1: '无水箱', 2: '水箱浓缩水区满', 3: '通讯故障', 4: '水箱自来水区水质差',
  5: '加热故障', 6: '电压故障', 7: '水箱自来水区缺水', 8: '无纯水壶', 9: '进水NTC故障',
  10: '出水NTC故障', 11: '转接板通讯故障', 12: 'E12', 13: 'RO滤芯检测异常',
  14: 'GC滤芯检测异常', 15: 'GC和RO滤芯检测异常', 16: '滤芯检测板通讯故障',
  17: '纯水壶水位检测故障', 18: '制冰冷水箱水位故障', 19: '制冰冷水箱NTC故障',
  20: '储冰仓NTC故障', 21: '制冰冷水箱排空故障', 22: '制冰水盒故障',
  23: '出冰仓门故障', 25: '压缩机故障', 26: '水箱自来水区缺水',
};

// 净饮机出水温度下限：最低可取「常温水」档，即水箱当前水温（取整），上限 95℃。
// 水温未知时回退到这个兜底值，避免滑杆下限落到设备不支持的低温（如 5℃）。
const PURIFIER_TARGET_MIN = 40;
function purifierTargetMin(dev) {
  if (dev && isNum(dev.temperature)) {
    return Math.min(Math.max(Math.round(dev.temperature), 0), 95);
  }
  return PURIFIER_TARGET_MIN;
}

// 从 {value,description} 列表里取某原始值的显示文案（英文项自动本地化）
function labelList(list, value) {
  if (!Array.isArray(list)) return '';
  const hit = list.find((it) => it && typeof it === 'object' && String(it.value) === String(value));
  return hit ? humanizeLevel(hit.description) : '';
}

// 标签行：左侧说明 + 右侧控件（控件靠右对齐）
function ctrlRow(labelText, control) {
  const row = h('div', 'ctrl-row');
  row.append(h('span', 'ctrl-label', labelText));
  const flex = h('div', 'ctrl-flex');
  flex.append(control);
  row.append(flex);
  return row;
}

// 分段选择控件（模式 / 摆风角度等枚举）
function makeSeg(items, onPick) {
  const seg = h('div', 'seg');
  const btns = items.map((it) => {
    const b = h('button', 'seg-btn');
    b.type = 'button';
    b.textContent = it.label;
    b.dataset.value = String(it.value);
    b.addEventListener('click', (e) => { e.stopPropagation(); onPick(it.value); });
    seg.append(b);
    return b;
  });
  seg._setActive = (value) => {
    for (const b of btns) b.classList.toggle('active', String(b.dataset.value) === String(value));
  };
  return seg;
}

// 开关 chip
function makeChip(text, onClick) {
  const c = h('button', 'chip');
  c.type = 'button';
  c.textContent = text;
  c.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return c;
}

// 滑杆（返回 {row, slider, text}，slider 自带 _drag/_fmt，供 updateCard 同步）
function makeSlider({ label, min, max, step, icon, format, onCommit }) {
  const row = h('div', 'slider-row');
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  if (step) slider.step = String(step);
  slider.value = String(min);
  slider.title = label || '';
  slider._fmt = format || ((v) => String(v));
  const text = h('span', 'slider-value', '--');
  const commit = () => onCommit(Number(slider.value));
  slider.addEventListener('pointerdown', () => { slider._drag = true; });
  slider.addEventListener('input', () => {
    text.textContent = slider._fmt(slider.value);
    clearTimeout(slider._t);
    slider._t = setTimeout(commit, 120);
  });
  slider.addEventListener('change', () => { slider._drag = false; commit(); });
  row.append(h('span', 'slider-icon', icon || ''), slider, text);
  return { row, slider, text };
}

// 扫风控制：开关 chip（+ 角度分段），左右/上下各一组
function makeSwing(entry, id, onField, angleField, angleList, title) {
  const row = h('div', 'ctrl-row');
  row.append(h('span', 'ctrl-label', title));
  const wrap = h('div', 'ctrl-flex');
  const chip = makeChip('关', () => {
    const cur = entry.last ? !!entry.last[onField] : false;
    window.mijia.setField(id, onField, !cur);
  });
  wrap.append(chip);
  entry.refs['sw_' + onField] = chip;
  if (Array.isArray(angleList) && angleList.length) {
    const seg = makeSeg(
      angleList.map((it) => ({ value: it.value, label: humanizeLevel(it.description) })),
      (v) => window.mijia.setField(id, angleField, v)
    );
    wrap.append(seg);
    entry.refs['segs_' + angleField] = seg;
  }
  row.append(wrap);
  return row;
}

// 同步扫风控件状态
function syncSwing(entry, d, onField, angleField) {
  const chip = entry.refs['sw_' + onField];
  if (chip) {
    const on = !!d[onField];
    chip.classList.toggle('on', on);
    chip.textContent = on ? '开' : '关';
  }
  const seg = entry.refs['segs_' + angleField];
  if (seg) seg._setActive(d[angleField]);
}

// 风速档位文案：优先用设备给的档位名，否则回退为「N 档」
function speedLabel(entry, value) {
  const v = Math.round(Number(value) || 0);
  const list = entry.refs.speedList;
  if (list && list.length) {
    // 先按枚举值精确匹配，再按索引兜底（兼容字符串数组与 {value,description} 两种格式）
    const at = (item) =>
      item && typeof item === 'object' ? humanizeLevel(item.description) : humanizeLevel(item);
    const hit = list.find((it) => it && typeof it === 'object' && Number(it.value) === v);
    if (hit) return at(hit);
    const i = Math.min(Math.max(v - entry.refs.speedMin, 0), list.length - 1);
    return at(list[i]);
  }
  return v + ' 档';
}

// 风速大号读数：与滑杆文案保持一致（取档位标签中的数字，如「3 档」→「3」）
function speedNumber(entry, value) {
  const label = speedLabel(entry, value);
  const m = /\d+/.exec(label);
  return m ? m[0] : label;
}

// 判断风扇某模式是否使用「无极风速」：直吹风=无极，自然风=档位。
// 无无极属性的机型一律按档位处理。
function fanModeStepless(device, mode, hasStepless) {
  if (!hasStepless) return false;
  const list = device.modeList;
  if (Array.isArray(list) && list.length) {
    const item = list.find((it) => Number(it.value) === Number(mode));
    const d = String(item ? item.description : '').toLowerCase();
    if (/straight|直吹|stepless|无极/.test(d)) return true;
    if (/natural|自然|gear|level|档/.test(d)) return false;
  }
  return true; // 无法判断时优先无极
}

// 按当前模式把风速读数写入滑杆右侧小字 + 大号读数
function applySpeedReadout(entry, value) {
  if (entry.refs.speedStepless) {
    const n = String(Math.round(Number(value) || 0));
    entry.refs.sliderText.textContent = n;
    entry.refs.value.querySelector('.value').textContent = n;
  } else {
    entry.refs.sliderText.textContent = speedLabel(entry, value);
    entry.refs.value.querySelector('.value').textContent = speedNumber(entry, value);
  }
}

function buildCard(device) {
  const el = h('div', 'card');
  el.dataset.id = device.id;
  el.dataset.type = device.type;

  const head = h('div', 'card-head');
  const icon = h('div', 'card-icon', ICONS[device.type] || '');
  const name = h('div', 'card-name', '<b></b><span></span>');
  const grip = h('div', 'drag-handle', GRIP_ICON);
  grip.title = '拖动排序';
  head.append(icon, name);
  el.append(head);

  const entry = { el, type: device.type, refs: {}, dragging: false, last: null };

  if (device.type === 'sensor') {
    // 温度 / 湿度并排放大显示
    const body = h('div', 'card-body sensor-body');
    const readouts = h('div', 'readouts');

    const tCol = h('div', 'ro');
    tCol.append(h('span', 'ro-label', '温度'));
    entry.refs.temp = h('div', 'readout', '<span class="value">--</span><span class="unit">°C</span>');
    tCol.append(entry.refs.temp);

    const hCol = h('div', 'ro');
    hCol.append(h('span', 'ro-label', '湿度'));
    entry.refs.humidity = h('div', 'readout', '<span class="value">--</span><span class="unit">%</span>');
    hCol.append(entry.refs.humidity);

    readouts.append(tCol, hCol);

    const meta = h('div', 'meta');
    entry.refs.battery = h('div', 'meta-row', '<span>电量</span><b>--</b>');
    meta.append(entry.refs.battery);

    body.append(readouts, meta);
    el.append(body);
  }

  if (device.type === 'plug') {
    const sw = makeSwitch(device);
    head.append(sw);
    entry.refs.switch = sw;

    const body = h('div', 'card-body');
    const hero = makeHero('功率', 'W');
    entry.refs.value = hero.value;
    const meta = h('div', 'meta');
    entry.refs.kwh = h('div', 'meta-row', '<span>今日用电</span><b>--</b>');
    entry.refs.state = h('div', 'meta-row', '<span>状态</span><b>--</b>');
    meta.append(entry.refs.kwh, entry.refs.state);
    body.append(hero.hero, meta);
    el.append(body);
  }

  if (device.type === 'light') {
    const sw = makeSwitch(device);
    head.append(sw);
    entry.refs.switch = sw;

    const body = h('div', 'card-body');
    const hero = makeHero('亮度', '%');
    entry.refs.value = hero.value;
    body.append(hero.hero);

    // 色温大号读数：与「亮度」同字号（26px）、横排并列在亮度之后；仅规格带色温区间时展示
    const ctRange = Array.isArray(device.colorTempRange) && device.colorTempRange.length >= 2
      ? device.colorTempRange
      : null;
    if (ctRange) {
      const tempHero = makeHero('色温', 'K');
      entry.refs.tempValue = tempHero.value;
      body.append(tempHero.hero);
    }

    const meta = h('div', 'meta');
    entry.refs.state = h('div', 'meta-row', '<span>状态</span><b>--</b>');
    meta.append(entry.refs.state);
    body.append(meta);
    el.append(body);

    el.append(sep());

    // 亮度滑杆
    const row = h('div', 'slider-row');
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '100';
    slider.value = '50';
    slider.title = '亮度';
    entry.refs.slider = slider;
    entry.refs.sliderText = h('span', 'slider-value', '--%');

    const commit = () => window.mijia.setBrightness(device.id, Number(slider.value));
    slider.addEventListener('pointerdown', () => { entry.dragging = true; });
    slider.addEventListener('input', () => {
      entry.refs.sliderText.textContent = slider.value + '%';
      entry.refs.value.querySelector('.value').textContent = slider.value;
      slider.classList.toggle('lit', Number(slider.value) > 1);
      setFill(slider);
      clearTimeout(entry._t);
      entry._t = setTimeout(commit, 120);
    });
    slider.addEventListener('change', () => {
      entry.dragging = false;
      commit();
    });

    const bulbIcon = h('span', 'slider-icon', BULB_ICON);
    row.append(bulbIcon, slider, entry.refs.sliderText);
    el.append(row);

    // 色温滑杆（仅当设备规格里带有色温区间时展示）
    if (ctRange) {
      const [tMin, tMax] = ctRange;
      const tempRow = h('div', 'slider-row');
      const tempSlider = document.createElement('input');
      tempSlider.type = 'range';
      tempSlider.min = String(tMin);
      tempSlider.max = String(tMax);
      tempSlider.step = '50';
      tempSlider.value = String(Math.round((tMin + tMax) / 2));
      tempSlider.title = '色温';
      tempSlider.classList.add('ct-range');
      entry.refs.tempSlider = tempSlider;
      entry.refs.tempText = h('span', 'slider-value', '--K');

      const commitTemp = () => window.mijia.setColorTemperature(device.id, Number(tempSlider.value));
      tempSlider.addEventListener('pointerdown', () => { entry.tempDragging = true; });
      tempSlider.addEventListener('input', () => {
        entry.refs.tempText.textContent = tempSlider.value + 'K';
        if (entry.refs.tempValue) entry.refs.tempValue.querySelector('.value').textContent = tempSlider.value;
        clearTimeout(entry._tt);
        entry._tt = setTimeout(commitTemp, 120);
      });
      tempSlider.addEventListener('change', () => {
        entry.tempDragging = false;
        commitTemp();
      });

      tempRow.append(h('span', 'slider-icon', TEMP_ICON), tempSlider, entry.refs.tempText);
      el.append(tempRow);
    }
  }

  if (device.type === 'fan') {
    const sw = makeSwitch(device);
    head.append(sw);
    entry.refs.switch = sw;

    const body = h('div', 'card-body');
    const hero = makeHero('风速', '档');
    entry.refs.value = hero.value;
    const meta = h('div', 'meta');
    entry.refs.state = h('div', 'meta-row', '<span>状态</span><b>--</b>');
    meta.append(entry.refs.state);
    body.append(hero.hero, meta);
    el.append(body);

    // 风速：直吹风=无极（连续），自然风=档位（离散）。两者是不同 MIoT 属性，
    // 滑杆随当前模式重配置绑定目标与量程。
    const steplessRange = Array.isArray(device.speedSteplessRange) && device.speedSteplessRange.length >= 2
      ? device.speedSteplessRange : null;
    const levelRange = Array.isArray(device.speedRange) && device.speedRange.length >= 2
      ? device.speedRange : [0, 3];
    entry.refs.speedList = Array.isArray(device.speedList) ? device.speedList : null;
    entry.refs.levelRange = levelRange;
    entry.refs.speedMin = levelRange[0];

    const row = h('div', 'slider-row');
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.title = '风速';
    entry.refs.slider = slider;
    entry.refs.sliderText = h('span', 'slider-value', '--');

    // 按模式切换：无极模式绑定 speedStepless，档位模式绑定 speed
    entry.refs.configureSpeed = (mode) => {
      const stepless = fanModeStepless(device, mode, !!steplessRange);
      const rng = stepless ? steplessRange : levelRange;
      entry.refs.speedStepless = stepless;
      entry.refs.speedMin = rng[0];
      slider.min = String(rng[0]);
      slider.max = String(rng[1]);
      slider.step = '1';
      hero.value.querySelector('.unit').textContent = stepless ? '' : '档';
    };
    entry.refs.configureSpeed(device.mode);

    const commit = () => {
      const v = Number(slider.value);
      if (entry.refs.speedStepless) window.mijia.setField(device.id, 'speedStepless', v);
      else window.mijia.setSpeed(device.id, v);
    };
    slider.addEventListener('pointerdown', () => { entry.dragging = true; });
    slider.addEventListener('input', () => {
      applySpeedReadout(entry, Number(slider.value));
      slider.classList.toggle('lit', Number(slider.value) > entry.refs.speedMin);
      setFill(slider);
      clearTimeout(entry._t);
      entry._t = setTimeout(commit, 120);
    });
    slider.addEventListener('change', () => {
      entry.dragging = false;
      commit();
    });

    row.append(h('span', 'slider-icon', ICONS.fan), slider, entry.refs.sliderText);
    el.append(row);

    // 自然风 / 直吹风模式
    if (Array.isArray(device.modeList) && device.modeList.length) {
      entry.refs.modeSeg = makeSeg(
        device.modeList.map((it) => ({ value: it.value, label: humanizeLevel(it.description) })),
        (v) => window.mijia.setField(device.id, 'mode', v)
      );
      el.append(sep(), ctrlRow('模式', entry.refs.modeSeg));
    }

    // 扫风（左右 / 上下归为一组）
    const hasSwing = device.horizontalSwing !== null && device.horizontalSwing !== undefined
      || device.verticalSwing !== null && device.verticalSwing !== undefined;
    if (hasSwing) el.append(sep());
    if (device.horizontalSwing !== null && device.horizontalSwing !== undefined) {
      el.append(makeSwing(entry, device.id, 'horizontalSwing', 'horizontalSwingAngle', device.horizontalSwingAngleList, '左右扫风'));
    }
    if (device.verticalSwing !== null && device.verticalSwing !== undefined) {
      el.append(makeSwing(entry, device.id, 'verticalSwing', 'verticalSwingAngle', device.verticalSwingAngleList, '上下扫风'));
    }

    // 手动风向（真机为 action：上下左右微调）
    if (device.manualDir) {
      const btn = makeChip('调节', () => openFanDirModal(device.id, device.name));
      el.append(sep(), ctrlRow('手动风向', btn));
    }
  }

  if (device.type === 'aircon') {
    const sw = makeSwitch(device);
    head.append(sw);
    entry.refs.switch = sw;

    const body = h('div', 'card-body');
    const hero = makeHero('目标温度', '°C');
    entry.refs.value = hero.value;
    const meta = h('div', 'meta');
    entry.refs.room = h('div', 'meta-row', '<span>室温</span><b>--</b>');
    meta.append(entry.refs.room);
    body.append(hero.hero, meta);
    el.append(body);

    // 运行模式：制冷 / 除湿 / 送风 / 制热
    if (Array.isArray(device.modeList) && device.modeList.length) {
      entry.refs.modeSeg = makeSeg(
        device.modeList.map((it) => ({ value: it.value, label: humanizeLevel(it.description) })),
        (v) => window.mijia.setField(device.id, 'mode', v)
      );
      el.append(sep(), ctrlRow('模式', entry.refs.modeSeg));
    }

    // 目标温度
    const tt = Array.isArray(device.targetTempRange) && device.targetTempRange.length >= 2
      ? device.targetTempRange : [16, 31];
    entry.refs.targetSlider = makeSlider({
      label: '目标温度', min: tt[0], max: tt[1], step: '0.5', icon: TEMP_ICON,
      format: (v) => Number(v).toFixed(1) + '°C',
      onCommit: (v) => window.mijia.setField(device.id, 'targetTemperature', v),
    });
    el.append(sep(), entry.refs.targetSlider.row);

    // 风速
    const sr = Array.isArray(device.speedRange) && device.speedRange.length >= 2 ? device.speedRange : [0, 8];
    entry.refs.speedList = Array.isArray(device.speedList) ? device.speedList : null;
    entry.refs.speedMin = sr[0];
    entry.refs.slider = makeSlider({
      label: '风速', min: sr[0], max: sr[1], icon: ICONS.fan,
      format: (v) => (entry.refs.speedList
        ? (labelList(entry.refs.speedList, v) || speedLabel(entry, v))
        : (Number(v) === sr[0] ? '自动' : Number(v) + ' 档')),
      onCommit: (v) => window.mijia.setSpeed(device.id, v),
    });
    entry.refs.sliderText = entry.refs.slider.text;
    el.append(entry.refs.slider.row);

    // 上下扫风
    const acSwing = device.verticalSwing !== null && device.verticalSwing !== undefined
      || device.horizontalSwing !== null && device.horizontalSwing !== undefined;
    if (acSwing) el.append(sep());
    if (device.verticalSwing !== null && device.verticalSwing !== undefined) {
      el.append(makeSwing(entry, device.id, 'verticalSwing', 'verticalSwingAngle', device.verticalSwingAngleList, '上下扫风'));
    }
    // 左右扫风（部分机型支持）
    if (device.horizontalSwing !== null && device.horizontalSwing !== undefined) {
      el.append(makeSwing(entry, device.id, 'horizontalSwing', 'horizontalSwingAngle', device.horizontalSwingAngleList, '左右扫风'));
    }
  }

  if (device.type === 'purifier') {
    const body = h('div', 'card-body');
    const hero = makeHero('水温', '°C');
    entry.refs.value = hero.value;

    const meta = h('div', 'meta');
    // 状态行：状态文案 + 缺水警示
    const stateRow = h('div', 'meta-row');
    stateRow.append(h('span', null, '状态'));
    entry.refs.statusChip = h('span', 'status-chip', '--');
    entry.refs.warn = h('span', 'warn-badge', '缺水');
    entry.refs.warn.hidden = true;
    stateRow.append(entry.refs.statusChip, entry.refs.warn);
    // 滤芯寿命 / TDS / 故障
    entry.refs.filter = h('div', 'meta-row', '<span>滤芯寿命</span><b>--</b>');
    entry.refs.tds = h('div', 'meta-row', '<span>进水/出水 TDS</span><b>--</b>');
    entry.refs.faultRow = h('div', 'meta-row', '<span>故障</span><b>--</b>');
    entry.refs.faultRow.hidden = true;
    meta.append(stateRow, entry.refs.filter, entry.refs.tds, entry.refs.faultRow);

    body.append(hero.hero, meta);
    el.append(body);

    // 制冰：开关 + 制冰状态
    const iceRow = h('div', 'ctrl-row');
    iceRow.append(h('span', 'ctrl-label', '制冰'));
    const iceWrap = h('div', 'ctrl-flex');
    entry.refs.iceChip = makeChip('关', () => {
      const cur = entry.last ? !!entry.last.iceMakerOn : false;
      window.mijia.setField(device.id, 'iceMakerOn', !cur);
    });
    entry.refs.iceText = h('span', 'ctrl-note', '--');
    iceWrap.append(entry.refs.iceChip, entry.refs.iceText);
    iceRow.append(iceWrap);
    el.append(sep(), iceRow);

    // 制冰模式：正常 / 快速
    if (Array.isArray(device.modeList) && device.modeList.length) {
      entry.refs.modeSeg = makeSeg(
        device.modeList.map((it) => ({ value: it.value, label: humanizeLevel(it.description) })),
        (v) => window.mijia.setField(device.id, 'mode', v)
      );
      el.append(sep(), ctrlRow('制冰模式', entry.refs.modeSeg));
    }

    // 出水温度：下限跟随「当前水温」（常温档），上限 95℃，避免调到设备不支持的低温
    const pt = Array.isArray(device.targetTempRange) && device.targetTempRange.length >= 2
      ? device.targetTempRange : [0, 95];
    entry.refs.targetSlider = makeSlider({
      label: '出水温度', min: purifierTargetMin(device), max: pt[1], step: '1', icon: TEMP_ICON,
      format: (v) => String(Math.round(Number(v))) + '°C',
      onCommit: (v) => window.mijia.setField(device.id, 'targetTemperature', v),
    });
    // 水温变化时同步滑杆下限（下限不能高于当前设定值）
    entry.refs.syncTargetMin = () => {
      const min = purifierTargetMin(entry.last);
      const slider = entry.refs.targetSlider.slider;
      if (slider.min !== String(min)) {
        slider.min = String(min);
        if (Number(slider.value) < min) slider.value = String(min);
      }
    };
    el.append(sep(), entry.refs.targetSlider.row);
  }

  // 网络设备（路由器 / 网关）与其它无可控开关的设备：只展示只读信息
  if (device.type === 'router' || device.type === 'gateway' || device.type === 'other') {
    const body = h('div', 'card-body');
    const meta = h('div', 'meta');
    // 规格里没有可读属性（如计时器、青萍蓝牙网关）时，状态行最左侧给一句提示，
    // 说明只能看到在线/离线，读不到设备自身的状态；有可读属性的设备保持原样。
    const hint = device.hasReads ? '' : '<i class="meta-hint">该设备暂不支持读取状态</i>';
    entry.refs.state = h('div', 'meta-row', hint + '<span>状态</span><b>--</b>');
    // 路由器规格里有上下行速率 / 连接设备数，就一并展示
    if (device.hasNetMetrics) {
      const hero = makeHero('连接设备', '台');
      entry.refs.value = hero.value;
      entry.refs.down = h('div', 'meta-row', '<span>下行</span><b>--</b>');
      entry.refs.up = h('div', 'meta-row', '<span>上行</span><b>--</b>');
      meta.append(entry.refs.down, entry.refs.up, entry.refs.state);
      body.append(hero.hero);
    } else {
      meta.append(entry.refs.state);
    }
    body.append(meta);
    el.append(body);
  }

  // 点阵把手始终位于卡片头部最右
  head.append(grip);

  // 收折：除卡片头部与基础信息(card-body)以外的直接子元素都标记为可收折区域，
  // 收折后只保留「基本信息 + 基本按钮(头部开关)」，滑杆 / 控制行等一并隐藏。
  let extraCount = 0;
  for (const child of el.children) {
    if (child === head || child.classList.contains('card-body')) continue;
    child.classList.add('card-extra');
    extraCount += 1;
  }
  // 没有可收折内容的卡片（温度计 / 网关 / 计时器等）直接禁止收折
  if (extraCount === 0) {
    el.classList.add('no-collapse');
    collapsedSet.delete(String(device.id));
  } else {
    el.classList.toggle('collapsed', collapsedSet.has(String(device.id)));
  }

  return entry;
}

/* ---------------- 卡片更新 ---------------- */

// 真实设备在拉到属性前，temperature/humidity/battery/todayKwh 均为 null，
// 这里统一做数值兜底，避免 toFixed 抛错中断整个列表渲染。
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// 汇总设备异常项，返回「设备名+异常项目」文本（离线 / 缺水 / 故障）
function collectAnomalies(devices) {
  const out = [];
  for (const d of devices) {
    if (d.online === false) { out.push(`${d.name}离线`); continue; }
    if (d.noWater) out.push(`${d.name}缺水`);
    const fv = isNum(d.fault) ? Number(d.fault) : 0;
    if (fv) out.push(`${d.name}${d.faultLabel || PURIFIER_FAULT[fv] || '故障'}`);
  }
  return out;
}

// 同步 makeSlider 生成的滑杆（拖拽中不覆盖用户输入）
function syncSlider(ref, value, online) {
  if (!ref) return;
  const { slider, text } = ref;
  if (!slider._drag) {
    if (isNum(value)) {
      slider.value = String(value);
      text.textContent = slider._fmt(slider.value);
    } else {
      text.textContent = '--';
    }
  }
  slider.disabled = online === false;
}

function updateCard(entry, d) {
  const r = entry.refs;
  entry.last = d;
  entry.el.querySelector('.card-name b').textContent = d.name;
  // 显示房间名称时，把房间名以小字前缀写在设备代号（model）前，用「 | 」分隔；
  // 两者同处 .card-name span，字号与字体天然一致。
  entry.el.querySelector('.card-name span').textContent =
    (showRoomName && d.roomName ? String(d.roomName) + ' · ' : '') + d.model;
  entry.el.classList.toggle('offline', d.online === false);
  // 只有「带开关且已开启」的设备才显示激活态（实色）图标；
  // 传感器、净饮机等没有开关的设备始终显示淡底（关闭态）图标，
  // 避免出现和灯「打开」一样的实色图标。
  const hasSwitch = entry.type === 'plug' || entry.type === 'light' || entry.type === 'fan' || entry.type === 'aircon';
  entry.el.classList.toggle('active', hasSwitch && d.on === true);

  if (d.type === 'sensor') {
    const tv = r.temp.querySelector('.value');
    const t = isNum(d.temperature) ? d.temperature.toFixed(1) : '--';
    if (tv.textContent !== t) tv.textContent = t;
    const hv = r.humidity.querySelector('.value');
    hv.textContent = isNum(d.humidity) ? String(Math.round(d.humidity)) : '--';
    r.battery.querySelector('b').textContent = isNum(d.battery) ? d.battery + '%' : '--';
  }

  if (d.type === 'plug') {
    r.value.querySelector('.value').textContent = d.on ? Math.round(isNum(d.power) ? d.power : 0) : 0;
    r.value.querySelector('.unit').textContent = 'W';
    r.kwh.querySelector('b').textContent = isNum(d.todayKwh) ? d.todayKwh.toFixed(2) + ' kWh' : '--';
    r.state.querySelector('b').textContent = d.on ? '已开启' : '已关闭';
    r.switch.classList.toggle('on', !!d.on);
    r.switch.setAttribute('aria-checked', String(!!d.on));
    r.switch.disabled = d.online === false;
  }

  if (d.type === 'light') {
    r.value.querySelector('.value').textContent = d.brightness;
    r.state.querySelector('b').textContent = d.on ? '已开启' : '已关闭';
    r.switch.classList.toggle('on', !!d.on);
    r.switch.setAttribute('aria-checked', String(!!d.on));
    r.switch.disabled = d.online === false;
    if (!entry.dragging) {
      r.slider.value = String(d.brightness);
      r.sliderText.textContent = d.brightness + '%';
      r.slider.classList.toggle('lit', d.on && d.brightness > 1);
      setFill(r.slider);
    }
    r.slider.disabled = d.online === false;
    // 色温（仅支持的灯具有该滑杆）
    if (r.tempSlider) {
      if (!entry.tempDragging) {
        if (isNum(d.colorTemperature) && d.colorTemperature > 0) {
          r.tempSlider.value = String(d.colorTemperature);
          r.tempText.textContent = d.colorTemperature + 'K';
          if (r.tempValue) r.tempValue.querySelector('.value').textContent = d.colorTemperature;
        } else {
          r.tempText.textContent = '--K';
          if (r.tempValue) r.tempValue.querySelector('.value').textContent = '--';
        }
      }
      r.tempSlider.disabled = d.online === false;
      // 关灯时色温滑杆同步置灰（不再显示渐变），与亮度滑杆一致
      r.tempSlider.classList.toggle('ct-off', !d.on);
    }
  }

  if (d.type === 'fan') {
    if (r.configureSpeed) r.configureSpeed(d.mode);
    const sp = r.speedStepless
      ? (isNum(d.speedStepless) ? Math.round(d.speedStepless) : r.speedMin)
      : (isNum(d.speed) ? Math.round(d.speed) : r.speedMin);
    applySpeedReadout(entry, sp);
    r.state.querySelector('b').textContent = d.on ? '已开启' : '已关闭';
    r.switch.classList.toggle('on', !!d.on);
    r.switch.setAttribute('aria-checked', String(!!d.on));
    r.switch.disabled = d.online === false;
    if (!entry.dragging) {
      r.slider.value = String(sp);
      r.slider.classList.toggle('lit', d.on && sp > r.speedMin);
      setFill(r.slider);
    }
    r.slider.disabled = d.online === false;
    if (r.modeSeg) r.modeSeg._setActive(d.mode);
    syncSwing(entry, d, 'horizontalSwing', 'horizontalSwingAngle');
    syncSwing(entry, d, 'verticalSwing', 'verticalSwingAngle');
  }

  if (d.type === 'aircon') {
    r.switch.classList.toggle('on', !!d.on);
    r.switch.setAttribute('aria-checked', String(!!d.on));
    r.switch.disabled = d.online === false;
    r.value.querySelector('.value').textContent = isNum(d.targetTemperature) ? d.targetTemperature.toFixed(1) : '--';
    r.room.hidden = !isNum(d.temperature);
    r.room.querySelector('b').textContent = isNum(d.temperature) ? d.temperature.toFixed(1) + '°C' : '--';
    if (r.modeSeg) r.modeSeg._setActive(d.mode);
    syncSlider(r.targetSlider, d.targetTemperature, d.online);
    syncSlider(r.slider, d.speed, d.online);
    syncSwing(entry, d, 'verticalSwing', 'verticalSwingAngle');
    syncSwing(entry, d, 'horizontalSwing', 'horizontalSwingAngle');
  }

  if (d.type === 'purifier') {
    const faultValue = isNum(d.fault) ? Number(d.fault) : null;
    const faultLabel = faultValue ? (PURIFIER_FAULT[faultValue] || '故障 ' + faultValue) : '';
    const noWater = d.noWater === true;
    let st = labelList(d.statusList, d.status);
    if (noWater) st = '缺水中';
    if (!st) st = '待机中';
    r.statusChip.textContent = st;
    r.statusChip.classList.toggle('warn', noWater);
    r.warn.hidden = !noWater;

    r.value.querySelector('.value').textContent = isNum(d.temperature)
      ? String(Math.round(d.temperature)) : '--';

    const iceOn = !!d.iceMakerOn;
    r.iceChip.classList.toggle('on', iceOn);
    r.iceChip.textContent = iceOn ? '开' : '关';
    r.iceText.textContent = labelList(d.iceMakerStatusList, d.iceMakerStatus) || (iceOn ? '制冰中' : '空闲');

    if (r.modeSeg) r.modeSeg._setActive(d.mode);
    // 出水温度下限跟随当前水温（常温档），水温变化时同步滑杆 min
    if (r.syncTargetMin) r.syncTargetMin();
    syncSlider(r.targetSlider, d.targetTemperature, d.online);

    // 滤芯寿命：部分净饮机有两支滤芯，两支并排展示（如 88% / 92%）
    const lives = [d.filterLife, d.filterLife2].filter((v) => isNum(v));
    r.filter.querySelector('b').textContent = lives.length
      ? lives.map((v) => v + '%').join(' / ')
      : '--';
    r.tds.querySelector('b').textContent = (isNum(d.tdsIn) || isNum(d.tdsOut))
      ? `${isNum(d.tdsIn) ? d.tdsIn : '--'} / ${isNum(d.tdsOut) ? d.tdsOut : '--'}`
      : '--';
    r.faultRow.querySelector('b').textContent = faultLabel || '正常';
    r.faultRow.classList.toggle('warn', !!faultLabel);
    r.faultRow.hidden = !faultLabel;
  }

  // 网络设备（路由器 / 网关）与其它无可控开关的设备：只读信息
  if (d.type === 'router' || d.type === 'gateway' || d.type === 'other') {
    r.state.querySelector('b').textContent = d.online === false ? '离线' : '在线';
    if (r.value) {
      r.value.querySelector('.value').textContent = isNum(d.connectedDeviceNumber)
        ? String(Math.round(d.connectedDeviceNumber)) : '--';
      r.down.querySelector('b').textContent = isNum(d.downloadSpeed)
        ? d.downloadSpeed.toFixed(1) + ' KB/s' : '--';
      r.up.querySelector('b').textContent = isNum(d.uploadSpeed)
        ? d.uploadSpeed.toFixed(1) + ' KB/s' : '--';
    }
  }
}

/* ---------------- 顺序持久化 ---------------- */

function readOrder() {
  try {
    const arr = JSON.parse(localStorage.getItem('mijia.order') || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persistOrder() {
  // 扁平模式只有一个容器；按房间分类时依次取各房间的瀑布流容器（文档序 = 房间顺序），
  // 拼成一份全局顺序：房间内顺序即用户拖动结果，渲染时 sortByOrder 再按此还原。
  const containers = groupByRoom
    ? [...listEl.querySelectorAll('.room-list')]
    : [listEl];
  order = [];
  for (const c of containers) {
    for (const el of c.children) {
      if (el.classList && el.classList.contains('card')) order.push(el.dataset.id);
    }
  }
  try { localStorage.setItem('mijia.order', JSON.stringify(order)); } catch {}
}

function sortByOrder(devices) {
  if (!order.length) return devices;
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...devices].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : Infinity;
    const rb = rank.has(b.id) ? rank.get(b.id) : Infinity;
    return ra - rb;
  });
}

/* ---------------- 房间顺序持久化 ---------------- */

function readRoomOrder() {
  try {
    const arr = JSON.parse(localStorage.getItem('mijia.roomOrder') || '[]');
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function writeRoomOrder() {
  try { localStorage.setItem('mijia.roomOrder', JSON.stringify(roomOrder)); } catch {}
}

// 按当前 DOM 顺序（即用户拖动后的顺序）记录房间 key
function persistRoomOrder() {
  roomOrder = [...listEl.children]
    .filter((el) => el.classList && el.classList.contains('room'))
    .map((el) => el.dataset.roomId);
  writeRoomOrder();
}

/* ---------------- 隐藏设备持久化 ---------------- */

function readHidden() {
  try {
    const arr = JSON.parse(localStorage.getItem('mijia.hidden') || '[]');
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeHidden() {
  try { localStorage.setItem('mijia.hidden', JSON.stringify([...hiddenSet])); } catch {}
}

/* ---------------- 卡片收折持久化 ---------------- */

function readCollapsed() {
  try {
    const arr = JSON.parse(localStorage.getItem('mijia.collapsed') || '[]');
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeCollapsed() {
  try { localStorage.setItem('mijia.collapsed', JSON.stringify([...collapsedSet])); } catch {}
}

// 切换某张卡片的收折状态（收折 = 只留基本信息与基本按钮）；不可收折的卡片直接忽略
function setCollapsed(card, collapsed) {
  if (!card || card.classList.contains('no-collapse')) return;
  card.classList.toggle('collapsed', collapsed);
  const id = String(card.dataset.id);
  if (collapsed) collapsedSet.add(id); else collapsedSet.delete(id);
  writeCollapsed();
  equalizeCollapsed();
  trackSpans();
  fitWindow();
}

// 双击卡片（正文区域）即可收折 / 展开
listEl.addEventListener('dblclick', (e) => {
  if (e.target.closest('input, button, .switch, .seg, .chip, .drag-handle, .room-head')) return;
  const card = e.target.closest('.card');
  if (!card) return;
  setCollapsed(card, !card.classList.contains('collapsed'));
});

/* ---------------- 房间分组：收折持久化 / 显示选项 ---------------- */

function readCollapsedRooms() {
  try {
    const arr = JSON.parse(localStorage.getItem('mijia.collapsedRooms') || '[]');
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeCollapsedRooms() {
  try { localStorage.setItem('mijia.collapsedRooms', JSON.stringify([...collapsedRooms])); } catch {}
}

function readGroupByRoom() {
  try { return localStorage.getItem('mijia.groupByRoom') === '1'; } catch { return false; }
}

function readShowRoomName() {
  try { return localStorage.getItem('mijia.showRoomName') !== '0'; } catch { return true; }
}

/* ---------------- 拖动排序 ---------------- */

// 仅在点阵把手上按下才进入拖动。卡片改为绝对定位跟手，原位置以等高占位撑住，
// 多列网格下按「二维最近网格单元」决定落点，其它卡片让位时用 FLIP 平滑过渡。
const DRAG_THRESHOLD = 4;
// 拖动时卡片放大倍数：transform-origin 固定为左上角(0 0)，跟手公式据此按比例换算抓取点，
// 保证指针始终压住把手上按下时的那个点（见 startDrag / layoutDrag）。
const DRAG_SCALE = 1.04;
// 目标判定迟滞（死区）：指针落在卡片之间的缝隙或边缘时，若没有死区，鼠标的亚像素抖动
// 会让 target / insertAfter 在边界（中心线）两侧反复翻转，占位符随之来回插入，
// 每次翻转都触发整列重排 + FLIP，视觉上就是「一闪一闪」。
const DRAG_TARGET_DEADZONE = 24;  // px：指针不在任何卡片内时，新目标须比当前目标近这么多才切换
const DRAG_INSERT_DEADZONE = 14;  // px：指针越过目标中心线这么多，才改变占位「插前 / 插后」
// 指针位移阈值：相对上次落点判定，指针在内容坐标系中移动不足这么多时直接沿用上次判定，
// 既不重算也不重排 —— 切断「重排改变布局 → 下一帧又改判 → 再重排」的反馈震荡。
const DRAG_EVAL_EPS = 3;          // px

listEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  if (roomDrag) return;                       // 房间拖动进行中不发起设备拖动
  const handle = e.target.closest('.drag-handle');
  if (!handle) return;
  const card = handle.closest('.card');
  if (!card) return;
  // 容器：扁平模式是 #devices；按房间分类时是卡片所在的 .room-list，
  // 拖动因此只在房间内部生效（卡片归属由房间决定，不能跨房间拖）
  const container = card.closest('.room-list') || listEl;
  drag = {
    container,
    el: card,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    lastX: e.clientX,
    lastY: e.clientY,
    grabX: 0,          // 指针相对卡片左上角的内容坐标偏移
    grabY: 0,
    moved: false,
    ph: null,
    baseTop: 0,
    baseLeft: 0,
    width: 0,
    height: 0,
    lastTarget: null,        // 上一帧的落点目标，用于迟滞
    lastInsertAfter: false,  // 上一帧的插前/插后判定，用于迟滞
    lastEvalX: null,         // 上次落点判定时指针的内容坐标（用于位移阈值）
    lastEvalY: null,
    boxes: null,             // 起拖前各卡片的几何快照（内容坐标），落点判定只用它，见 startDrag
  };
  e.preventDefault();
});

function startDrag() {
  const el = drag.el;
  const container = drag.container;
  drag.moved = true;
  // 记录脱离文档流前的几何信息：用视觉矩形（getBoundingClientRect）而不是 offsetLeft/Top。
  // 网格列宽/间隙是亚像素分配，offset 系列与视觉矩形能差 1~2px；若以 offset 为基准，
  // 切到绝对定位的一瞬间卡片会平移这一点点，抓取点也就随之偏离指针。
  const listRect = container.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  drag.baseLeft = rect.left - listRect.left + container.scrollLeft;
  drag.baseTop = rect.top - listRect.top + container.scrollTop;
  drag.width = rect.width;
  drag.height = rect.height;
  // 指针在卡片内的视觉偏移（放大前），跟手时按 DRAG_SCALE 换算
  drag.grabX = drag.startX - rect.left;
  drag.grabY = drag.startY - rect.top;

  // 落点判定的几何快照：必须在插入占位符「之前」抓取。
  // 占位符一旦插入网格，会把它之后的卡片顺移一个槽位（列锁定按 DOM 序 i%列数 分配），
  // 若判定读「实时」offset —— 判定改变占位符位置 → 占位符改变卡片位置 → 下一帧又改判定，
  // 指针停在边缘/缝隙（不在任何卡片内、只能取最近卡片）时就会每帧来回翻转，表现为闪烁。
  // 快照冻结了「插入占位符之前」的布局，判定与占位符自身的影响解耦，从此稳定。
  drag.boxes = new Map();
  for (const c of container.children) {
    if (c.classList && c.classList.contains('card') && c !== el) {
      drag.boxes.set(c, {
        l: c.offsetLeft,
        t: c.offsetTop,
        w: c.offsetWidth,
        h: c.offsetHeight,
      });
    }
  }

  const ph = document.createElement('div');
  ph.className = 'drag-placeholder';
  ph.style.height = drag.height + 'px';
  // 占位符沿用卡片原来的跨度，保证脱离文档流时不引起其它卡片跳动
  if (el.style.gridRowEnd) ph.style.gridRowEnd = el.style.gridRowEnd;
  container.insertBefore(ph, el);
  drag.ph = ph;

  el.classList.add('dragging');
  el.style.position = 'absolute';
  // 关键：绝对定位的网格子元素若保留显式 grid-column，其包含块会变成「所在网格区域」，
  // 于是 left/top 变成相对该区域偏移（第 2 列会凭空多出一个列宽），卡片就会「飞」。
  // 清掉列/行定位，让包含块回落到列表容器的 padding 盒，left/top 即内容坐标。
  el.style.gridColumn = '';
  el.style.gridRowEnd = '';
  // 放大以左上角为原点，跟手换算才与抓取位置无关
  el.style.transformOrigin = '0 0';
  el.style.left = drag.baseLeft + 'px';
  el.style.top = drag.baseTop + 'px';
  el.style.width = drag.width + 'px';
  el.style.margin = '0';
  el.style.zIndex = '20';
  el.style.pointerEvents = 'none';
  el.style.transition = 'none';

  drag.lastX = drag.startX;
  drag.lastY = drag.startY;
  autoScrollRAF = requestAnimationFrame(autoScrollTick);
}

// 拖拽跟手定位：按当前指针位置（视口坐标）重算位移，并处理二维让位
function layoutDrag(cursorX, cursorY) {
  const container = drag.container;
  const rect = container.getBoundingClientRect();
  const cx = cursorX - rect.left + container.scrollLeft; // 指针在容器内容坐标系中的位置
  const cy = cursorY - rect.top + container.scrollTop;
  // transform-origin 为左上角(0 0)，放大后卡片上任意点 p 的落位 = 原点 + DRAG_SCALE*p + 位移。
  // 要让「按下时抓住的那一点」(grabX,grabY) 始终停在指针下，位移应为：
  //   dx = cx - baseLeft - DRAG_SCALE*grabX（y 同理）
  const dx = cx - drag.baseLeft - DRAG_SCALE * drag.grabX;
  const dy = cy - drag.baseTop - DRAG_SCALE * drag.grabY;
  drag.el.style.transform = `translate(${dx}px, ${dy}px) scale(${DRAG_SCALE})`;

  // 位移阈值：指针相对上次落点判定移动很小（亚像素抖动/静止微颤）时，直接沿用上次判定，
  // 不重算目标、不重排。否则指针停在边缘/缝隙处，重排改变布局会让下一帧又改判，来回震荡闪烁。
  if (
    drag.lastEvalX !== null &&
    Math.hypot(cx - drag.lastEvalX, cy - drag.lastEvalY) < DRAG_EVAL_EPS
  ) return;

  // 落点判定：优先取包含指针的网格单元；指针不在任何单元内（缝隙 / 边缘）时，
  // 默认沿用上一次的目标，只有当另一张卡片明显更近（超出死区）才切换 —— 迟滞抑制边界抖动。
  const cards = [...container.children].filter(
    (c) => c.classList && c.classList.contains('card') && c !== drag.el
  );
  // 判定一律走「起拖时的几何快照」（见 startDrag）：快照不受占位符插入影响，
  // 因此判定结果不会反过来被自己的后果改变，边缘/缝隙处也就不再每帧翻转。
  // 快照缺失（异常路径）时退回实时 offset，保证不会因为拿不到几何而失效。
  const boxOf = (c) => {
    const b = drag.boxes && drag.boxes.get(c);
    return b || { l: c.offsetLeft, t: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight };
  };
  const centerDist = (c) => {
    const b = boxOf(c);
    const dx = cx - (b.l + b.w / 2);
    const dy = cy - (b.t + b.h / 2);
    return Math.hypot(dx, dy);
  };
  let target = null;
  for (const c of cards) {
    const b = boxOf(c);
    if (cx >= b.l && cx <= b.l + b.w && cy >= b.t && cy <= b.t + b.h) { target = c; break; }
  }
  if (!target && cards.length) {
    const prev = drag.lastTarget && cards.includes(drag.lastTarget) ? drag.lastTarget : null;
    let best = prev;
    let bestD = prev ? centerDist(prev) : Infinity;
    for (const c of cards) {
      const d = centerDist(c);
      if (d < bestD) { bestD = d; best = c; }
    }
    // 有上一目标时：最优卡片必须比它近出死区才允许切换，否则保持原目标，避免中心线附近来回翻转
    if (prev && best !== prev && bestD > centerDist(prev) - DRAG_TARGET_DEADZONE) best = prev;
    target = best;
  }

  // 依据读序（先行后列）判断占位应落在目标单元之前还是之后
  let insertAfter = false;
  if (target) {
    const tb = boxOf(target);
    const tcx = tb.l + tb.w / 2;
    const tcy = tb.t + tb.h / 2;
    // 比较轴的选择：指针落在目标卡片的「水平跨度」内时按纵向（上/下）判断插入前后，
    // 否则按横向判断。绝不能以「卡片自身高度」判同行 —— 指针刚进入卡片顶边的一瞬间，
    // 比较轴会从纵向切成横向，delta 由负突变（-70）为正（+136），占位符在相邻两个槽位
    // 间每帧来回翻转。纵向缝隙（同列上下两卡之间）判定的正是这条边界，于是表现为闪烁。
    // 改用「水平跨度」作为分界，指针上下微动时比较轴保持纵向，delta 连续，判定稳定。
    const inSpanX = cx >= tb.l && cx <= tb.l + tb.w;
    const delta = inSpanX ? cy - tcy : cx - tcx;
    if (target === drag.lastTarget && typeof drag.lastInsertAfter === 'boolean') {
      // 同一目标内：指针只有在越过中心线并超出死区后才改变「插前 / 插后」，死区内维持原判定
      if (delta > DRAG_INSERT_DEADZONE) insertAfter = true;
      else if (delta < -DRAG_INSERT_DEADZONE) insertAfter = false;
      else insertAfter = drag.lastInsertAfter;
    } else {
      insertAfter = delta > 0;
    }
  }
  // 记录本次稳定判定，供下一帧迟滞参考
  drag.lastTarget = target;
  drag.lastInsertAfter = target ? insertAfter : false;
  drag.lastEvalX = cx;
  drag.lastEvalY = cy;

  // 占位当前是否已经在正确位置：是则直接返回 —— 不重排、不 FLIP。
  // 这是消除「多列拖动一闪一闪」的关键：pointermove 每帧都会触发，
  // 若每帧都重排 + FLIP，会反复读到未结束的过渡位置并叠加位移，造成抖动/不跟手。
  const alreadyPlaced = target
    ? (insertAfter ? target.nextElementSibling === drag.ph : drag.ph.nextElementSibling === target)
    : container.lastElementChild === drag.ph;
  if (alreadyPlaced) return;

  // 记录让位前位置：用 offset 快照（不含 transform），FLIP 差值才稳定不累积
  const before = new Map(cards.map((c) => [c, [c.offsetLeft, c.offsetTop]]));
  if (target) {
    container.insertBefore(drag.ph, insertAfter ? target.nextElementSibling : target);
  } else {
    container.append(drag.ph);
  }

  // 占位符落位后重新分配列，其余卡片随之让位（列锁定下也按新顺序重排）
  assignColumns(container);
  cards.forEach((c) => {
    const b = before.get(c);
    const mdx = b[0] - c.offsetLeft;
    const mdy = b[1] - c.offsetTop;
    if (Math.abs(mdx) < 0.5 && Math.abs(mdy) < 0.5) return;
    c.style.transition = 'none';
    c.style.transform = `translate(${mdx}px, ${mdy}px)`;
    void c.offsetWidth; // 强制应用起始帧，避免被合并导致动画起点错位
    requestAnimationFrame(() => {
      c.style.transition = 'transform 0.18s ease';
      c.style.transform = '';
    });
  });
}

function moveDrag(e) {
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  layoutDrag(e.clientX, e.clientY);
}

// 指针靠近列表上下边缘时，自动滚动列表并刷新跟手位置
function autoScrollTick() {
  if (!drag || !drag.moved) { autoScrollRAF = null; return; }
  const rect = listEl.getBoundingClientRect();
  const EDGE = 46;   // 触发自动滚动的边缘高度
  const MAX = 16;    // 每帧最大滚动像素
  const y = drag.lastY;
  let speed = 0;
  if (y < rect.top + EDGE) speed = -Math.ceil(((rect.top + EDGE - y) / EDGE) * MAX);
  else if (y > rect.bottom - EDGE) speed = Math.ceil(((y - (rect.bottom - EDGE)) / EDGE) * MAX);
  speed = Math.max(-MAX, Math.min(MAX, speed));
  if (speed) {
    const before = listEl.scrollTop;
    listEl.scrollTop = before + speed;
    if (listEl.scrollTop !== before) layoutDrag(drag.lastX, drag.lastY);
  }
  autoScrollRAF = requestAnimationFrame(autoScrollTick);
}

// 结束拖动：把被拖卡片插回占位处，并用二维 FLIP 平滑落回网格单元
function endDrag() {
  if (!drag) return;
  const { el, ph, moved, container } = drag;
  if (autoScrollRAF) { cancelAnimationFrame(autoScrollRAF); autoScrollRAF = null; }
  if (moved && ph) {
    const from = el.getBoundingClientRect();
    el.classList.remove('dragging');
    container.insertBefore(el, ph);
    ph.remove();

    // 复位其它卡片的临时让位样式
    for (const c of container.children) {
      if (c !== el && c.classList && c.classList.contains('card')) {
        c.style.transition = '';
        c.style.transform = '';
      }
    }

    // 清除绝对定位等内联样式，让卡片重新受网格排布，再 FLIP 到最终位置
    el.style.cssText = '';
    assignColumns(container);
    equalizeCollapsed(container);
    layoutSpans(container);
    trackSpans();
    const to = el.getBoundingClientRect();
    const fx = from.left - to.left;
    const fy = from.top - to.top;
    if (fx || fy) {
      el.style.transition = 'none';
      el.style.transform = `translate(${fx}px, ${fy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.18s ease';
        el.style.transform = '';
        // 动画结束后清掉内联过渡，避免残留影响后续布局动画
        setTimeout(() => { if (!el.classList.contains('dragging')) el.style.transition = ''; }, 220);
      });
    }
    persistOrder();
  } else {
    if (ph) ph.remove();
    el.classList.remove('dragging');
    el.style.cssText = '';
    // 未真正拖动也会清空内联样式，这里把列/跨度补回来，避免卡片被自动放置到第一列
    assignColumns(container);
    equalizeCollapsed(container);
    layoutSpans(container);
    trackSpans();
  }
  drag = null;
}

window.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
    startDrag();
  }
  e.preventDefault();
  moveDrag(e);
}, { passive: false });

window.addEventListener('pointerup', (e) => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  endDrag();
});

window.addEventListener('pointercancel', () => {
  if (drag) endDrag();
});

// 窗口失焦（如拖到窗外松手）时收尾，避免拖动状态残留
window.addEventListener('blur', () => {
  if (drag) endDrag();
  if (roomDrag) endRoomDrag();
});

/* ---------------- 房间整体拖动排序 ---------------- */

// 仅按房间头上的点阵把手才进入拖动。整个 .room（头 + 卡片区）绝对定位跟手，
// 原位置以等高占位撑住；上下移动到其它房间中心线附近时占位让位，其它房间用 FLIP 平滑过渡。
const ROOM_DRAG_THRESHOLD = 4;
const ROOM_DRAG_DEADZONE = 18;  // 指针越过目标中心线这么多才改变「插前 / 插后」，抑制边界抖动
const ROOM_DRAG_EPS = 3;        // 指针位移阈值，避免每帧重算重排
let roomAutoScrollRAF = null;

listEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  if (drag) return;                           // 设备拖动进行中不发起房间拖动
  const grip = e.target.closest('.room-grip');
  if (!grip) return;
  const section = grip.closest('.room');
  if (!section) return;
  roomDrag = {
    el: section,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    grabY: 0,
    moved: false,
    ph: null,
    baseTop: 0,
    baseLeft: 0,
    width: 0,
    height: 0,
    boxes: null,            // 起拖前其它房间的几何快照（内容坐标）
    lastTarget: null,
    lastInsertAfter: false,
    lastEvalY: null,
  };
  e.preventDefault();
});

function startRoomDrag() {
  const el = roomDrag.el;
  roomDrag.moved = true;
  const listRect = listEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  roomDrag.baseTop = rect.top - listRect.top + listEl.scrollTop;
  roomDrag.baseLeft = rect.left - listRect.left + listEl.scrollLeft;
  roomDrag.width = rect.width;
  roomDrag.height = rect.height;
  roomDrag.grabY = roomDrag.startY - rect.top;

  // 落点判定快照：必须在插入占位符之前抓取（占位符会顺移其后的房间）
  roomDrag.boxes = new Map();
  for (const c of listEl.children) {
    if (c.classList && c.classList.contains('room') && c !== el) {
      roomDrag.boxes.set(c, { t: c.offsetTop, h: c.offsetHeight });
    }
  }

  const ph = document.createElement('div');
  ph.className = 'room-drag-placeholder';
  ph.style.height = roomDrag.height + 'px';
  // 占位符沿用原房间的下外边距，避免脱离文档流时下方房间整体上移
  ph.style.marginBottom = getComputedStyle(el).marginBottom;
  el.parentNode.insertBefore(ph, el);
  roomDrag.ph = ph;

  el.classList.add('dragging-room');
  el.style.position = 'absolute';
  el.style.left = roomDrag.baseLeft + 'px';
  el.style.top = roomDrag.baseTop + 'px';
  el.style.width = roomDrag.width + 'px';
  el.style.margin = '0';
  el.style.zIndex = '20';
  el.style.pointerEvents = 'none';
  el.style.transition = 'none';

  roomAutoScrollRAF = requestAnimationFrame(roomAutoScrollTick);
}

function layoutRoomDrag(cursorY) {
  const listRect = listEl.getBoundingClientRect();
  const cy = cursorY - listRect.top + listEl.scrollTop;
  const dy = cy - roomDrag.baseTop - roomDrag.grabY;
  roomDrag.el.style.transform = `translateY(${dy}px)`;

  if (roomDrag.lastEvalY !== null && Math.abs(cy - roomDrag.lastEvalY) < ROOM_DRAG_EPS) return;

  const rooms = [...listEl.children].filter(
    (c) => c.classList && c.classList.contains('room') && c !== roomDrag.el
  );
  const boxOf = (c) => roomDrag.boxes.get(c) || { t: c.offsetTop, h: c.offsetHeight };
  const centerDist = (c) => {
    const b = boxOf(c);
    return Math.abs(cy - (b.t + b.h / 2));
  };
  let target = null;
  for (const c of rooms) {
    const b = boxOf(c);
    if (cy >= b.t && cy <= b.t + b.h) { target = c; break; }
  }
  if (!target && rooms.length) {
    const prev = roomDrag.lastTarget && rooms.includes(roomDrag.lastTarget) ? roomDrag.lastTarget : null;
    let best = prev;
    let bestD = prev ? centerDist(prev) : Infinity;
    for (const c of rooms) {
      const d = centerDist(c);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (prev && best !== prev && bestD > centerDist(prev) - ROOM_DRAG_DEADZONE) best = prev;
    target = best;
  }

  let insertAfter = false;
  if (target) {
    const tb = boxOf(target);
    const delta = cy - (tb.t + tb.h / 2);
    if (target === roomDrag.lastTarget && typeof roomDrag.lastInsertAfter === 'boolean') {
      if (delta > ROOM_DRAG_DEADZONE) insertAfter = true;
      else if (delta < -ROOM_DRAG_DEADZONE) insertAfter = false;
      else insertAfter = roomDrag.lastInsertAfter;
    } else {
      insertAfter = delta > 0;
    }
  }
  roomDrag.lastTarget = target;
  roomDrag.lastInsertAfter = target ? insertAfter : false;
  roomDrag.lastEvalY = cy;

  const alreadyPlaced = target
    ? (insertAfter ? target.nextElementSibling === roomDrag.ph : roomDrag.ph.nextElementSibling === target)
    : listEl.lastElementChild === roomDrag.ph;
  if (alreadyPlaced) return;

  const before = new Map(rooms.map((c) => [c, c.offsetTop]));
  if (target) {
    listEl.insertBefore(roomDrag.ph, insertAfter ? target.nextElementSibling : target);
  } else {
    listEl.append(roomDrag.ph);
  }
  rooms.forEach((c) => {
    const mdy = before.get(c) - c.offsetTop;
    if (Math.abs(mdy) < 0.5) return;
    c.style.transition = 'none';
    c.style.transform = `translateY(${mdy}px)`;
    void c.offsetWidth;
    requestAnimationFrame(() => {
      c.style.transition = 'transform 0.18s ease';
      c.style.transform = '';
    });
  });
}

function moveRoomDrag(e) {
  layoutRoomDrag(e.clientY);
}

// 指针靠近列表上下边缘时自动滚动列表并刷新跟手位置
function roomAutoScrollTick() {
  if (!roomDrag || !roomDrag.moved) { roomAutoScrollRAF = null; return; }
  const rect = listEl.getBoundingClientRect();
  const EDGE = 46;
  const MAX = 16;
  const y = roomDrag.lastY != null ? roomDrag.lastY : roomDrag.startY;
  let speed = 0;
  if (y < rect.top + EDGE) speed = -Math.ceil(((rect.top + EDGE - y) / EDGE) * MAX);
  else if (y > rect.bottom - EDGE) speed = Math.ceil(((y - (rect.bottom - EDGE)) / EDGE) * MAX);
  speed = Math.max(-MAX, Math.min(MAX, speed));
  if (speed) {
    const prev = listEl.scrollTop;
    listEl.scrollTop = prev + speed;
    if (listEl.scrollTop !== prev) layoutRoomDrag(y);
  }
  roomAutoScrollRAF = requestAnimationFrame(roomAutoScrollTick);
}

function endRoomDrag() {
  if (!roomDrag) return;
  const { el, ph, moved } = roomDrag;
  if (roomAutoScrollRAF) { cancelAnimationFrame(roomAutoScrollRAF); roomAutoScrollRAF = null; }
  if (moved && ph) {
    const from = el.getBoundingClientRect();
    el.classList.remove('dragging-room');
    listEl.insertBefore(el, ph);
    ph.remove();
    for (const c of listEl.children) {
      if (c !== el && c.classList && c.classList.contains('room')) {
        c.style.transition = '';
        c.style.transform = '';
      }
    }
    el.style.cssText = '';
    const to = el.getBoundingClientRect();
    const fy = from.top - to.top;
    if (fy) {
      el.style.transition = 'none';
      el.style.transform = `translateY(${fy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.18s ease';
        el.style.transform = '';
        setTimeout(() => { if (!el.classList.contains('dragging-room')) el.style.transition = ''; }, 220);
      });
    }
    persistRoomOrder();
  } else {
    if (ph) ph.remove();
    el.classList.remove('dragging-room');
    el.style.cssText = '';
  }
  roomDrag = null;
}

window.addEventListener('pointermove', (e) => {
  if (!roomDrag || e.pointerId !== roomDrag.pointerId) return;
  roomDrag.lastY = e.clientY;
  if (!roomDrag.moved) {
    if (Math.hypot(e.clientX - roomDrag.startX, e.clientY - roomDrag.startY) < ROOM_DRAG_THRESHOLD) return;
    startRoomDrag();
  }
  e.preventDefault();
  moveRoomDrag(e);
}, { passive: false });

window.addEventListener('pointerup', (e) => {
  if (!roomDrag || e.pointerId !== roomDrag.pointerId) return;
  endRoomDrag();
});

window.addEventListener('pointercancel', () => {
  if (roomDrag) endRoomDrag();
});

/* ---------------- 瀑布流：列锁定 + 按卡片实际高度换算 grid-row 跨度 ---------------- */

// 列锁定：按 DOM 顺序把卡片轮流分配到各列（i % 列数），写入 grid-column 钉死。
// 这样每张卡片的列是固定的 —— 展开某张卡片只会撑高它自己所在的列、顺延其后的卡片，
// 其它列不会因为高度差而横向换列（避免卡片「随意移动」）。
function assignColumns(container = listEl) {
  if (!container) return;
  const cols = gridCols(container);
  isSingleCol(container);
  let i = 0;
  for (const el of container.children) {
    if (!el.classList) continue;
    const placed = el.classList.contains('card')
      ? !el.classList.contains('dragging')
      : el.classList.contains('drag-placeholder');
    if (!placed) continue;
    const v = cols > 1 ? String((i % cols) + 1) : '';
    if (el.style.gridColumn !== v) el.style.gridColumn = v;
    i += 1;
  }
}

// 每张卡片测量自身自然高度，换算成「跨多少行」（行高 2px + 行间距 8px）。
// 这样展开某张卡片时，只有它自己的网格区域变高、其所在列向下顺延，
// 同一排的其它卡片高度不受影响 —— 即真·瀑布流。
function layoutSpans(container = listEl) {
  if (!container) return;
  // 单列用内容自适应行高：卡片各占一行、缝隙由 row-gap 精确决定，无需（也不应）写跨度
  if (isSingleCol(container)) {
    for (const el of container.children) {
      if (el.classList && el.classList.contains('card') && el.style.gridRowEnd) el.style.gridRowEnd = '';
    }
    return;
  }
  const cs = getComputedStyle(container);
  const gap = parseFloat(cs.columnGap) || 8;      // 横竖缝统一：纵向缝隙 = 列间距
  const unit = parseFloat(cs.gridAutoRows) || 1;  // 多列下为 1px（配合 row-gap:0）
  if (unit <= 0) return;
  for (const el of container.children) {
    if (!el.classList || !el.classList.contains('card')) continue;
    // 拖动中的卡片已脱离文档流（absolute），不要给它写网格跨度，否则
    // 「确定的网格定位」会让它的包含块变成网格区域，left/top 基准又错位（卡片飞走）。
    if (el.classList.contains('dragging')) continue;
    // 用布局高度 offsetHeight（已取整、且忽略 transform）：房间叠牌动画会给卡片加
    // scale(0.9)，若用 getBoundingClientRect 会读到缩放后的高度、把跨度算小。
    const hgt = el.offsetHeight;
    // 行跨度把「一个纵向缝隙」内嵌进去：区域高 = n*unit（unit=1，row-gap=0），
    // 下一张卡片的顶部 = 本卡顶部 + n，视觉缝隙 = n - 高度 ≈ gap（±0.5px）。
    // 因为量化粒度是 1px 而不是「unit+row-gap」，展开态卡片也不会残留大缝，横竖缝一致。
    const n = Math.max(1, Math.round(hgt / unit) + Math.round(gap / unit));
    const v = 'span ' + n;
    if (el.style.gridRowEnd !== v) el.style.gridRowEnd = v;
  }
}

// 多列模式下让所有卡片的「默认（收折）态」等高：取各卡片收折态高度（含当前展开中的卡片、
// 以及不可收折卡片）的最大值，给收折态卡片与不可收折卡片写入 min-height；仅展开中的卡片
// 不加限高（用户要求只对齐默认态，展开态保持自然高度）。
// 测量用「离屏克隆」完成（.measure-host + .measuring），绝不触碰活卡片的 display ——
// 否则 display 切换会重置 CSS transition，导致多列下收折/展开没有过渡动画。
let measureHost = null;
function getMeasureHost() {
  if (!measureHost || !measureHost.isConnected) {
    measureHost = document.createElement('div');
    measureHost.className = 'measure-host';
    document.body.append(measureHost);
  }
  return measureHost;
}

// 生成一张「收折态」克隆：清掉内联限高/列跨度，加 .measuring 隐藏可收折区，按原宽度量高
function makeMeasureClone(el) {
  const clone = el.cloneNode(true);
  clone.classList.remove('dragging', 'collapsed');
  clone.classList.add('measuring');
  clone.style.minHeight = '';
  clone.style.gridColumn = '';
  clone.style.gridRowEnd = '';
  clone.style.transform = '';
  clone.style.position = '';
  clone.style.width = el.offsetWidth + 'px';
  return clone;
}

function equalizeCollapsed(container = listEl) {
  if (!container) return;
  const items = [...container.children].filter(
    (el) => el.classList && el.classList.contains('card') && !el.classList.contains('dragging')
  );
  // 单列 / 不足两张卡片：不需要等高，把可能残留的限高平滑收回
  if (items.length < 2 || isSingleCol(container)) {
    for (const el of items) if (el.style.minHeight && el.style.minHeight !== '0px') el.style.minHeight = '0px';
    return;
  }

  // 先把克隆全部挂到离屏宿主，再统一量高（减少同步布局次数）
  const host = getMeasureHost();
  const clones = items.map((el) => {
    const c = makeMeasureClone(el);
    host.append(c);
    return c;
  });
  let target = 0;
  for (const c of clones) target = Math.max(target, c.getBoundingClientRect().height);
  for (const c of clones) c.remove();

  // 去掉子像素噪声（如 112.00002 → 112），否则后续网格跨度会多算一行、把缝隙撑大
  target = Math.ceil(target - 0.01);
  // 瀑布流按 grid-auto-rows 的整数倍占行（span 向上取整），会残留最多一格的行间空隙。
  // 把统一高度吸附到「占满 n 行后正好留下一个行间距」的尺寸，让纵向缝隙与横向一致。
  const gcs = getComputedStyle(container);
  const rgap = parseFloat(gcs.rowGap) || 0;
  const runit = parseFloat(gcs.gridAutoRows) || 0;
  const rpitch = runit + rgap;
  if (rpitch > 0) target = Math.ceil((target + rgap - 0.01) / rpitch) * rpitch - rgap;
  for (const el of items) {
    // 展开中的可收折卡片不限高（用 0px 而不是空值，保证 min-height 能在 px↔px 间过渡）；
    // 收折态卡片与不可收折卡片统一到最高值
    const expanded = !el.classList.contains('no-collapse') && !el.classList.contains('collapsed');
    const v = expanded ? '0px' : target + 'px';
    if (el.style.minHeight !== v) el.style.minHeight = v;
  }
}

// 收折 / 展开时卡片高度是连续变化的：用一小段 rAF 跟随刷新跨度，
// 让下方卡片随动画平滑顺延，而不是收尾时一次性跳变。
let spanRAF = 0;
function trackSpans(ms = 420) {
  if (spanRAF) cancelAnimationFrame(spanRAF);
  const t0 = performance.now();
  const tick = () => {
    relayoutSpans();
    if (performance.now() - t0 < ms) spanRAF = requestAnimationFrame(tick);
    else spanRAF = 0;
  };
  spanRAF = requestAnimationFrame(tick);
}

/* ---------------- 分组容器（扁平列表 + 各房间瀑布流）统一重排 ---------------- */

// 按房间分类时，每个 .room-list 各自是一个独立瀑布流容器；扁平模式下只有 #devices 一个。
// 这些遍历器把「列分配 / 等高 / 跨度」应用到所有可见容器上（收折隐藏的容器跳过，
// 否则 clientWidth=0 会把列数误判为 1，展开后布局错乱）。
function forEachContainer(fn) {
  if (!listEl) return;
  fn(listEl);
  for (const l of listEl.querySelectorAll('.room-list')) {
    if (l.clientWidth === 0) continue;
    fn(l);
  }
}
function relayoutColumns() { forEachContainer(assignColumns); }
function relayoutEqualize() { forEachContainer(equalizeCollapsed); }
function relayoutSpans() { forEachContainer(layoutSpans); }

/* ---------------- 窗口高度自适应 ---------------- */

// 首次加载后按内容自然高度校准一次窗口尺寸；之后由用户自由缩放。
function fitWindow() {
  if (sized) return;
  const widget = document.querySelector('.widget');
  if (!widget || typeof window.mijia.resize !== 'function') return;
  const titlebar = widget.querySelector('.titlebar');
  const statusbar = widget.querySelector('.statusbar');
  const listCs = getComputedStyle(listEl);
  const padBottom = parseFloat(listCs.paddingBottom) || 0;
  // 瀑布流各列高低不一，不能再按「行」累加；取最低一张卡片（或房间头）的底边作为列表内容高度。
  const listRect = listEl.getBoundingClientRect();
  let maxB = 0;
  for (const el of listEl.querySelectorAll('.card, .room-head')) {
    const r = el.getBoundingClientRect();
    maxB = Math.max(maxB, r.bottom - listRect.top + listEl.scrollTop);
  }
  // 无真实设备卡（欢迎 / 登录 / 空态）：不按内容压缩窗口，保留默认尺寸，保证登录弹窗完整可见
  if (maxB === 0) { sized = true; return; }
  const cardsH = maxB + padBottom; // maxB 已含上内边距
  const contentH =
    titlebar.getBoundingClientRect().height +
    statusbar.getBoundingClientRect().height +
    cardsH;
  sized = true;
  window.mijia.resize(Math.ceil(contentH));
}

/* ---------------- 多列自适应：列数切换时的平滑过渡 ---------------- */

// 读取网格当前的「自然」列数：按容器内容宽度与 --card-min 反推 auto-fill 的轨道数。
// 不能用 gridTemplateColumns 的轨道数 —— 卡片被写入显式 grid-column 后会撑出隐式轨道，
// 使轨道数只增不减，窗口收窄时列数无法回落（即「收窄不恢复单列」）。
function gridCols(container = listEl) {
  if (!container) return 1;
  const cs = getComputedStyle(container);
  const gap = parseFloat(cs.columnGap) || 0;
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const cardMin = parseFloat(cs.getPropertyValue('--card-min')) || 280;
  const avail = container.clientWidth - padL - padR;
  if (avail <= 0) return 1;
  const track = Math.min(cardMin, avail);
  return Math.max(1, Math.floor((avail + gap) / (track + gap)));
}

// 单列与否：同步容器上的 one-col class（CSS 据此把行高切成内容自适应），
// 返回是否为单列。所有需要判断单列的地方都走这里，保证 class 与判断结果一致。
function isSingleCol(container = listEl) {
  if (!container) return true;
  const one = gridCols(container) <= 1;
  if (container.classList.contains('one-col') !== one) container.classList.toggle('one-col', one);
  return one;
}

// 用「上一次」的卡片位置做 FLIP：让卡片在 1→2→3 列切换时平滑滑入新位置，而非硬切。
function playColumnReflow(items, prevRects) {
  for (const el of items) {
    const a = prevRects.get(el);
    if (!a) continue;
    const b = el.getBoundingClientRect();
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  requestAnimationFrame(() => {
    for (const el of items) {
      if (!el.style.transform) continue;
      el.style.transition = 'transform 0.34s cubic-bezier(0.22, 0.61, 0.36, 1)';
      el.style.transform = '';
    }
    setTimeout(() => {
      for (const el of items) {
        if (el.classList.contains('dragging')) continue;
        el.style.transition = '';
        el.style.transform = '';
      }
    }, 400);
  });
}

// ResizeObserver 在布局完成后触发：此处缓存的正是「变动前」的位置，用于下一次列数变化的 FLIP。
let reflowPrevRects = null;
let reflowPrevCols = 0;

const listRO = new ResizeObserver(() => {
  // 列数变化 → 重新分配列；列宽变化 → 卡片高度随之变化 → 先重算各自跨度，
  // 再做列数切换的 FLIP
  const cols = gridCols(listEl);
  if (cols !== reflowPrevCols) relayoutColumns();
  relayoutEqualize();
  relayoutSpans();
  trackSpans();
  const items = [...listEl.querySelectorAll('.card')].filter(
    (el) => !el.classList.contains('dragging')
  );
  const nowRects = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
  if (reflowPrevRects && cols !== reflowPrevCols) playColumnReflow(items, reflowPrevRects);
  reflowPrevCols = cols;
  reflowPrevRects = nowRects;
});
listRO.observe(listEl);

/* ---------------- 渲染 ---------------- */

// 未登录 / 无真实设备时的欢迎引导（新用户首次打开看到的样子）
function renderWelcome() {
  cards.clear();
  roomSections.clear();
  listEl.classList.add('welcome-mode');   // 欢迎引导居中显示
  let wrap = listEl.querySelector('.empty.welcome');
  if (!wrap) {
    listEl.textContent = '';
    wrap = h('div', 'empty welcome');
    wrap.innerHTML =
      '<img class="welcome-logo" src="../assets/icon.png" alt="OpenMexia" />' +
      '<h2 class="welcome-title">欢迎使用 OpenMexia</h2>' +
      '<p class="welcome-desc">登录米家账号，把灯、风扇、空调与传感器汇聚到同一个控制台</p>' +
      '<button class="pin-btn welcome-btn" type="button">登录米家</button>';
    wrap.querySelector('.welcome-btn').addEventListener('click', () => window.mijia.openDialog('login'));
    listEl.append(wrap);
  }
  subtitleEl.textContent = '尚未登录';
  updatedEl.textContent = '未登录';
  statusDot.classList.remove('ok', 'warn');
  fitWindow();
}

/* ---------------- 按房间分类渲染 ---------------- */

// 取（或新建）一张卡片的 entry，并刷新其内容
function ensureCard(d) {
  let entry = cards.get(d.id);
  if (!entry) {
    entry = buildCard(d);
    cards.set(d.id, entry);
  }
  updateCard(entry, d);
  return entry;
}

// 设备按房间聚合：返回 [{ key, name, devices[] }]，无房间归入「未分类」并排到最后
function groupDevices(devices) {
  const map = new Map();
  for (const d of devices) {
    const key = String(d.roomId || '');
    if (!map.has(key)) map.set(key, { key, name: String(d.roomName || ''), devices: [] });
    map.get(key).devices.push(d);
  }
  const groups = [...map.values()];
  if (roomOrder.length) {
    // 有持久化顺序时按其排列；新出现（未记录）的房间排到末尾，保持相互间的出现顺序
    const rank = new Map(roomOrder.map((k, i) => [k, i]));
    groups.sort((a, b) => {
      const ra = rank.has(a.key) ? rank.get(a.key) : Infinity;
      const rb = rank.has(b.key) ? rank.get(b.key) : Infinity;
      return ra - rb;
    });
  } else {
    groups.sort((a, b) => (a.key ? (b.key ? 0 : -1) : 1));   // 未分类殿后（其余保持出现顺序）
  }
  return groups;
}

// 一个房间 = 全宽房间头（名称 + 设备数 + 点阵把手） + 可收折的独立瀑布流容器
function makeRoomSection(key) {
  const section = h('section', 'room');
  section.dataset.roomId = key;
  const head = h('div', 'room-head');
  head.title = '双击收折 / 展开，右键打开菜单';
  const nameEl = h('span', 'room-name');
  const countEl = h('span', 'room-count');
  const grip = h('span', 'room-grip', GRIP_ICON);
  grip.title = '拖动调整房间顺序';
  head.append(nameEl, countEl, grip);

  // 双击房间头：收折 / 展开（带高度过渡）
  head.addEventListener('dblclick', (e) => {
    if (e.target.closest('.room-grip')) return;
    setRoomCollapsed(section, key, !section.classList.contains('room-collapsed'));
  });
  // 右键房间头：弹出房间控制菜单（与设备右键菜单同款样式）
  head.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openRoomCtxMenu(key, section, e.clientX, e.clientY);
  });

  const body = h('div', 'room-body');
  const list = h('div', 'room-list');
  body.append(list);
  section.append(head, body);
  return { section, head, nameEl, countEl, list };
}

/* ---------------- 房间收折动画：叠牌 → 非线性扎进表头 ---------------- */

// 卡片先像扑克牌一样叠成一摞（第一张在最上），随后整摞非线性地「扎进」表头。
// 收折：叠牌(GATHER_EASE，立即) → 牌堆上移 + 房间体塌缩(PLUNGE_EASE，延迟接力)
// 展开：逆过程 —— 房间体撑开 + 牌堆从表头抽出 → 卡片散开归位
const ROOM_ANIM_MS = 300;         // 单段时长
const ROOM_ANIM_DELAY = 100;      // 两段之间的接力延迟
const ROOM_ANIM_CLEAN = ROOM_ANIM_MS + ROOM_ANIM_DELAY + 80; // 清理内联样式的时机
// 收拢 / 散开：快出缓收（easeOut）；扎入 / 抽出：缓起快收（easeIn）——两段都非线性
const ROOM_GATHER_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const ROOM_PLUNGE_EASE = 'cubic-bezier(0.5, 0, 0.75, 0)';
const ROOM_STACK_STEP = 2;        // 每张牌相对上一张的错位，营造「一摞牌」的厚度感

function roomCardsOf(list) {
  return list ? [...list.children].filter((el) => el.classList && el.classList.contains('card')) : [];
}

// 计算每张卡片叠到「列表左上角」所需的位移；第一张 z 最高（盖在最上）
function roomStackFrames(cards, list) {
  const listRect = list.getBoundingClientRect();
  // 单列时卡片与列表同宽，牌堆扎向左上角会显得偏：改扎向顶部居中；多列保持左上角
  const center = isSingleCol(list);
  return cards.map((el, i) => {
    const r = el.getBoundingClientRect();
    const off = i * ROOM_STACK_STEP;
    // scale(0.9) 以左上为原点收缩，单列时把收缩后的牌堆补偿到水平居中
    const anchorX = center ? listRect.left + (listRect.width - r.width * 0.9) / 2 : listRect.left;
    return { el, dx: anchorX - r.left + off, dy: listRect.top - r.top + off, z: cards.length - i };
  });
}

// 把一张卡片设为「叠牌」态（transform-origin 固定在左上角，缩放不改变错位基准）
function setCardStack(f, withTransition) {
  const el = f.el;
  el.style.transformOrigin = 'top left';
  el.style.zIndex = String(f.z);
  el.style.transition = withTransition ? `transform ${ROOM_ANIM_MS}ms ${ROOM_GATHER_EASE}` : 'none';
  el.style.transform = `translate(${f.dx}px, ${f.dy}px) scale(0.9)`;
}

// 清掉本次动画写在元素上的临时内联样式，回到 CSS 静止态
function clearRoomStyles(section) {
  const body = section.querySelector('.room-body');
  const list = section.querySelector('.room-list');
  if (body) {
    body.style.transition = '';
    body.style.height = '';
    body.style.marginTop = '';
    body.classList.remove('animating');
  }
  if (list) {
    list.style.transition = '';
    list.style.transform = '';
  }
  for (const el of roomCardsOf(list)) {
    el.style.transition = '';
    el.style.transform = '';
    el.style.transformOrigin = '';
    el.style.zIndex = '';
  }
}

function scheduleRoomCleanup(section) {
  if (section._roomAnimTimer) clearTimeout(section._roomAnimTimer);
  section._roomAnimTimer = setTimeout(() => {
    section._roomAnimTimer = 0;
    clearRoomStyles(section);
    section._roomAnimating = false;
  }, ROOM_ANIM_CLEAN);
}

function stopRoomAnim(section) {
  if (section._roomAnimTimer) { clearTimeout(section._roomAnimTimer); section._roomAnimTimer = 0; }
  clearRoomStyles(section);
}

// 收折：叠牌 → 整摞非线性扎进表头
function collapseRoom(section) {
  stopRoomAnim(section);
  section._roomAnimating = true;

  const body = section.querySelector('.room-body');
  const list = section.querySelector('.room-list');
  const cards = roomCardsOf(list);
  const startH = body.getBoundingClientRect().height;
  const frames = roomStackFrames(cards, list);

  // 起点：锁定当前高度，卡片为自然位置（无过渡）
  body.style.transition = 'none';
  body.style.height = startH + 'px';
  body.style.marginTop = '';
  body.classList.add('animating');
  list.style.transition = 'none';
  list.style.transform = '';
  for (const f of frames) {
    f.el.style.transition = 'none';
    f.el.style.transformOrigin = 'top left';
    f.el.style.zIndex = String(f.z);
    f.el.style.transform = 'none';
  }
  void body.offsetHeight;   // 提交起点帧

  // 第一段：卡片叠成一摞（第一张在最上）
  for (const f of frames) setCardStack(f, true);
  // 第二段：延迟接力 —— 牌堆非线性扎进表头，房间体同步塌缩
  const plunge = startH + 24;   // 上移距离：足以把牌堆完全推出房间体（被表头裁掉）
  const trans = `${ROOM_ANIM_MS}ms ${ROOM_PLUNGE_EASE} ${ROOM_ANIM_DELAY}ms`;
  body.style.transition = `height ${trans}, margin-top ${trans}`;
  list.style.transition = `transform ${trans}`;
  section.classList.add('room-collapsed');
  body.style.height = '0px';
  body.style.marginTop = '0px';
  list.style.transform = `translateY(${-plunge}px)`;

  scheduleRoomCleanup(section);
}

// 展开：牌堆从表头抽出 → 卡片散开归位
function expandRoom(section) {
  stopRoomAnim(section);
  section._roomAnimating = true;

  const body = section.querySelector('.room-body');
  const list = section.querySelector('.room-list');
  const cards = roomCardsOf(list);

  // 先量出展开态自然高度（临时解除收折与裁剪；全程同步、不产生闪烁）
  section.classList.remove('room-collapsed');
  body.style.transition = 'none';
  body.style.height = '';
  body.style.marginTop = '';
  list.style.transition = 'none';
  list.style.transform = '';
  for (const el of cards) { el.style.transition = 'none'; el.style.transform = ''; el.style.transformOrigin = ''; el.style.zIndex = ''; }
  const target = body.getBoundingClientRect().height;
  const frames = roomStackFrames(cards, list);
  const plunge = target + 24;

  // 起点：塌缩 + 牌堆藏在表头里（无过渡）
  body.classList.add('animating');
  body.style.transition = 'none';
  body.style.height = '0px';
  body.style.marginTop = '0px';
  section.classList.add('room-collapsed');
  list.style.transition = 'none';
  list.style.transform = `translateY(${-plunge}px)`;
  for (const f of frames) setCardStack(f, false);
  void body.offsetHeight;   // 提交起点帧

  // 第一段：房间体撑开、牌堆下移抽出表头（非线性）
  section.classList.remove('room-collapsed');
  const trans = `${ROOM_ANIM_MS}ms ${ROOM_GATHER_EASE}`;
  body.style.transition = `height ${trans}, margin-top ${trans}`;
  list.style.transition = `transform ${trans}`;
  body.style.height = target + 'px';
  body.style.marginTop = '';
  list.style.transform = '';
  // 第二段：延迟接力 —— 卡片非线性散开归位
  for (const f of frames) {
    f.el.style.transition = `transform ${ROOM_ANIM_MS}ms ${ROOM_GATHER_EASE} ${ROOM_ANIM_DELAY}ms`;
    f.el.style.transform = 'none';
  }

  scheduleRoomCleanup(section);
}

// 切换房间收折状态（带「叠牌 → 扎进表头」动画）；房间正在动画时不响应
function setRoomCollapsed(section, key, collapsed) {
  if (collapsed) collapsedRooms.add(key); else collapsedRooms.delete(key);
  writeCollapsedRooms();
  if (section._roomAnimating) return;
  if (collapsed === section.classList.contains('room-collapsed')) return;
  if (collapsed) collapseRoom(section); else expandRoom(section);
}

// 退回到扁平网格：移除所有房间分组（其中的卡片会被 renderFlat 重新挂回 #devices）
function clearGrouped() {
  listEl.classList.remove('grouped');
  for (const [, sec] of roomSections) sec.section.remove();
  roomSections.clear();
}

// 扁平（多列瀑布流）渲染：卡片按顺序直接排在 #devices 下
function renderFlat(devices) {
  clearGrouped();
  devices.forEach((d, index) => {
    try {
      const entry = ensureCard(d);
      // 拖动过程中不按数据顺序重排 DOM，避免覆盖用户拖动的结果
      if (!(drag && drag.moved) && listEl.children[index] !== entry.el) {
        listEl.insertBefore(entry.el, listEl.children[index] || null);
      }
    } catch (err) {
      // 单台设备渲染异常不影响其它设备与后续统计
      console.error('渲染设备失败', d && d.id, err);
    }
  });
}

// 按房间渲染：房间头横跨整行，其下每个房间各自是一个细分瀑布流
function renderGrouped(devices) {
  listEl.classList.add('grouped');
  const groups = groupDevices(devices);
  const keys = new Set(groups.map((g) => g.key));
  // 移除已不存在的房间分组
  for (const [key, sec] of roomSections) {
    if (!keys.has(key)) { sec.section.remove(); roomSections.delete(key); }
  }
  groups.forEach((g, gi) => {
    let sec = roomSections.get(g.key);
    if (!sec) { sec = makeRoomSection(g.key); roomSections.set(g.key, sec); }
    sec.nameEl.textContent = g.name || '未分类';
    sec.countEl.textContent = String(g.devices.length);
    // 房间正在做收折 / 展开动画时不覆盖其状态，避免打断动画
    if (!sec.section._roomAnimating) {
      sec.section.classList.toggle('room-collapsed', collapsedRooms.has(g.key));
    }
    const memberIds = new Set();
    g.devices.forEach((d, i) => {
      try {
        const entry = ensureCard(d);
        memberIds.add(String(d.id));
        // 拖动过程中不按数据顺序重排 DOM，避免覆盖用户拖动的结果
        if (!(drag && drag.moved) && sec.list.children[i] !== entry.el) {
          sec.list.insertBefore(entry.el, sec.list.children[i] || null);
        }
      } catch (err) {
        console.error('渲染设备失败', d && d.id, err);
      }
    });
    // 清掉不再属于该房间的残留卡片
    for (const child of [...sec.list.children]) {
      if (child.classList.contains('card') && !memberIds.has(String(child.dataset.id))) child.remove();
    }
    // 房间顺序与分组顺序一致（房间拖动过程中不重排，避免覆盖用户拖动结果）
    if (!(roomDrag && roomDrag.moved) && listEl.children[gi] !== sec.section) {
      listEl.insertBefore(sec.section, listEl.children[gi] || null);
    }
  });
}

function render(devices) {
  if (mockMode) { renderWelcome(); return; }
  allDevices = devices;
  devices = sortByOrder(devices).filter((d) => !hiddenSet.has(String(d.id)));

  // 兜底：拖动已结束但仍残留的占位 / 拖动态卡片会破坏网格排布，这里清掉
  if (!drag) {
    listEl.querySelector('.drag-placeholder')?.remove();
    for (const c of listEl.querySelectorAll('.dragging')) {
      c.classList.remove('dragging');
      c.style.cssText = '';
    }
  }

  listEl.querySelector('.empty.welcome')?.remove();
  listEl.classList.remove('welcome-mode');   // 恢复多列网格排布

  const ids = new Set(devices.map((d) => d.id));
  for (const [id, entry] of cards) {
    if (!ids.has(id)) {
      entry.el.remove();
      cards.delete(id);
    }
  }

  if (devices.length === 0) {
    clearGrouped();
    const text = allDevices.length ? '设备已全部隐藏（可在菜单「隐藏的设备」中恢复）' : '还没有设备';
    let emptyEl = listEl.querySelector('.empty');
    if (!emptyEl) {
      emptyEl = h('div', 'empty', text);
      listEl.append(emptyEl);
    } else {
      emptyEl.textContent = text;
    }
  } else {
    listEl.querySelector('.empty')?.remove();
    if (groupByRoom) renderGrouped(devices);
    else renderFlat(devices);
  }

  const online = devices.filter((d) => d.online !== false).length;
  const active = devices.filter((d) => d.on).length;
  subtitleEl.textContent = `${devices.length} 台设备 · ${online} 在线 · ${active} 开启`;

  // 底栏：正常显示「设备正常」（绿灯），有异常显示「设备名+异常项目」（红灯）
  const anomalies = collectAnomalies(devices);
  if (!devices.length) {
    updatedEl.textContent = '暂无设备';
    statusDot.classList.remove('ok', 'warn');
  } else if (anomalies.length) {
    updatedEl.textContent = anomalies.join('、');
    statusDot.classList.add('warn');
    statusDot.classList.remove('ok');
  } else {
    updatedEl.textContent = '设备正常';
    statusDot.classList.remove('warn');
    statusDot.classList.add('ok');
  }

  relayoutColumns();
  relayoutEqualize();
  relayoutSpans();
  // 多列等高后若统一高度发生变化（如隐藏了最高的卡片），min-height 在过渡，
  // 用 trackSpans 跟随刷新跨度，让下方卡片平滑顺延、缝隙一起收回。
  trackSpans();
  fitWindow();
}

/* ---------------- 应用内弹出菜单（独立窗口，不受主窗口边界裁剪） ---------------- */

const btnMenu = document.getElementById('btn-menu');
const menuEl = document.getElementById('menu');
// 应用内菜单与设备右键菜单共用一个弹出窗口，因此共用一个「已展开」状态
let menuOpen = false;

const miTop = document.getElementById('mi-top');
const miPin = document.getElementById('mi-pin');
const miLogin = document.getElementById('mi-login');
const miReset = document.getElementById('mi-reset');
const miFs = document.getElementById('mi-fs');
const miFsCover = document.getElementById('mi-fs-cover');
const miHide = document.getElementById('mi-hide');

// 当前主题（弹出窗口据此渲染同款浅/深色菜单）
function currentMenuTheme() {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

// 同步两个全屏项的勾选状态（mode: 'normal' | 'cover' | null）
function applyFullscreenState(mode) {
  miFs.setAttribute('aria-checked', String(mode === 'normal'));
  miFsCover.setAttribute('aria-checked', String(mode === 'cover'));
}

// 序列化 #menu：克隆后去掉 id / hidden，并给每个菜单项打上 data-menu-key（= 原 id）。
// 弹出窗口点击时按 key 回传，主窗口用 getElementById(key).click() 复用原有监听，无需重新绑定。
function serializeAppMenu() {
  const clone = menuEl.cloneNode(true);
  clone.removeAttribute('id');
  clone.removeAttribute('hidden');
  clone.querySelectorAll('.menu-item').forEach((el) => {
    if (el.id) el.setAttribute('data-menu-key', el.id);
    el.removeAttribute('id');
  });
  return clone.outerHTML;
}

// 收起弹出菜单（幂等）：请主进程隐藏弹出窗口，并复位汉堡按钮态。
// 不做 menuOpen 提前返回——请求本身幂等，主进程以自身状态为准；
// 若渲染层状态万一失步，提前返回会让「点击任意位置收起」失效。
function closeMenu() {
  menuOpen = false;
  window.mijia.closeMenu();
  btnMenu.classList.toggle('active', false);
  btnMenu.setAttribute('aria-expanded', 'false');
}

// 弹出应用内菜单。anchor 为屏幕坐标；place='below-right' 以锚点为菜单右上角（汉堡按钮），
// 'at' 以锚点为左上角（跟随鼠标 / 标题栏右键）。菜单由独立窗口渲染，不受主窗口边界裁剪。
function showAppMenu(anchor, place) {
  menuOpen = true;
  const viaButton = place === 'below-right';
  btnMenu.classList.toggle('active', viaButton);
  btnMenu.setAttribute('aria-expanded', viaButton ? 'true' : 'false');
  window.mijia.openMenu({
    kind: 'app',
    html: serializeAppMenu(),
    anchor,
    place,
    theme: currentMenuTheme(),
  });
}

btnMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  if (menuOpen) { closeMenu(); return; }
  // 以汉堡按钮右下角为锚点（屏幕坐标）：与旧版 CSS 的 top:44px / right:10px 对齐
  const w = document.documentElement.clientWidth;
  showAppMenu({ x: window.screenX + w - 10, y: window.screenY + 44 }, 'below-right');
});

miTop.addEventListener('click', () => window.mijia.toggleOnTop());
miPin.addEventListener('click', () => window.mijia.pinTaskbar());
miLogin.addEventListener('click', () => window.mijia.toggleLogin());
miReset.addEventListener('click', () => window.mijia.sendToSecondScreen());
miFs.addEventListener('click', () => window.mijia.fullscreen('normal'));
miFsCover.addEventListener('click', () => window.mijia.fullscreen('cover'));
miHide.addEventListener('click', () => window.mijia.hide());
document.getElementById('mi-quit').addEventListener('click', () => window.mijia.quit());

/* ---------------- 深色 / 浅色主题 ---------------- */

const miTheme = document.getElementById('mi-theme');
const miThemeLabel = miTheme.querySelector('.mi-label');

function readTheme() {
  try { return localStorage.getItem('mijia.theme') === 'light' ? 'light' : 'dark'; }
  catch { return 'dark'; }
}

// theme: 'dark' | 'light'。深色为默认，通过 <html class="light"> 切换主题变量
function applyTheme(theme) {
  const dark = theme !== 'light';
  document.documentElement.classList.toggle('light', !dark);
  // 显示「将切换到的目标模式」：当前深色则提示切浅色，反之亦然
  miThemeLabel.textContent = dark ? '浅色模式' : '深色模式';
  if (window.mijia && window.mijia.setTheme) window.mijia.setTheme(theme);
}

miTheme.addEventListener('click', () => {
  const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
  try { localStorage.setItem('mijia.theme', next); } catch {}
  applyTheme(next);
});

applyTheme(readTheme());

/* ---------------- 窗口模式 / 小组件模式 ---------------- */

const miMode = document.getElementById('mi-mode');
const miModeLabel = miMode.querySelector('.mi-label');

// mode: 'window' 正常窗口（任务栏可见、无托盘）；'widget' 小组件（工具窗口 + 托盘）。
// 参照主题项：菜单文字显示「将切换到的目标模式」。
function applyWindowMode(mode) {
  const widget = mode !== 'window';
  miModeLabel.textContent = widget ? '窗口模式' : '小组件模式';
  // 窗口模式下窗口本就常驻任务栏、且没有托盘：移除「固定到任务栏」与「收起到托盘」
  miPin.hidden = !widget;
  miHide.hidden = !widget;
}

miMode.addEventListener('click', () => window.mijia.toggleWindowMode());
window.mijia.onWindowMode(applyWindowMode);

/* ---------------- 按房间分类 / 房间名称显示 ---------------- */

const miRoom = document.getElementById('mi-room');
const miRoomName = document.getElementById('mi-roomname');
const miRoomNameLabel = miRoomName.querySelector('.mi-label');

function applyRoomGroupState() {
  miRoom.setAttribute('aria-checked', String(groupByRoom));
}

// 参照主题项：菜单文字显示「将切换到的目标状态」
function applyRoomNameState() {
  miRoomNameLabel.textContent = showRoomName ? '隐藏房间名称' : '显示房间名称';
}

// 把房间显示偏好上报给主进程（托盘菜单需要同步勾选态与文案）
function reportRoomState() {
  if (window.mijia && window.mijia.reportRoomState) {
    window.mijia.reportRoomState({ groupByRoom, showRoomName });
  }
}

miRoom.addEventListener('click', () => {
  groupByRoom = !groupByRoom;
  try { localStorage.setItem('mijia.groupByRoom', groupByRoom ? '1' : '0'); } catch {}
  applyRoomGroupState();
  reportRoomState();
  render(allDevices);
});

miRoomName.addEventListener('click', () => {
  showRoomName = !showRoomName;
  try { localStorage.setItem('mijia.showRoomName', showRoomName ? '1' : '0'); } catch {}
  applyRoomNameState();
  reportRoomState();
  for (const [, entry] of cards) {
    if (entry.last) updateCard(entry, entry.last);
  }
});

applyRoomGroupState();
applyRoomNameState();
reportRoomState();

// 托盘菜单 → 打开对应面板（登录 / 关于 走独立弹窗；家庭 / 隐藏设备仍在主窗口内）
window.mijia.onOpenPanel((name) => {
  if (name === 'login') window.mijia.openDialog('login');
  else if (name === 'home') openHomeModal(true);
  else if (name === 'hidden') openHiddenModal(true);
  else if (name === 'about') window.mijia.openDialog('about');
});

// 托盘菜单 → 切换深色 / 浅色主题（复用应用内菜单项的点击逻辑）
window.mijia.onToggleTheme(() => miTheme.click());

// 托盘菜单 → 切换 按房间分类 / 房间名称显示（复用应用内菜单项的点击逻辑）
window.mijia.onToggleRoom((which) => {
  if (which === 'group') miRoom.click();
  else if (which === 'name') miRoomName.click();
});

// 弹出窗口里点了菜单项（key 非空）/ 点了透明留白（key 为空）→ 主进程回传 key，
// 这里复用原有菜单项监听执行动作（ctx- 前缀为设备右键菜单项，其余为应用内菜单项 id）。
window.mijia.onMenuAction((key) => {
  if (!key) return;
  if (key.indexOf('ctx-') === 0) {
    const item = ctxMenu.querySelector('[data-menu-key="' + key + '"]');
    if (item) item.click();
  } else {
    const el = document.getElementById(key);
    if (el) el.click();
  }
});

// 主进程已收起弹出窗口（点空白 / Esc / 主窗口失焦 / 主窗口移动等）→ 同步复位展开态
window.mijia.onMenuClosed(() => {
  menuOpen = false;
  btnMenu.classList.toggle('active', false);
  btnMenu.setAttribute('aria-expanded', 'false');
});

// 点击主窗口内任意位置（汉堡按钮之外）即收起：用捕获阶段，保证即使内部元素 stopPropagation 也能生效。
// 不依赖 menuOpen 判断，收起请求幂等下发，避免渲染层状态失步导致点击无效。
window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#btn-menu')) return;
  closeMenu();
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
// 注意：不要在这里监听主窗口 blur 去收起菜单——弹出窗口显示瞬间主窗口可能瞬时失焦，
// 而无去抖的 blur 会立即把 menuOpen 置 false，造成渲染层与主进程状态失步，
// 之后「点击任意位置」就会因提前 return 而失效。主窗口失焦收起统一由主进程处理（带去抖）。

/* ---------------- 标题栏右键菜单 ---------------- */

// 标题栏保持原生 drag 区域（保留系统拖动、双击最大化、边缘吸附等行为），
// 右键不会派发到渲染层，而是触发主进程的 system-context-menu 事件；
// 主进程阻止系统菜单后，把鼠标屏幕坐标传回这里，让应用内菜单跟随鼠标弹出。
window.mijia.onTitlebarMenu((pt) => {
  if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return;
  closeCtxMenu();
  showAppMenu({ x: pt.x, y: pt.y }, 'at');   // pt 已是屏幕坐标
});

/* ---------------- 设备右键操作菜单 ---------------- */

const ctxMenu = document.getElementById('ctx-menu');
// 右键菜单项的稳定 key（弹出窗口点击后按此找回对应项并触发其点击）
let ctxKeySeq = 0;

function makeCtxItem(label, icon, onClick, danger) {
  const item = h('button', 'ctx-item' + (danger ? ' danger' : ''));
  item.type = 'button';
  // data-menu-key 是弹出窗口回传的凭据（见 onMenuAction），点击后由主进程先收起菜单再执行动作
  item.setAttribute('data-menu-key', 'ctx-' + (++ctxKeySeq));
  item.append(h('span', 'ctx-icon', icon || ''), h('span', 'ctx-label', label));
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return item;
}

function openCtxMenu(device, card, x, y) {
  ctxMenu.innerHTML = '';
  // 仅可开关的设备提供「开/关设备」：传感器、净饮机（on 是提示音）、
  // 路由器 / 网关 / 其它无可控开关的设备都不显示该菜单项
  const powerTypes = ['plug', 'light', 'fan', 'aircon'];
  if (device.type && powerTypes.includes(device.type)) {
    ctxMenu.append(
      makeCtxItem(device.on ? '关闭设备' : '开启设备', POWER_ICON, () => {
        window.mijia.setPower(device.id, !device.on);
      })
    );
  }
  const collapsed = !!(card && card.classList.contains('collapsed'));
  // 无可收折内容的卡片不提供收折菜单项
  if (card && !card.classList.contains('no-collapse')) {
    ctxMenu.append(makeCtxItem(collapsed ? '展开卡片' : '收折卡片', COLLAPSE_ICON, () => {
      setCollapsed(card, !collapsed);
    }));
  }
  ctxMenu.append(makeCtxItem('隐藏设备', EYE_OFF_ICON, () => hideDevice(device.id), true));

  showCtxMenu(x, y);
}

// 房间右键菜单：与设备菜单同款样式，提供收折 / 展开房间
function openRoomCtxMenu(key, section, x, y) {
  ctxMenu.innerHTML = '';
  const collapsed = section.classList.contains('room-collapsed');
  ctxMenu.append(makeCtxItem(collapsed ? '展开房间' : '收折房间', COLLAPSE_ICON, () => {
    setRoomCollapsed(section, key, !collapsed);
  }));
  showCtxMenu(x, y);
}

// 把 #ctx-menu（已填充好菜单项）作为独立弹出窗口展示在鼠标处（x/y 为窗口内坐标），
// 与汉堡菜单共用同一弹出窗口与样式，同样不受主窗口边界裁剪。
function showCtxMenu(x, y) {
  menuOpen = true;
  btnMenu.classList.toggle('active', false);
  btnMenu.setAttribute('aria-expanded', 'false');
  const clone = ctxMenu.cloneNode(true);
  clone.removeAttribute('id');
  clone.removeAttribute('hidden');
  window.mijia.openMenu({
    kind: 'ctx',
    html: clone.outerHTML,
    anchor: { x: window.screenX + x, y: window.screenY + y },
    place: 'at',
    theme: currentMenuTheme(),
  });
}

function closeCtxMenu() {
  if (menuOpen) closeMenu();
}

function hideDevice(id) {
  hiddenSet.add(String(id));
  writeHidden();
  render(allDevices);
}

function restoreDevice(id) {
  hiddenSet.delete(String(id));
  writeHidden();
  render(allDevices);
  renderHiddenList();
}

listEl.addEventListener('contextmenu', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  e.preventDefault();
  const device = allDevices.find((d) => String(d.id) === card.dataset.id);
  if (device) openCtxMenu(device, card, e.clientX, e.clientY);
});
listEl.addEventListener('scroll', closeCtxMenu);

/* ---------------- 隐藏的设备 面板 ---------------- */

const hiddenModal = document.getElementById('hidden-modal');
const hiddenStateEl = document.getElementById('hidden-state');
const hiddenListEl = document.getElementById('hidden-list');

function openHiddenModal(open) {
  hiddenModal.hidden = !open;
  if (open) renderHiddenList();
}

function renderHiddenList() {
  const hidden = allDevices.filter((d) => hiddenSet.has(String(d.id)));
  hiddenListEl.innerHTML = '';
  if (!hidden.length) {
    hiddenStateEl.textContent = '暂无隐藏的设备';
    return;
  }
  hiddenStateEl.textContent = `共 ${hidden.length} 台已隐藏`;
  for (const d of hidden) {
    const item = h('button', 'home-item');
    item.type = 'button';
    item.append(h('span', 'home-name', d.name || d.id));
    item.append(h('span', 'home-check restore', EYE_ICON));
    item.addEventListener('click', () => restoreDevice(d.id));
    hiddenListEl.appendChild(item);
  }
}

document.getElementById('mi-hidden').addEventListener('click', () => openHiddenModal(true));
document.getElementById('hidden-close').addEventListener('click', () => openHiddenModal(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !hiddenModal.hidden) openHiddenModal(false); });

/* ---------------- 独立弹窗（登录 / 关于） ---------------- */

// 登录 / 关于已迁到独立窗口（renderer/dialog.html + dialog.ts），不受主窗口尺寸约束。
// 主窗口只负责：①菜单项触发打开；②弹窗打开时显示黑色遮罩。

// 弹窗打开 / 关闭 → 主窗口黑色遮罩显隐
const modalBackdrop = document.getElementById('modal-backdrop');
window.mijia.onDialogOpen(() => { if (modalBackdrop) modalBackdrop.hidden = false; });
window.mijia.onDialogClosed(() => { if (modalBackdrop) modalBackdrop.hidden = true; });

// 应用内菜单 / 托盘菜单的入口（菜单项在弹出窗口里点击后由 onMenuAction 回流到这里）
document.getElementById('mi-about').addEventListener('click', () => window.mijia.openDialog('about'));
document.getElementById('mi-cloud').addEventListener('click', () => window.mijia.openDialog('login'));


function applySettings(s) {
  miTop.setAttribute('aria-checked', String(!!s.alwaysOnTop));
  miLogin.setAttribute('aria-checked', String(!!s.launchAtLogin));
}

/* ---------------- 托盘菜单图标（用同一套 SVG 离屏栅格化为 PNG 给主进程） ---------------- */

// 复用汉堡菜单里现有的 SVG，保证托盘菜单与应用内菜单图标完全一致
function rasterizeIcon(itemId, color) {
  const svg = menuEl.querySelector(`#${itemId} .mi-icon svg`);
  if (!svg) return null;
  const S = 32;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S / 24, S / 24); // SVG viewBox 为 24×24
  ctx.strokeStyle = color || '#9a9a9a';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const node of svg.children) {
    const tag = node.tagName.toLowerCase();
    if (tag === 'path') {
      ctx.stroke(new Path2D(node.getAttribute('d')));
    } else if (tag === 'rect') {
      ctx.beginPath();
      ctx.roundRect(
        +node.getAttribute('x'), +node.getAttribute('y'),
        +node.getAttribute('width'), +node.getAttribute('height'),
        +node.getAttribute('rx') || 0
      );
      ctx.stroke();
    } else if (tag === 'circle') {
      ctx.beginPath();
      ctx.arc(+node.getAttribute('cx'), +node.getAttribute('cy'), +node.getAttribute('r'), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  return canvas.toDataURL('image/png');
}

function sendTrayIcons() {
  const map = {
    top: 'mi-top', pin: 'mi-pin', login: 'mi-login',
    cloud: 'mi-cloud', home: 'mi-home', hidden: 'mi-hidden', theme: 'mi-theme',
    mode: 'mi-mode', room: 'mi-room', roomname: 'mi-roomname',
    reset: 'mi-reset', hide: 'mi-hide', quit: 'mi-quit',
    fs: 'mi-fs', 'fs-cover': 'mi-fs-cover',
    about: 'mi-about',
  };
  const icons = {};
  for (const [key, id] of Object.entries(map)) {
    icons[key] = rasterizeIcon(id, key === 'quit' ? '#d97575' : null);
  }
  window.mijia.setMenuIcons(icons);
}

/* ---------------- 固定到任务栏 引导对话框 ---------------- */

const pinModal = document.getElementById('pin-modal');

// 关闭引导对话框：恢复工具窗口模式（不再占用任务栏）
function closePinModal() {
  if (pinModal.hidden) return;
  pinModal.hidden = true;
  window.mijia.pinTaskbarDone();
}

function openPinModal(open) {
  pinModal.hidden = !open;
}

document.getElementById('pin-ok').addEventListener('click', closePinModal);
document.getElementById('pin-close').addEventListener('click', closePinModal);
// 来自托盘菜单「固定到任务栏」：主进程已让窗口临时出现在任务栏
window.mijia.onOpenPinGuide(() => openPinModal(true));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pinModal.hidden) closePinModal(); });

/* ---------------- 登录态（面板已迁至独立弹窗窗口 renderer/dialog.html + dialog.ts） ---------------- */

const mockTag = document.querySelector('.mock-tag');

// 出错信息去掉 Electron 的 invoke 前缀，只留可读部分
function readableError(e) {
  const msg = e && e.message ? e.message : String(e);
  return msg
    .replace(/^Error invoking remote method '[^']*':\s*/, '')
    .replace(/^(Error|TypeError):\s*/, '');
}

// 登录态只用于决定主窗口显示「欢迎引导」还是真实设备；登录面板本身已迁到独立弹窗
function applyLoginState(s) {
  if (!s) return;
  const wasMock = mockMode;
  if (typeof s.isMock === 'boolean') mockMode = s.isMock;
  mockTag.hidden = true; // 不再暴露「演示数据」标签：未登录显示欢迎引导
  // 进入未登录态：立即切到欢迎引导；登录成功后的真实设备会由设备推送渲染
  if (mockMode) renderWelcome();
  else if (wasMock) {
    // 离开未登录态：既要移除欢迎块，也要撤掉居中的 welcome-mode 布局 class，
    // 否则 #devices 会残留为「空的 flex 容器」而整片空白（真实设备卡片随后由设备推送渲染）
    listEl.querySelector('.empty.welcome')?.remove();
    listEl.classList.remove('welcome-mode');
  }
}

// 登录态变化（无论来自独立弹窗登录还是主进程推送）→ 主窗口切换「欢迎引导 / 真实设备」
window.mijia.onLoginState((s) => applyLoginState(s));

/* ---------------- 选择家庭 面板 ---------------- */

const homeModal = document.getElementById('home-modal');
const homeStateEl = document.getElementById('home-state');
const homeListEl = document.getElementById('home-list');
const HOME_CHECK_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>';

function openHomeModal(open) {
  homeModal.hidden = !open;
  if (open) loadHomes();
}

function makeHomeItem(home, currentId) {
  const active = String(home.id || '') === String(currentId || '');
  const item = h('button', 'home-item' + (active ? ' active' : ''));
  item.type = 'button';
  item.appendChild(h('span', 'home-name', home.name || home.id || '未命名家庭'));
  const check = h('span', 'home-check');
  check.innerHTML = HOME_CHECK_SVG;
  item.appendChild(check);
  item.addEventListener('click', () => selectHome(home.id));
  return item;
}

async function loadHomes() {
  homeStateEl.textContent = '正在读取家庭列表…';
  homeListEl.innerHTML = '';
  try {
    const { homes = [], currentHomeId } = await window.mijia.getHomes();
    if (!homes.length) {
      homeStateEl.textContent = '未找到家庭（请先登录米家）';
      return;
    }
    homeStateEl.textContent = `共 ${homes.length} 个家庭`;
    homeListEl.appendChild(makeHomeItem({ id: '', name: '全部家庭' }, currentHomeId));
    for (const home of homes) homeListEl.appendChild(makeHomeItem(home, currentHomeId));
  } catch (e) {
    homeStateEl.textContent = readableError(e);
  }
}

async function selectHome(homeId) {
  try {
    await window.mijia.setHome(homeId || '');
    openHomeModal(false);
  } catch (e) {
    homeStateEl.textContent = readableError(e);
  }
}

document.getElementById('mi-home').addEventListener('click', () => openHomeModal(true));
document.getElementById('home-close').addEventListener('click', () => openHomeModal(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !homeModal.hidden) openHomeModal(false); });

/* ---------------- 风扇手动风向 面板 ---------------- */

const fanDirModal = document.getElementById('fan-dir-modal');
const fanDirTip = document.getElementById('fan-dir-tip');
let fanDirTarget = null;   // 当前正在调节的风扇 id

function openFanDirModal(id, name) {
  fanDirTarget = id;
  fanDirTip.textContent = name ? `${name} · 点击方向键微调` : '点击方向键微调风扇朝向';
  fanDirModal.hidden = false;
}

function closeFanDirModal() {
  fanDirModal.hidden = true;
  fanDirTarget = null;
}

function fanDirSend(dir) {
  if (!fanDirTarget) return;
  window.mijia.callAction(fanDirTarget, dir);
}

fanDirModal.querySelectorAll('.dir-btn').forEach((btn) => {
  btn.addEventListener('click', () => fanDirSend(btn.dataset.dir));
});

document.getElementById('fan-dir-close').addEventListener('click', closeFanDirModal);
document.addEventListener('keydown', (e) => {
  if (fanDirModal.hidden) return;
  const map = {
    ArrowUp: 'turnUpward', ArrowDown: 'turnDownward',
    ArrowLeft: 'turnLeft', ArrowRight: 'turnRight',
  };
  if (e.key === 'Escape') { closeFanDirModal(); return; }
  const dir = map[e.key];
  if (dir) { e.preventDefault(); fanDirSend(dir); }
});

/* ---------------- 启动 ---------------- */

window.mijia.onDevices(render);
window.mijia.onSettings(applySettings);
window.mijia.onFullscreenState(applyFullscreenState);

window.mijia.init().then(({ devices, settings, isMock, login, hasCustomSize, fullscreen, theme, windowMode }) => {
  // 用户此前手动调整过窗口大小：跳过启动时的按内容自适应
  if (hasCustomSize) sized = true;
  applyFullscreenState(fullscreen || null);
  // 窗口/小组件模式：同步菜单文案与「固定到任务栏 / 收起到托盘」的显隐
  applyWindowMode(windowMode || 'widget');
  // 以主进程持久化的主题为准（首次打开默认深色），并同步本地记忆
  if (theme === 'light' || theme === 'dark') {
    try { localStorage.setItem('mijia.theme', theme); } catch {}
    applyTheme(theme);
  }
  if (typeof isMock === 'boolean') mockMode = isMock;
  render(devices);
  applySettings(settings);
  if (login) applyLoginState({ ...login, isMock });
  // DOM 就绪后把菜单图标栅格化并交给主进程，供托盘菜单使用
  sendTrayIcons();
});

// 字体/图片加载完成后（可能影响高度）再校准一次
window.addEventListener('load', () => setTimeout(fitWindow, 60));
