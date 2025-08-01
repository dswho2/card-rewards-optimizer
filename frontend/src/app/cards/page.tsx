// src/app/cards/page.tsx
"use client";
import { useState, useEffect } from 'react';

import type { Card } from '@/types';

import { getUserCards } from '@/api/user';
import { useCardsStore } from '@/store/useCardsStore';

import CreditCardItem from '@/components/CreditCardItem';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableCard({ card, editMode }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(editMode ? { ...attributes, ...listeners } : {})}
    >
      <CreditCardItem card={card} editMode={editMode} />
    </div>
  );
}

export default function CardsPage() {
  const [editMode, setEditMode] = useState(false);

  const cards = useCardsStore((state) => state.cards);
  const setCards = useCardsStore((state) => state.setCards);

  useEffect(() => {
    const loadCards = async () => {
      const fetched: Card[] = await getUserCards();
      setCards(fetched);
    };
    loadCards();
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = cards.findIndex(c => c.id === active.id);
      const newIndex = cards.findIndex(c => c.id === over?.id);
      setCards(arrayMove(cards, oldIndex, newIndex));
    }
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Your Cards</h2>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-6">
            {cards.map((card) => (
              <SortableCard key={card.id} card={card} editMode={editMode} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex justify-between mt-10">
        <button
          className="border px-4 py-2 rounded"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit Cards'}
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add New Card
        </button>
      </div>
    </main>
  );
}
