// src/api/user.ts

import type { Card } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const getUserCards = async () => {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${API_BASE_URL}/api/user-cards`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch user cards');
  return res.json();
};

export const saveUserCards = async (cards: Card[]) => {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${API_BASE_URL}/api/user-cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ cards }),
  });

  const data: { success: boolean; message?: string } = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to save cards');
  }

  return data;
};

export const getCardRec = async (description: string): Promise<string> => {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${API_BASE_URL}/api/recommend-card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) throw new Error('Failed to get recommendation');
  
  const { data }: { data: { category: string } } = await res.json();
  return data.category;
};
