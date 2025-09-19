// src/api/user.ts

import type { Card } from '@/types';

// ApiCard is now just an alias since Card includes all necessary fields
export type ApiCard = Card;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const getUserCards = async (): Promise<Card[]> => {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${API_BASE_URL}/api/user-cards`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch user cards');

  const data = await res.json();
  return data.cards;
};

export const saveUserCard = async (
  cardId: string
): Promise<{ success: boolean; message?: string }> => {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    throw new Error('You need to log in to save cards');
  }

  if (!cardId) {
    throw new Error('Card ID is required');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/user-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ card_id: cardId }),
    });

    const data: { success: boolean; message?: string } = await res.json();
    
    if (!res.ok) {
      let errorMessage = 'Failed to save card';
      if (res.status === 401) {
        errorMessage = 'You need to log in again';
      } else if (res.status === 400) {
        errorMessage = data.message || 'Invalid request';
      } else if (res.status === 409) {
        errorMessage = 'Card is already in your collection';
      }
      throw new Error(errorMessage);
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to save card');
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
};

export const removeUserCard = async (cardId: string): Promise<{ success: boolean; message?: string }> => {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    throw new Error('You need to log in to delete cards');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/user-cards/${cardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      // Provide more specific error messages based on status code
      let errorMessage = 'Failed to delete card';
      if (res.status === 400) {
        errorMessage = data.error || 'Invalid card ID';
      } else if (res.status === 401) {
        errorMessage = 'You need to log in again';
      } else if (res.status === 404) {
        errorMessage = 'Card not found in your collection';
      } else if (res.status === 500) {
        errorMessage = 'Server error - please try again';
      }
      
      throw new Error(errorMessage);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete card');
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
};

export const getCardRecommendation = async (
  description: string,
  amount?: number,
  date?: string,
  userId?: string,
  detectionMethod?: string
): Promise<import('@/types').RecommendationResponse> => {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${API_BASE_URL}/api/recommend-card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      description,
      amount,
      date: date || new Date().toISOString(),
      userId,
      detectionMethod
      // Backend logic: if detectionMethod is specified, bypass cache automatically
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get recommendation: ${errorText}`);
  }
  
  return await res.json();
};

// Legacy function for backward compatibility
export const getCardRec = async (description: string): Promise<string> => {
  const recommendation = await getCardRecommendation(description);
  return recommendation.category;
};

export const searchCards = async (params: {
  search?: string;
  annual_fee?: string;
  issuer?: string;
  network?: string;
  reward_category?: string;
}): Promise<ApiCard[]> => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.annual_fee) query.append('annual_fee', params.annual_fee);
  if (params.issuer) query.append('issuer', params.issuer);
  if (params.network) query.append('network', params.network);
  if (params.reward_category) query.append('reward_category', params.reward_category);

  const res = await fetch(`${API_BASE_URL}/api/cards?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch cards');
  }

  const data = await res.json();
  return data.cards || [];
};

export const analyzePortfolio = async (
  mode: 'auto' | 'category',
  category?: string
): Promise<{
  mode: 'auto' | 'category';
  category?: string;
  gaps?: unknown[];
  userCurrentCards?: unknown[];
  marketLeaders?: unknown[];
  analysis?: unknown;
  recommendations?: unknown[];
  summary?: unknown;
  analyzedAt: string;
}> => {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    throw new Error('You need to log in to use portfolio analysis');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/cards/analyze-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        mode,
        category: mode === 'category' ? category : undefined
      }),
    });

    if (!res.ok) {
      let errorMessage = 'Portfolio analysis failed';
      if (res.status === 401) {
        errorMessage = 'You need to log in again';
      } else if (res.status === 400) {
        const data = await res.json();
        errorMessage = data.error || 'Invalid request';
      } else if (res.status === 500) {
        errorMessage = 'Server error - please try again';
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
};