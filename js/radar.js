/**
 * 顔鉴 · AI 颜值评分 H5
 * 雷达图 Canvas 绘制模块
 * Version: 1.0
 */

import { DIMENSIONS, AVG_SCORES, EASING } from './config.js';

// 雷达图配置
const DEFAULT_CONFIG = {
  canvas: { width: 280, height: 280 },
  center: { x: 140, y: 140 },
  radius: 100,           // 最大半径（对应 9 分）
  levels: 5,             // 网格层数
  dimensions: 8,         // 维度数量

  // 样式
  gridColor: 'rgba(201, 169, 110, 0.15)',
  gridLineWidth: 1,
  axisColor: 'rgba(201, 169, 110, 0.25)',
  axisLineWidth: 1,

  // 用户数据图层
  userFill: 'rgba(201, 169, 110, 0.20)',
  userStroke: '#C9A96E',
  userStrokeWidth: 2,
  userPointRadius: 4,

  // 参照图层（东亚平均）
  avgFill: 'rgba(126, 184, 164, 0.08)',
  avgStroke: 'rgba(126, 184, 164, 0.4)',
  avgStrokeWidth: 1.5,
  avgDash: [4, 4],

  // 文字标注
  labelFont: '11px "Noto Serif SC", serif',
  labelColor: '#9A9090',
  scoreFont: 'bold 10px "Cormorant Garamond", serif',
  scoreColor: '#C9A96E',

  // 动画
  animDuration: 800
};

// 维度顺序（顺时针从顶部开始）
const DIMENSION_ORDER = [
  'youthfulness',  // 幼态感 (上)
  'harmony',       // 整体协调度
  'symmetry',      // 面部对称性
  'proportion',    // 三庭五眼比例
  'eyeType',       // 眼型分析 (下)
  'skinTone',      // 肤色肤质
  'definition',    // 五官立体度
  'faceShape'      // 脸型轮廓
];

/**
 * 绘制雷达图
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @param {Object} userScores - 用户各维度分数
 * @param {Object} options - 配置选项
 * @returns {Object} 包含 destroy 方法的对象
 */
export function drawRadar(canvas, userScores, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const ctx = canvas.getContext('2d');
  
  // 设置 Canvas 尺寸
  const dpr = window.devicePixelRatio || 1;
  canvas.width = config.canvas.width * dpr;
  canvas.height = config.canvas.height * dpr;
  canvas.style.width = `${config.canvas.width}px`;
  canvas.style.height = `${config.canvas.height}px`;
  ctx.scale(dpr, dpr);

  const { center, radius, dimensions } = config;
  const angleStep = (2 * Math.PI) / dimensions;
  const startAngle = -Math.PI / 2; // 从顶部开始

  // 缓存计算好的坐标
  let animationProgress = 0;
  let animationFrame = null;

  /**
   * 清除画布
   */
  function clear() {
    ctx.clearRect(0, 0, config.canvas.width, config.canvas.height);
  }

  /**
   * 获取角度对应的坐标
   * @param {number} angle - 角度
   * @param {number} r - 半径
   * @returns {Object} {x, y}
   */
  function getPoint(angle, r) {
    return {
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle)
    };
  }

  /**
   * 绘制网格线
   */
  function drawGrid() {
    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = config.gridLineWidth;

    // 绘制同心多边形
    for (let level = 1; level <= config.levels; level++) {
      const levelRadius = (radius / config.levels) * level;
      
      ctx.beginPath();
      for (let i = 0; i < dimensions; i++) {
        const angle = startAngle + angleStep * i;
        const point = getPoint(angle, levelRadius);
        
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 绘制轴线
    ctx.strokeStyle = config.axisColor;
    ctx.lineWidth = config.axisLineWidth;

    for (let i = 0; i < dimensions; i++) {
      const angle = startAngle + angleStep * i;
      const point = getPoint(angle, radius);
      
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }

  /**
   * 绘制数据区域
   * @param {Object} scores - 分数对象
   * @param {Object} style - 样式配置
   * @param {number} progress - 动画进度 (0-1)
   */
  function drawDataArea(scores, style, progress = 1) {
    const points = [];

    for (let i = 0; i < dimensions; i++) {
      const key = DIMENSION_ORDER[i];
      const score = scores[key]?.score ?? scores[key] ?? 0;
      const angle = startAngle + angleStep * i;
      
      // 分数映射到半径 (0-9 映射到 0-radius)
      const scoreRadius = (score / 9) * radius * progress;
      points.push(getPoint(angle, scoreRadius));
    }

    // 绘制填充区域
    ctx.fillStyle = style.fill;
    ctx.beginPath();
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.fill();

    // 绘制边框
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth;
    if (style.dash) {
      ctx.setLineDash(style.dash);
    } else {
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    return points;
  }

  /**
   * 绘制数据点
   * @param {Array} points - 坐标点数组
   * @param {string} fillColor - 填充颜色
   */
  function drawDataPoints(points, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = '#0E0C0F';
    ctx.lineWidth = 2;

    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, config.userPointRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  }

  /**
   * 绘制标签
   * @param {Object} scores - 用户分数
   */
  function drawLabels(scores) {
    ctx.font = config.labelFont;
    ctx.fillStyle = config.labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labelRadius = radius + 20;

    for (let i = 0; i < dimensions; i++) {
      const key = DIMENSION_ORDER[i];
      const dimInfo = DIMENSIONS[key];
      const angle = startAngle + angleStep * i;
      const point = getPoint(angle, labelRadius);

      // 维度名称
      ctx.fillStyle = config.labelColor;
      ctx.fillText(dimInfo.name, point.x, point.y);

      // 分数
      const score = scores[key]?.score ?? scores[key] ?? 0;
      ctx.font = config.scoreFont;
      ctx.fillStyle = config.scoreColor;
      ctx.fillText(score.toFixed(1), point.x, point.y + 14);

      // 恢复字体
      ctx.font = config.labelFont;
    }
  }

  /**
   * 完整绘制
   * @param {number} progress - 动画进度
   */
  function draw(progress = 1) {
    clear();
    
    // 绘制网格
    drawGrid();

    // 绘制平均值参照（如果启用）
    if (options.showAvg !== false) {
      drawDataArea(AVG_SCORES, {
        fill: config.avgFill,
        stroke: config.avgStroke,
        strokeWidth: config.avgStrokeWidth,
        dash: config.avgDash
      });
    }

    // 绘制用户数据
    const userPoints = drawDataArea(userScores, {
      fill: config.userFill,
      stroke: config.userStroke,
      strokeWidth: config.userStrokeWidth
    }, progress);

    // 绘制数据点
    if (progress >= 1) {
      drawDataPoints(userPoints, config.userStroke);
    }

    // 绘制标签
    drawLabels(userScores);
  }

  /**
   * 动画绘制
   */
  function animate() {
    if (!options.animated) {
      draw(1);
      return;
    }

    const startTime = performance.now();
    const duration = config.animDuration;

    function frame(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = EASING.easeOutCubic(progress);

      draw(easedProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(frame);
      }
    }

    animationFrame = requestAnimationFrame(frame);
  }

  /**
   * 处理点击事件
   * @param {MouseEvent} event
   */
  function handleClick(event) {
    if (!options.onDimensionClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickRadius = 20; // 点击判定半径

    for (let i = 0; i < dimensions; i++) {
      const key = DIMENSION_ORDER[i];
      const angle = startAngle + angleStep * i;
      const point = getPoint(angle, radius);

      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
      );

      if (distance < clickRadius) {
        options.onDimensionClick(key, DIMENSIONS[key]);
        break;
      }
    }
  }

  // 绑定事件
  if (options.onDimensionClick) {
    canvas.addEventListener('click', handleClick);
    canvas.style.cursor = 'pointer';
  }

  // 开始绘制
  animate();

  // 返回控制接口
  return {
    /**
     * 更新数据并重绘
     * @param {Object} newScores
     */
    update(newScores) {
      Object.assign(userScores, newScores);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      animate();
    },

    /**
     * 销毁实例
     */
    destroy() {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (options.onDimensionClick) {
        canvas.removeEventListener('click', handleClick);
      }
      clear();
    }
  };
}

/**
 * 创建雷达图（简化接口）
 * @param {string} selector - Canvas 选择器
 * @param {Object} scores - 分数数据
 * @param {Object} options - 选项
 * @returns {Object|null}
 */
export function createRadar(selector, scores, options = {}) {
  const canvas = document.querySelector(selector);
  if (!canvas) {
    console.error(`Canvas element not found: ${selector}`);
    return null;
  }

  return drawRadar(canvas, scores, {
    animated: true,
    showAvg: true,
    ...options
  });
}

export default { drawRadar, createRadar };
