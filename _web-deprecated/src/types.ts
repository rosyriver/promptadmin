export interface ExtraImage {
  mediaUrl: string;
  fileKey?: string;
}

export interface PromptCase {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  fileKey?: string;
  extraImages?: ExtraImage[];
  prompt: string;
  tags: string[];
  sourceUrl?: string;
  author?: string;
  model?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
}

export const PRESET_TAGS = [
  '电影感', '国风', '产品图', '小红书', '雨夜', '人物',
  '极简', '真实摄影', '插画', '赛博朋克', '广告片', '短视频',
  '海报', '光影', '复古',
];

export const MODEL_OPTIONS = [
  'Midjourney', 'GPT Image', 'Sora', 'Runway', 'Kling', 'Pika',
];
