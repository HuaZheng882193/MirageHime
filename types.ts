
export interface Accessory {
  id: string;
  name: string;
  image: string;
  category: 'ring' | 'necklace' | 'bracelet' | 'hairpin' | 'wand';
  tag?: string;
  rarity?: string;
  rating: number;
  description: string;
}

export interface HandAnalysis {
  shape: string;
  features: string[];
  recommendations: string;
  recommendedTypes: string[]; // 仅保留首饰类型名称
  magicChant?: string; // 魔导语
}

export type AppTab = 'home' | 'tryon' | 'wishlist' | 'menu' | 'profile';
