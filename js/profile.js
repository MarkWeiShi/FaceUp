/**
 * 顔鉴 · AI 颜值评分 H5
 * 个人中心模块 - 历史记录、趋势图、打卡
 * Version: 1.0
 */

import { CHECKIN_TASKS, getRankByScore } from './config.js';

// ========== IndexedDB 配置 ==========
const DB_NAME = 'FaceJ_DB';
const DB_VERSION = 1;
const STORE_HISTORY = 'history';
const STORE_CHECKIN = 'checkin';
const MAX_HISTORY = 10;

let db = null;

/**
 * 初始化 IndexedDB
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // 历史记录存储
      if (!database.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = database.createObjectStore(STORE_HISTORY, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // 打卡记录存储
      if (!database.objectStoreNames.contains(STORE_CHECKIN)) {
        const checkinStore = database.createObjectStore(STORE_CHECKIN, { 
          keyPath: 'date' 
        });
      }
    };
  });
}

/**
 * 保存分析记录
 * @param {Object} result - 分析结果
 * @param {string} photo - 照片 base64
 */
export async function saveHistory(result, photo) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    
    const record = {
      timestamp: Date.now(),
      total: result.total,
      rank: result.rank,
      percentile: result.percentile,
      dimensions: result.dimensions,
      photo: photo,
      region: result.region || 'china'
    };
    
    const request = store.add(record);
    request.onsuccess = () => {
      // 清理旧记录（保留最新10条）
      cleanOldRecords();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 清理旧记录
 */
async function cleanOldRecords() {
  const records = await getHistory();
  if (records.length > MAX_HISTORY) {
    const transaction = db.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    
    const toDelete = records.slice(MAX_HISTORY);
    toDelete.forEach(record => {
      store.delete(record.id);
    });
  }
}

/**
 * 获取历史记录
 * @returns {Promise<Array>} 按时间倒序排列的记录
 */
export async function getHistory() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const index = store.index('timestamp');
    
    const request = index.openCursor(null, 'prev');
    const records = [];
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        records.push(cursor.value);
        cursor.continue();
      } else {
        resolve(records);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 获取单条记录
 * @param {number} id - 记录 ID
 */
export async function getHistoryById(id) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 打卡
 * @param {string} date - 日期 YYYY-MM-DD
 */
export async function checkin(date = getTodayDate()) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CHECKIN], 'readwrite');
    const store = transaction.objectStore(STORE_CHECKIN);
    
    const record = {
      date: date,
      timestamp: Date.now()
    };
    
    const request = store.put(record);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 获取打卡记录
 * @returns {Promise<Array>} 打卡日期数组
 */
export async function getCheckinDates() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CHECKIN], 'readonly');
    const store = transaction.objectStore(STORE_CHECKIN);
    const request = store.getAllKeys();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 计算连续打卡天数
 */
export async function getCheckinStreak() {
  const dates = await getCheckinDates();
  if (dates.length === 0) return 0;
  
  const sortedDates = dates.sort().reverse();
  const today = getTodayDate();
  const yesterday = getDateStr(new Date(Date.now() - 86400000));
  
  // 检查今天或昨天是否打卡
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }
  
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diff = (prev - curr) / 86400000;
    
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * 获取今日日期字符串
 */
function getTodayDate() {
  return getDateStr(new Date());
}

/**
 * 格式化日期
 */
function getDateStr(date) {
  return date.toISOString().split('T')[0];
}

/**
 * 渲染历史时间线
 */
export async function renderHistoryTimeline(container) {
  const records = await getHistory();
  
  if (records.length === 0) {
    container.innerHTML = `
      <div class="profile__empty">
        <div class="profile__empty-icon">📋</div>
        <div class="profile__empty-text">暂无分析记录</div>
        <button class="btn-secondary" data-action="go-analyze">开始第一次分析</button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = records.map(record => {
    const date = new Date(record.timestamp);
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const rank = getRankByScore(record.total);
    
    return `
      <div class="profile__timeline-item" data-history-id="${record.id}">
        <div class="profile__timeline-date">${dateStr}</div>
        <div class="profile__timeline-card">
          <img class="profile__timeline-thumb" src="${record.photo}" alt="分析照片">
          <div class="profile__timeline-info">
            <div class="profile__timeline-score">${record.total.toFixed(1)}</div>
            <div class="profile__timeline-rank">${rank.symbol} ${rank.label}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-muted);">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 渲染趋势图
 */
export async function renderTrendChart(canvas) {
  const ctx = canvas.getContext('2d');
  const records = await getHistory();
  
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  if (records.length < 2) {
    // 数据不足，显示提示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '12px "Noto Serif SC"';
    ctx.textAlign = 'center';
    ctx.fillText('完成更多分析后可查看趋势', width / 2, height / 2);
    return;
  }
  
  // 反转数据（按时间正序）
  const data = records.slice().reverse().slice(-10);
  const scores = data.map(r => r.total);
  const minScore = Math.max(0, Math.min(...scores) - 1);
  const maxScore = Math.min(9, Math.max(...scores) + 1);
  
  // 绘制网格线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    
    // Y轴标签
    const score = maxScore - ((maxScore - minScore) / 4) * i;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px "Cormorant Garamond"';
    ctx.textAlign = 'right';
    ctx.fillText(score.toFixed(1), padding.left - 8, y + 4);
  }
  
  // 绘制折线
  ctx.strokeStyle = '#C9A96E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const points = data.map((record, i) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * i;
    const y = padding.top + chartHeight - ((record.total - minScore) / (maxScore - minScore)) * chartHeight;
    return { x, y, score: record.total };
  });
  
  points.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
  
  // 绘制渐变填充
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, 'rgba(201, 169, 110, 0.3)');
  gradient.addColorStop(1, 'rgba(201, 169, 110, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(points[0].x, height - padding.bottom);
  points.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.closePath();
  ctx.fill();
  
  // 绘制数据点
  points.forEach(point => {
    ctx.fillStyle = '#C9A96E';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#0E0C0F';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * 渲染打卡网格
 */
export async function renderCheckinGrid(container) {
  const checkinDates = await getCheckinDates();
  const today = getTodayDate();
  const todayChecked = checkinDates.includes(today);
  
  // 获取当前周的开始日期（周一）
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  
  // 生成30天的日期
  const days = [];
  for (let i = 0; i < 28; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    days.push({
      date: getDateStr(date),
      day: date.getDate(),
      isToday: getDateStr(date) === today,
      isCompleted: checkinDates.includes(getDateStr(date)),
      isFuture: date > now
    });
  }
  
  container.innerHTML = days.map(d => {
    let classes = 'profile__checkin-day';
    if (d.isCompleted) classes += ' profile__checkin-day--completed';
    if (d.isToday && !d.isCompleted) classes += ' profile__checkin-day--today';
    
    const content = d.isCompleted ? '✓' : (d.isFuture ? '' : d.day);
    
    return `<div class="${classes}" data-date="${d.date}">${content}</div>`;
  }).join('');
  
  return { todayChecked };
}

/**
 * 获取今日任务
 */
export function getTodayTask() {
  const dayOfMonth = new Date().getDate();
  const taskIndex = (dayOfMonth - 1) % CHECKIN_TASKS.length;
  return CHECKIN_TASKS[taskIndex];
}
