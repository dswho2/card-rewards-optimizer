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

export type Rewards = {
  [key in Category]?: number;
};

export interface Card {
  id: string;
  name: string;
  image_url: string;
  rewards: Rewards;
  annual_fee: number;
  notes: string;
}
