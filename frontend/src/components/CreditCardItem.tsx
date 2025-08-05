// src/components/CreditCardItem.tsx
'use client';

import { SquareX, GripVertical } from 'lucide-react';
import type { Card } from '@/types';

interface CardProps {
  card: Card;
  editMode: boolean;
}

export default function CreditCardItem({ card, editMode }: CardProps) {
  return (
    <div className="relative flex flex-col md:flex-row gap-4 p-4 border rounded shadow dark:bg-gray-800">
        {editMode && (
            <>
                {/* Delete circle (top left) */}
                <button
                className="absolute top-1 left-1 text-red-600 hover:text-red-800"
                aria-label="Delete card"
                >
                <SquareX size={24} />
                </button>

                {/* Drag handle (top right) */}
                <div
                className="absolute top-2 right-2 text-gray-400 cursor-move select-none"
                aria-label="Drag handle"
                >
                <GripVertical size={18} />
                </div>
            </>
            )}
        <img
            src={card.image_url}
            alt={card.name}
            className="w-full md:w-48 h-auto object-contain border rounded"
        />
        <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1">{card.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            <strong>Rewards:</strong>{" "}
            {Object.entries(card.rewards)
                .map(([category, multiplier]) => `${multiplier}x ${category}`)
                .join(', ')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            <strong>Annual Fee:</strong> {card.annual_fee}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Notes:</strong> {card.notes}
            </p>
        </div>
    </div>
  );
}