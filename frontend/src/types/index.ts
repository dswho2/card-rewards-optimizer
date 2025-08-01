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
  image: string;
  rewards: Rewards;
  annualFee: string;
  notes: string;
}
