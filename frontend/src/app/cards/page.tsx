// src/app/cards/page.tsx
"use client";
import React, { useState, useCallback } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { useUser } from '@/contexts/UserContext';

import type { Card } from '@/types';
import CreditCardItem from '@/components/CreditCardItem';
import AddCardModal from '@/components/AddCardModal';
import ConfirmationModal from '@/components/ConfirmationModal';
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

const SortableCard = React.memo(function SortableCard({ card, editMode, onDelete }: SortableCardProps) {
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
});

export default function CardsPage() {
  // ✅ CORRECT: All hooks called at the top level before any conditions
  const [editMode, setEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isLoggedIn, mounted } = useAuthState();
  const { cards, loading, refetchCards, removeCard: removeCardFromContext } = useUser();

  // ✅ CORRECT: Move useCallback to top level with other hooks
  const handleDeleteClick = useCallback((cardId: string) => {
    setCardToDelete(cardId);
    setShowConfirmModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!cardToDelete) return;
    
    setIsDeleting(true);
    try {
      // Optimistically remove from context
      removeCardFromContext(cardToDelete);
      
      // Try to delete from server
      await removeUserCard(cardToDelete);
      
      // Success - close modal
      setShowConfirmModal(false);
      setCardToDelete(null);
      console.log('Card successfully deleted');
      
    } catch (error) {
      console.error('Failed to delete card:', error);
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete card';
      alert(`Error: ${errorMessage}`);
      
      // Revert the optimistic update by refetching all cards
      // This ensures we have the correct state from the server
      await refetchCards();
      
      // Close modal
      setShowConfirmModal(false);
      setCardToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }, [cardToDelete, removeCardFromContext, refetchCards]);

  const handleDeleteCancel = useCallback(() => {
    setShowConfirmModal(false);
    setCardToDelete(null);
  }, []);

  const handleModalClose = useCallback(async () => {
    setShowModal(false);
    // Refresh cards list after modal closes (in case a card was added)
    await refetchCards();
  }, [refetchCards]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = cards.findIndex(c => c.id === active.id);
      const newIndex = cards.findIndex(c => c.id === over?.id);
      // For now, we'll just update locally. In a real app, you might want to save the order to the backend
      const reorderedCards = arrayMove(cards, oldIndex, newIndex);
      // Note: This would require adding an action to the context to handle reordering
      console.log('Card reordered:', { oldIndex, newIndex });
    }
  }, [cards]);

  // ✅ CORRECT: Conditional rendering without early returns
  // Show loading state during hydration
  if (!mounted) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Your Cards</h2>
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Your Cards</h2>
        <p className="text-gray-600 dark:text-gray-300">Log in to view and manage your saved cards.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Your Cards</h2>
        <p className="text-gray-600 dark:text-gray-300">Loading your cards...</p>
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
        {showModal && <AddCardModal onClose={handleModalClose} />}
      </main>
    );
  }


  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Your Cards</h2>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-6">
            {cards.map((card) => (
              <SortableCard key={card.id} card={card} editMode={editMode} onDelete={handleDeleteClick} />
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

      {showModal && <AddCardModal onClose={handleModalClose} />}
      
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Remove Card"
        message={
          cardToDelete 
            ? `Are you sure you want to remove "${cards.find(c => c.id === cardToDelete)?.name || 'this card'}" from your collection? This action cannot be undone.`
            : 'Are you sure you want to remove this card from your collection? This action cannot be undone.'
        }
        confirmText="Remove Card"
        cancelText="Keep Card"
        type="danger"
        loading={isDeleting}
      />
    </main>
  );
}
