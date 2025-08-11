// src/app/cards/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

import type { Card } from '@/types';
import { useCardsStore } from '@/store/useCardsStore';
import CreditCardItem from '@/components/CreditCardItem';
import AddCardModal from '@/components/AddCardModal';
import { removeUserCard } from '@/app/api/user';
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

interface SortableCardProps {
  card: Card;
  editMode: boolean;
  onDelete: (id: string) => void;
}

function SortableCard({ card, editMode, onDelete }: SortableCardProps) {
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
      <CreditCardItem card={card} editMode={editMode} onDelete={onDelete} />
    </div>
  );
}

export default function CardsPage() {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const cards = useCardsStore((state) => state.cards);
  const removeCard = useCardsStore((state) => state.removeCard);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!isLoggedIn) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Your Cards</h2>
        <p className="text-gray-600 dark:text-gray-300">Log in to view and manage your saved cards.</p>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Your Cards</h2>
        <p className="text-gray-600 dark:text-gray-300">You don&apos;t have any cards saved yet. Click &quot;Add New Card&quot; to get started.</p>
        <button
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          Add New Card
        </button>
        {showModal && <AddCardModal onClose={() => setShowModal(false)} />}
      </main>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = cards.findIndex(c => c.id === active.id);
      const newIndex = cards.findIndex(c => c.id === over?.id);
      useCardsStore.getState().setCards(arrayMove(cards, oldIndex, newIndex));
    }
  }

  const handleDelete = async (cardId: string) => {
    removeCard(cardId);
    try {
      await removeUserCard(cardId);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Your Cards</h2>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-6">
            {cards.map((card) => (
              <SortableCard key={card.id} card={card} editMode={editMode} onDelete={handleDelete} />
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
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          Add New Card
        </button>
      </div>

      {showModal && <AddCardModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
