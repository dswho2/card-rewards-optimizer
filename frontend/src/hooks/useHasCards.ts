// src/hooks/useHasCards.ts
import { useCardsStore } from '@/store/useCardsStore';

export function useHasCards() {
  const cards = useCardsStore((state) => state.cards);
  return { cards, hasCards: cards.length > 0 };
}
