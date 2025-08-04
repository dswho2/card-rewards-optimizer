// src/lib/loadUserCards.ts
import { getUserCards } from '@/app/api/user';
import { useCardsStore } from '@/store/useCardsStore';

export async function loadUserCardsToStore() {
  try {
    const cards = await getUserCards();
    const setCards = useCardsStore.getState().setCards;
    setCards(cards);
  } catch (err) {
    console.error('Failed to load user cards after login:', err);
  }
}
