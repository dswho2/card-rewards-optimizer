//src/store/useCardsStore.ts

import { create } from 'zustand';

import type { Card } from '@/types';

interface CardStore {
  cards: Card[];
  setCards: (cards: Card[]) => void;
  updateCardOrder: (reordered: Card[]) => void;
  removeCard: (id: string) => void;
}

export const useCardsStore = create<CardStore>((set) => ({
  cards: [],
  setCards: (cards) => set({ cards }),
  updateCardOrder: (reordered) => set({ cards: reordered }),
  removeCard: (id) => set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),
}));