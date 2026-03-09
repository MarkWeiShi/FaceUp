/**
 * 顔鉴 · AI 颜值评分 H5
 * 主入口文件 - 页面切换状态机、全局事件绑定
 * Version: 1.0
 */

import { 
  REGIONS, 
  DIMENSIONS, 
  ANALYSIS_STEPS, 
  TOAST_CONFIG,
  INGREDIENT_DATABASE,
  FACE_SHAPE_MAKEUP,
  EYE_TYPE_MAKEUP,
  AESTHETIC_PROCEDURES,
  SKINCARE_ADVICE_TEMPLATES,
  MAKEUP_ADVICE_TEMPLATES,
  ANALYSIS_VERSIONS,
  PHOTO_ANGLES,
  getRankByScore,
  getScoreLevel,
  EASING,
  calculateTotalScore
} from './config.js';
import { 
  getApiKey, 
  setApiKey, 
  validateApiKey, 
  analyzeWithRetry,
  generateMockData
} from './api.js';
import { createRadar } from './radar.js';
import {
  initDB,
  saveHistory,
  getHistory,
  getCheckinStreak,
  renderHistoryTimeline,
  renderTrendChart,
  renderCheckinGrid,
  getTodayTask,
  checkin
} from './profile.js';

// ========== 全局状态 ==========
const state = {
  currentScreen: 'landing',
  selectedRegion: 'china',
  skinMode: 'natural',
  analysisVersion: 'quick',  // quick | standard | pro
  uploadedImage: null,
  imageBase64: null,
  // 多照片模式
  multiPhotos: {
    front: null,
    left45: null,
    right45: null,
    side90: null,
    upward: null,
    downward: null
  },
  currentPhotoAngle: null,
  analysisResult: null,
  radarInstance: null,
  aestheticUnlocked: false,
  pkChallenger: null,
  currentAdviceData: null
};

// ========== DOM 元素缓存 ==========
const elements = {};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  initEventListeners();
  initApiKeyInput();
  checkExistingApiKey();
  
  // 初始化数据库
  try {
    await initDB();
  } catch (e) {
    console.warn('IndexedDB init failed:', e);
  }
  
  // 检查 PK 链接
  checkPKLink();
});

/**
 * 缓存 DOM 元素
 */
function cacheElements() {
  elements.screens = {
    landing: document.getElementById('screen-landing'),
    analyzing: document.getElementById('screen-analyzing'),
    report: document.getElementById('screen-report'),
    share: document.getElementById('screen-share'),
    pk: document.getElementById('screen-pk'),
    profile: document.getElementById('screen-profile')
  };
  
  elements.uploadArea = document.getElementById('upload-area');
  elements.uploadInput = document.getElementById('upload-input');
  elements.uploadPreview = document.getElementById('upload-preview');
  elements.uploadGuide = document.querySelector('.upload-area__guide');
  
  // 单照片和多照片上传区域
  elements.uploadSingle = document.getElementById('upload-single');
  elements.uploadMulti = document.getElementById('upload-multi');
  elements.uploadMultiGrid = document.getElementById('upload-multi-grid');
  elements.uploadMultiInput = document.getElementById('upload-multi-input');
  elements.uploadMultiTitle = document.getElementById('upload-multi-title');
  elements.uploadMultiProgress = document.getElementById('upload-multi-progress');
  
  // 版本选择
  elements.versionTabs = document.querySelectorAll('.version-tab');
  
  elements.skinModeControl = document.getElementById('skin-mode-control');
  elements.regionTags = document.querySelectorAll('.region-tag');
  
  elements.startButton = document.getElementById('start-analysis');
  
  elements.analyzingPhoto = document.getElementById('analyzing-photo');
  elements.analyzingProgress = document.getElementById('analyzing-progress');
  elements.analyzingSteps = document.getElementById('analyzing-steps');
  elements.analyzingTimer = document.getElementById('analyzing-timer');
  
  elements.reportAvatar = document.getElementById('report-avatar');
  elements.reportScore = document.getElementById('report-score');
  elements.reportRank = document.getElementById('report-rank');
  elements.reportPercentile = document.getElementById('report-percentile');
  elements.reportSummary = document.getElementById('report-summary');
  elements.reportStarMatch = document.getElementById('report-star-match');
  elements.reportRegions = document.querySelectorAll('.report__region-tag');
  elements.radarCanvas = document.getElementById('radar-canvas');
  elements.dimensionsList = document.getElementById('dimensions-list');
  
  elements.tabBar = document.getElementById('advice-tab-bar');
  elements.tabContents = document.querySelectorAll('.report__tab-content');
  
  elements.toast = document.getElementById('toast');
  elements.apiKeyInput = document.getElementById('api-key-input');
  elements.apiKeyModal = document.getElementById('api-key-modal');
}

/**
 * 初始化事件监听
 */
function initEventListeners() {
  // 上传区域
  elements.uploadArea?.addEventListener('click', () => {
    elements.uploadInput?.click();
  });
  
  elements.uploadInput?.addEventListener('change', handleImageUpload);
  
  // 拖拽上传
  elements.uploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add('upload-area--dragover');
  });
  
  elements.uploadArea?.addEventListener('dragleave', () => {
    elements.uploadArea.classList.remove('upload-area--dragover');
  });
  
  elements.uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove('upload-area--dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  });
  
  // 素颜/有妆切换
  elements.skinModeControl?.addEventListener('click', (e) => {
    const option = e.target.closest('.segmented-control__option');
    if (option) {
      const mode = option.dataset.mode;
      setSkinMode(mode);
    }
  });
  
  // 版本选择
  elements.versionTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const version = tab.dataset.version;
      setAnalysisVersion(version);
    });
  });
  
  // 多照片上传区域点击
  elements.uploadMultiGrid?.addEventListener('click', (e) => {
    const item = e.target.closest('.upload-multi__item');
    if (item && !item.classList.contains('upload-multi__item--filled')) {
      const angle = item.dataset.angle;
      // 检查专业版限制
      if (PHOTO_ANGLES[angle]?.proOnly && state.analysisVersion !== 'pro') {
        return;
      }
      state.currentPhotoAngle = angle;
      highlightCurrentAngle(angle);
      elements.uploadMultiInput?.click();
    }
  });
  
  // 多照片上传input
  elements.uploadMultiInput?.addEventListener('change', handleMultiPhotoUpload);
  
  // 地区选择
  elements.regionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      setRegion(tag.dataset.region);
    });
  });
  
  // 开始分析按钮
  elements.startButton?.addEventListener('click', startAnalysis);
  
  // 报告页地区切换
  elements.reportRegions.forEach(tag => {
    tag.addEventListener('click', () => {
      switchReportRegion(tag.dataset.region);
    });
  });
  
  // Tab 切换
  elements.tabBar?.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-bar__item');
    if (tab) {
      switchTab(tab.dataset.tab);
    }
  });
  
  // 导航返回
  document.querySelectorAll('[data-action="back"]').forEach(btn => {
    btn.addEventListener('click', goBack);
  });
  
  // 分享按钮
  document.querySelectorAll('[data-action="share"]').forEach(btn => {
    btn.addEventListener('click', () => switchScreen('share'));
  });
  
  // 医美解锁
  document.getElementById('aesthetic-unlock-btn')?.addEventListener('click', unlockAesthetic);
  
  // API Key 相关
  document.getElementById('api-key-save')?.addEventListener('click', saveApiKey);
  document.getElementById('api-key-cancel')?.addEventListener('click', closeApiKeyModal);
  
  // 个人中心
  document.querySelectorAll('[data-action="profile"]').forEach(btn => {
    btn.addEventListener('click', openProfile);
  });
  
  // 设置按钮
  document.querySelectorAll('[data-action="settings"]').forEach(btn => {
    btn.addEventListener('click', showApiKeyModal);
  });
  
  // PK 链接生成
  document.getElementById('create-pk-link')?.addEventListener('click', createPKLink);
  document.getElementById('copy-pk-link')?.addEventListener('click', copyPKLink);
  document.getElementById('pk-link-close')?.addEventListener('click', closePKLinkModal);
  
  // 建议详情弹窗关闭
  document.querySelectorAll('[data-action="close-advice-detail"]').forEach(btn => {
    btn.addEventListener('click', closeAdviceDetail);
  });
  
  // 点击弹窗背景关闭
  document.getElementById('advice-detail-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeAdviceDetail();
    }
  });
  
  // 添加到日历按钮
  document.getElementById('add-to-calendar-btn')?.addEventListener('click', addSkincareToCalendar);
  
  // 打卡
  document.getElementById('checkin-btn')?.addEventListener('click', handleCheckin);
  
  // 开始分析按钮（从个人中心）
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="go-analyze"]')) {
      switchScreen('landing');
    }
  });
  
  // 成分标签点击
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip--clickable');
    if (chip) {
      showIngredientTooltip(chip.dataset.ingredient);
    }
  });
  
  // 关闭成分 Tooltip
  document.querySelector('.ingredient-tooltip__close')?.addEventListener('click', hideIngredientTooltip);
  
  // 折叠面板
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.accordion__header');
    if (header) {
      const accordion = header.closest('.accordion');
      accordion?.classList.toggle('accordion--open');
    }
  });
  
  // 历史记录点击
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.profile__timeline-item');
    if (item) {
      const historyId = parseInt(item.dataset.historyId);
      loadHistoryRecord(historyId);
    }
  });
}

/**
 * 初始化 API Key 输入
 */
function initApiKeyInput() {
  const existingKey = getApiKey();
  if (existingKey && elements.apiKeyInput) {
    elements.apiKeyInput.value = existingKey;
  }
}

/**
 * 检查现有 API Key
 */
function checkExistingApiKey() {
  const key = getApiKey();
  if (!key) {
    // 首次使用，显示提示
    setTimeout(() => {
      showToast('请先设置 Claude API Key', 'info');
    }, 1000);
  }
}

/**
 * 设置皮肤模式
 */
function setSkinMode(mode) {
  state.skinMode = mode;
  
  const options = elements.skinModeControl?.querySelectorAll('.segmented-control__option');
  const slider = elements.skinModeControl?.querySelector('.segmented-control__slider');
  
  options?.forEach(opt => {
    opt.classList.toggle('segmented-control__option--active', opt.dataset.mode === mode);
  });
  
  slider?.classList.toggle('segmented-control__slider--left', mode === 'natural');
  slider?.classList.toggle('segmented-control__slider--right', mode === 'makeup');
}

/**
 * 设置地区
 */
function setRegion(region) {
  state.selectedRegion = region;
  
  elements.regionTags.forEach(tag => {
    tag.classList.toggle('region-tag--active', tag.dataset.region === region);
  });
}

/**
 * 设置分析版本
 */
function setAnalysisVersion(version) {
  state.analysisVersion = version;
  
  // 更新版本标签状态
  elements.versionTabs.forEach(tab => {
    tab.classList.toggle('version-tab--active', tab.dataset.version === version);
  });
  
  // 根据版本切换上传区域
  const config = ANALYSIS_VERSIONS[version];
  
  if (version === 'quick') {
    // 快速版：单照片上传
    elements.uploadSingle.style.display = 'block';
    elements.uploadMulti.style.display = 'none';
  } else {
    // 标准版/专业版：多照片上传
    elements.uploadSingle.style.display = 'none';
    elements.uploadMulti.style.display = 'block';
    
    // 更新提示文本
    elements.uploadMultiTitle.textContent = `请拍摄 ${config.photos} 张照片`;
    
    // 显示/隐藏专业版专属角度
    const proItems = document.querySelectorAll('.upload-multi__item--pro');
    proItems.forEach(item => {
      item.style.display = version === 'pro' ? 'block' : 'none';
    });
    
    // 重置多照片状态
    resetMultiPhotos();
    updateMultiPhotoProgress();
  }
  
  // 更新开始按钮状态
  updateStartButtonState();
}

/**
 * 重置多照片状态
 */
function resetMultiPhotos() {
  state.multiPhotos = {
    front: null,
    left45: null,
    right45: null,
    side90: null,
    upward: null,
    downward: null
  };
  state.currentPhotoAngle = null;
  
  // 重置UI
  document.querySelectorAll('.upload-multi__item').forEach(item => {
    item.classList.remove('upload-multi__item--filled', 'upload-multi__item--active');
    const img = item.querySelector('.upload-multi__img');
    const placeholder = item.querySelector('.upload-multi__placeholder');
    if (img) img.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  });
}

/**
 * 高亮当前正在拍摄的角度
 */
function highlightCurrentAngle(angle) {
  document.querySelectorAll('.upload-multi__item').forEach(item => {
    item.classList.toggle('upload-multi__item--active', item.dataset.angle === angle);
  });
}

/**
 * 处理多照片上传
 */
async function handleMultiPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file || !state.currentPhotoAngle) return;
  
  try {
    // 验证文件
    if (!file.type.startsWith('image/')) {
      showToast('请上传图片文件', 'error');
      return;
    }
    
    showToast('正在处理图片...', 'info');
    
    // 读取并压缩图片
    const base64 = await readAndCompressImage(file);
    
    // 保存到多照片状态
    state.multiPhotos[state.currentPhotoAngle] = base64;
    
    // 更新UI
    const item = document.querySelector(`.upload-multi__item[data-angle="${state.currentPhotoAngle}"]`);
    if (item) {
      item.classList.add('upload-multi__item--filled');
      item.classList.remove('upload-multi__item--active');
      
      const img = item.querySelector('.upload-multi__img');
      const placeholder = item.querySelector('.upload-multi__placeholder');
      
      if (img) {
        img.src = base64;
        img.style.display = 'block';
      }
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    }
    
    // 更新进度
    updateMultiPhotoProgress();
    
    // 自动选择下一个未拍摄的角度
    selectNextAngle();
    
    showToast(`${PHOTO_ANGLES[state.currentPhotoAngle]?.name || '照片'} 已上传`, 'success');
    
  } catch (error) {
    console.error('Photo upload error:', error);
    showToast('照片上传失败', 'error');
  }
  
  // 重置input
  e.target.value = '';
}

/**
 * 更新多照片上传进度
 */
function updateMultiPhotoProgress() {
  const config = ANALYSIS_VERSIONS[state.analysisVersion];
  const requiredAngles = config.angles;
  
  let uploadedCount = 0;
  requiredAngles.forEach(angle => {
    if (state.multiPhotos[angle]) {
      uploadedCount++;
    }
  });
  
  elements.uploadMultiProgress.textContent = `${uploadedCount}/${config.photos}`;
  
  // 更新开始按钮状态
  updateStartButtonState();
}

/**
 * 选择下一个未拍摄的角度
 */
function selectNextAngle() {
  const config = ANALYSIS_VERSIONS[state.analysisVersion];
  const requiredAngles = config.angles;
  
  for (const angle of requiredAngles) {
    if (!state.multiPhotos[angle]) {
      state.currentPhotoAngle = angle;
      highlightCurrentAngle(angle);
      return;
    }
  }
  
  // 所有角度都已拍摄
  state.currentPhotoAngle = null;
  highlightCurrentAngle(null);
}

/**
 * 更新开始按钮状态
 */
function updateStartButtonState() {
  const config = ANALYSIS_VERSIONS[state.analysisVersion];
  let canStart = false;
  
  if (state.analysisVersion === 'quick') {
    // 快速版只需一张照片
    canStart = !!state.imageBase64;
  } else {
    // 标准版/专业版需要所有照片
    const requiredAngles = config.angles;
    canStart = requiredAngles.every(angle => state.multiPhotos[angle]);
  }
  
  if (elements.startButton) {
    elements.startButton.disabled = !canStart;
    elements.startButton.querySelector('span:first-child').textContent = 
      canStart ? '开始颜值分析' : `上传${config.photos}张照片开始`;
  }
}

/**
 * 处理图片上传
 */
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    processImageFile(file);
  }
}

/**
 * 处理图片文件
 */
async function processImageFile(file) {
  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showToast('请上传图片文件', 'error');
      return;
    }
    
    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片文件过大，请选择小于 10MB 的图片', 'error');
      return;
    }
    
    showToast('正在处理图片...', 'info');
    
    // 读取并压缩图片
    const base64 = await readAndCompressImage(file);
    
    state.uploadedImage = file;
    state.imageBase64 = base64;
    
    // 显示预览
    if (elements.uploadPreview) {
      elements.uploadPreview.src = base64;
      elements.uploadPreview.style.display = 'block';
    }
    
    if (elements.uploadGuide) {
      elements.uploadGuide.style.display = 'none';
    }
    
    elements.uploadArea?.classList.add('upload-area--has-image');
    
    // 启用开始按钮
    if (elements.startButton) {
      elements.startButton.disabled = false;
    }
    
    showToast('照片就绪，开始分析', 'success');
    
  } catch (error) {
    console.error('Image processing error:', error);
    showToast('图片处理失败，请重试', 'error');
  }
}

/**
 * 读取并压缩图片
 */
function readAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算目标尺寸
        let { width, height } = img;
        const maxSize = 1200;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 导出为 JPEG
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 开始分析
 */
async function startAnalysis() {
  const config = ANALYSIS_VERSIONS[state.analysisVersion];
  
  // 验证照片
  if (state.analysisVersion === 'quick') {
    if (!state.imageBase64) {
      showToast('请先上传照片', 'warning');
      return;
    }
  } else {
    // 检查多照片是否完整
    const requiredAngles = config.angles;
    const missingAngles = requiredAngles.filter(angle => !state.multiPhotos[angle]);
    if (missingAngles.length > 0) {
      showToast(`请完成所有${config.photos}张照片拍摄`, 'warning');
      return;
    }
  }
  
  const apiKey = getApiKey();
  if (!apiKey) {
    showApiKeyModal();
    return;
  }
  
  // 切换到分析页面
  switchScreen('analyzing');
  
  // 设置预览图（显示正面照）
  const previewImage = state.analysisVersion === 'quick' 
    ? state.imageBase64 
    : state.multiPhotos.front;
  if (elements.analyzingPhoto && previewImage) {
    elements.analyzingPhoto.src = previewImage;
  }
  
  // 重置进度
  resetAnalysisProgress();
  
  try {
    // 模拟步骤进度（根据版本调整时长）
    const stepPromise = simulateSteps(config.analysisDuration);
    
    // 准备分析选项
    const analysisOptions = {
      region: state.selectedRegion,
      skinMode: state.skinMode,
      version: state.analysisVersion,
      onProgress: (msg) => {
        updateAnalysisStatus(msg);
      }
    };
    
    // 根据版本选择图片数据
    let result;
    if (state.analysisVersion === 'quick') {
      result = await analyzeWithRetry(state.imageBase64, analysisOptions);
    } else {
      // 多照片分析
      result = await analyzeWithRetry(state.multiPhotos, analysisOptions);
    }
    
    // 等待步骤动画完成
    await stepPromise;
    
    state.analysisResult = result;
    
    // 保存到历史记录
    try {
      const primaryImage = state.analysisVersion === 'quick' 
        ? state.imageBase64 
        : state.multiPhotos.front;
      await saveHistory(result, primaryImage);
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
    
    // 切换到报告页
    await new Promise(resolve => setTimeout(resolve, 500));
    switchScreen('report');
    renderReport(result);
    
    // 如果有 PK 挑战者，显示 PK 结果
    if (state.pkChallenger) {
      setTimeout(() => {
        showPKResult();
      }, 2000);
    }
    
  } catch (error) {
    console.error('Analysis error:', error);
    showToast(error.message || '分析失败，请重试', 'error');
    
    // 返回落地页
    setTimeout(() => {
      switchScreen('landing');
    }, 2000);
  }
}

/**
 * 重置分析进度
 */
function resetAnalysisProgress() {
  if (elements.analyzingProgress) {
    elements.analyzingProgress.style.width = '0%';
  }
  
  if (elements.analyzingSteps) {
    elements.analyzingSteps.innerHTML = ANALYSIS_STEPS.map((step, i) => `
      <div class="step-item" data-step="${step.key}">
        <div class="step-item__icon">○</div>
        <div class="step-item__text">${step.name}</div>
      </div>
    `).join('');
  }
}

/**
 * 模拟步骤进度
 */
async function simulateSteps(targetDuration = 5) {
  let totalDuration = 0;
  const baseDuration = 5; // 基础版时长（秒）
  const durationMultiplier = targetDuration / baseDuration;
  
  for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
    const step = ANALYSIS_STEPS[i];
    const stepEl = elements.analyzingSteps?.querySelector(`[data-step="${step.key}"]`);
    
    // 设为进行中
    if (stepEl) {
      stepEl.classList.add('step-item--active');
      stepEl.querySelector('.step-item__icon').innerHTML = '<div class="step-item__spinner"></div>';
    }
    
    // 更新进度条
    const progress = ((i + 0.5) / ANALYSIS_STEPS.length) * 100;
    if (elements.analyzingProgress) {
      elements.analyzingProgress.style.width = `${progress}%`;
    }
    
    // 根据版本调整步骤时长
    const adjustedDuration = step.duration * durationMultiplier;
    totalDuration += adjustedDuration;
    updateTimer(totalDuration, targetDuration * 1000);
    
    await new Promise(resolve => setTimeout(resolve, adjustedDuration));
    
    // 设为完成
    if (stepEl) {
      stepEl.classList.remove('step-item--active');
      stepEl.classList.add('step-item--completed');
      stepEl.querySelector('.step-item__icon').textContent = '✓';
    }
  }
  
  // 完成进度条
  if (elements.analyzingProgress) {
    elements.analyzingProgress.style.width = '100%';
  }
}

/**
 * 更新计时器
 */
function updateTimer(elapsed, totalTime = 5000) {
  const remaining = Math.max(0, totalTime - elapsed);
  const seconds = Math.ceil(remaining / 1000);
  
  if (elements.analyzingTimer) {
    elements.analyzingTimer.textContent = `预计还需 ${seconds} 秒...`;
  }
}

/**
 * 更新分析状态
 */
function updateAnalysisStatus(message) {
  if (elements.analyzingTimer) {
    elements.analyzingTimer.textContent = message;
  }
}

/**
 * 渲染报告
 */
function renderReport(result) {
  // 头像
  if (elements.reportAvatar) {
    elements.reportAvatar.src = state.imageBase64;
  }
  
  // 分数动画
  animateScore(result.total);
  
  // 段位
  const rank = getRankByScore(result.total);
  if (elements.reportRank) {
    elements.reportRank.innerHTML = `${rank.symbol} ${rank.label}`;
    elements.reportRank.style.color = rank.color;
  }
  
  // 百分位
  if (elements.reportPercentile) {
    elements.reportPercentile.innerHTML = `超过了 <span class="report__percentile-value">${result.percentile}%</span> 的用户`;
  }
  
  // AI 总评
  if (elements.reportSummary) {
    elements.reportSummary.textContent = result.summary;
  }
  
  // 明星相似
  if (elements.reportStarMatch) {
    elements.reportStarMatch.innerHTML = `✨ 相似明星气质：<span>${result.starMatch}</span>`;
  }
  
  // 地区标签
  elements.reportRegions.forEach(tag => {
    tag.classList.toggle('region-tag--active', tag.dataset.region === state.selectedRegion);
  });
  
  // 雷达图
  if (state.radarInstance) {
    state.radarInstance.destroy();
  }
  
  if (elements.radarCanvas) {
    state.radarInstance = createRadar('#radar-canvas', result.dimensions, {
      animated: true,
      showAvg: true,
      onDimensionClick: (key, info) => {
        showDimensionDetail(key, result.dimensions[key]);
      }
    });
  }
  
  // 维度评分列表
  renderDimensionsList(result.dimensions);
  
  // 改善建议
  renderAdvice(result);
  
  // 标准版/专业版专属分析
  const version = state.analysisVersion || 'quick';
  
  // 侧面轮廓分析（标准版以上）
  const sideProfileSection = document.getElementById('side-profile-section');
  if (sideProfileSection) {
    if ((version === 'standard' || version === 'pro') && result.sideProfile) {
      sideProfileSection.style.display = 'block';
      renderSideProfile(result.sideProfile);
    } else {
      sideProfileSection.style.display = 'none';
    }
  }
  
  // 皮肤分析（标准版以上）
  const skinAnalysisSection = document.getElementById('skin-analysis-section');
  if (skinAnalysisSection) {
    if ((version === 'standard' || version === 'pro') && result.skinAnalysis) {
      skinAnalysisSection.style.display = 'block';
      renderSkinAnalysis(result.skinAnalysis);
    } else {
      skinAnalysisSection.style.display = 'none';
    }
  }
  
  // 幼态系统（仅专业版）
  const neotenysection = document.getElementById('neoteny-section');
  if (neotenysection) {
    if (version === 'pro' && result.neotenSystem) {
      neotenysection.style.display = 'block';
      renderNeotenSystem(result.neotenSystem);
    } else {
      neotenysection.style.display = 'none';
    }
  }
  
  // 3D立体感分析（仅专业版）
  const definition3dSection = document.getElementById('definition3d-section');
  if (definition3dSection) {
    if (version === 'pro' && result.definition3D) {
      definition3dSection.style.display = 'block';
      renderDefinition3D(result.definition3D);
    } else {
      definition3dSection.style.display = 'none';
    }
  }
  
  // 医美精准参考（仅专业版）
  const aestheticRefSection = document.getElementById('aesthetic-ref-section');
  if (aestheticRefSection) {
    if (version === 'pro' && result.aestheticReference) {
      aestheticRefSection.style.display = 'block';
      renderAestheticReference(result.aestheticReference);
    } else {
      aestheticRefSection.style.display = 'none';
    }
  }
}

/**
 * 分数动画
 */
function animateScore(targetScore) {
  if (!elements.reportScore) return;
  
  const duration = 1800;
  const startTime = performance.now();
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = EASING.easeOutCubic(progress);
    
    const currentScore = targetScore * easedProgress;
    elements.reportScore.textContent = currentScore.toFixed(1);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

/**
 * 渲染维度列表
 */
function renderDimensionsList(dimensions) {
  if (!elements.dimensionsList) return;
  
  const html = Object.entries(dimensions).map(([key, data], i) => {
    const dimInfo = DIMENSIONS[key];
    const score = data.score ?? data;
    const comment = data.comment || '';
    const level = getScoreLevel(score);
    const percentage = (score / 9 * 100).toFixed(0);
    
    return `
      <div class="dimension-row animate-fade-in-up stagger-delay-${i + 1}">
        <div class="dimension-row__name">${dimInfo.name}</div>
        <div class="dimension-row__score dimension-row__score--${level}">${score.toFixed(1)}</div>
        <div class="dimension-row__bar">
          <div class="progress-bar">
            <div class="progress-bar__fill progress-bar__fill--${level === 'high' ? 'gold' : level === 'medium' ? 'jade' : 'rose'}" 
                 style="width: ${percentage}%"></div>
          </div>
          <div class="dimension-row__comment">${comment}</div>
        </div>
      </div>
    `;
  }).join('');
  
  elements.dimensionsList.innerHTML = html;
}

/**
 * 渲染改善建议
 */
function renderAdvice(result) {
  // 护肤建议（带成分标签和预期提升）
  const skincareContent = document.getElementById('skincare-content');
  if (skincareContent && result.skincare) {
    // 预定义的护肤建议类型映射
    const skincareTypes = ['hydration', 'brightening', 'antiAging', 'acne', 'sensitive', 'sunProtection'];
    
    skincareContent.innerHTML = result.skincare.map((advice, i) => {
      // 提取成分关键词
      const ingredients = extractIngredients(advice);
      const chipsHtml = ingredients.length > 0 
        ? `<div class="advice-card__tags">${ingredients.map(ing => 
            `<span class="chip chip--clickable" data-ingredient="${ing}">${ing}</span>`
          ).join('')}</div>`
        : '';
      
      // 匹配建议类型获取预期提升数据
      const adviceType = matchSkincareType(advice);
      const template = SKINCARE_ADVICE_TEMPLATES[adviceType] || SKINCARE_ADVICE_TEMPLATES.hydration;
      
      return `
        <div class="advice-card advice-card--skincare advice-card--clickable animate-fade-in-up stagger-delay-${i + 1}"
             data-advice-type="skincare"
             data-advice-key="${adviceType}"
             data-advice-content="${encodeURIComponent(advice)}">
          <div class="advice-card__header">
            <span class="advice-card__icon">${template.icon}</span>
            <span class="advice-card__title">${template.title}</span>
          </div>
          <div class="advice-card__content">${advice}</div>
          ${chipsHtml}
          <div class="advice-card__meta">
            <div class="advice-card__improvement">
              <span>📈</span>
              <span>预计 +${template.improvement.score} 分</span>
            </div>
            <span class="advice-card__time">⏱️ ${template.improvement.time}</span>
            <span class="advice-card__arrow">▶</span>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // 彩妆建议（折叠面板形式 + 可点击卡片）
  const makeupContent = document.getElementById('makeup-content');
  if (makeupContent && result.makeup) {
    // 基于维度生成结构化建议
    const faceShapeType = detectFaceShape(result);
    const eyeType = detectEyeType(result);
    
    const faceShapeInfo = FACE_SHAPE_MAKEUP[faceShapeType] || FACE_SHAPE_MAKEUP.oval;
    const eyeInfo = EYE_TYPE_MAKEUP[eyeType] || EYE_TYPE_MAKEUP.almond;
    const contourTemplate = MAKEUP_ADVICE_TEMPLATES.contour;
    const eyeTemplate = MAKEUP_ADVICE_TEMPLATES.eyeMakeup;
    
    makeupContent.innerHTML = `
      <!-- 脸型修饰卡片 -->
      <div class="advice-card advice-card--makeup advice-card--clickable animate-fade-in-up"
           data-advice-type="makeup"
           data-advice-key="contour"
           data-advice-extra="${encodeURIComponent(JSON.stringify(faceShapeInfo))}">
        <div class="advice-card__header">
          <span class="advice-card__icon">💎</span>
          <span class="advice-card__title">脸型修饰方案</span>
        </div>
        <div class="advice-card__content">
          基于您的【${faceShapeInfo.name}】，为您定制修容、腮红、高光方案
        </div>
        <div class="advice-card__meta">
          <div class="advice-card__improvement">
            <span>👁️</span>
            <span>视觉 +${contourTemplate.improvement.visualScore} 分</span>
          </div>
          <span class="advice-card__time">⏱️ ${contourTemplate.improvement.time}</span>
          <span class="advice-card__arrow">▶</span>
        </div>
      </div>
      
      <!-- 眼妆强化卡片 -->
      <div class="advice-card advice-card--makeup advice-card--clickable animate-fade-in-up stagger-delay-1"
           data-advice-type="makeup"
           data-advice-key="eyeMakeup"
           data-advice-extra="${encodeURIComponent(JSON.stringify(eyeInfo))}">
        <div class="advice-card__header">
          <span class="advice-card__icon">👁️</span>
          <span class="advice-card__title">眼妆强化方案</span>
        </div>
        <div class="advice-card__content">
          基于您的【${eyeInfo.name}】，为您定制眼影、眼线技法
        </div>
        <div class="advice-card__meta">
          <div class="advice-card__improvement">
            <span>👁️</span>
            <span>视觉 +${eyeTemplate.improvement.visualScore} 分</span>
          </div>
          <span class="advice-card__time">⏱️ ${eyeTemplate.improvement.time}</span>
          <span class="advice-card__arrow">▶</span>
        </div>
      </div>
      
      <!-- 原始 AI 建议 -->
      ${result.makeup.map((advice, i) => {
        const lipTemplate = MAKEUP_ADVICE_TEMPLATES.lipColor;
        return `
        <div class="advice-card advice-card--makeup advice-card--clickable animate-fade-in-up stagger-delay-${i + 2}"
             data-advice-type="makeup-ai"
             data-advice-content="${encodeURIComponent(advice)}">
          <div class="advice-card__header">
            <span class="advice-card__icon">💄</span>
            <span class="advice-card__title">彩妆技巧 ${i + 1}</span>
          </div>
          <div class="advice-card__content">${advice}</div>
          <div class="advice-card__meta">
            <div class="advice-card__improvement">
              <span>👁️</span>
              <span>视觉提升</span>
            </div>
            <span class="advice-card__time">⏱️ 即时见效</span>
            <span class="advice-card__arrow">▶</span>
          </div>
        </div>
      `}).join('')}
    `;
  }
  
  // 医美建议（带解锁机制 + 预期提升）
  const aestheticContent = document.getElementById('aesthetic-content');
  if (aestheticContent && result.aesthetic) {
    // 生成基于得分的医美建议
    const aestheticCards = generateAestheticAdvice(result);
    const content = aestheticCards + result.aesthetic.map((advice, i) => `
      <div class="advice-card advice-card--aesthetic advice-card--clickable animate-fade-in-up stagger-delay-${i + 3}"
           data-advice-type="aesthetic-ai"
           data-advice-content="${encodeURIComponent(advice)}">
        <div class="advice-card__header">
          <span class="advice-card__icon">💉</span>
          <span class="advice-card__title">AI 建议 ${i + 1}</span>
        </div>
        <div class="advice-card__content">${advice}</div>
        <div class="advice-card__meta">
          <div class="advice-card__improvement advice-card__improvement--aesthetic">
            <span>✨</span>
            <span>专业参考</span>
          </div>
          <span class="advice-card__arrow">▶</span>
        </div>
      </div>
    `).join('');
    
    // 检查是否已解锁
    if (state.aestheticUnlocked || sessionStorage.getItem('aesthetic_unlocked')) {
      aestheticContent.innerHTML = content + `
        <div class="disclaimer" style="position: relative; margin-top: var(--spacing-lg);">
          <span>⚕️</span>
          <span>以上内容为科普参考，不构成医疗诊断或手术推荐。请在正规持牌医疗机构咨询执业医师。</span>
        </div>
      `;
      state.aestheticUnlocked = true;
    } else {
      aestheticContent.innerHTML = `
        <div class="aesthetic-unlock">
          <div class="aesthetic-unlock__blur">${content}</div>
          <div class="aesthetic-unlock__overlay">
            <div class="aesthetic-unlock__icon">⚕️</div>
            <div class="aesthetic-unlock__title">医美参考方案</div>
            <div class="aesthetic-unlock__desc">
              以下内容为科普性信息，仅供参考，不构成医疗建议。
              在采取任何行动前请务必咨询正规医疗机构专业医生。
            </div>
            <div class="aesthetic-unlock__actions">
              <button class="btn-primary" id="aesthetic-unlock-btn">我已了解，查看参考内容</button>
              <button class="btn-text">我暂时不需要</button>
            </div>
          </div>
        </div>
      `;
      
      // 重新绑定解锁按钮
      document.getElementById('aesthetic-unlock-btn')?.addEventListener('click', unlockAesthetic);
    }
  }
  
  // 绑定卡片点击事件
  bindAdviceCardClicks();
}

/**
 * 匹配护肤建议类型
 */
function matchSkincareType(advice) {
  const text = advice.toLowerCase();
  if (text.includes('补水') || text.includes('保湿') || text.includes('透明质酸')) return 'hydration';
  if (text.includes('美白') || text.includes('提亮') || text.includes('烟酰胺') || text.includes('维c') || text.includes('淡斑')) return 'brightening';
  if (text.includes('抗老') || text.includes('皱纹') || text.includes('视黄醇') || text.includes('胶原') || text.includes('胜肽')) return 'antiAging';
  if (text.includes('控油') || text.includes('痘') || text.includes('水杨酸') || text.includes('粉刺')) return 'acne';
  if (text.includes('敏感') || text.includes('舒缓') || text.includes('修复') || text.includes('屏障')) return 'sensitive';
  if (text.includes('防晒') || text.includes('spf') || text.includes('紫外线')) return 'sunProtection';
  return 'hydration';
}

/**
 * 绑定建议卡片点击事件
 */
function bindAdviceCardClicks() {
  document.querySelectorAll('.advice-card--clickable').forEach(card => {
    card.addEventListener('click', (e) => {
      // 避免点击成分chip时触发
      if (e.target.classList.contains('chip')) return;
      
      const adviceType = card.dataset.adviceType;
      const adviceKey = card.dataset.adviceKey;
      const adviceContent = card.dataset.adviceContent ? decodeURIComponent(card.dataset.adviceContent) : '';
      const adviceExtra = card.dataset.adviceExtra ? JSON.parse(decodeURIComponent(card.dataset.adviceExtra)) : null;
      
      showAdviceDetail(adviceType, adviceKey, adviceContent, adviceExtra);
    });
  });
}

/**
 * 渲染侧面轮廓分析（标准版/专业版）
 */
function renderSideProfile(data) {
  const content = document.getElementById('side-profile-content');
  if (!content || !data) return;
  
  const html = `
    <div class="profile-analysis">
      <div class="profile-angles">
        <div class="profile-angle">
          <div class="metric-bar__label">面角</div>
          <div class="profile-angle__value">${data.facialAngle || '-'}°</div>
          <div class="profile-angle__ideal">理想: 81-83°</div>
        </div>
        <div class="profile-angle">
          <div class="metric-bar__label">鼻唇角</div>
          <div class="profile-angle__value">${data.nasolabialAngle || '-'}°</div>
          <div class="profile-angle__ideal">理想: 90-95°</div>
        </div>
        <div class="profile-angle">
          <div class="metric-bar__label">下颌角</div>
          <div class="profile-angle__value">${data.mandibularAngle || '-'}°</div>
          <div class="profile-angle__ideal">理想: 120-128°</div>
        </div>
        <div class="profile-angle">
          <div class="metric-bar__label">下巴突度</div>
          <div class="profile-angle__value">${data.mentProminence || '-'}</div>
          <div class="profile-angle__ideal">理想: 0~-2mm</div>
        </div>
      </div>
      ${data.profileType ? `
        <div class="metric-item" style="text-align: center;">
          <div class="metric-item__label">轮廓类型</div>
          <div class="metric-item__value">${data.profileType}</div>
        </div>
      ` : ''}
      ${data.comment ? `<p style="color: var(--color-text-secondary); margin-top: var(--spacing-sm); font-size: var(--font-size-caption);">${data.comment}</p>` : ''}
    </div>
  `;
  
  content.innerHTML = html;
}

/**
 * 渲染皮肤分析（标准版/专业版）
 */
function renderSkinAnalysis(data) {
  const content = document.getElementById('skin-analysis-content');
  if (!content || !data) return;
  
  const html = `
    <div class="skin-analysis">
      <div class="skin-overview">
        <div class="skin-stat">
          <div class="skin-stat__score">${data.overallScore || '-'}</div>
          <div class="skin-stat__label">综合肤质</div>
        </div>
        <div class="skin-stat">
          <div class="skin-stat__score">${data.textureScore || '-'}</div>
          <div class="skin-stat__label">肤质细腻</div>
        </div>
        <div class="skin-stat">
          <div class="skin-stat__score">${data.clarityScore || '-'}</div>
          <div class="skin-stat__label">清透度</div>
        </div>
        <div class="skin-stat">
          <div class="skin-stat__score">${data.luminosityScore || '-'}</div>
          <div class="skin-stat__label">光泽度</div>
        </div>
      </div>
      
      <div class="metrics-grid">
        ${data.pores ? `
          <div class="metric-item">
            <div class="metric-item__label">毛孔状态</div>
            <div class="metric-item__value">${getPoreLevel(data.pores)}</div>
          </div>
        ` : ''}
        ${data.wrinkles ? `
          <div class="metric-item">
            <div class="metric-item__label">纹理情况</div>
            <div class="metric-item__value">${getWrinkleLevel(data.wrinkles)}</div>
          </div>
        ` : ''}
        ${data.spots ? `
          <div class="metric-item">
            <div class="metric-item__label">色斑程度</div>
            <div class="metric-item__value">${getSpotLevel(data.spots)}</div>
          </div>
        ` : ''}
        ${data.acne ? `
          <div class="metric-item">
            <div class="metric-item__label">痘痘情况</div>
            <div class="metric-item__value">${getAcneLevel(data.acne)}</div>
          </div>
        ` : ''}
      </div>
      
      ${data.skinAge ? `
        <div class="metric-item" style="margin-top: var(--spacing-sm); text-align: center;">
          <div class="metric-item__label">皮肤年龄评估</div>
          <div class="metric-item__value" style="font-size: var(--font-size-xl);">${data.skinAge} 岁</div>
        </div>
      ` : ''}
    </div>
  `;
  
  content.innerHTML = html;
}

// 肤质等级辅助函数
function getPoreLevel(score) {
  if (score >= 8) return '几乎无可见毛孔';
  if (score >= 6) return '毛孔细小';
  if (score >= 4) return '部分区域毛孔可见';
  return '毛孔较明显';
}

function getWrinkleLevel(score) {
  if (score >= 8) return '光滑无纹';
  if (score >= 6) return '极少细纹';
  if (score >= 4) return '有表情纹';
  return '明显皱纹';
}

function getSpotLevel(score) {
  if (score >= 8) return '肤色均匀';
  if (score >= 6) return '极少色斑';
  if (score >= 4) return '轻度色沉';
  return '明显色斑';
}

function getAcneLevel(score) {
  if (score >= 8) return '无痘肌';
  if (score >= 6) return '偶发痘痘';
  if (score >= 4) return '轻度痘痘';
  return '需要关注';
}

/**
 * 渲染幼态系统分析（仅专业版）
 */
function renderNeotenSystem(data) {
  const content = document.getElementById('neoteny-content');
  if (!content || !data) return;
  
  const html = `
    <div class="neoteny-section">
      <div class="neoteny-score">
        <div class="neoteny-score__value">${data.score || '-'}</div>
        <div class="neoteny-score__label">幼态综合指数</div>
        ${data.level ? `<span class="rating-tag rating-tag--${getRatingClass(data.score)}">${data.level}</span>` : ''}
      </div>
      
      <div class="neoteny-indicators">
        ${data.eyeRatio ? `
          <div class="neoteny-indicator">
            <div class="neoteny-indicator__name">眼部比例</div>
            <div class="neoteny-indicator__score">${data.eyeRatio}/10</div>
          </div>
        ` : ''}
        ${data.faceRoundness ? `
          <div class="neoteny-indicator">
            <div class="neoteny-indicator__name">面部丰盈度</div>
            <div class="neoteny-indicator__score">${data.faceRoundness}/10</div>
          </div>
        ` : ''}
        ${data.foreheadRatio ? `
          <div class="neoteny-indicator">
            <div class="neoteny-indicator__name">额部比例</div>
            <div class="neoteny-indicator__score">${data.foreheadRatio}/10</div>
          </div>
        ` : ''}
        ${data.noseBridge ? `
          <div class="neoteny-indicator">
            <div class="neoteny-indicator__name">鼻梁高度</div>
            <div class="neoteny-indicator__score">${data.noseBridge}/10</div>
          </div>
        ` : ''}
        ${data.lipFullness ? `
          <div class="neoteny-indicator">
            <div class="neoteny-indicator__name">唇部丰满度</div>
            <div class="neoteny-indicator__score">${data.lipFullness}/10</div>
          </div>
        ` : ''}
        ${data.skinTexture ? `
          <div class="neoteny-indicator">
            <div class="neoteny-indicator__name">肌肤质感</div>
            <div class="neoteny-indicator__score">${data.skinTexture}/10</div>
          </div>
        ` : ''}
      </div>
      
      ${data.analysis ? `<p style="color: var(--color-text-secondary); margin-top: var(--spacing-md); font-size: var(--font-size-caption); line-height: 1.6;">${data.analysis}</p>` : ''}
    </div>
  `;
  
  content.innerHTML = html;
}

// 获取评级样式类
function getRatingClass(score) {
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'average';
  return 'poor';
}

/**
 * 渲染3D立体感分析（仅专业版）
 */
function renderDefinition3D(data) {
  const content = document.getElementById('definition3d-content');
  if (!content || !data) return;
  
  const html = `
    <div class="definition3d-section">
      <div class="definition3d-overview">
        <div class="definition3d-score">
          <div class="definition3d-score__value">${data.score || '-'}</div>
          <div class="definition3d-score__label">立体指数</div>
        </div>
        <div class="definition3d-details">
          ${data.browBone ? `
            <div class="definition3d-item">
              <span class="definition3d-item__label">眉骨:</span>
              <span class="definition3d-item__value">${data.browBone}/10</span>
            </div>
          ` : ''}
          ${data.cheekbone ? `
            <div class="definition3d-item">
              <span class="definition3d-item__label">颧骨:</span>
              <span class="definition3d-item__value">${data.cheekbone}/10</span>
            </div>
          ` : ''}
          ${data.noseBridge ? `
            <div class="definition3d-item">
              <span class="definition3d-item__label">鼻梁:</span>
              <span class="definition3d-item__value">${data.noseBridge}/10</span>
            </div>
          ` : ''}
          ${data.jawline ? `
            <div class="definition3d-item">
              <span class="definition3d-item__label">下颌:</span>
              <span class="definition3d-item__value">${data.jawline}/10</span>
            </div>
          ` : ''}
          ${data.lightShadow ? `
            <div class="definition3d-item">
              <span class="definition3d-item__label">光影对比:</span>
              <span class="definition3d-item__value">${data.lightShadow}/10</span>
            </div>
          ` : ''}
          ${data.depthRatio ? `
            <div class="definition3d-item">
              <span class="definition3d-item__label">深度比:</span>
              <span class="definition3d-item__value">${data.depthRatio}/10</span>
            </div>
          ` : ''}
        </div>
      </div>
      
      ${data.analysis ? `<p style="color: var(--color-text-secondary); margin-top: var(--spacing-md); font-size: var(--font-size-caption); line-height: 1.6;">${data.analysis}</p>` : ''}
    </div>
  `;
  
  content.innerHTML = html;
}

/**
 * 渲染医美精准参考（仅专业版）
 */
function renderAestheticReference(data) {
  const content = document.getElementById('aesthetic-ref-content');
  if (!content || !data) return;
  
  const suggestions = Array.isArray(data) ? data : (data.suggestions || []);
  
  if (suggestions.length === 0) {
    content.innerHTML = '<p style="color: var(--color-text-tertiary); text-align: center;">暂无针对性建议</p>';
    return;
  }
  
  const html = `
    <div class="aesthetic-ref">
      ${suggestions.map((suggestion, i) => `
        <div class="aesthetic-suggestion animate-fade-in-up stagger-delay-${i + 1}">
          <div class="aesthetic-suggestion__title">
            ${suggestion.area || suggestion.title || '优化项目'}
            ${suggestion.priority ? `<span class="aesthetic-suggestion__priority aesthetic-suggestion__priority--${suggestion.priority}">${getPriorityLabel(suggestion.priority)}</span>` : ''}
          </div>
          <div class="aesthetic-suggestion__desc">${suggestion.description || suggestion.desc || ''}</div>
          ${suggestion.methods && suggestion.methods.length > 0 ? `
            <div class="aesthetic-suggestion__methods">
              <div class="aesthetic-suggestion__methods-title">可选方案:</div>
              ${suggestion.methods.map(m => `<span class="aesthetic-method">${m}</span>`).join('')}
            </div>
          ` : ''}
          ${suggestion.expectedImprovement ? `
            <div style="margin-top: var(--spacing-xs); font-size: 11px; color: var(--color-primary);">
              预期提升: +${suggestion.expectedImprovement} 分
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
  
  content.innerHTML = html;
}

// 获取优先级标签
function getPriorityLabel(priority) {
  const labels = {
    'high': '高优先级',
    'medium': '中优先级',
    'low': '低优先级'
  };
  return labels[priority] || priority;
}

/**
 * 提取成分关键词
 */
function extractIngredients(text) {
  const knownIngredients = Object.keys(INGREDIENT_DATABASE);
  const found = [];
  
  knownIngredients.forEach(ing => {
    if (text.includes(ing)) {
      found.push(ing);
    }
  });
  
  return found;
}

/**
 * 检测脸型
 */
function detectFaceShape(result) {
  const faceShape = result.dimensions?.faceShape?.score || result.dimensions?.faceShape || 6;
  // 简化逻辑：基于分数推断
  if (faceShape >= 7.5) return 'oval';
  if (faceShape >= 6.5) return 'diamond';
  if (faceShape >= 5.5) return 'round';
  if (faceShape >= 4.5) return 'square';
  return 'long';
}

/**
 * 检测眼型
 */
function detectEyeType(result) {
  const eyeType = result.dimensions?.eyeType?.score || result.dimensions?.eyeType || 6;
  // 简化逻辑
  if (eyeType >= 7.5) return 'almond';
  if (eyeType >= 6.5) return 'inner-double';
  if (eyeType >= 5.5) return 'droopy';
  if (eyeType >= 4.5) return 'small';
  return 'monolid';
}

/**
 * 生成基于得分的医美建议
 */
function generateAestheticAdvice(result) {
  const dims = result.dimensions;
  const cards = [];
  
  Object.entries(AESTHETIC_PROCEDURES).forEach(([key, procedure]) => {
    const score = dims[key]?.score || dims[key] || 6;
    if (score < procedure.trigger) {
      cards.push(`
        <div class="advice-card advice-card--aesthetic advice-card--clickable animate-fade-in-up"
             data-advice-type="aesthetic"
             data-advice-key="${key}">
          <div class="advice-card__header">
            <span class="advice-card__icon">💉</span>
            <span class="advice-card__title">${procedure.name}</span>
          </div>
          <div class="advice-card__content">
            ${procedure.description}
          </div>
          <div class="advice-card__meta">
            <div class="advice-card__improvement advice-card__improvement--aesthetic">
              <span>📈</span>
              <span>预计 +${procedure.improvement.score} 分</span>
            </div>
            <span class="advice-card__time">⏱️ ${procedure.improvement.time}</span>
            <span class="advice-card__arrow">▶</span>
          </div>
        </div>
      `);
    }
  });
  
  return cards.join('');
}

/**
 * 显示建议详情弹窗
 */
function showAdviceDetail(adviceType, adviceKey, adviceContent, adviceExtra) {
  const modal = document.getElementById('advice-detail-modal');
  const iconEl = document.getElementById('advice-detail-icon');
  const titleEl = document.getElementById('advice-detail-title');
  const improvementEl = document.getElementById('advice-detail-improvement');
  const summaryEl = document.getElementById('advice-detail-summary');
  const infoEl = document.getElementById('advice-detail-info');
  const scheduleSection = document.getElementById('advice-detail-schedule');
  const scheduleContent = document.getElementById('advice-detail-schedule-content');
  const ingredientsSection = document.getElementById('advice-detail-ingredients');
  const ingredientsList = document.getElementById('advice-detail-ingredients-list');
  const proceduresSection = document.getElementById('advice-detail-procedures');
  const procedureListEl = document.getElementById('advice-detail-procedure-list');
  const cautionEl = document.getElementById('advice-detail-caution');
  const calendarBtn = document.getElementById('add-to-calendar-btn');
  
  if (!modal) return;
  
  // 重置所有区域
  scheduleSection.style.display = 'none';
  ingredientsSection.style.display = 'none';
  proceduresSection.style.display = 'none';
  cautionEl.style.display = 'none';
  calendarBtn.style.display = 'none';
  
  // 存储当前建议数据用于日历
  state.currentAdviceData = null;
  
  // 根据类型获取相应数据
  let data = null;
  
  if (adviceType === 'skincare') {
    data = SKINCARE_ADVICE_TEMPLATES[adviceKey];
    if (data) {
      iconEl.textContent = data.icon;
      titleEl.textContent = data.title;
      improvementEl.innerHTML = `📈 预计提升 <strong>+${data.improvement.score}</strong> 分 · ${data.improvement.time}`;
      summaryEl.textContent = adviceContent || data.detailedInfo;
      infoEl.textContent = data.detailedInfo;
      
      // 显示护肤时刻表
      if (data.schedule) {
        scheduleSection.style.display = 'block';
        scheduleContent.innerHTML = renderSkincareSchedule(data.schedule);
        
        // 显示日历按钮
        calendarBtn.style.display = 'inline-flex';
        state.currentAdviceData = { type: 'skincare', key: adviceKey, data };
      }
      
      // 显示关键成分
      if (data.keyIngredients && data.keyIngredients.length > 0) {
        ingredientsSection.style.display = 'block';
        ingredientsList.innerHTML = data.keyIngredients.map(ing => 
          `<span class="ingredient-tag">${ing}</span>`
        ).join('');
      }
    }
  } else if (adviceType === 'makeup') {
    data = MAKEUP_ADVICE_TEMPLATES[adviceKey];
    if (data && adviceExtra) {
      iconEl.textContent = data.icon;
      titleEl.textContent = data.title + ' · ' + adviceExtra.name;
      improvementEl.innerHTML = `👁️ 视觉效果 <strong>+${data.improvement.visualScore}</strong> 分 · ${data.improvement.time}`;
      
      // 构建摘要
      let summary = '';
      if (adviceKey === 'contour') {
        summary = `修容: ${adviceExtra.contour}\n腮红: ${adviceExtra.blush}\n高光: ${adviceExtra.highlight}`;
      } else if (adviceKey === 'eyeMakeup') {
        summary = `眼影: ${adviceExtra.eyeshadow}\n眼线: ${adviceExtra.eyeliner}`;
      }
      summaryEl.textContent = summary;
      infoEl.textContent = data.detailedInfo;
      
      // 显示避雷
      if (adviceExtra.avoid) {
        cautionEl.textContent = '避雷: ' + adviceExtra.avoid;
        cautionEl.style.display = 'block';
      }
    }
  } else if (adviceType === 'aesthetic') {
    data = AESTHETIC_PROCEDURES[adviceKey];
    if (data) {
      iconEl.textContent = '💉';
      titleEl.textContent = data.name;
      improvementEl.innerHTML = `📈 预计提升 <strong>+${data.improvement.score}</strong> 分 · ${data.improvement.time}`;
      summaryEl.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>适合人群：</strong>${data.suitable}</div>
        <div><strong>恢复期参考：</strong>${data.recovery}</div>
      `;
      infoEl.textContent = data.detailedInfo;
      
      // 显示推荐项目
      if (data.procedures && data.procedures.length > 0) {
        proceduresSection.style.display = 'block';
        procedureListEl.innerHTML = data.procedures.map(p => 
          `<span class="advice-detail__procedure">${p}</span>`
        ).join('');
      }
      
      // 显示注意事项
      cautionEl.textContent = data.caution;
      cautionEl.style.display = 'block';
    }
  } else if (adviceType === 'makeup-ai' || adviceType === 'aesthetic-ai') {
    // AI生成的建议
    iconEl.textContent = adviceType === 'makeup-ai' ? '💄' : '💉';
    titleEl.textContent = adviceType === 'makeup-ai' ? '彩妆技巧详解' : '医美建议详解';
    improvementEl.innerHTML = adviceType === 'makeup-ai' 
      ? '👁️ 视觉提升 · 即时见效' 
      : '✨ 专业参考信息';
    summaryEl.textContent = adviceContent;
    infoEl.textContent = adviceType === 'makeup-ai' 
      ? '以上为AI根据您的面部特征生成的个性化彩妆建议。建议根据自身肤质和习惯进行调整，可以搭配专业彩妆产品使用。'
      : '以上为AI根据您的面部特征生成的医美参考建议。此内容仅供科普参考，不构成医疗诊断或手术推荐。';
    cautionEl.textContent = adviceType === 'aesthetic-ai' 
      ? '请在正规持牌医疗机构咨询执业医师后再做决定。' 
      : '';
    cautionEl.style.display = adviceType === 'aesthetic-ai' ? 'block' : 'none';
  }
  
  // 显示弹窗
  modal.classList.add('modal-overlay--visible');
  modal.querySelector('.modal')?.classList.add('modal--visible');
}

/**
 * 渲染护肤时刻表HTML
 */
function renderSkincareSchedule(schedule) {
  let html = '';
  
  // 早间护理
  if (schedule.morning) {
    html += `
      <div class="schedule-block">
        <div class="schedule-block__header">
          <span class="schedule-block__title">🌅 早间护理</span>
          <span class="schedule-block__time">${schedule.morning.time}</span>
        </div>
        <div class="schedule-block__steps">
          ${schedule.morning.steps.map(step => `
            <div class="schedule-step">
              <span class="schedule-step__time">${step.time}</span>
              <span class="schedule-step__action">${step.action}</span>
              <span class="schedule-step__duration">${step.duration}分钟</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // 晚间护理
  if (schedule.evening) {
    html += `
      <div class="schedule-block">
        <div class="schedule-block__header">
          <span class="schedule-block__title">🌙 晚间护理</span>
          <span class="schedule-block__time">${schedule.evening.time}</span>
        </div>
        <div class="schedule-block__steps">
          ${schedule.evening.steps.map(step => `
            <div class="schedule-step">
              <span class="schedule-step__time">${step.time}</span>
              <span class="schedule-step__action">${step.action}</span>
              <span class="schedule-step__duration">${step.duration}分钟</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // 日间补涂（防晒专用）
  if (schedule.daytime) {
    html += `
      <div class="schedule-block">
        <div class="schedule-block__header">
          <span class="schedule-block__title">☀️ 日间补涂</span>
          <span class="schedule-block__time">${schedule.daytime.time}</span>
        </div>
        <div class="schedule-block__steps">
          ${schedule.daytime.steps.map(step => `
            <div class="schedule-step">
              <span class="schedule-step__time">${step.time}</span>
              <span class="schedule-step__action">${step.action}</span>
              <span class="schedule-step__duration">${step.duration}分钟</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // 每周特殊护理
  if (schedule.weekly && schedule.weekly.length > 0) {
    html += `
      <div class="schedule-weekly">
        <div class="schedule-weekly__title">📅 每周特殊护理</div>
        ${schedule.weekly.map(item => `
          <div class="schedule-weekly__item">
            <span class="schedule-weekly__day">${item.day}</span>
            <span>${item.action}</span>
            <span>${item.time}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // 小贴士
  if (schedule.tips && schedule.tips.length > 0) {
    html += `
      <div class="schedule-weekly" style="background: rgba(201, 169, 110, 0.08); border-color: rgba(201, 169, 110, 0.2);">
        <div class="schedule-weekly__title" style="color: var(--color-primary);">💡 小贴士</div>
        ${schedule.tips.map(tip => `
          <div class="schedule-weekly__item">
            <span>• ${tip}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  return html;
}

/**
 * 添加护肤计划到日历
 */
async function addSkincareToCalendar() {
  if (!state.currentAdviceData || state.currentAdviceData.type !== 'skincare') {
    showToast('无可用的护肤计划', 'error');
    return;
  }
  
  const { key, data } = state.currentAdviceData;
  
  // 生成ICS日历文件
  const events = generateCalendarEvents(data);
  
  // 创建ICS文件内容
  const icsContent = generateICSFile(data.title, events);
  
  // 下载ICS文件
  downloadICSFile(icsContent, `顔鉴护肤计划_${data.title}.ics`);
  
  showToast('护肤计划已生成，请打开下载的文件添加到日历', 'success');
}

/**
 * 生成日历事件数据
 */
function generateCalendarEvents(data) {
  const events = [];
  const today = new Date();
  const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天计划
  
  // 早间护理事件
  if (data.schedule?.morning) {
    const [startHour, startMinute] = data.schedule.morning.time.split('-')[0].split(':').map(Number);
    events.push({
      title: `🌅 ${data.title} - 早间护理`,
      description: data.schedule.morning.steps.map(s => `${s.time} ${s.action}`).join('\\n'),
      startHour,
      startMinute,
      duration: 30,
      recurrence: 'DAILY',
      endDate
    });
  }
  
  // 晚间护理事件
  if (data.schedule?.evening) {
    const [startHour, startMinute] = data.schedule.evening.time.split('-')[0].split(':').map(Number);
    events.push({
      title: `🌙 ${data.title} - 晚间护理`,
      description: data.schedule.evening.steps.map(s => `${s.time} ${s.action}`).join('\\n'),
      startHour,
      startMinute,
      duration: 30,
      recurrence: 'DAILY',
      endDate
    });
  }
  
  return events;
}

/**
 * 生成ICS文件内容
 */
function generateICSFile(planTitle, events) {
  const now = new Date();
  const formatDate = (date, hour = 0, minute = 0) => {
    const d = new Date(date);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//顔鉴//护肤计划//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:顔鉴护肤计划 - ${planTitle}
`;

  events.forEach((event, index) => {
    const startDate = formatDate(now, event.startHour, event.startMinute);
    const endHour = event.startHour + Math.floor(event.duration / 60);
    const endMinute = event.startMinute + (event.duration % 60);
    const endDateStr = formatDate(now, endHour, endMinute);
    const untilDate = formatDate(event.endDate).split('T')[0] + 'T235959Z';
    
    ics += `
BEGIN:VEVENT
UID:facej-skincare-${index}-${Date.now()}@facej.app
DTSTAMP:${formatDate(now)}
DTSTART:${startDate}
DTEND:${endDateStr}
RRULE:FREQ=${event.recurrence};UNTIL=${untilDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
BEGIN:VALARM
TRIGGER:-PT10M
ACTION:DISPLAY
DESCRIPTION:护肤时间到！
END:VALARM
END:VEVENT
`;
  });

  ics += `END:VCALENDAR`;
  return ics;
}

/**
 * 下载ICS文件
 */
function downloadICSFile(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 关闭建议详情弹窗
 */
function closeAdviceDetail() {
  const modal = document.getElementById('advice-detail-modal');
  if (modal) {
    modal.classList.remove('modal-overlay--visible');
    modal.querySelector('.modal')?.classList.remove('modal--visible');
  }
}

/**
 * 解锁医美内容
 */
function unlockAesthetic() {
  state.aestheticUnlocked = true;
  sessionStorage.setItem('aesthetic_unlocked', 'true');
  
  const aestheticContent = document.getElementById('aesthetic-content');
  const blurContent = aestheticContent?.querySelector('.aesthetic-unlock__blur');
  const overlay = aestheticContent?.querySelector('.aesthetic-unlock__overlay');
  
  if (blurContent && overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      blurContent.classList.remove('aesthetic-unlock__blur');
      blurContent.parentElement.classList.remove('aesthetic-unlock');
    }, 300);
  }
}

/**
 * 切换报告地区
 */
function switchReportRegion(region) {
  if (!state.analysisResult) return;
  
  state.selectedRegion = region;
  
  // 更新标签高亮
  elements.reportRegions.forEach(tag => {
    tag.classList.toggle('region-tag--active', tag.dataset.region === region);
  });
  
  // 重新计算总分
  const newTotal = calculateTotalScore(state.analysisResult.dimensions, region);
  
  // 更新分数动画
  animateScore(newTotal);
  
  // 更新段位
  const rank = getRankByScore(newTotal);
  if (elements.reportRank) {
    elements.reportRank.innerHTML = `${rank.symbol} ${rank.label}`;
    elements.reportRank.style.color = rank.color;
  }
}

/**
 * 切换 Tab
 */
function switchTab(tabName) {
  // 更新 Tab 高亮
  elements.tabBar?.querySelectorAll('.tab-bar__item').forEach(item => {
    item.classList.toggle('tab-bar__item--active', item.dataset.tab === tabName);
  });
  
  // 更新指示器位置
  const activeTab = elements.tabBar?.querySelector('.tab-bar__item--active');
  const indicator = elements.tabBar?.querySelector('.tab-bar__indicator');
  if (activeTab && indicator) {
    indicator.style.left = `${activeTab.offsetLeft}px`;
    indicator.style.width = `${activeTab.offsetWidth}px`;
  }
  
  // 切换内容
  elements.tabContents.forEach(content => {
    const isActive = content.dataset.tab === tabName;
    content.style.display = isActive ? 'block' : 'none';
    if (isActive) {
      content.classList.add('animate-fade-in-up');
    }
  });
}

/**
 * 切换页面
 */
function switchScreen(screenName) {
  state.currentScreen = screenName;
  
  Object.entries(elements.screens).forEach(([name, el]) => {
    el?.classList.toggle('active', name === screenName);
  });
}

/**
 * 返回上一页
 */
function goBack() {
  switch (state.currentScreen) {
    case 'analyzing':
    case 'report':
      switchScreen('landing');
      break;
    case 'share':
      switchScreen('report');
      break;
    case 'pk':
      switchScreen('report');
      break;
    case 'profile':
      switchScreen('landing');
      break;
  }
}

/**
 * 显示维度详情
 */
function showDimensionDetail(key, data) {
  const dimInfo = DIMENSIONS[key];
  showToast(`${dimInfo.name}: ${data.score.toFixed(1)} 分 - ${data.comment}`, 'info');
}

/**
 * 显示 Toast
 */
function showToast(message, type = 'info') {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  
  if (!elements.toast) return;
  
  elements.toast.innerHTML = `
    <span class="toast__icon">${config.icon}</span>
    <span class="toast__message">${message}</span>
  `;
  elements.toast.className = `toast toast--${type} toast--visible`;
  
  setTimeout(() => {
    elements.toast.classList.remove('toast--visible');
  }, config.duration);
}

/**
 * 显示 API Key 模态框
 */
function showApiKeyModal() {
  elements.apiKeyModal?.classList.add('modal-overlay--visible');
  elements.apiKeyModal?.querySelector('.modal')?.classList.add('modal--visible');
}

/**
 * 关闭 API Key 模态框
 */
function closeApiKeyModal() {
  elements.apiKeyModal?.classList.remove('modal-overlay--visible');
  elements.apiKeyModal?.querySelector('.modal')?.classList.remove('modal--visible');
}

/**
 * 保存 API Key
 */
function saveApiKey() {
  const key = elements.apiKeyInput?.value?.trim();
  
  if (!key) {
    showToast('请输入 API Key', 'warning');
    return;
  }
  
  if (!validateApiKey(key)) {
    showToast('API Key 格式不正确', 'error');
    elements.apiKeyInput?.parentElement?.classList.add('api-key-input--error');
    return;
  }
  
  setApiKey(key);
  elements.apiKeyInput?.parentElement?.classList.remove('api-key-input--error');
  closeApiKeyModal();
  showToast('API Key 已保存', 'success');
}

// ========== 个人中心功能 ==========

/**
 * 打开个人中心
 */
async function openProfile() {
  switchScreen('profile');
  
  // 渲染历史时间线
  const timeline = document.getElementById('history-timeline');
  if (timeline) {
    await renderHistoryTimeline(timeline);
  }
  
  // 渲染趋势图
  const canvas = document.getElementById('score-trend-canvas');
  if (canvas) {
    await renderTrendChart(canvas);
  }
  
  // 渲染打卡网格
  const checkinGrid = document.getElementById('checkin-grid');
  if (checkinGrid) {
    const { todayChecked } = await renderCheckinGrid(checkinGrid);
    
    // 更新打卡按钮状态
    const checkinBtn = document.getElementById('checkin-btn');
    if (checkinBtn) {
      checkinBtn.disabled = todayChecked;
      checkinBtn.textContent = todayChecked ? '已打卡' : '打卡';
    }
  }
  
  // 更新连续打卡天数
  const streak = await getCheckinStreak();
  const streakEl = document.querySelector('#checkin-streak span');
  if (streakEl) {
    streakEl.textContent = streak;
  }
  
  // 更新今日任务
  const task = getTodayTask();
  const taskIcon = document.querySelector('.profile__task-icon');
  const taskText = document.querySelector('.profile__task-text');
  if (taskIcon) taskIcon.textContent = task.icon;
  if (taskText) taskText.textContent = `今日任务：${task.task}`;
}

/**
 * 处理打卡
 */
async function handleCheckin() {
  try {
    await checkin();
    showToast('打卡成功！', 'success');
    
    // 刷新打卡网格
    const checkinGrid = document.getElementById('checkin-grid');
    if (checkinGrid) {
      await renderCheckinGrid(checkinGrid);
    }
    
    // 更新按钮
    const checkinBtn = document.getElementById('checkin-btn');
    if (checkinBtn) {
      checkinBtn.disabled = true;
      checkinBtn.textContent = '已打卡';
    }
    
    // 更新连续天数
    const streak = await getCheckinStreak();
    const streakEl = document.querySelector('#checkin-streak span');
    if (streakEl) {
      streakEl.textContent = streak;
    }
    
    // 检查成就
    if (streak === 7) {
      showToast('🎁 恭喜解锁进阶彩妆教程！', 'success');
    } else if (streak === 30) {
      showToast('🏆 恭喜解锁复测优先通道！', 'success');
    }
  } catch (e) {
    showToast('打卡失败，请重试', 'error');
  }
}

/**
 * 加载历史记录
 */
async function loadHistoryRecord(id) {
  const { getHistoryById } = await import('./profile.js');
  const record = await getHistoryById(id);
  
  if (record) {
    state.analysisResult = record;
    state.imageBase64 = record.photo;
    
    switchScreen('report');
    renderReport(record);
  }
}

// ========== 成分知识 Tooltip ==========

/**
 * 显示成分知识 Tooltip
 */
function showIngredientTooltip(ingredientName) {
  const info = INGREDIENT_DATABASE[ingredientName];
  if (!info) return;
  
  const tooltip = document.getElementById('ingredient-tooltip');
  if (!tooltip) return;
  
  document.getElementById('ingredient-name').textContent = info.name;
  document.getElementById('ingredient-name-en').textContent = info.nameEn;
  document.getElementById('ingredient-effect').textContent = info.effect;
  document.getElementById('ingredient-concentration').textContent = info.concentration;
  document.getElementById('ingredient-caution').textContent = info.caution;
  
  tooltip.classList.add('ingredient-tooltip--visible');
}

/**
 * 隐藏成分知识 Tooltip
 */
function hideIngredientTooltip() {
  const tooltip = document.getElementById('ingredient-tooltip');
  tooltip?.classList.remove('ingredient-tooltip--visible');
}

// ========== PK 功能 ==========

/**
 * 检查 PK 链接
 */
function checkPKLink() {
  const params = new URLSearchParams(window.location.search);
  const pkToken = params.get('pk');
  
  if (pkToken) {
    try {
      const pkData = JSON.parse(atob(pkToken));
      state.pkChallenger = pkData;
      showToast('收到 PK 挑战！完成分析后查看结果', 'info');
    } catch (e) {
      console.warn('Invalid PK token');
    }
  }
}

/**
 * 生成 PK 链接
 */
function createPKLink() {
  if (!state.analysisResult || !state.imageBase64) {
    showToast('请先完成颜值分析', 'warning');
    return;
  }
  
  const pkData = {
    total: state.analysisResult.total,
    rank: state.analysisResult.rank,
    dimensions: state.analysisResult.dimensions,
    photo: state.imageBase64.substring(0, 500) + '...', // 缩略
    timestamp: Date.now()
  };
  
  const token = btoa(JSON.stringify(pkData));
  const pkLink = `${window.location.origin}${window.location.pathname}?pk=${token}`;
  
  document.getElementById('pk-link-input').value = pkLink;
  document.getElementById('pk-link-modal')?.classList.add('modal-overlay--visible');
  document.getElementById('pk-link-modal')?.querySelector('.modal')?.classList.add('modal--visible');
}

/**
 * 复制 PK 链接
 */
function copyPKLink() {
  const input = document.getElementById('pk-link-input');
  if (input) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('邀请链接已复制', 'success');
    }).catch(() => {
      input.select();
      document.execCommand('copy');
      showToast('邀请链接已复制', 'success');
    });
  }
}

/**
 * 关闭 PK 链接模态框
 */
function closePKLinkModal() {
  document.getElementById('pk-link-modal')?.classList.remove('modal-overlay--visible');
  document.getElementById('pk-link-modal')?.querySelector('.modal')?.classList.remove('modal--visible');
}

/**
 * 显示 PK 结果
 */
function showPKResult() {
  if (!state.pkChallenger || !state.analysisResult) return;
  
  switchScreen('pk');
  
  // 设置玩家 A（挑战者）
  const avatarA = document.getElementById('pk-avatar-a');
  const scoreA = document.getElementById('pk-score-a');
  const rankA = document.getElementById('pk-rank-a');
  
  // 设置玩家 B（当前用户）
  const avatarB = document.getElementById('pk-avatar-b');
  const scoreB = document.getElementById('pk-score-b');
  const rankB = document.getElementById('pk-rank-b');
  
  const rankInfoA = getRankByScore(state.pkChallenger.total);
  const rankInfoB = getRankByScore(state.analysisResult.total);
  
  if (scoreA) scoreA.textContent = state.pkChallenger.total.toFixed(1);
  if (rankA) rankA.textContent = `${rankInfoA.symbol} ${rankInfoA.label}`;
  
  if (avatarB) avatarB.src = state.imageBase64;
  if (scoreB) scoreB.textContent = state.analysisResult.total.toFixed(1);
  if (rankB) rankB.textContent = `${rankInfoB.symbol} ${rankInfoB.label}`;
  
  // 渲染维度对比
  renderPKDimensions();
  
  // 计算互补指数
  const compatibility = calculateCompatibility(state.pkChallenger, state.analysisResult);
  const compatEl = document.querySelector('#pk-compatibility span');
  if (compatEl) compatEl.textContent = `${compatibility}%`;
  
  // 生成评语
  const summary = generatePKSummary(state.pkChallenger, state.analysisResult);
  const summaryEl = document.getElementById('pk-summary');
  if (summaryEl) summaryEl.textContent = summary;
}

/**
 * 渲染 PK 维度对比
 */
function renderPKDimensions() {
  const container = document.getElementById('pk-dimensions-list');
  if (!container) return;
  
  const dimsA = state.pkChallenger.dimensions;
  const dimsB = state.analysisResult.dimensions;
  
  const html = Object.entries(DIMENSIONS).map(([key, info]) => {
    const scoreA = dimsA[key]?.score || dimsA[key] || 5;
    const scoreB = dimsB[key]?.score || dimsB[key] || 5;
    const total = scoreA + scoreB;
    const percentA = (scoreA / total * 100).toFixed(0);
    const percentB = (scoreB / total * 100).toFixed(0);
    
    let result = '平手';
    if (scoreA > scoreB + 0.3) result = 'A 占优';
    else if (scoreB > scoreA + 0.3) result = 'B 占优';
    
    return `
      <div class="pk__dimension-row">
        <div class="pk__dimension-name">${info.name}</div>
        <div class="pk__dimension-bars">
          <div class="pk__bar pk__bar--a" style="width: ${percentA}%"></div>
          <div class="pk__bar pk__bar--b" style="width: ${percentB}%"></div>
        </div>
        <div class="pk__dimension-result">${result}</div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

/**
 * 计算互补指数
 */
function calculateCompatibility(a, b) {
  const scoreDiff = Math.abs(a.total - b.total);
  const base = 100 - scoreDiff * 8;
  
  // 计算维度互补度
  let complementarity = 0;
  const dimsA = a.dimensions;
  const dimsB = b.dimensions;
  
  Object.keys(DIMENSIONS).forEach(key => {
    const scoreA = dimsA[key]?.score || dimsA[key] || 5;
    const scoreB = dimsB[key]?.score || dimsB[key] || 5;
    complementarity += Math.abs(scoreA - scoreB);
  });
  
  const bonus = complementarity * 0.5;
  return Math.min(99, Math.max(1, Math.round(base + bonus)));
}

/**
 * 生成 PK 评语
 */
function generatePKSummary(a, b) {
  const dimsA = a.dimensions;
  const dimsB = b.dimensions;
  
  // 找出各自优势维度
  let maxDiffA = { key: '', diff: 0 };
  let maxDiffB = { key: '', diff: 0 };
  
  Object.keys(DIMENSIONS).forEach(key => {
    const scoreA = dimsA[key]?.score || dimsA[key] || 5;
    const scoreB = dimsB[key]?.score || dimsB[key] || 5;
    const diff = scoreA - scoreB;
    
    if (diff > maxDiffA.diff) {
      maxDiffA = { key, diff };
    }
    if (-diff > maxDiffB.diff) {
      maxDiffB = { key, diff: -diff };
    }
  });
  
  const nameA = DIMENSIONS[maxDiffA.key]?.name || '优势';
  const nameB = DIMENSIONS[maxDiffB.key]?.name || '特点';
  
  return `A 的${nameA} × B 的${nameB}，是绝佳搭配！`;
}

// 导出供其他模块使用
export { state, showToast, switchScreen };
