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
  entry.el.querySelector('.card-name span').textContent = d.model;
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

    r.filter.querySelector('b').textContent = isNum(d.filterLife) ? d.filterLife + '%' : '--';
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
  order = [...listEl.children]
    .filter((el) => el.classList.contains('card'))
    .map((el) => el.dataset.id);
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
  if (e.target.closest('input, button, .switch, .seg, .chip, .drag-handle')) return;
  const card = e.target.closest('.card');
  if (!card) return;
  setCollapsed(card, !card.classList.contains('collapsed'));
});

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
  const handle = e.target.closest('.drag-handle');
  if (!handle) return;
  const card = handle.closest('.card');
  if (!card) return;
  drag = {
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
  drag.moved = true;
  // 记录脱离文档流前的几何信息：用视觉矩形（getBoundingClientRect）而不是 offsetLeft/Top。
  // 网格列宽/间隙是亚像素分配，offset 系列与视觉矩形能差 1~2px；若以 offset 为基准，
  // 切到绝对定位的一瞬间卡片会平移这一点点，抓取点也就随之偏离指针。
  const listRect = listEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  drag.baseLeft = rect.left - listRect.left + listEl.scrollLeft;
  drag.baseTop = rect.top - listRect.top + listEl.scrollTop;
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
  for (const c of listEl.children) {
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
  listEl.insertBefore(ph, el);
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
  const rect = listEl.getBoundingClientRect();
  const cx = cursorX - rect.left + listEl.scrollLeft; // 指针在列表内容坐标系中的位置
  const cy = cursorY - rect.top + listEl.scrollTop;
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
  const cards = [...listEl.children].filter(
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
    : listEl.lastElementChild === drag.ph;
  if (alreadyPlaced) return;

  // 记录让位前位置：用 offset 快照（不含 transform），FLIP 差值才稳定不累积
  const before = new Map(cards.map((c) => [c, [c.offsetLeft, c.offsetTop]]));
  if (target) {
    listEl.insertBefore(drag.ph, insertAfter ? target.nextElementSibling : target);
  } else {
    listEl.append(drag.ph);
  }

  // 占位符落位后重新分配列，其余卡片随之让位（列锁定下也按新顺序重排）
  assignColumns();
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
  const { el, ph, moved } = drag;
  if (autoScrollRAF) { cancelAnimationFrame(autoScrollRAF); autoScrollRAF = null; }
  if (moved && ph) {
    const from = el.getBoundingClientRect();
    el.classList.remove('dragging');
    listEl.insertBefore(el, ph);
    ph.remove();

    // 复位其它卡片的临时让位样式
    for (const c of listEl.children) {
      if (c !== el && c.classList && c.classList.contains('card')) {
        c.style.transition = '';
        c.style.transform = '';
      }
    }

    // 清除绝对定位等内联样式，让卡片重新受网格排布，再 FLIP 到最终位置
    el.style.cssText = '';
    assignColumns();
    equalizeCollapsed();
    layoutSpans();
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
    assignColumns();
    equalizeCollapsed();
    layoutSpans();
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
});

/* ---------------- 瀑布流：列锁定 + 按卡片实际高度换算 grid-row 跨度 ---------------- */

// 列锁定：按 DOM 顺序把卡片轮流分配到各列（i % 列数），写入 grid-column 钉死。
// 这样每张卡片的列是固定的 —— 展开某张卡片只会撑高它自己所在的列、顺延其后的卡片，
// 其它列不会因为高度差而横向换列（避免卡片「随意移动」）。
function assignColumns() {
  if (!listEl) return;
  const cols = gridCols();
  isSingleCol();
  let i = 0;
  for (const el of listEl.children) {
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
function layoutSpans() {
  if (!listEl) return;
  // 单列用内容自适应行高：卡片各占一行、缝隙由 row-gap 精确决定，无需（也不应）写跨度
  if (isSingleCol()) {
    for (const el of listEl.children) {
      if (el.classList && el.classList.contains('card') && el.style.gridRowEnd) el.style.gridRowEnd = '';
    }
    return;
  }
  const cs = getComputedStyle(listEl);
  const gap = parseFloat(cs.columnGap) || 8;      // 横竖缝统一：纵向缝隙 = 列间距
  const unit = parseFloat(cs.gridAutoRows) || 1;  // 多列下为 1px（配合 row-gap:0）
  if (unit <= 0) return;
  for (const el of listEl.children) {
    if (!el.classList || !el.classList.contains('card')) continue;
    // 拖动中的卡片已脱离文档流（absolute），不要给它写网格跨度，否则
    // 「确定的网格定位」会让它的包含块变成网格区域，left/top 基准又错位（卡片飞走）。
    if (el.classList.contains('dragging')) continue;
    // 高度取整到整数像素：实测高度常带子像素噪声（如 112.00002），
    // 直接向上取整会多占一行、把同列相邻卡片的缝隙撑大。
    const hgt = Math.round(el.getBoundingClientRect().height);
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

function equalizeCollapsed() {
  if (!listEl) return;
  const items = [...listEl.children].filter(
    (el) => el.classList && el.classList.contains('card') && !el.classList.contains('dragging')
  );
  // 单列 / 不足两张卡片：不需要等高，把可能残留的限高平滑收回
  if (items.length < 2 || isSingleCol()) {
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
  const gcs = getComputedStyle(listEl);
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
function trackSpans(ms = 380) {
  if (spanRAF) cancelAnimationFrame(spanRAF);
  const t0 = performance.now();
  const tick = () => {
    layoutSpans();
    if (performance.now() - t0 < ms) spanRAF = requestAnimationFrame(tick);
    else spanRAF = 0;
  };
  spanRAF = requestAnimationFrame(tick);
}

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
  // 瀑布流各列高低不一，不能再按「行」累加；取最低一张卡片的底边作为列表内容高度。
  const listRect = listEl.getBoundingClientRect();
  let maxB = 0;
  for (const el of listEl.querySelectorAll('.card, .empty')) {
    const r = el.getBoundingClientRect();
    maxB = Math.max(maxB, r.bottom - listRect.top + listEl.scrollTop);
  }
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
function gridCols() {
  if (!listEl) return 1;
  const cs = getComputedStyle(listEl);
  const gap = parseFloat(cs.columnGap) || 0;
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const cardMin = parseFloat(cs.getPropertyValue('--card-min')) || 280;
  const avail = listEl.clientWidth - padL - padR;
  if (avail <= 0) return 1;
  const track = Math.min(cardMin, avail);
  return Math.max(1, Math.floor((avail + gap) / (track + gap)));
}

// 单列与否：同步 listEl 上的 one-col class（CSS 据此把行高切成内容自适应），
// 返回是否为单列。所有需要判断单列的地方都走这里，保证 class 与判断结果一致。
function isSingleCol() {
  if (!listEl) return true;
  const one = gridCols() <= 1;
  if (listEl.classList.contains('one-col') !== one) listEl.classList.toggle('one-col', one);
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
  const cols = gridCols();
  if (cols !== reflowPrevCols) assignColumns();
  equalizeCollapsed();
  layoutSpans();
  trackSpans();
  const items = [...listEl.children].filter(
    (el) => el.classList.contains('card') && !el.classList.contains('dragging')
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
    wrap.querySelector('.welcome-btn').addEventListener('click', () => openLoginModal(true));
    listEl.append(wrap);
  }
  subtitleEl.textContent = '尚未登录';
  updatedEl.textContent = '未登录';
  statusDot.classList.remove('ok', 'warn');
  fitWindow();
}

function render(devices) {
  if (mockMode) { renderWelcome(); return; }
  allDevices = devices;
  devices = sortByOrder(devices).filter((d) => !hiddenSet.has(String(d.id)));

  // 兜底：拖动已结束但仍残留的占位 / 拖动态卡片会破坏网格排布，这里清掉
  if (!drag) {
    const stray = listEl.querySelector('.drag-placeholder');
    if (stray) stray.remove();
    for (const c of listEl.children) {
      if (c.classList && c.classList.contains('dragging')) {
        c.classList.remove('dragging');
        c.style.cssText = '';
      }
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
  }

  devices.forEach((d, index) => {
    try {
      let entry = cards.get(d.id);
      if (!entry) {
        entry = buildCard(d);
        cards.set(d.id, entry);
      }
      updateCard(entry, d);
      // 拖动过程中不按数据顺序重排 DOM，避免覆盖用户拖动的结果
      if (!(drag && drag.moved) && listEl.children[index] !== entry.el) {
        listEl.insertBefore(entry.el, listEl.children[index] || null);
      }
    } catch (err) {
      // 单台设备渲染异常不影响其它设备与后续统计
      console.error('渲染设备失败', d && d.id, err);
    }
  });

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

  assignColumns();
  equalizeCollapsed();
  layoutSpans();
  // 多列等高后若统一高度发生变化（如隐藏了最高的卡片），min-height 在过渡，
  // 用 trackSpans 跟随刷新跨度，让下方卡片平滑顺延、缝隙一起收回。
  trackSpans();
  fitWindow();
}

/* ---------------- 右上角汉堡菜单 ---------------- */

const btnMenu = document.getElementById('btn-menu');
const menuEl = document.getElementById('menu');
const menuBackdrop = document.getElementById('menu-backdrop');
const miTop = document.getElementById('mi-top');
const miPin = document.getElementById('mi-pin');
const miLogin = document.getElementById('mi-login');
const miReset = document.getElementById('mi-reset');
const miFs = document.getElementById('mi-fs');
const miFsCover = document.getElementById('mi-fs-cover');

// 同步两个全屏项的勾选状态（mode: 'normal' | 'cover' | null）
function applyFullscreenState(mode) {
  miFs.setAttribute('aria-checked', String(mode === 'normal'));
  miFsCover.setAttribute('aria-checked', String(mode === 'cover'));
}

function openMenu(open, at) {
  if (!open) {
    menuEl.hidden = true;
    menuBackdrop.hidden = true;
    btnMenu.classList.toggle('active', false);
    btnMenu.setAttribute('aria-expanded', 'false');
    // 复位为默认（右上角汉堡按钮下方）定位
    menuEl.style.left = '';
    menuEl.style.top = '';
    menuEl.style.right = '';
    menuEl.style.transformOrigin = '';
    return;
  }

  menuEl.hidden = false;
  menuBackdrop.hidden = false;
  // 只有从汉堡按钮打开时才高亮它；标题栏右键跟随鼠标弹出时不要激活汉堡按钮
  const viaButton = !(at && Number.isFinite(at.x) && Number.isFinite(at.y));
  btnMenu.classList.toggle('active', viaButton);
  btnMenu.setAttribute('aria-expanded', viaButton ? 'true' : 'false');

  if (at && Number.isFinite(at.x) && Number.isFinite(at.y)) {
    // 跟随鼠标弹出（标题栏右键）：先显示再量尺寸，然后做窗口边界钳制
    menuEl.style.right = 'auto';
    menuEl.style.transformOrigin = 'top left';
    const pad = 6;
    const w = menuEl.offsetWidth;
    const hgt = menuEl.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const left = Math.max(pad, Math.min(at.x, vw - w - pad));
    const top = Math.max(pad, Math.min(at.y, vh - hgt - pad));
    menuEl.style.left = left + 'px';
    menuEl.style.top = top + 'px';
  } else {
    // 汉堡按钮：用 CSS 默认的右上角定位
    menuEl.style.left = '';
    menuEl.style.top = '';
    menuEl.style.right = '';
    menuEl.style.transformOrigin = '';
  }
}

btnMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  openMenu(menuEl.hidden);
});

miTop.addEventListener('click', () => window.mijia.toggleOnTop());
miPin.addEventListener('click', () => window.mijia.pinTaskbar());
miLogin.addEventListener('click', () => window.mijia.toggleLogin());
miReset.addEventListener('click', () => window.mijia.sendToSecondScreen());
miFs.addEventListener('click', () => window.mijia.fullscreen('normal'));
miFsCover.addEventListener('click', () => window.mijia.fullscreen('cover'));
document.getElementById('mi-hide').addEventListener('click', () => window.mijia.hide());
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

// 托盘菜单 → 打开对应面板（与应用内菜单共用同一套面板）
window.mijia.onOpenPanel((name) => {
  if (name === 'login') openLoginModal(true);
  else if (name === 'home') openHomeModal(true);
  else if (name === 'hidden') openHiddenModal(true);
  else if (name === 'about') openAboutModal(true);
});

// 托盘菜单 → 切换深色 / 浅色主题（复用应用内菜单项的点击逻辑）
window.mijia.onToggleTheme(() => miTheme.click());

// 点击菜单项后收起
menuEl.addEventListener('click', () => openMenu(false));

// 点击任意位置（菜单与汉堡按钮之外）即收起：用捕获阶段，
// 保证即使内部元素 stopPropagation 也能生效
window.addEventListener('pointerdown', (e) => {
  if (!ctxMenu.hidden && !e.target.closest('#ctx-menu')) closeCtxMenu();
  if (menuEl.hidden) return;
  if (e.target.closest('#menu') || e.target.closest('#btn-menu')) return;
  openMenu(false);
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openMenu(false); });
window.addEventListener('blur', () => openMenu(false));

/* ---------------- 标题栏右键菜单 ---------------- */

// 标题栏保持原生 drag 区域（保留系统拖动、双击最大化、边缘吸附等行为），
// 右键不会派发到渲染层，而是触发主进程的 system-context-menu 事件；
// 主进程阻止系统菜单后，把鼠标屏幕坐标传回这里，换算成窗口内坐标让菜单跟随鼠标弹出。
window.mijia.onTitlebarMenu((pt) => {
  if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return;
  closeCtxMenu();
  openMenu(true, { x: pt.x - window.screenX, y: pt.y - window.screenY });
});

/* ---------------- 设备右键操作菜单 ---------------- */

const ctxMenu = document.getElementById('ctx-menu');

function makeCtxItem(label, icon, onClick, danger) {
  const item = h('button', 'ctx-item' + (danger ? ' danger' : ''));
  item.type = 'button';
  item.append(h('span', 'ctx-icon', icon || ''), h('span', 'ctx-label', label));
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCtxMenu();
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

  ctxMenu.hidden = false;
  // 定位到鼠标处，并避免超出窗口边界
  const pad = 6;
  const w = ctxMenu.offsetWidth;
  const hgt = ctxMenu.offsetHeight;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  let left = Math.min(x, vw - w - pad);
  let top = Math.min(y, vh - hgt - pad);
  ctxMenu.style.left = Math.max(pad, left) + 'px';
  ctxMenu.style.top = Math.max(pad, top) + 'px';
}

function closeCtxMenu() {
  if (!ctxMenu.hidden) ctxMenu.hidden = true;
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

/* ---------------- 关于 面板 ---------------- */

// 本软件官网 / 作者主页
const SITE_URL = 'https://hzdavy.github.io/OpenMexia/';
const AUTHOR_URL = 'https://github.com/HZDavy';

const aboutModal = document.getElementById('about-modal');
const aboutMsgEl = document.getElementById('about-msg');
const badge3d = document.getElementById('about-badge-3d');

// 硬币厚度：在 3D 空间里沿 Z 轴堆叠多层银色薄片，旋转到侧面时呈现金属侧壁
(function buildBadgeRim() {
  const rim = document.getElementById('badge-rim');
  if (!rim) return;
  const SLICES = 25;   // 薄片数量（0.5px 一步，侧视时不露缝）
  const HALF = 6;      // 单侧厚度，总厚 = 2 * HALF = 12px
  for (let i = 0; i < SLICES; i++) {
    const t = i / (SLICES - 1);            // 0..1
    const layer = document.createElement('div');
    layer.className = 'badge-rim-slice';
    layer.style.transform = `translateZ(${(-HALF + t * HALF * 2).toFixed(2)}px)`;
    // 外缘中部更亮、向两面渐暗 → 圆柱侧面的反光带
    layer.style.filter = `brightness(${(0.62 + 0.5 * Math.sin(t * Math.PI)).toFixed(3)})`;
    rim.appendChild(layer);
  }
})();

function setAboutMsg(text, kind) {
  if (!text) {
    aboutMsgEl.hidden = true;
    aboutMsgEl.textContent = '';
    aboutMsgEl.className = 'about-msg';
    return;
  }
  aboutMsgEl.hidden = false;
  aboutMsgEl.textContent = text;
  aboutMsgEl.className = 'about-msg' + (kind ? ' ' + kind : '');
}

function openAboutModal(open) {
  aboutModal.hidden = !open;
  if (open) setAboutMsg('');
}

document.getElementById('mi-about').addEventListener('click', () => openAboutModal(true));
document.getElementById('about-close').addEventListener('click', () => openAboutModal(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !aboutModal.hidden) openAboutModal(false); });

// 访问官网 / 点作者名跳转作者主页（交给主进程用系统浏览器打开）
document.getElementById('about-site').addEventListener('click', () => window.mijia.openExternal(SITE_URL));
document.getElementById('about-author-link').addEventListener('click', (e) => {
  e.preventDefault();
  window.mijia.openExternal(AUTHOR_URL);
});

// 检查更新
let checkingUpdate = false;
document.getElementById('about-update').addEventListener('click', async () => {
  if (checkingUpdate) return;
  checkingUpdate = true;
  setAboutMsg('正在检查更新…');
  try {
    const r = await window.mijia.checkUpdate();
    if (!r || !r.ok) {
      setAboutMsg('检查更新失败，请稍后重试', 'error');
    } else if (r.hasUpdate) {
      setAboutMsg(`发现新版本 v${r.latest}（当前 v${r.current}），已打开下载页`, 'ok');
      window.mijia.openExternal(r.url || SITE_URL);
    } else {
      setAboutMsg(`已是最新版本 v${r.current}`, 'ok');
    }
  } catch {
    setAboutMsg('检查更新失败，请稍后重试', 'error');
  } finally {
    checkingUpdate = false;
  }
});

// 3D 徽章：鼠标拖动翻转（X/Y 轴），单击也翻转半圈；高光随旋转移动
const badgeRot = { x: 0, y: 0 };
let badgeDrag = null;      // 拖动起点
let badgePointerId = null;
let badgeMoved = false;

function applyBadge() {
  badge3d.style.transform = `rotateX(${badgeRot.x}deg) rotateY(${badgeRot.y}deg)`;
  // 高光位置随旋转反向偏移，模拟固定光源在徽章表面的反射
  const nx = Math.max(-1, Math.min(1, badgeRot.y / 120));
  const ny = Math.max(-1, Math.min(1, -badgeRot.x / 120));
  badge3d.style.setProperty('--lx', (50 - nx * 38).toFixed(1) + '%');
  badge3d.style.setProperty('--ly', (50 - ny * 38).toFixed(1) + '%');
}

badge3d.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  badgePointerId = e.pointerId;
  badgeMoved = false;
  badgeDrag = { x: e.clientX, y: e.clientY, rx: badgeRot.x, ry: badgeRot.y };
  badge3d.classList.add('dragging');
  badge3d.setPointerCapture(e.pointerId);
});

badge3d.addEventListener('pointermove', (e) => {
  if (!badgeDrag || e.pointerId !== badgePointerId) return;
  const dx = e.clientX - badgeDrag.x;
  const dy = e.clientY - badgeDrag.y;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) badgeMoved = true;
  badgeRot.y = badgeDrag.ry + dx * 0.6;
  badgeRot.x = Math.max(-75, Math.min(75, badgeDrag.rx - dy * 0.6));
  applyBadge();
});

function endBadgeDrag(e) {
  if (!badgeDrag || (e && e.pointerId !== badgePointerId)) return;
  badge3d.classList.remove('dragging');
  badgeDrag = null;
  badgePointerId = null;
  if (!badgeMoved) {
    // 单击（未拖动）→ 翻转到另一面
    badgeRot.y += 180;
    applyBadge();
  }
}
badge3d.addEventListener('pointerup', endBadgeDrag);
badge3d.addEventListener('pointercancel', endBadgeDrag);

applyBadge();

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

/* ---------------- 登录米家 面板 ---------------- */

const mockTag = document.querySelector('.mock-tag');
const loginModal = document.getElementById('login-modal');
const loginStateEl = document.getElementById('login-state');
const loginMsgEl = document.getElementById('login-msg');
const qrImg = document.getElementById('qr-img');
const qrPlaceholder = document.getElementById('qr-placeholder');
const loginTabs = { pwd: document.getElementById('tab-pwd'), qr: document.getElementById('tab-qr') };
const loginPanes = { pwd: document.getElementById('pane-pwd'), qr: document.getElementById('pane-qr') };

function switchTab(tab) {
  for (const k of Object.keys(loginTabs)) {
    loginTabs[k].classList.toggle('active', k === tab);
    loginPanes[k].hidden = k !== tab;
  }
  if (tab !== 'pwd') hideCaptcha();
}

function showLoginMsg(text, kind) {
  loginMsgEl.hidden = !text;
  loginMsgEl.textContent = text || '';
  loginMsgEl.className = 'login-msg' + (kind ? ' ' + kind : '');
}

function renderLoginState(s) {
  if (!s) return;
  const authed = !!s.hasDevices;
  const wasMock = mockMode;
  if (typeof s.isMock === 'boolean') mockMode = s.isMock;
  loginStateEl.textContent = authed
    ? `已登录 · ${s.deviceCount} 台设备${s.cloudAuth ? ' · 云端会话有效' : ''}`
    : '未登录 · 登录后可同步真实设备';
  loginStateEl.classList.toggle('ok', authed);
  mockTag.hidden = true;
  // 进入未登录态：立即切到欢迎引导；登录成功后的真实设备会由设备推送渲染
  if (mockMode) renderWelcome();
  else if (wasMock) {
    // 离开未登录态：既要移除欢迎块，也要撤掉居中的 welcome-mode 布局 class，
    // 否则 #devices 会残留为「空的 flex 容器」而整片空白（真实设备卡片随后由设备推送渲染）
    listEl.querySelector('.empty.welcome')?.remove();
    listEl.classList.remove('welcome-mode');
  }
}

function openLoginModal(open) {
  loginModal.hidden = !open;
  if (open) {
    hideCaptcha();
    showLoginMsg('');
    window.mijia.loginStatus().then(renderLoginState).catch(() => {});
  }
}

// 出错信息去掉 Electron 的 invoke 前缀，只留可读部分
function readableError(e) {
  const msg = e && e.message ? e.message : String(e);
  return msg
    .replace(/^Error invoking remote method '[^']*':\s*/, '')
    .replace(/^(Error|TypeError):\s*/, '');
}

// 密码登录（多步式：账号密码 → 图形验证码 / 二次安全验证码）
const captchaField = document.getElementById('login-captcha-field');
const captchaLabel = document.getElementById('login-captcha-label');
const captchaInput = document.getElementById('login-captcha');
const captchaBox = document.getElementById('login-captcha-img');
let pwdSessionId = null;   // 待继续输入的登录会话
let pwdStage = null;       // 'captcha' | 'send-captcha' | 'code'
let pwdMethod = '';        // 二次验证方式：'email' | 'phone'

// 验证码图片：拿到有效图片才显示，否则显示「点击刷新」占位文字（避免出现破损图标）
function setCaptchaImage(dataUrl) {
  const ok = typeof dataUrl === 'string' && dataUrl.startsWith('data:image/');
  if (ok) {
    captchaBox.style.backgroundImage = `url("${dataUrl}")`;
    captchaBox.textContent = '';
    captchaBox.classList.remove('empty');
  } else {
    captchaBox.style.backgroundImage = 'none';
    captchaBox.textContent = '点击刷新';
    captchaBox.classList.add('empty');
  }
}

// 显示图形验证码输入（stage='captcha' 或 'send-captcha' 复用同一输入框）
function showCaptcha(dataUrl) {
  captchaField.hidden = false;
  captchaLabel.textContent = '图形验证码';
  captchaBox.hidden = false;
  captchaInput.placeholder = '输入图中字符';
  setCaptchaImage(dataUrl);
  captchaInput.value = '';
  captchaInput.focus();
}

// 显示二次验证码输入（邮箱 / 短信验证码）：复用同一输入框，隐藏图片按钮
function showCodeField(method) {
  pwdMethod = method || 'email';
  captchaField.hidden = false;
  captchaLabel.textContent = pwdMethod === 'phone' ? '短信验证码' : '邮箱验证码';
  captchaBox.hidden = true;
  captchaBox.style.backgroundImage = 'none';
  captchaInput.placeholder = '输入收到的验证码';
  captchaInput.value = '';
  captchaInput.focus();
}

function hideCaptcha() {
  pwdSessionId = null;
  pwdStage = null;
  pwdMethod = '';
  captchaField.hidden = true;
  captchaLabel.textContent = '图形验证码';
  captchaBox.hidden = false;
  captchaBox.style.backgroundImage = 'none';
  captchaBox.textContent = '点击刷新';
  captchaBox.classList.remove('empty');
  captchaInput.placeholder = '输入图中字符';
  captchaInput.value = '';
}

// 处理「需要继续输入」类响应（图形验证码 / 二次验证码）；返回 true 表示已接管、无需再走成功分支
function handleContinue(res) {
  if (!res || res.ok) return false;
  if (res.needCode) {
    pwdSessionId = res.sessionId || pwdSessionId;
    pwdStage = 'code';
    showCodeField(res.method);
    showLoginMsg(res.hint || '请输入验证码');
    return true;
  }
  if (res.needCaptcha) {
    pwdSessionId = res.sessionId || pwdSessionId;
    pwdStage = res.twoFactor ? 'send-captcha' : 'captcha';
    showCaptcha(res.captcha);
    if (!res.captcha) showLoginMsg('验证码加载失败，请点击刷新', 'error');
    else if (res.twoFactor) showLoginMsg('为安全起见，请先输入图形验证码以发送验证码');
    else showLoginMsg('需要图形验证码，请输入图中字符');
    return true;
  }
  return false;
}

// 登录成功统一收尾
function finishLoginSuccess(res) {
  hideCaptcha();
  document.getElementById('login-pass').value = '';
  showLoginMsg(`登录成功，已获取 ${res.count} 台设备`, 'ok');
  renderLoginState({ hasDevices: true, deviceCount: res.count, cloudAuth: false, isMock: false });
}

// 点「点击刷新」：按当前 stage 重新取一张验证码（图形验证码 / 二次验证发送用的图形验证码）
async function refreshCaptcha() {
  if (pwdSessionId) {
    try {
      const res = await window.mijia.loginRefreshCaptcha({ sessionId: pwdSessionId });
      if (handleContinue(res)) return;
      finishLoginSuccess(res);
    } catch (e) {
      showLoginMsg(readableError(e), 'error');
    }
    return;
  }
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const country = document.getElementById('login-country').value;
  if (!username || !password) { showLoginMsg('请填写小米账号与密码', 'error'); return; }
  try {
    const res = await window.mijia.loginPassword({ username, password, country });
    if (handleContinue(res)) return;
    finishLoginSuccess(res);
  } catch (e) {
    showLoginMsg(readableError(e), 'error');
  }
}
captchaBox.addEventListener('click', refreshCaptcha);

document.getElementById('login-pwd-btn').addEventListener('click', async () => {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const country = document.getElementById('login-country').value;
  const btn = document.getElementById('login-pwd-btn');

  // 已进入需要继续输入的阶段（图形验证码 / 二次验证码）：本次点击提交验证码
  if (pwdSessionId) {
    const code = captchaInput.value.trim();
    if (!code) { showLoginMsg(pwdStage === 'code' ? '请输入验证码' : '请输入图形验证码', 'error'); return; }
    btn.disabled = true;
    showLoginMsg(pwdStage === 'code' ? '正在验证…' : '正在提交…');
    try {
      const res = await window.mijia.loginCaptcha({ sessionId: pwdSessionId, code });
      if (res.needCode) {
        pwdSessionId = res.sessionId;
        pwdStage = 'code';
        showCodeField(res.method);
        showLoginMsg(res.hint || '验证码不正确，请重新输入', 'error');
        return;
      }
      if (res.needCaptcha) {
        pwdSessionId = res.sessionId;
        pwdStage = res.twoFactor ? 'send-captcha' : 'captcha';
        showCaptcha(res.captcha);
        if (!res.captcha) showLoginMsg('验证码加载失败，请点击刷新', 'error');
        else showLoginMsg(res.twoFactor ? '请重新输入图形验证码' : '验证码不正确，请重试', 'error');
        return;
      }
      finishLoginSuccess(res);
    } catch (e) {
      hideCaptcha();
      showLoginMsg(readableError(e), 'error');
    } finally {
      btn.disabled = false;
    }
    return;
  }

  if (!username || !password) { showLoginMsg('请填写小米账号与密码', 'error'); return; }
  btn.disabled = true;
  showLoginMsg('正在登录…');
  try {
    const res = await window.mijia.loginPassword({ username, password, country });
    if (handleContinue(res)) return;
    finishLoginSuccess(res);
  } catch (e) {
    showLoginMsg(readableError(e), 'error');
  } finally {
    btn.disabled = false;
  }
});

// 二维码登录（生成二维码 → 等待 App 扫码，完成后返回）
let qrBusy = false;
async function startQR() {
  if (qrBusy) return;
  qrBusy = true;
  const btn = document.getElementById('login-qr-btn');
  btn.disabled = true;
  showLoginMsg('正在生成二维码…');
  qrImg.hidden = true;
  qrPlaceholder.hidden = false;
  qrPlaceholder.textContent = '正在生成二维码…';
  try {
    const res = await window.mijia.loginQR();
    showLoginMsg(`登录成功，已获取 ${res.count} 台设备`, 'ok');
    renderLoginState({ hasDevices: true, deviceCount: res.count, cloudAuth: true, isMock: false });
  } catch (e) {
    showLoginMsg(readableError(e), 'error');
    qrPlaceholder.hidden = false;
    qrPlaceholder.textContent = '二维码已失效，请重新生成';
  } finally {
    qrBusy = false;
    btn.disabled = false;
  }
}
document.getElementById('login-qr-btn').addEventListener('click', startQR);
loginTabs.qr.addEventListener('click', () => {
  switchTab('qr');
  if (!qrBusy && qrImg.hidden && !qrImg.src) startQR();
});
loginTabs.pwd.addEventListener('click', () => switchTab('pwd'));

// 主进程推来的二维码
window.mijia.onQR((info) => {
  const src = (info && (info.dataUrl || info.qrImageUrl)) || '';
  if (src) {
    qrImg.src = src;
    qrImg.hidden = false;
    qrPlaceholder.hidden = true;
    showLoginMsg('请用米家 App 扫描二维码', '');
  } else {
    qrImg.hidden = true;
    qrPlaceholder.hidden = false;
    qrPlaceholder.textContent = '二维码获取失败，请重试';
  }
});

// 刷新设备清单
document.getElementById('login-refresh').addEventListener('click', async () => {
  const btn = document.getElementById('login-refresh');
  btn.disabled = true;
  showLoginMsg('正在刷新设备清单…');
  try {
    const res = await window.mijia.refreshDevices();
    showLoginMsg(`已刷新，共 ${res.count} 台设备`, 'ok');
    window.mijia.loginStatus().then(renderLoginState).catch(() => {});
  } catch (e) {
    showLoginMsg(readableError(e), 'error');
  } finally {
    btn.disabled = false;
  }
});

// 退出登录
document.getElementById('login-logout').addEventListener('click', async () => {
  const btn = document.getElementById('login-logout');
  btn.disabled = true;
  showLoginMsg('正在退出登录…');
  try {
    await window.mijia.logout();
    showLoginMsg('已退出登录', 'ok');
    renderLoginState({ hasDevices: false, deviceCount: 0, cloudAuth: false, isMock: true });
  } catch (e) {
    showLoginMsg(readableError(e), 'error');
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('login-close').addEventListener('click', () => openLoginModal(false));
document.getElementById('mi-cloud').addEventListener('click', () => openLoginModal(true));
window.mijia.onLoginState((s) => renderLoginState(s));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !loginModal.hidden) openLoginModal(false); });

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

window.mijia.init().then(({ devices, settings, isMock, login, hasCustomSize, fullscreen, theme, version }) => {
  // 用户此前手动调整过窗口大小：跳过启动时的按内容自适应
  if (hasCustomSize) sized = true;
  applyFullscreenState(fullscreen || null);
  // 关于窗口版本号
  if (version) document.getElementById('about-ver').textContent = 'v' + version;
  // 以主进程持久化的主题为准（首次打开默认深色），并同步本地记忆
  if (theme === 'light' || theme === 'dark') {
    try { localStorage.setItem('mijia.theme', theme); } catch {}
    applyTheme(theme);
  }
  if (typeof isMock === 'boolean') mockMode = isMock;
  mockTag.hidden = true; // 不再暴露「演示数据」标签：未登录显示欢迎引导
  render(devices);
  applySettings(settings);
  if (login) renderLoginState({ ...login, isMock });
  // DOM 就绪后把菜单图标栅格化并交给主进程，供托盘菜单使用
  sendTrayIcons();
});

// 字体/图片加载完成后（可能影响高度）再校准一次
window.addEventListener('load', () => setTimeout(fitWindow, 60));
