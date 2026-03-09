/**
 * 顔鉴 · AI 颜值评分 H5
 * 分享卡片生成模块
 * Version: 1.0
 */

import { getRankByScore, SHARE_TEMPLATES } from './config.js';

/**
 * 生成分享卡片
 * @param {string} template - 模板类型 (black-gold/sakura/magazine)
 * @param {Object} userData - 用户数据
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function generateShareCard(template, userData) {
  const config = SHARE_TEMPLATES[template] || SHARE_TEMPLATES['black-gold'];
  
  // 创建临时容器
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: -9999px;
    width: 375px;
    height: 500px;
  `;
  
  // 根据模板生成 HTML
  container.innerHTML = getTemplateHTML(template, userData, config);
  document.body.appendChild(container);
  
  try {
    // 等待图片加载
    await waitForImages(container);
    
    // 使用 html2canvas 生成图片
    const canvas = await html2canvas(container.firstElementChild, {
      width: 375,
      height: 500,
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      logging: false
    });
    
    return canvas;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * 获取模板 HTML
 */
function getTemplateHTML(template, userData, config) {
  const rank = getRankByScore(userData.total);
  
  switch (template) {
    case 'sakura':
      return getSakuraTemplate(userData, rank);
    case 'magazine':
      return getMagazineTemplate(userData, rank);
    default:
      return getBlackGoldTemplate(userData, rank);
  }
}

/**
 * 黑金卡模板
 */
function getBlackGoldTemplate(userData, rank) {
  const topDimensions = userData.topDimensions || [];
  
  return `
    <div style="
      width: 375px;
      height: 500px;
      background: #0E0C0F;
      position: relative;
      font-family: 'Noto Serif SC', serif;
      overflow: hidden;
    ">
      <!-- Grain Overlay -->
      <div style="
        position: absolute;
        inset: 0;
        opacity: 0.06;
        background-image: url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\"/%3E%3C/svg%3E');
      "></div>
      
      <!-- Content -->
      <div style="position: relative; z-index: 1; padding: 40px 30px; height: 100%; display: flex; flex-direction: column; align-items: center;">
        <!-- Avatar -->
        <div style="
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 3px solid;
          border-image: linear-gradient(135deg, #C9A96E, #D4849A) 1;
          overflow: hidden;
          margin-bottom: 24px;
        ">
          <img src="${userData.photo}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        
        <!-- Rank & Score -->
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        ">
          <span style="color: ${rank.color}; font-size: 14px;">${rank.symbol}</span>
          <span style="
            color: ${rank.color};
            font-size: 18px;
            font-weight: 600;
          ">${rank.label}</span>
        </div>
        
        <div style="
          font-family: 'Cormorant Garamond', serif;
          font-size: 72px;
          font-weight: 300;
          color: #C9A96E;
          line-height: 1;
          margin-bottom: 8px;
        ">${userData.total.toFixed(1)}</div>
        
        <div style="
          color: #9A9090;
          font-size: 13px;
          margin-bottom: 24px;
        ">超过了 <span style="color: #C9A96E; font-weight: 600;">${userData.percentile}%</span> 的用户</div>
        
        <!-- Divider -->
        <div style="
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin-bottom: 20px;
        "></div>
        
        <!-- Top Dimensions -->
        <div style="width: 100%;">
          ${topDimensions.map(d => `
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;
            ">
              <div style="color: #9A9090; font-size: 12px; width: 70px;">${d.name}</div>
              <div style="flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
                <div style="width: ${(d.score / 9 * 100).toFixed(0)}%; height: 100%; background: #C9A96E; border-radius: 2px;"></div>
              </div>
              <div style="color: #C9A96E; font-size: 12px; font-family: 'Cormorant Garamond', serif; font-weight: 600;">${d.score.toFixed(1)}</div>
            </div>
          `).join('')}
        </div>
        
        <!-- Footer -->
        <div style="
          margin-top: auto;
          text-align: center;
          color: #6B6570;
          font-size: 11px;
        ">
          顔鉴 · AI 东亚颜值分析
        </div>
      </div>
    </div>
  `;
}

/**
 * 樱花卡模板
 */
function getSakuraTemplate(userData, rank) {
  return `
    <div style="
      width: 375px;
      height: 500px;
      background: linear-gradient(135deg, #FDF0F4 0%, #FFF8F0 100%);
      position: relative;
      font-family: 'Noto Serif SC', serif;
      overflow: hidden;
    ">
      <!-- Sakura Decorations -->
      <div style="position: absolute; top: 20px; left: 20px; font-size: 24px; opacity: 0.4;">🌸</div>
      <div style="position: absolute; top: 60px; right: 40px; font-size: 16px; opacity: 0.3;">🌸</div>
      <div style="position: absolute; bottom: 80px; left: 30px; font-size: 20px; opacity: 0.35;">🌸</div>
      <div style="position: absolute; bottom: 40px; right: 25px; font-size: 18px; opacity: 0.3;">🌸</div>
      
      <!-- Content -->
      <div style="position: relative; z-index: 1; padding: 50px 30px; height: 100%; display: flex; flex-direction: column; align-items: center;">
        <!-- Avatar -->
        <div style="
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 3px solid #D4849A;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(212, 132, 154, 0.2);
        ">
          <img src="${userData.photo}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        
        <!-- Score -->
        <div style="
          font-family: 'Cormorant Garamond', serif;
          font-size: 64px;
          font-weight: 300;
          color: #D4849A;
          line-height: 1;
          margin-bottom: 8px;
        ">${userData.total.toFixed(1)}</div>
        
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(212, 132, 154, 0.1);
          border: 1px solid rgba(212, 132, 154, 0.3);
          border-radius: 4px;
          margin-bottom: 20px;
        ">
          <span style="color: #D4849A; font-size: 12px;">${rank.symbol}</span>
          <span style="color: #D4849A; font-size: 14px; font-weight: 600;">${rank.label}</span>
        </div>
        
        <!-- Summary -->
        <div style="
          color: #8A7070;
          font-size: 13px;
          text-align: center;
          line-height: 1.7;
          padding: 0 20px;
          margin-bottom: 20px;
        ">${userData.summary || '颜值出众，气质动人'}</div>
        
        <!-- Star Match -->
        <div style="
          color: #B0A0A0;
          font-size: 12px;
        ">✨ ${userData.starMatch || '气质独特'}</div>
        
        <!-- Footer -->
        <div style="
          margin-top: auto;
          text-align: center;
          color: #C0B0B0;
          font-size: 11px;
        ">
          顔鉴 · AI 东亚颜值分析
        </div>
      </div>
    </div>
  `;
}

/**
 * 杂志卡模板
 */
function getMagazineTemplate(userData, rank) {
  return `
    <div style="
      width: 375px;
      height: 500px;
      background: #FAF7F4;
      position: relative;
      font-family: 'Noto Serif SC', serif;
      overflow: hidden;
    ">
      <!-- Photo Area (Top 60%) -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 60%;
        background: #0E0C0F;
      ">
        <img src="${userData.photo}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" />
        
        <!-- Magazine Label -->
        <div style="
          position: absolute;
          top: 16px;
          left: 16px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 10px;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.6);
        ">FACE AESTHETICS 2025</div>
      </div>
      
      <!-- Diagonal Divider -->
      <svg style="position: absolute; top: 55%; left: 0; width: 100%; height: 10%;" viewBox="0 0 375 50" preserveAspectRatio="none">
        <path d="M0 50 L375 0 L375 50 Z" fill="#FAF7F4"/>
      </svg>
      
      <!-- Content Area (Bottom) -->
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40%;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
      ">
        <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
          <div style="
            font-family: 'Cormorant Garamond', serif;
            font-size: 48px;
            font-weight: 300;
            color: #1A1A1A;
            line-height: 1;
          ">${userData.total.toFixed(1)}</div>
          
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            background: rgba(26,26,26,0.05);
            border-radius: 3px;
          ">
            <span style="font-size: 10px;">${rank.symbol}</span>
            <span style="font-size: 12px; font-weight: 500; color: #1A1A1A;">${rank.label}</span>
          </div>
        </div>
        
        <div style="
          color: #6A6A6A;
          font-size: 12px;
          line-height: 1.6;
          flex: 1;
        ">${userData.summary || '您的颜值分析报告'}</div>
        
        <!-- Footer -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(0,0,0,0.08);
        ">
          <div style="color: #9A9A9A; font-size: 10px;">顔鉴 · AI 东亚颜值分析</div>
          <div style="color: #9A9A9A; font-size: 10px;">超过 ${userData.percentile}% 用户</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 等待图片加载
 */
function waitForImages(container) {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = resolve; // 即使加载失败也继续
    });
  });
  return Promise.all(promises);
}

/**
 * 下载分享卡片
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 */
export function downloadShareCard(canvas, filename = null) {
  const link = document.createElement('a');
  link.download = filename || `顔鉴_颜值报告_${Date.now()}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 0.92);
  link.click();
}

/**
 * 分享到社交媒体（Web Share API）
 * @param {HTMLCanvasElement} canvas
 * @param {Object} shareData
 */
export async function shareToSocial(canvas, shareData = {}) {
  if (!navigator.share) {
    console.warn('Web Share API not supported');
    return false;
  }
  
  try {
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92);
    });
    
    const file = new File([blob], '顔鉴_颜值报告.jpg', { type: 'image/jpeg' });
    
    await navigator.share({
      title: shareData.title || '顔鉴 · 我的颜值报告',
      text: shareData.text || '来看看我的颜值分析结果吧！',
      files: [file]
    });
    
    return true;
  } catch (error) {
    console.error('Share failed:', error);
    return false;
  }
}

export default { generateShareCard, downloadShareCard, shareToSocial };
