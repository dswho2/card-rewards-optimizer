// src/types/index.ts

export type Category =
  | 'Grocery'
  | 'Dining'
  | 'Gas'
  | 'Travel'
  | 'Online'
  | 'Entertainment'
  | 'Transit'
  | 'Utilities'
  | 'All';

export interface Reward {
  category: Category;
  multiplier: number;
  reward_type?: string;
  cap?: number | null;
  portal_only?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string;
}

export interface Card {
  id: string;
  name: string;
  image_url: string;
  rewards: Reward[];
  annual_fee: number;
  notes?: string;
}
