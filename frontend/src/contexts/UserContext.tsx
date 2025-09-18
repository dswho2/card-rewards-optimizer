'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { getUserCards } from '@/app/api/user';
import { useAuthState } from '@/hooks/useAuthState';
import type { Card } from '@/types';

interface UserState {
  cards: Card[];
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

interface UserContextValue extends UserState {
  refetchCards: () => Promise<void>;
  addCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  clearUserData: () => void;
}

type UserAction = 
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Card[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'ADD_CARD'; payload: Card }
  | { type: 'REMOVE_CARD'; payload: string }
  | { type: 'CLEAR_DATA' };

const initialState: UserState = {
  cards: [],
  loading: false,
  error: null,
  lastFetch: null,
};

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        cards: action.payload,
        error: null,
        lastFetch: new Date(),
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'ADD_CARD':
      return {
        ...state,
        cards: [...state.cards, action.payload],
      };
    case 'REMOVE_CARD':
      return {
        ...state,
        cards: state.cards.filter(card => card.id !== action.payload),
      };
    case 'CLEAR_DATA':
      return initialState;
    default:
      return state;
  }
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const { isLoggedIn, userId, mounted } = useAuthState();

  // Fetch user cards when user logs in
  const fetchCards = useCallback(async () => {
    console.log('[UserContext] fetchCards called:', { isLoggedIn, userId });
    if (!isLoggedIn || !userId) {
      console.log('[UserContext] Not fetching - not logged in or no userId');
      return;
    }

    console.log('[UserContext] Starting to fetch user cards...');
    dispatch({ type: 'FETCH_START' });
    try {
      const cards = await getUserCards();
      console.log('[UserContext] Successfully fetched cards:', cards.length);
      dispatch({ type: 'FETCH_SUCCESS', payload: cards });
    } catch (error) {
      console.error('[UserContext] Failed to fetch user cards:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load your cards';
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
    }
  }, [isLoggedIn, userId]);

  // Auto-fetch cards when user logs in
  useEffect(() => {
    console.log('[UserContext] useEffect triggered:', { mounted, isLoggedIn, userId, cardsCount: state.cards.length, lastFetch: state.lastFetch });
    
    if (!mounted) {
      console.log('[UserContext] Not mounted yet, skipping');
      return;
    }

    if (isLoggedIn && userId) {
      // Only fetch if we don't have recent data (avoid unnecessary calls)
      const shouldFetch = !state.lastFetch || 
        (Date.now() - state.lastFetch.getTime()) > 5 * 60 * 1000; // 5 minutes

      console.log('[UserContext] User is logged in, shouldFetch:', shouldFetch, 'cardsLength:', state.cards.length);

      if (shouldFetch || state.cards.length === 0) {
        console.log('[UserContext] Triggering fetchCards');
        fetchCards();
      } else {
        console.log('[UserContext] Using cached cards');
      }
    } else {
      console.log('[UserContext] User not logged in, clearing data');
      // Clear data when user logs out
      dispatch({ type: 'CLEAR_DATA' });
    }
  }, [mounted, isLoggedIn, userId]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: UserContextValue = useMemo(() => ({
    ...state,
    refetchCards: fetchCards,
    addCard: (card: Card) => dispatch({ type: 'ADD_CARD', payload: card }),
    removeCard: (cardId: string) => dispatch({ type: 'REMOVE_CARD', payload: cardId }),
    clearUserData: () => dispatch({ type: 'CLEAR_DATA' }),
  }), [state, fetchCards]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}