/**
 * 顔鉴 · AI 颜值评分 H5
 * 全局配置 - 评分权重、API端点、段位映射
 * Version: 1.0
 */

// ========== 评分权重配置 ==========
export const SCORE_WEIGHTS = {
  // 基础权重（东亚美学）
  base: {
    symmetry: 0.12,      // 面部对称性
    proportion: 0.15,    // 三庭五眼比例
    faceShape: 0.14,     // 脸型轮廓
    eyeType: 0.13,       // 眼型分析
    skinTone: 0.16,      // 肤色与肤质
    definition: 0.10,    // 五官立体度
    youthfulness: 0.12,  // 幼态感指数
    harmony: 0.08        // 整体协调度
  },
  
  // 地区权重调整
  delta: {
    china: { 
      skinTone: 0.04, 
      youthfulness: 0.03, 
      proportion: 0.02, 
      symmetry: 0.01,
      definition: -0.02, 
      harmony: -0.08 
    },
    korea: { 
      faceShape: 0.04, 
      youthfulness: 0.04, 
      eyeType: 0.02, 
      skinTone: -0.01,
      harmony: -0.09 
    },
    japan: { 
      symmetry: 0.02,
      youthfulness: 0.03, 
      harmony: 0.01,
      proportion: -0.01,
      faceShape: -0.02,
      definition: -0.03 
    },
    thailand: { 
      skinTone: 0.03, 
      definition: 0.04, 
      faceShape: 0.03,
      youthfulness: 0.02, 
      harmony: -0.12 
    },
    western: { 
      definition: 0.08, 
      proportion: 0.04, 
      symmetry: 0.02,
      youthfulness: -0.06, 
      skinTone: -0.04,
      harmony: -0.04 
    }
  }
};

// ========== 段位映射 ==========
export const RANK_MAP = [
  { 
    min: 8.5, 
    label: '神颜', 
    symbol: '✦', 
    color: '#F0C060',
    labelEn: 'Divine',
    description: '明星级、登顶颜值金字塔',
    percentage: '~1%'
  },
  { 
    min: 7.5, 
    label: '高颜值', 
    symbol: '◈', 
    color: '#C9A96E',
    labelEn: 'Gorgeous',
    description: '公认好看，有明显五官优势',
    percentage: '~9%'
  },
  { 
    min: 6.5, 
    label: '靓丽', 
    symbol: '◇', 
    color: '#7EB8A4',
    labelEn: 'Pretty',
    description: '颜值在线，特征鲜明',
    percentage: '~20%'
  },
  { 
    min: 5.5, 
    label: '清秀', 
    symbol: '○', 
    color: '#A8C5D8',
    labelEn: 'Elegant',
    description: '整体协调，有一定亮点',
    percentage: '~30%'
  },
  { 
    min: 4.5, 
    label: '邻家', 
    symbol: '△', 
    color: '#D4849A',
    labelEn: 'Natural',
    description: '平和耐看，有提升空间',
    percentage: '~25%'
  },
  { 
    min: 0.0, 
    label: '潜力股', 
    symbol: '◎', 
    color: '#B0A8B0',
    labelEn: 'Potential',
    description: '可塑性强，改善空间大',
    percentage: '~15%'
  }
];

// ========== 维度配置 ==========
export const DIMENSIONS = {
  symmetry: {
    name: '面部对称性',
    nameEn: 'Symmetry',
    icon: '⚖️'
  },
  proportion: {
    name: '三庭五眼',
    nameEn: 'Proportion',
    icon: '📐'
  },
  faceShape: {
    name: '脸型轮廓',
    nameEn: 'Face Shape',
    icon: '💎'
  },
  eyeType: {
    name: '眼型分析',
    nameEn: 'Eye Type',
    icon: '👁️'
  },
  skinTone: {
    name: '肤色肤质',
    nameEn: 'Skin Tone',
    icon: '✨'
  },
  definition: {
    name: '五官立体度',
    nameEn: 'Definition',
    icon: '🎭'
  },
  youthfulness: {
    name: '幼态感',
    nameEn: 'Youthfulness',
    icon: '🌸'
  },
  harmony: {
    name: '整体协调度',
    nameEn: 'Harmony',
    icon: '🎵'
  }
};

// ========== 地区配置 ==========
export const REGIONS = {
  china: {
    name: '中国',
    nameEn: 'China',
    flag: '🇨🇳',
    keywords: ['白皙', '幼态', '气质']
  },
  korea: {
    name: '韩国',
    nameEn: 'Korea',
    flag: '🇰🇷',
    keywords: ['V脸', '双眼皮', '清纯']
  },
  japan: {
    name: '日本',
    nameEn: 'Japan',
    flag: '🇯🇵',
    keywords: ['小脸', '柔和', '减龄']
  },
  thailand: {
    name: '泰国',
    nameEn: 'Thailand',
    flag: '🇹🇭',
    keywords: ['混血', '立体', '性感']
  },
  western: {
    name: '欧美',
    nameEn: 'Western',
    flag: '🌍',
    keywords: ['立体', '轮廓', '成熟']
  }
};

// ========== 皮肤模式配置 ==========
export const SKIN_MODES = {
  natural: {
    name: '素颜模式',
    nameEn: 'Natural',
    description: '不带妆容的自然状态'
  },
  makeup: {
    name: '有妆模式',
    nameEn: 'Makeup',
    description: '带有日常妆容'
  }
};

// ========== 分析版本配置 ==========
export const ANALYSIS_VERSIONS = {
  quick: {
    name: '快速版',
    nameEn: 'Quick',
    photos: 1,
    angles: ['front'],
    indicatorCount: 20,
    analysisDuration: 5,
    dimensions: ['symmetry', 'proportion', 'faceShape', 'eyeType', 'skinTone', 'definition', 'youthfulness', 'harmony'],
    features: {
      basicScore: true,
      radarChart: true,
      detailedMetrics: false,
      sideAnalysis: false,
      skinAnalysis: false,
      youthSystem: false,
      aestheticRef: false,
      pdfReport: false
    },
    description: '娱乐体验，首次接触'
  },
  standard: {
    name: '标准版',
    nameEn: 'Standard',
    photos: 4,
    angles: ['front', 'left45', 'right45', 'side90'],
    indicatorCount: 60,
    analysisDuration: 15,
    dimensions: ['symmetry', 'proportion', 'faceShape', 'eyeType', 'skinTone', 'definition', 'youthfulness', 'harmony'],
    features: {
      basicScore: true,
      radarChart: true,
      detailedMetrics: true,
      sideAnalysis: true,
      skinAnalysis: true,
      youthSystem: false,
      aestheticRef: 'basic',
      pdfReport: false
    },
    description: '推荐方案，覆盖 90% 分析需求'
  },
  pro: {
    name: '专业版',
    nameEn: 'Professional',
    photos: 6,
    angles: ['front', 'left45', 'right45', 'side90', 'upward', 'downward'],
    indicatorCount: 100,
    analysisDuration: 30,
    dimensions: ['symmetry', 'proportion', 'faceShape', 'eyeType', 'skinTone', 'definition', 'youthfulness', 'harmony'],
    features: {
      basicScore: true,
      radarChart: true,
      detailedMetrics: true,
      sideAnalysis: true,
      skinAnalysis: true,
      youthSystem: true,
      aestheticRef: 'full',
      pdfReport: true
    },
    description: '医美咨询，极致精确'
  }
};

// ========== 拍摄角度配置 ==========
export const PHOTO_ANGLES = {
  front: {
    name: '正面 0°',
    icon: '👤',
    description: '正面平视，保持水平',
    tips: '双眼平视镜头，法兰克福平面水平'
  },
  left45: {
    name: '左 45°',
    icon: '👤',
    description: '头转向左侧 45 度',
    tips: '眼睛注视正前方，非侧视'
  },
  right45: {
    name: '右 45°',
    icon: '👤',
    description: '头转向右侧 45 度',
    tips: '眼睛注视正前方，露出耳廓'
  },
  side90: {
    name: '侧面 90°',
    icon: '👤',
    description: '完全侧面',
    tips: '鼻尖、眉弓、下颌角清晰可见'
  },
  upward: {
    name: '仰视 30°',
    icon: '🔼',
    description: '头部后仰，自下向上拍',
    tips: '用于检测鼻孔形态、下颌线',
    proOnly: true
  },
  downward: {
    name: '俯视 30°',
    icon: '🔽',
    description: '头部前倾，自上向下拍',
    tips: '用于检测额头饱满度、发际线',
    proOnly: true
  }
};

// ========== 指标分组定义 ==========
export const INDICATOR_GROUPS = {
  // A组：面部整体比例（20项）
  A: {
    name: '面部比例',
    nameEn: 'Facial Proportions',
    version: 'quick', // 快速版即可用
    indicators: {
      A01: { name: '面部长宽比', ideal: { min: 1.20, max: 1.40 }, unit: 'ratio' },
      A02: { name: '上面部高度比', ideal: { min: 0.28, max: 0.33 }, unit: '%' },
      A03: { name: '中面部高度比', ideal: { min: 0.33, max: 0.36 }, unit: '%' },
      A04: { name: '下面部高度比', ideal: { min: 0.30, max: 0.36 }, unit: '%' },
      A05: { name: '下面部内部比例', ideal: { min: 0.45, max: 0.55 }, unit: 'ratio' },
      A06: { name: '面宽五等分偏差', ideal: { min: 0, max: 0.1 }, unit: 'cv' },
      A07: { name: '眼间距比', ideal: { min: 0.26, max: 0.30 }, unit: 'ratio' },
      A08: { name: '眼裂宽面宽比', ideal: { min: 0.95, max: 1.05 }, unit: 'ratio' },
      A09: { name: '颧骨宽面宽比', ideal: { min: 0.95, max: 1.10 }, unit: 'ratio' },
      A10: { name: '下颌宽颧骨比', ideal: { min: 0.75, max: 0.85 }, unit: 'ratio', female: true },
      A11: { name: '面部凸度', ideal: { min: 165, max: 175 }, unit: '°', version: 'standard' },
      A12: { name: '颅面高度比', ideal: { min: 0.6, max: 0.8 }, unit: 'ratio' },
      A13: { name: '内眦指数', ideal: { min: 0.35, max: 0.45 }, unit: 'ratio' },
      A14: { name: '上唇高度', ideal: { min: 18, max: 22 }, unit: 'mm' },
      A15: { name: '颏高下面部比', ideal: { min: 0.60, max: 0.70 }, unit: 'ratio' },
      A16: { name: '黄金比例偏差', ideal: { min: 0, max: 0.15 }, unit: 'rmse' },
      A17: { name: '眼-嘴垂直距离比', ideal: { min: 0.34, max: 0.38 }, unit: 'ratio' },
      A18: { name: '眼水平间距比', ideal: { min: 0.44, max: 0.48 }, unit: 'ratio' },
      A19: { name: '前额高度', ideal: { min: 0.28, max: 0.33 }, unit: '%' },
      A20: { name: '苹果肌高度', ideal: { min: 15, max: 25 }, unit: 'mm' }
    }
  },
  // B组：眼部指标（12项）
  B: {
    name: '眼部分析',
    nameEn: 'Eye Analysis',
    version: 'quick',
    indicators: {
      B01: { name: '睑裂高度', ideal: { min: 8.98, max: 9.12 }, unit: 'mm' },
      B02: { name: '睑裂宽度', ideal: { min: 28, max: 32 }, unit: 'mm' },
      B03: { name: '睑裂指数', ideal: { min: 0.28, max: 0.35 }, unit: 'ratio' },
      B04: { name: '内眦距', ideal: { min: 32, max: 38 }, unit: 'mm' },
      B05: { name: '瞳孔间距', ideal: { min: 58, max: 66 }, unit: 'mm' },
      B06: { name: '外眦距', ideal: { min: 0.65, max: 0.75 }, unit: 'ratio' },
      B07: { name: '内眦角', ideal: { min: 40, max: 55 }, unit: '°' },
      B08: { name: '外眦倾斜角', ideal: { min: 2, max: 8 }, unit: '°' },
      B09: { name: '双眼皮类型', ideal: { min: 3, max: 4 }, unit: 'level' },
      B10: { name: '内眦赘皮', ideal: { min: 0, max: 1 }, unit: 'level' },
      B11: { name: '眉峰位置', ideal: { min: 0, max: 5 }, unit: 'mm' },
      B12: { name: '眉眼距', ideal: { min: 10, max: 14 }, unit: 'mm' }
    }
  },
  // C组：鼻部指标（8项）
  C: {
    name: '鼻部分析',
    nameEn: 'Nose Analysis',
    version: 'standard',
    indicators: {
      C01: { name: '鼻翼宽度比', ideal: { min: 1.0, max: 1.15 }, unit: 'ratio' },
      C02: { name: '鼻面角', ideal: { min: 30, max: 40 }, unit: '°' },
      C03: { name: '鼻唇角', ideal: { min: 100, max: 120 }, unit: '°', female: true },
      C04: { name: '鼻额角', ideal: { min: 130, max: 140 }, unit: '°', female: true },
      C05: { name: '鼻尖角', ideal: { min: 80, max: 90 }, unit: '°', female: true },
      C06: { name: '鼻长中面部比', ideal: { min: 0.43, max: 0.50 }, unit: 'ratio' },
      C07: { name: '鼻基底宽高比', ideal: { min: 0.60, max: 0.75 }, unit: 'ratio' },
      C08: { name: '鼻孔可见度', ideal: { min: 1, max: 1 }, unit: 'level' }
    }
  },
  // D组：唇部指标（8项）
  D: {
    name: '唇部分析',
    nameEn: 'Lip Analysis',
    version: 'standard',
    indicators: {
      D01: { name: '口裂宽度比', ideal: { min: 0.36, max: 0.42 }, unit: 'ratio' },
      D02: { name: '口裂鼻翼比', ideal: { min: 1.5, max: 1.7 }, unit: 'ratio' },
      D03: { name: '上下唇厚度比', ideal: { min: 0.55, max: 0.70 }, unit: 'ratio' },
      D04: { name: '上唇高度', ideal: { min: 8, max: 12 }, unit: 'mm' },
      D05: { name: '下唇高度', ideal: { min: 9, max: 14 }, unit: 'mm' },
      D06: { name: '唇弓清晰度', ideal: { min: 2, max: 3 }, unit: 'level' },
      D07: { name: '颏唇角', ideal: { min: 130, max: 145 }, unit: '°', female: true },
      D08: { name: '人中长度比', ideal: { min: 0.25, max: 0.35 }, unit: 'ratio' }
    }
  },
  // E组：脸型轮廓（8项）
  E: {
    name: '脸型轮廓',
    nameEn: 'Face Shape',
    version: 'standard',
    indicators: {
      E01: { name: '下颌角角度', ideal: { min: 125, max: 130 }, unit: '°', female: true },
      E02: { name: '面部轮廓类型', ideal: { labels: ['oval', 'heart'] }, unit: 'type' },
      E03: { name: 'V形脸指数', ideal: { min: 18, max: 30 }, unit: '%' },
      E04: { name: '颊宽比', ideal: { min: 0.68, max: 0.78 }, unit: 'ratio' },
      E05: { name: '颏部突出度', ideal: { min: -4, max: 0 }, unit: 'mm' },
      E06: { name: '颏部高度比', ideal: { min: 0.60, max: 0.68 }, unit: 'ratio' },
      E07: { name: '面部轮廓对称性', ideal: { min: 90, max: 100 }, unit: '%' },
      E08: { name: '颧弓突出度', ideal: { min: 0, max: 5 }, unit: 'mm' }
    }
  },
  // F组：对称性（4项）
  F: {
    name: '面部对称性',
    nameEn: 'Symmetry',
    version: 'quick',
    indicators: {
      F01: { name: '整体对称指数', ideal: { min: 92, max: 100 }, unit: '%' },
      F02: { name: '眼部对称性', ideal: { min: 95, max: 100 }, unit: '%' },
      F03: { name: '眉部对称性', ideal: { min: 95, max: 100 }, unit: '%' },
      F04: { name: '唇部对称性', ideal: { min: 95, max: 100 }, unit: '%' }
    }
  },
  // G组：侧面深度分析（12项）- 专业版
  G: {
    name: '侧面分析',
    nameEn: 'Profile Analysis',
    version: 'pro',
    indicators: {
      G01: { name: '软组织侧面角', ideal: { min: 85, max: 93 }, unit: '°' },
      G02: { name: 'Z角', ideal: { min: 75, max: 80 }, unit: '°', female: true },
      G03: { name: 'H角', ideal: { min: 7, max: 15 }, unit: '°' },
      G04: { name: '上唇突度 E线', ideal: { min: -2, max: 3 }, unit: 'mm' },
      G05: { name: '下唇突度 E线', ideal: { min: -4, max: 0 }, unit: 'mm' },
      G06: { name: '颏唇沟深度', ideal: { min: 4, max: 8 }, unit: 'mm' },
      G07: { name: '鼻面高度比', ideal: { min: 0.45, max: 0.55 }, unit: 'ratio' },
      G08: { name: '颏颈角', ideal: { min: 105, max: 120 }, unit: '°' },
      G09: { name: '额面角', ideal: { min: -3, max: 2 }, unit: 'mm' },
      G10: { name: '鼻背曲线', ideal: { labels: ['straight'] }, unit: 'type' },
      G11: { name: '颏部形态', ideal: { min: 0.65, max: 0.85 }, unit: 'ratio' },
      G12: { name: '侧面轮廓流畅度', ideal: { min: 7, max: 9 }, unit: 'score' }
    }
  },
  // J组：皮肤质地（10项）- 标准版+
  J: {
    name: '肤质分析',
    nameEn: 'Skin Analysis',
    version: 'standard',
    indicators: {
      J01: { name: '肤色均匀度', ideal: { min: 0, max: 8 }, unit: 'std' },
      J02: { name: '肤色亮度', ideal: { min: 65, max: 85 }, unit: 'L' },
      J03: { name: '暗沉程度', ideal: { min: 0, max: 1 }, unit: 'level' },
      J04: { name: '色斑指数', ideal: { min: 0, max: 1 }, unit: 'level' },
      J05: { name: '毛孔评级', ideal: { min: 0, max: 1 }, unit: 'level' },
      J06: { name: '皮肤光泽度', ideal: { min: 2, max: 3 }, unit: 'level', version: 'pro' },
      J07: { name: '细纹评级', ideal: { min: 0, max: 1 }, unit: 'level', version: 'pro' },
      J08: { name: '法令纹深度', ideal: { min: 0, max: 2 }, unit: 'mm', version: 'pro' },
      J09: { name: '皮肤弹性感', ideal: { min: 2, max: 3 }, unit: 'level', version: 'pro' },
      J10: { name: '整体肤质评分', ideal: { min: 7, max: 9 }, unit: 'score' }
    }
  },
  // K组：幼态感系统（8项）- 专业版
  K: {
    name: '幼态感',
    nameEn: 'Neoteny',
    version: 'pro',
    indicators: {
      K01: { name: '眼-脸宽比', ideal: { min: 0.45, max: 0.55 }, unit: 'ratio' },
      K02: { name: '额头饱满度', ideal: { min: 2, max: 3 }, unit: 'level' },
      K03: { name: '颊脂垫丰满度', ideal: { min: 2, max: 3 }, unit: 'level' },
      K04: { name: '面部脂肪分布', ideal: { min: 2, max: 3 }, unit: 'level' },
      K05: { name: '鼻尖圆润度', ideal: { min: 2, max: 3 }, unit: 'level' },
      K06: { name: '下巴尖削指数', ideal: { min: 0.6, max: 0.8 }, unit: 'ratio' },
      K07: { name: '面骨感指数', ideal: { min: 0, max: 1 }, unit: 'level' },
      K08: { name: '幼态感综合指数', ideal: { min: 7, max: 9 }, unit: 'score' }
    }
  },
  // L组：颌面立体度（10项）- 专业版
  L: {
    name: '立体度',
    nameEn: '3D Definition',
    version: 'pro',
    indicators: {
      L01: { name: '颧骨三维突出度', ideal: { min: 5, max: 10 }, unit: 'mm' },
      L02: { name: '鼻梁立体感', ideal: { min: 2, max: 3 }, unit: 'level' },
      L03: { name: '卧蚕丰满度', ideal: { min: 2, max: 3 }, unit: 'level' },
      L04: { name: '太阳穴饱满度', ideal: { min: 2, max: 3 }, unit: 'level' },
      L05: { name: '下颌线清晰度', ideal: { min: 2, max: 3 }, unit: 'level' },
      L06: { name: '颧弓可见度', ideal: { min: 1, max: 2 }, unit: 'level' },
      L07: { name: '苹果肌立体度', ideal: { min: 2, max: 3 }, unit: 'level' },
      L08: { name: '面颊凹陷程度', ideal: { min: 1, max: 2 }, unit: 'level' },
      L09: { name: '耳廓形态', ideal: { min: 2, max: 3 }, unit: 'level' },
      L10: { name: '整体立体感评分', ideal: { min: 6, max: 9 }, unit: 'score' }
    }
  }
};

// ========== API 配置 ==========
export const API_CONFIG = {
  claude: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-6',
    maxTokens: 1200,
    timeout: 30000
  },
  facepp: {
    endpoint: 'https://api-cn.faceplusplus.com/facepp/v3/detect',
    timeout: 10000
  }
};

// ========== 图片配置 ==========
export const IMAGE_CONFIG = {
  maxSize: 600 * 1024,      // 最大 600KB
  minWidth: 480,            // 最小宽度
  quality: 0.85,            // 压缩质量
  acceptTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  
  // 质量预检阈值
  validation: {
    minBrightness: 40,
    maxBrightness: 220,
    minSharpness: 80,
    maxYawAngle: 25,
    warnYawAngle: 35,
    minFaceVisibility: 0.6
  }
};

// ========== 动画配置 ==========
export const ANIMATION_CONFIG = {
  score: {
    duration: 1800,
    easing: 'easeOutCubic'
  },
  progress: {
    duration: 300,
    stagger: 80,
    easing: 'easeOutQuart'
  },
  page: {
    duration: 300,
    easing: 'easeInOutCubic'
  },
  card: {
    duration: 300,
    stagger: 80,
    easing: 'easeOutCubic'
  }
};

// ========== 分析步骤 ==========
export const ANALYSIS_STEPS = [
  { key: 'detect', name: '人脸特征识别', duration: 1200 },
  { key: 'calculate', name: '三庭五眼比例计算', duration: 300 },
  { key: 'match', name: '东亚美学模型匹配', duration: 200 },
  { key: 'generate', name: '个性化建议生成', duration: 2500 },
  { key: 'render', name: '报告渲染完成', duration: 300 }
];

// ========== Toast 配置 ==========
export const TOAST_CONFIG = {
  success: { icon: '✓', duration: 1500, color: '#4CAF6E' },
  warning: { icon: '⚠️', duration: 3000, color: '#F0A040' },
  error: { icon: '✕', duration: 4000, color: '#E05C5C' },
  info: { icon: '✦', duration: 2000, color: '#C9A96E' }
};

// ========== 分享卡片模板 ==========
export const SHARE_TEMPLATES = {
  'black-gold': {
    name: '黑金卡',
    background: '#0E0C0F',
    accent: '#C9A96E',
    style: 'luxury'
  },
  'sakura': {
    name: '樱花卡',
    background: 'linear-gradient(135deg, #FDF0F4 0%, #FFF8F0 100%)',
    accent: '#D4849A',
    style: 'fresh'
  },
  'magazine': {
    name: '杂志卡',
    background: '#FAF7F4',
    accent: '#1A1A1A',
    style: 'editorial'
  }
};

// ========== 成分知识库 ==========
export const INGREDIENT_DATABASE = {
  '透明质酸': {
    name: '透明质酸',
    nameEn: 'Hyaluronic Acid',
    effect: '强效保湿，可吸收自身重量1000倍的水分',
    concentration: '0.1-2%',
    caution: '干燥环境需配合封闭剂使用'
  },
  '神经酰胺': {
    name: '神经酰胺',
    nameEn: 'Ceramide',
    effect: '修复皮肤屏障，增强锁水能力',
    concentration: '0.5-2%',
    caution: '敏感肌友好成分'
  },
  '烟酰胺': {
    name: '烟酰胺',
    nameEn: 'Niacinamide',
    effect: '美白淡斑、控油收毛孔',
    concentration: '4-6%',
    caution: '初次使用建议低浓度起步'
  },
  'VC': {
    name: '维生素C',
    nameEn: 'Vitamin C',
    effect: '抗氧化、提亮肤色',
    concentration: '10-20%',
    caution: '避光保存，配合防晒使用'
  },
  '水杨酸': {
    name: '水杨酸',
    nameEn: 'Salicylic Acid',
    effect: '疏通毛孔、控油祛痘',
    concentration: '1-2%',
    caution: '孕期禁用，敏感肌慎用'
  },
  '视黄醇': {
    name: '视黄醇',
    nameEn: 'Retinol',
    effect: '抗老、促进细胞更新',
    concentration: '0.025-0.1%',
    caution: '夜间使用，需建立耐受'
  },
  '熊果苷': {
    name: '熊果苷',
    nameEn: 'Arbutin',
    effect: '温和美白、淡化色斑',
    concentration: '2-5%',
    caution: '相对温和的美白成分'
  },
  '胜肽': {
    name: '胜肽',
    nameEn: 'Peptides',
    effect: '促进胶原蛋白生成、紧致',
    concentration: '1-5%',
    caution: '可与多数成分叠加使用'
  },
  '果酸': {
    name: '果酸/AHA',
    nameEn: 'Alpha Hydroxy Acid',
    effect: '去角质、提亮肤色',
    concentration: '5-10%',
    caution: '需建立耐受，配合防晒'
  },
  '传明酸': {
    name: '传明酸',
    nameEn: 'Tranexamic Acid',
    effect: '美白淡斑、抑制黑色素',
    concentration: '2-5%',
    caution: '温和稳定，可日间使用'
  }
};

// ========== 脸型彩妆建议 ==========
export const FACE_SHAPE_MAKEUP = {
  round: {
    name: '圆脸',
    contour: '颧骨斜向下颌角深色修容',
    blush: '颧骨斜向上，位置偏高',
    highlight: '额头中央 + 下巴尖',
    avoid: '避免横向腮红'
  },
  square: {
    name: '方脸',
    contour: '下颌角双侧阴影修饰',
    blush: '颧骨斜向上',
    highlight: 'T区集中',
    avoid: '避免直线眉'
  },
  long: {
    name: '长脸',
    contour: '额头/下巴横向修容',
    blush: '水平向外展开',
    highlight: '两侧而非T区',
    avoid: '避免拉长形高光'
  },
  oval: {
    name: '瓜子脸',
    contour: '轻度定向修容即可',
    blush: '苹果肌中央',
    highlight: 'T区常规',
    avoid: '无需过度修容'
  },
  diamond: {
    name: '菱形脸',
    contour: '颧骨两侧修容减宽',
    blush: '偏下位置',
    highlight: '额头两侧',
    avoid: '避免强调颧骨'
  }
};

// ========== 眼型彩妆建议 ==========
export const EYE_TYPE_MAKEUP = {
  monolid: {
    name: '单眼皮',
    eyeshadow: '哑光深色平涂，内眼线贴近睫毛根',
    eyeliner: '细长内眼线，延伸眼尾',
    avoid: '珠光眼影（显肿泡）'
  },
  'inner-double': {
    name: '内双',
    eyeshadow: '内眼角留白 + 眼尾强调，打开眼形',
    eyeliner: '眼尾加粗上扬',
    avoid: '全眼盖同色'
  },
  droopy: {
    name: '下垂眼',
    eyeshadow: '上扬渐变色',
    eyeliner: '眼尾上扬眼线，下眼线后1/3',
    avoid: '全包式眼线'
  },
  small: {
    name: '小眼睛',
    eyeshadow: '白色卧蚕提亮',
    eyeliner: '肉色内眼线，下睫毛膏',
    avoid: '深色眼线全包'
  },
  almond: {
    name: '杏仁眼',
    eyeshadow: '渐变烟熏，强调神秘感',
    eyeliner: '自由发挥',
    avoid: '无明显禁忌'
  }
};

// ========== 医美项目科普 ==========
export const AESTHETIC_PROCEDURES = {
  skinTone: {
    trigger: 6.0,
    name: '肤色提亮方向',
    procedures: ['光子嫩肤', '激光淡斑', '水光针'],
    description: '光子嫩肤通过强脉冲光技术改善色斑与暗沉，是日韩最普及的基础美肤项目之一。',
    suitable: '轻度暗沉、色斑、毛孔粗大',
    recovery: '1-3天（轻微泛红）',
    caution: '如有敏感肌，请提前告知医生',
    improvement: { score: 0.4, time: '4-6次疗程后' },
    detailedInfo: '光子嫩肤原理是利用强脉冲光（IPL）作用于皮肤深层，刺激胶原蛋白新生，同时分解表皮黑色素。\n\n① 疗程建议：第一疗程4-6次，每次3-4周间隔\n② 维持稀程：每3-6个月做一次\n③ 建议时段：秋冬季节紫外线较弱时\n④ 术后注意：严格防晒，避免高温洗浴'
  },
  faceShape: {
    trigger: 5.5,
    name: '脸型优化方向',
    procedures: ['热玛吉', '超声刀', '溶脂针'],
    description: '热玛吉通过射频能量刺激胶原蛋白再生，达到紧致提升效果，属非侵入性项目。',
    suitable: '面部轻微松弛、轮廓不清晰',
    recovery: '通常无明显恢复期',
    caution: '效果维持约1-2年，需定期维护',
    improvement: { score: 0.5, time: '1次治疗合1-3个月' },
    detailedInfo: '热玛吉采用单极射频技术，作用于真皮层和皮下组织，促进胶原蛋白收缩和新生。\n\n① 层次作用：表皮、真皮、皮下组织\n② 功效曲线：即时紧致+2-6个月胶原新生\n③ 维持时间：约1-2年\n④ 注意事项：治疗前充分卸妆，治疗后加强保湿'
  },
  definition: {
    trigger: 5.5,
    name: '立体感提升方向',
    procedures: ['玻尿酸填充', '鼻综合', '下巴填充'],
    description: '玻尿酸作为透明质酸类填充剂，可温和提升面部立体感，具有可溶解性。',
    suitable: '鼻梁偏平、下巴后缩',
    recovery: '3-7天（轻微肿胀）',
    caution: '选择正规医疗机构，确保使用透明质酸酶可溶解产品',
    improvement: { score: 0.6, time: '即时见效' },
    detailedInfo: '玻尿酸填充是临床上最常用的面部轮廓优化手段，其主要成分是人体天然存在的透明质酸。\n\n① 适用部位：鼻梁、下巴、额头、太阳穴\n② 维持时间：6-18个月（根据产品型号）\n③ 可逆性：可使用透明质酸酶溶解\n④ 注意事项：要求医生的美学设计能力'
  },
  eyeType: {
    trigger: 5.5,
    name: '眼部优化方向',
    procedures: ['双眼皮手术', '开眼角', '卧蚕填充'],
    description: '双眼皮手术分为埋线法（可逆、恢复快）和切割法（永久、适合皮肤松弛者）。',
    suitable: '单眼皮、内双、眼型改善需求',
    recovery: '埋线1周，切割2-4周',
    caution: '术前需面诊确定适合术式',
    improvement: { score: 0.7, time: '恢复期后' },
    detailedInfo: '双眼皮手术是东亚最常见的眼部整形手术，目标是创造自然的压线或折叠。\n\n① 埋线法优缺点：创伤小、可逆，但持久性较差\n② 全切开优缺点：效果永久，但恢复期较长\n③ 美学设计：宽度、弧度、起始点需个性化\n④ 注意事项：选择有经验的眼部整形专科医生'
  },
  youthfulness: {
    trigger: 5.0,
    name: '抗老紧致方向',
    procedures: ['水光针', '射频紧肤', '胶原蛋白填充'],
    description: '水光针通过将透明质酸等营养成分注入真皮层，改善皮肤水润度和细纹。',
    suitable: '初老痕迹、皮肤干燥缺水',
    recovery: '1-3天（针眼印记）',
    caution: '需定期维护，通常3-4周一次',
    improvement: { score: 0.4, time: '3次疗程后' },
    detailedInfo: '水光针通过负压注射技术，将营养液精准地注入到真皮浅层，实现深层补水。\n\n① 常见成分：透明质酸、维生C、谷胱甘肽等\n② 疗程建议：强化期3-5次，每次2-4周间隔\n③ 维持期：每1-3个月一次\n④ 不适宜人群：耽瘡瞎性皮肤、孕妇、突破性痤疮期'
  }
};

// ========== 护肤建议增强数据 ==========
export const SKINCARE_ADVICE_TEMPLATES = {
  hydration: {
    icon: '💧',
    title: '补水保湿',
    improvement: { score: 0.2, time: '2-4周' },
    detailedInfo: '皮肤水分不足会导致细纹、暗沉、紧绷感。透明质酸可吸收自身1000倍重量的水分。',
    schedule: {
      morning: {
        time: '07:00-07:30',
        steps: [
          { time: '07:00', action: '温水洁面，轻柔按摩60秒', duration: 2 },
          { time: '07:03', action: '化妆水湿敷拍打，连拍3遍至吸收', duration: 3 },
          { time: '07:07', action: '透明质酸精华液（2-3滴）全脸按压', duration: 2 },
          { time: '07:10', action: '乳液薄涂，从中间向外推开', duration: 2 },
          { time: '07:13', action: '防晒霜（一元硬币大小）均匀涂抹', duration: 2 }
        ]
      },
      evening: {
        time: '21:30-22:00',
        steps: [
          { time: '21:30', action: '卸妆油乳化按摩60秒', duration: 2 },
          { time: '21:33', action: '氨基酸洁面温和清洁', duration: 2 },
          { time: '21:36', action: '化妆水湿敷或拍打吸收', duration: 3 },
          { time: '21:40', action: '浓缩补水精华（含神经酰胺）', duration: 3 },
          { time: '21:45', action: '保湿面霜封层锁水', duration: 2 },
          { time: '21:50', action: '眼霜轻柔按压眼周', duration: 2 }
        ]
      },
      weekly: [
        { day: '周一、周四', action: '补水面膜15分钟', time: '21:00' },
        { day: '周日', action: '深层清洁面膜', time: '20:30' }
      ]
    },
    keyIngredients: ['透明质酸', '神经酰胺', '角鲨烷', '甘油']
  },
  brightening: {
    icon: '✨',
    title: '提亮淡斑',
    improvement: { score: 0.3, time: '4-8周' },
    detailedInfo: '肤色不均、暗沉、色斑等问题需要综合的美白护理方案。',
    schedule: {
      morning: {
        time: '07:00-07:30',
        steps: [
          { time: '07:00', action: '温水洁面，轻柔按摩', duration: 2 },
          { time: '07:03', action: '维C精华液全脸涂抹', duration: 3 },
          { time: '07:07', action: '保湿乳液充分吸收', duration: 2 },
          { time: '07:10', action: 'SPF50+ PA+++防晒（重点！）', duration: 3 }
        ]
      },
      evening: {
        time: '21:30-22:15',
        steps: [
          { time: '21:30', action: '卸妆+洁面双重清洁', duration: 5 },
          { time: '21:36', action: '传明酸化妆水湿敷', duration: 5 },
          { time: '21:42', action: '烟酰胺5%精华液全脸', duration: 3 },
          { time: '21:46', action: '美白面霜封层', duration: 2 },
          { time: '21:50', action: '淡斑眼霜重点涂抹', duration: 2 }
        ]
      },
      weekly: [
        { day: '周二、周五', action: '美白精华面膜20分钟', time: '21:00' },
        { day: '周日', action: '去角质护理（温和型）', time: '20:30' }
      ]
    },
    keyIngredients: ['烟酰胺', '维生C', '传明酸', '熊果苷', '曲酸']
  },
  antiAging: {
    icon: '🕒',
    title: '抗老护理',
    improvement: { score: 0.4, time: '8-12周' },
    detailedInfo: '抗老需要从抵御、修复、再生三个层面综合作用。',
    schedule: {
      morning: {
        time: '07:00-07:30',
        steps: [
          { time: '07:00', action: '温和洁面，不过度清洁', duration: 2 },
          { time: '07:03', action: '抗氧化精华（维C/白藜芦醇）', duration: 3 },
          { time: '07:07', action: '胜肽面霜促进胶原生成', duration: 3 },
          { time: '07:12', action: '眼霜SPF保护眼周', duration: 2 },
          { time: '07:15', action: 'SPF50+防晒（抗老核心）', duration: 3 }
        ]
      },
      evening: {
        time: '21:00-21:45',
        steps: [
          { time: '21:00', action: '卸妆+洁面双重清洁', duration: 5 },
          { time: '21:06', action: '视黄醇精华（从低浓度开始）', duration: 3 },
          { time: '21:10', action: '等待20分钟充分吸收', duration: 20 },
          { time: '21:32', action: '修复面霜封层保护', duration: 2 },
          { time: '21:35', action: '抗皱眼霜按摩眼周', duration: 3 }
        ]
      },
      weekly: [
        { day: '周三、周六', action: '胶原蛋白面膜', time: '21:00' },
        { day: '周日', action: '居家护理日（拉提按摩）', time: '20:00' }
      ]
    },
    keyIngredients: ['视黄醇', '胜肽', '维生C', '辅酶Q10', '白藜芦醇']
  },
  acne: {
    icon: '🧹',
    title: '控油祛痘',
    improvement: { score: 0.3, time: '4-6周' },
    detailedInfo: '痘痘管理需要控油、疏通、消炎的综合方案。',
    schedule: {
      morning: {
        time: '07:00-07:20',
        steps: [
          { time: '07:00', action: '氨基酸洁面温和清洁', duration: 2 },
          { time: '07:03', action: '控油爽肤水收缩毛孔', duration: 2 },
          { time: '07:06', action: '清爽型乳液（避免厚重）', duration: 2 },
          { time: '07:09', action: '清爽防晒（无油配方）', duration: 2 }
        ]
      },
      evening: {
        time: '21:30-22:00',
        steps: [
          { time: '21:30', action: '卸妆+氨基酸洁面', duration: 5 },
          { time: '21:36', action: '水杨酸棉片湿敷T区（5分钟）', duration: 5 },
          { time: '21:42', action: '壬二酸精华全脸涂抹', duration: 3 },
          { time: '21:46', action: '祛痘凝胶点涂痘痘', duration: 2 },
          { time: '21:50', action: '无油保湿凝露薄涂', duration: 2 }
        ]
      },
      weekly: [
        { day: '周二、周五', action: '泥状清洁面膜（15分钟）', time: '21:00' },
        { day: '周日', action: '去角质（视肌肤状态）', time: '20:30' }
      ]
    },
    keyIngredients: ['水杨酸', '壬二酸', '茶树精油', '烟酰胺']
  },
  sensitive: {
    icon: '🌸',
    title: '舒缓修护',
    improvement: { score: 0.2, time: '4-6周' },
    detailedInfo: '敏感肌需要简化护理步骤，重点在于修复皮肤屏障。',
    schedule: {
      morning: {
        time: '07:30-07:45',
        steps: [
          { time: '07:30', action: '清水洗脸或超温和洁面', duration: 2 },
          { time: '07:33', action: '舒缓化妆水轻拍', duration: 2 },
          { time: '07:36', action: '修护面霜（神经酰胺配方）', duration: 2 },
          { time: '07:40', action: '物理防晒（温和不刺激）', duration: 2 }
        ]
      },
      evening: {
        time: '21:30-21:50',
        steps: [
          { time: '21:30', action: '温和卸妆乳清洁', duration: 3 },
          { time: '21:34', action: '不起泡洁面乳清洁', duration: 2 },
          { time: '21:37', action: '积雪草精华舒缓修复', duration: 3 },
          { time: '21:41', action: '修护面霜加强封层', duration: 2 },
          { time: '21:45', action: '修护精华油封层（可选）', duration: 2 }
        ]
      },
      weekly: [
        { day: '周三', action: '舒缓补水面膜', time: '21:00' },
        { day: '周日', action: '修护日（简化护理）', time: '全天' }
      ]
    },
    keyIngredients: ['神经酰胺', '积雪草', '角鲨烷', '甘草酸二钾']
  },
  sunProtection: {
    icon: '☀️',
    title: '防晒保护',
    improvement: { score: 0.3, time: '持续使用' },
    detailedInfo: '防晒是抗老美白的基础，80%的皮肤老化来自紫外线。',
    schedule: {
      morning: {
        time: '07:00-07:15',
        steps: [
          { time: '07:00', action: '基础护肤（洁面+保湿）', duration: 8 },
          { time: '07:09', action: '防晒霜一元硬币量', duration: 2 },
          { time: '07:12', action: '等待15分钟成膜后上妆', duration: 1 }
        ]
      },
      daytime: {
        time: '每2小时',
        steps: [
          { time: '10:00', action: '户外补涂防晒', duration: 2 },
          { time: '12:00', action: '户外补涂防晒', duration: 2 },
          { time: '14:00', action: '户外补涂防晒', duration: 2 },
          { time: '16:00', action: '户外补涂防晒', duration: 2 }
        ]
      },
      tips: [
        '室内靠窗也需要防晒',
        '阴天同样需要防晒',
        '化学防晒需出门15分钟前涂抹'
      ]
    },
    keyIngredients: ['氧化锌', '二氧化钛', '水杨酸乙基己酯']
  }
};

// ========== 彩妆建议增强数据 ==========
export const MAKEUP_ADVICE_TEMPLATES = {
  contour: {
    icon: '💎',
    title: '修容轮廓',
    improvement: { visualScore: 0.5, time: '即时见效' },
    detailedInfo: '修容是通过明暗对比塑造立体感，可视觉改善脸型。\n\n① 工具：斜角修容刷 + 哑光修容盘\n② 方法：三庭五眼定位、自然晃染\n③ 色号：比肤色深2个色号\n④ 注意：避免边界明显，充分晃开'
  },
  eyeMakeup: {
    icon: '👁️',
    title: '眼妆强化',
    improvement: { visualScore: 0.6, time: '即时见效' },
    detailedInfo: '眼妆是整体妆容的灵魂，可以根据眼型进行针对性强化。\n\n① 打底：眼部打底覆盖暗沉\n② 眼影：加深眼窝、模化卧蚕\n③ 眼线：贴着睡毛、眼尾上扬\n④ 睢毛：多层薄涂不结块'
  },
  lipColor: {
    icon: '💄',
    title: '唇部设计',
    improvement: { visualScore: 0.4, time: '即时见效' },
    detailedInfo: '唇色能瞈间提亮整体气色，选择适合的色号很重要。\n\n① 肉桐色系：日常安全色\n② 豆沙/红棕色：白皙首选\n③ 正红色：气场担当\n④ 唇质：哑光精致，水光元气'
  }
};

// ========== 打卡任务 ==========
export const CHECKIN_TASKS = [
  { day: 1, task: '晚间使用烟酰胺精华', icon: '💧' },
  { day: 2, task: 'SPF50 防晒不间断', icon: '☀️' },
  { day: 3, task: '清洁面膜深层清洁', icon: '🧖' },
  { day: 4, task: '补水面膜急救保湿', icon: '💦' },
  { day: 5, task: '眼霜按摩护理', icon: '👁️' },
  { day: 6, task: '去角质或酸类护理', icon: '✨' },
  { day: 7, task: '完成一周护肤总结', icon: '📝' }
];

// ========== 东亚平均参考值 ==========
export const AVG_SCORES = {
  symmetry: 6.2,
  proportion: 6.0,
  faceShape: 5.8,
  eyeType: 6.1,
  skinTone: 6.3,
  definition: 5.5,
  youthfulness: 6.0,
  harmony: 6.2
};

// ========== 辅助函数 ==========

/**
 * 根据分数获取段位信息
 * @param {number} score - 总分
 * @returns {Object} 段位信息
 */
export function getRankByScore(score) {
  for (const rank of RANK_MAP) {
    if (score >= rank.min) {
      return rank;
    }
  }
  return RANK_MAP[RANK_MAP.length - 1];
}

/**
 * 计算加权总分
 * @param {Object} dimensions - 各维度分数
 * @param {string} region - 地区代码
 * @returns {number} 加权总分
 */
export function calculateTotalScore(dimensions, region = 'china') {
  const baseWeights = SCORE_WEIGHTS.base;
  const delta = SCORE_WEIGHTS.delta[region] || {};
  
  let total = 0;
  for (const [key, baseWeight] of Object.entries(baseWeights)) {
    const adjustedWeight = baseWeight + (delta[key] || 0);
    const score = dimensions[key]?.score || dimensions[key] || 0;
    total += score * adjustedWeight;
  }
  
  // 底线保护
  return Math.max(total, 4.0);
}

/**
 * 获取分数对应的颜色等级
 * @param {number} score - 分数
 * @returns {string} 颜色等级 high/medium/low
 */
export function getScoreLevel(score) {
  if (score >= 7.5) return 'high';
  if (score >= 5.5) return 'medium';
  return 'low';
}

/**
 * 估算百分位排名
 * @param {number} score - 总分
 * @returns {number} 百分位
 */
export function estimatePercentile(score) {
  // 基于正态分布估算
  const mean = 6.0;
  const stdDev = 1.2;
  const z = (score - mean) / stdDev;
  
  // 简化的 CDF 近似
  const percentile = Math.round(50 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI))));
  
  return Math.max(1, Math.min(99, percentile));
}

/**
 * 缓动函数
 */
export const EASING = {
  easeOutCubic: t => 1 - Math.pow(1 - t, 3),
  easeInCubic: t => t * t * t,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: t => 1 - Math.pow(1 - t, 4),
  easeOutBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};
