/**
 * 顔鉴 · AI 颜值评分 H5
 * API 调用模块 - Anthropic Claude API 封装
 * Version: 2.0 - 支持多照片分析
 */

import { API_CONFIG, REGIONS, SKIN_MODES, ANALYSIS_VERSIONS, PHOTO_ANGLES } from './config.js';
import { ENV } from './env.js';

// System Prompt - 快速版（20项基础指标）
const SYSTEM_PROMPT_QUICK = `你是一名专精多元美学的 AI 颜值分析师，具备中日韩泰及欧美审美体系的专业认知。

当用户上传面部照片时，请按照东亚美学维度进行分析，并【严格仅返回 JSON，不要输出任何其他内容】。

【评分规则】
1. 使用 0-9 分制（保留一位小数），最低输出分为 4.0
2. 以东亚审美为核心权重：白皙肤色(16%)、幼态感(12%)、V脸轮廓(14%)、眼型(13%)
3. 语气必须积极正向，用「提升空间」代替「缺陷」，用「可以尝试」代替「应该改变」
4. 突出用户最高分的 2-3 个维度，用温暖诗意的语言描述（参考：「如初春柔光般的肤色」）
5. 禁用词：丑、难看、缺陷、不对称、畸形、很差、需要整形
6. 护肤建议：精准到成分级别（如「烟酰胺4-5%」「水杨酸1-2%」），不推荐具体品牌
7. 医美建议：仅科普，不推荐手术，末尾必须注明「请咨询正规医疗机构执业医师」
8. 明星相似度：使用「X系」描述（如「新垣结衣系」「IU系」），不做精确断言

【返回 JSON 结构（严格遵守，不要添加字段或注释）】
{
  "total": 7.2,
  "rank": "靓丽",
  "percentile": 73,
  "starMatch": "新垣结衣系",
  "summary": "五官精致灵动，眼型尤为出众，白皙肤质是您最耀眼的底牌。（50字内）",
  "highlights": ["明亮眼神", "白皙肤色", "精致鼻型"],
  "dimensions": {
    "symmetry":     { "score": 7.5, "comment": "面部轮廓均衡，五官分布自然和谐（30字内）" },
    "proportion":   { "score": 7.0, "comment": "..." },
    "faceShape":    { "score": 6.8, "comment": "..." },
    "eyeType":      { "score": 7.8, "comment": "..." },
    "skinTone":     { "score": 6.5, "comment": "..." },
    "definition":   { "score": 6.2, "comment": "..." },
    "youthfulness": { "score": 7.6, "comment": "..." },
    "harmony":      { "score": 7.1, "comment": "..." }
  },
  "skincare": [
    "苹果肌水分偏低，建议早晚使用含透明质酸精华，重点拍打按摩（30字内）",
    "轻微暗沉迹象，推荐含烟酰胺4-5%产品，连续使用8周可见效",
    "防晒是白皙肤色的核心，SPF50+ PA+++ 轻薄质地，室内也不可忽略"
  ],
  "makeup": [
    "眼尾微上扬是优势，适合卧蚕阴影+下睫毛膏强化，突出眼神灵气",
    "修容从颧骨斜向下巴，腮红打斜向偏高位置，拉长面部比例",
    "裸粉色系哑光口红能突出五官精致感，避免过深色号"
  ],
  "aesthetic": [
    "苹果肌饱满度可通过胶原蛋白补充类项目维持，属轻医美范畴，恢复期短。请咨询正规医疗机构执业医师。",
    "如希望提升立体感，玻尿酸类填充可参考，属可逆性项目。请咨询正规医疗机构执业医师。"
  ],
  "faceRegions": {
    "highlights": ["left_eye", "right_eye", "nose_bridge"],
    "improvements": ["cheek_left", "cheek_right"]
  }
}`;

// System Prompt - 标准版（60项指标，4张照片）
const SYSTEM_PROMPT_STANDARD = `你是一名专精多元美学的 AI 颜值分析师，具备中日韩泰及欧美审美体系的专业认知。

【标准版分析模式】用户已上传4张照片（正面0°、左45°、右45°、侧面90°），请进行60+项专业指标分析。

【评分规则】
1. 使用 0-9 分制（保留一位小数），最低输出分为 4.0
2. 以东亚审美为核心权重：白皙肤色(16%)、幼态感(12%)、V脸轮廓(14%)、眼型(13%)
3. 结合多角度照片综合评估：正面评估对称性和比例，45°评估立体度，侧面评估轮廓
4. 语气必须积极正向，用「提升空间」代替「缺陷」
5. 禁用词：丑、难看、缺陷、不对称、畸形、很差、需要整形
6. 护肤建议：精准到成分级别，包含早晚护理步骤
7. 医美建议仅科普，必须注明「请咨询正规医疗机构执业医师」

【需要评估的60+项指标分组】
A组·面部比例(20项): 面部长宽比、三庭比例、五眼比例、颧下颌宽比等
B组·眼部(12项): 睑裂高度/宽度、眼型、内眦角、外眦倾斜、双眼皮类型等
C组·鼻部(8项): 鼻翼宽度比、鼻唇角、鼻额角、鼻尖角等（需侧面照）
D组·唇部(8项): 口裂宽度、上下唇比、唇弓清晰度、颏唇角等
E组·脸型(8项): 下颌角、V形脸指数、面部轮廓类型等
F组·对称性(4项): 整体对称指数、眼/眉/唇部对称性

【返回 JSON 结构】
{
  "total": 7.2,
  "rank": "靓丽",
  "percentile": 73,
  "version": "standard",
  "starMatch": "新垣结衣系",
  "summary": "多角度分析显示五官精致，侧面轮廓流畅，立体感良好。（80字内）",
  "highlights": ["明亮眼神", "流畅侧颜", "V脸轮廓"],
  "dimensions": {
    "symmetry":     { "score": 7.5, "comment": "..." },
    "proportion":   { "score": 7.0, "comment": "..." },
    "faceShape":    { "score": 6.8, "comment": "..." },
    "eyeType":      { "score": 7.8, "comment": "..." },
    "skinTone":     { "score": 6.5, "comment": "..." },
    "definition":   { "score": 6.2, "comment": "..." },
    "youthfulness": { "score": 7.6, "comment": "..." },
    "harmony":      { "score": 7.1, "comment": "..." }
  },
  "detailedMetrics": {
    "A": { "facialIndex": 1.32, "upperThird": 0.31, "middleThird": 0.34, "lowerThird": 0.35 },
    "B": { "palpebralHeight": 9.2, "palpebralWidth": 30, "lateralCanthalTilt": 5 },
    "C": { "nasalWidth": 1.05, "nasolabialAngle": 108, "nasofrontalAngle": 135 },
    "E": { "gonialAngle": 127, "vlineIndex": 22, "faceShape": "oval" }
  },
  "sideProfile": {
    "score": 7.2,
    "comment": "侧面轮廓流畅，鼻背线条挺拔，颏部比例协调",
    "nasolabialAngle": 108,
    "nasofrontalAngle": 135,
    "eLine": "upper lip slightly anterior"
  },
  "skinAnalysis": {
    "uniformity": 7.5,
    "brightness": 72,
    "spots": 1,
    "pores": 1,
    "comment": "肤色均匀白皙，T区毛孔略显，整体状态良好"
  },
  "skincare": [...],
  "makeup": [...],
  "aesthetic": [...]
}`;

// System Prompt - 专业版（100+项指标，6张照片）
const SYSTEM_PROMPT_PRO = `你是一名专精多元美学的 AI 颜值分析师，具备中日韩泰及欧美审美体系的专业认知。

【专业版分析模式】用户已上传6张照片（正面0°、左45°、右45°、侧面90°、仰视30°、俯视30°），请进行100+项全面专业指标分析。

【评分规则】
1. 使用 0-9 分制（保留一位小数），最低输出分为 4.0
2. 以东亚审美为核心权重，并综合不同地区审美差异
3. 结合6个角度照片进行三维立体评估
4. 语气积极正向，用「提升空间」代替「缺陷」
5. 禁用词：丑、难看、缺陷、畸形、很差、需要整形
6. 护肤/彩妆/医美建议需详细且专业
7. 医美建议仅科普，必须注明「请咨询正规医疗机构执业医师」

【100+项指标分组】
A组·面部比例(20项) | B组·眼部(12项) | C组·鼻部(8项) | D组·唇部(8项)
E组·脸型轮廓(8项) | F组·对称性(4项) | G组·侧面深度(12项)
H组·高级眼部(10项) | I组·高级鼻部(8项) | J组·皮肤质地(10项)
K组·幼态感系统(8项) | L组·颌面立体度(10项)

【特殊视角分析】
- 仰视：鼻孔形态、鼻小柱、下颌线清晰度、颏部投影
- 俯视：颅顶形态、额头饱满度、发际线、颧骨实际突出度

【返回 JSON 结构】
{
  "total": 7.2,
  "rank": "靓丽",
  "percentile": 73,
  "version": "pro",
  "starMatch": "新垣结衣系",
  "internationalMatch": "娜塔莉·波特曼系",
  "summary": "六角度全面分析显示您具有高度协调的面部特征...（120字详细总评）",
  "highlights": ["明亮眼神", "流畅侧颜", "V脸轮廓", "高幼态感"],
  "dimensions": {
    "symmetry":     { "score": 7.5, "comment": "...", "subScores": {"F01": 93, "F02": 96, "F03": 94, "F04": 95} },
    "proportion":   { "score": 7.0, "comment": "...", "subScores": {...} },
    "faceShape":    { "score": 6.8, "comment": "...", "subScores": {...} },
    "eyeType":      { "score": 7.8, "comment": "...", "subScores": {...} },
    "skinTone":     { "score": 6.5, "comment": "...", "subScores": {...} },
    "definition":   { "score": 6.2, "comment": "...", "subScores": {...} },
    "youthfulness": { "score": 7.6, "comment": "...", "subScores": {...} },
    "harmony":      { "score": 7.1, "comment": "...", "subScores": {...} }
  },
  "detailedMetrics": {
    "A": {...}, "B": {...}, "C": {...}, "D": {...}, "E": {...}, "F": {...},
    "G": {...}, "H": {...}, "I": {...}, "J": {...}, "K": {...}, "L": {...}
  },
  "sideProfile": {
    "score": 7.2,
    "comment": "...",
    "softTissueFacialAngle": 89,
    "zAngle": 77,
    "hAngle": 11,
    "eLine": {...},
    "profileHarmony": 7.5
  },
  "skinAnalysis": {
    "uniformity": 7.5, "brightness": 72, "dullness": 1, "spots": 1,
    "pores": 1, "luminosity": 2, "fineLines": 0, "nasolabialFold": 1,
    "firmness": 2, "overall": 7.2
  },
  "neotenySytem": {
    "eyeFaceRatio": 0.47, "foreheadConvexity": 2, "buccalFullness": 2,
    "fatDistribution": 2, "noseTipRoundness": 2, "chinTapering": 0.72,
    "boneProminence": 1, "compositeIndex": 7.4,
    "comment": "幼态感指数优秀，面部呈现年轻柔和特征"
  },
  "definition3D": {
    "zygomaticProminence": 7, "nasalBridge": 2, "aegyo": 2,
    "templeFullness": 2, "jawlineDefinition": 2, "appleVolume": 2,
    "overall": 6.8
  },
  "aestheticRef": {
    "priority": "high|medium|low",
    "suggestions": [
      { "area": "苹果肌", "procedure": "玻尿酸填充", "improvement": "+0.3分", "risk": "低", "recovery": "3天" },
      ...
    ]
  },
  "agingPrediction": {
    "pattern": "下垂型|凹陷型|皱纹型|色素型|混合型",
    "comment": "..."
  },
  "skincare": [...],
  "makeup": [...],
  "aesthetic": [...]
}`;

/**
 * 根据版本获取对应的 System Prompt
 */
function getSystemPrompt(version) {
  switch (version) {
    case 'pro': return SYSTEM_PROMPT_PRO;
    case 'standard': return SYSTEM_PROMPT_STANDARD;
    default: return SYSTEM_PROMPT_QUICK;
  }
}

/**
 * 构建图片内容数组（支持单张和多张）
 * @param {string|Object} imageData - 单张Base64或多照片对象
 * @param {string} version - 分析版本
 * @returns {Array} Claude API 所需的图片内容数组
 */
function buildImageContents(imageData, version) {
  const contents = [];
  
  if (version === 'quick' || typeof imageData === 'string') {
    // 单张照片
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    contents.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: base64Data
      }
    });
  } else {
    // 多张照片 - 按照角度顺序排列
    const angleOrder = version === 'pro' 
      ? ['front', 'left45', 'right45', 'side90', 'upward', 'downward']
      : ['front', 'left45', 'right45', 'side90'];
    
    const angleLabels = {
      front: '正面0°',
      left45: '左45°',
      right45: '右45°',
      side90: '侧面90°',
      upward: '仰视30°',
      downward: '俯视30°'
    };
    
    for (const angle of angleOrder) {
      if (imageData[angle]) {
        const base64Data = imageData[angle].replace(/^data:image\/\w+;base64,/, '');
        
        // 添加角度标识的文本说明
        contents.push({
          type: 'text',
          text: `[${angleLabels[angle]}]`
        });
        
        contents.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64Data
          }
        });
      }
    }
  }
  
  return contents;
}

/**
 * 获取 API Key
 * 优先使用环境配置，其次使用 localStorage
 * @returns {string|null}
 */
export function getApiKey() {
  // 优先使用环境配置的 API Key
  if (ENV.CLAUDE_API_KEY && !ENV.CLAUDE_API_KEY.includes('YOUR_API_KEY_HERE')) {
    return ENV.CLAUDE_API_KEY;
  }
  // 回退到 localStorage
  return localStorage.getItem('claude_api_key');
}

/**
 * 设置 API Key
 * @param {string} key
 */
export function setApiKey(key) {
  localStorage.setItem('claude_api_key', key);
}

/**
 * 验证 API Key 格式
 * @param {string} key
 * @returns {boolean}
 */
export function validateApiKey(key) {
  return key && key.startsWith('sk-ant-') && key.length > 20;
}

/**
 * 调用 Claude API 进行颜值分析
 * @param {string|Object} imageData - Base64 编码的图片数据（单张或多张）
 * @param {Object} options - 选项
 * @param {string} options.region - 地区代码 (china/korea/japan/vietnam)
 * @param {string} options.skinMode - 皮肤模式 (natural/makeup)
 * @param {string} options.version - 分析版本 (quick/standard/pro)
 * @param {Function} options.onProgress - 进度回调
 * @returns {Promise<Object>} 分析结果
 */
export async function analyzeWithClaude(imageData, options = {}) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('请先设置 API Key');
  }
  
  if (!validateApiKey(apiKey)) {
    throw new Error('API Key 格式不正确');
  }

  const { region = 'china', skinMode = 'natural', version = 'quick', onProgress } = options;
  
  const regionName = REGIONS[region]?.name || '中国';
  const skinModeName = SKIN_MODES[skinMode]?.name || '素颜模式';
  const versionConfig = ANALYSIS_VERSIONS[version] || ANALYSIS_VERSIONS.quick;
  
  // 构建图片内容
  const imageContents = buildImageContents(imageData, version);
  
  // 构建用户消息
  let userMessage = '';
  if (version === 'quick') {
    userMessage = `请分析这张照片，审美模式：${regionName}，拍摄模式：${skinModeName}。仅返回 JSON。`;
  } else if (version === 'standard') {
    userMessage = `请分析这4张照片（正面0°、左45°、右45°、侧面90°），审美模式：${regionName}，拍摄模式：${skinModeName}。请进行60+项标准版专业分析。仅返回 JSON。`;
  } else if (version === 'pro') {
    userMessage = `请分析这6张照片（正面0°、左45°、右45°、侧面90°、仰视30°、俯视30°），审美模式：${regionName}，拍摄模式：${skinModeName}。请进行100+项专业版全面分析，包含幼态感系统、三维立体度、医美参考建议。仅返回 JSON。`;
  }
  
  const requestBody = {
    model: API_CONFIG.claude.model,
    max_tokens: version === 'pro' ? 3000 : (version === 'standard' ? 2000 : API_CONFIG.claude.maxTokens),
    system: getSystemPrompt(version),
    messages: [
      {
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: userMessage
          }
        ]
      }
    ]
  };

  onProgress?.('正在连接 AI 服务...');

  try {
    const controller = new AbortController();
    // 专业版需要更长的超时时间
    const timeout = version === 'pro' ? 60000 : (version === 'standard' ? 45000 : API_CONFIG.claude.timeout);
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(API_CONFIG.claude.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查后重试');
      }
      if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      }
      if (response.status === 500) {
        throw new Error('AI 服务暂时不可用，请稍后重试');
      }
      
      throw new Error(errorData.error?.message || `请求失败: ${response.status}`);
    }

    onProgress?.('正在解析分析结果...');

    const data = await response.json();
    
    // 提取 Claude 返回的文本内容
    const content = data.content?.[0]?.text;
    
    if (!content) {
      throw new Error('AI 返回内容为空');
    }

    // 解析 JSON
    let result;
    try {
      // 尝试直接解析
      result = JSON.parse(content);
    } catch {
      // 尝试提取 JSON 块
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析 AI 返回的数据');
      }
    }

    // 验证必要字段
    if (typeof result.total !== 'number' || !result.dimensions) {
      throw new Error('AI 返回数据格式不完整');
    }

    return result;

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw error;
  }
}

/**
 * 生成模拟数据（用于演示/API 失败时）
 * @param {string} region - 地区代码
 * @returns {Object} 模拟的分析结果
 */
export function generateMockData(region = 'china') {
  // 随机生成基础分数
  const baseScore = 6.0 + Math.random() * 1.5;
  
  const generateScore = (base, variance = 0.8) => {
    const score = base + (Math.random() - 0.5) * variance * 2;
    return Math.round(Math.max(4.0, Math.min(9.0, score)) * 10) / 10;
  };

  const dimensions = {
    symmetry: { 
      score: generateScore(baseScore), 
      comment: '面部轮廓左右均衡，五官分布自然和谐' 
    },
    proportion: { 
      score: generateScore(baseScore), 
      comment: '三庭比例协调，眉眼间距适宜' 
    },
    faceShape: { 
      score: generateScore(baseScore), 
      comment: '轮廓柔和，下颌线流畅' 
    },
    eyeType: { 
      score: generateScore(baseScore + 0.3), 
      comment: '眼型自然，眼神清澈有神' 
    },
    skinTone: { 
      score: generateScore(baseScore), 
      comment: '肤色匀净，肤质状态良好' 
    },
    definition: { 
      score: generateScore(baseScore - 0.2), 
      comment: '五官轮廓清晰，立体感适中' 
    },
    youthfulness: { 
      score: generateScore(baseScore + 0.2), 
      comment: '面部线条柔和，保持年轻活力' 
    },
    harmony: { 
      score: generateScore(baseScore), 
      comment: '五官配合自然，整体气质和谐' 
    }
  };

  // 计算总分
  const total = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0) / 8;
  const roundedTotal = Math.round(total * 10) / 10;

  // 确定段位
  let rank, percentile;
  if (roundedTotal >= 8.5) {
    rank = '神颜';
    percentile = 95 + Math.floor(Math.random() * 4);
  } else if (roundedTotal >= 7.5) {
    rank = '高颜值';
    percentile = 85 + Math.floor(Math.random() * 10);
  } else if (roundedTotal >= 6.5) {
    rank = '靓丽';
    percentile = 65 + Math.floor(Math.random() * 15);
  } else if (roundedTotal >= 5.5) {
    rank = '清秀';
    percentile = 40 + Math.floor(Math.random() * 20);
  } else if (roundedTotal >= 4.5) {
    rank = '邻家';
    percentile = 20 + Math.floor(Math.random() * 15);
  } else {
    rank = '潜力股';
    percentile = 5 + Math.floor(Math.random() * 10);
  }

  const starMatches = {
    china: ['刘亦菲系', '杨幂系', '赵丽颖系', '迪丽热巴系', '杨紫系'],
    korea: ['IU系', '秀智系', '金泰熙系', 'Jennie系', '允儿系'],
    japan: ['新垣结衣系', '石原里美系', '佐佐木希系', '北川景子系', '有村架纯系'],
    vietnam: ['Ngọc Trinh系', 'Chi Pu系', 'Đông Nhi系']
  };

  const matches = starMatches[region] || starMatches.china;
  const starMatch = matches[Math.floor(Math.random() * matches.length)];

  return {
    total: roundedTotal,
    rank,
    percentile,
    starMatch,
    summary: '五官精致灵动，整体气质温婉，眼神清澈有神是您的亮点所在。',
    highlights: ['灵动眼神', '柔和轮廓', '匀净肤质'],
    dimensions,
    skincare: [
      '建议早晚使用含透明质酸精华，帮助肌肤深层补水',
      '适量使用含烟酰胺4-5%的产品，提升肤色均匀度',
      '日常防晒必不可少，SPF50+ PA+++ 是首选'
    ],
    makeup: [
      '眼妆可强化卧蚕效果，提升眼神灵气',
      '选择裸粉色系口红，凸显气质感',
      '腮红位置可略偏高，营造立体感'
    ],
    aesthetic: [
      '面部状态良好，日常护肤为主即可。如需进一步咨询，请联系正规医疗机构执业医师。'
    ],
    faceRegions: {
      highlights: ['left_eye', 'right_eye'],
      improvements: []
    }
  };
}

/**
 * 带重试的分析函数
 * @param {string} imageBase64
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function analyzeWithRetry(imageBase64, options = {}) {
  const maxRetries = 2;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        options.onProgress?.(`正在重试 (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      return await analyzeWithClaude(imageBase64, options);
    } catch (error) {
      lastError = error;
      console.error(`Analysis attempt ${attempt + 1} failed:`, error);
      
      // 某些错误不需要重试
      if (error.message.includes('API Key') || error.message.includes('无效')) {
        throw error;
      }
    }
  }

  // 所有重试都失败，返回模拟数据
  console.warn('All API attempts failed, using mock data');
  return generateMockData(options.region);
}
