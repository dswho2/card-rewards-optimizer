// src/components/CreditCardItem.tsx
'use client';

import { useState } from 'react';
import { SquareX, GripVertical } from 'lucide-react';
import Image from 'next/image';
import type { Card, Reward } from '@/types';

interface CardProps {
  card: Card;
  editMode?: boolean;
  onDelete?: (id: string) => void;
  rightContent?: React.ReactNode;
  reasoning?: string;
  issuer?: string;
  className?: string;
}

export default function CreditCardItem({
  card,
  editMode = false,
  onDelete,
  rightContent,
  reasoning,
  issuer,
  className = ""
}: CardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const formatRewards = (rewards: Reward[]) => {
    if (!rewards || rewards.length === 0) return 'No rewards';

    // Deduplicate rewards by category and multiplier
    const uniqueRewards = rewards.filter((reward, index, arr) =>
      arr.findIndex(r => r.category === reward.category && r.multiplier === reward.multiplier) === index
    );

    // Sort by multiplier from highest to lowest
    return uniqueRewards
      .sort((a, b) => b.multiplier - a.multiplier)
      .map((reward) => `${reward.multiplier}x ${reward.category}`)
      .join(', ');
  };

  const formatConditions = (rewards: Reward[]): string | null => {
    if (!rewards || rewards.length === 0) return null;

    const conditions: string[] = [];
    rewards.forEach(reward => {
      if (reward.portal_only) {
        conditions.push('Portal booking required');
      }
      if (reward.cap) {
        conditions.push(`$${reward.cap} annual spending cap`);
      }
    });

    return conditions.length > 0 ? conditions.join(', ') : null;
  };

  return (
    <div className={`relative flex flex-col md:flex-row gap-4 p-4 border rounded shadow dark:bg-gray-800 ${className}`}>
        {editMode && (
            <>
                {/* Delete circle (top left) */}
                <button
                className="absolute top-1 left-1 text-red-600 hover:text-red-800"
                aria-label="Delete card"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(card.id);
                }}
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

        <div className="relative w-full md:w-48 h-32 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
          {card.image_url && !imageError ? (
            <Image
              src={card.image_url}
              alt={card.name}
              fill
              className="object-contain"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 192px"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
              <div className="text-center p-4">
                <div className="text-2xl mb-2">💳</div>
                <div className="text-xs">
                  {card.network ? `${card.network} Card` : 'Credit Card'}
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {card.image_url && !imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          )}
        </div>

        <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1">{card.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {issuer || card.issuer}
            </p>

            {reasoning ? (
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                {reasoning.split('\n').map((line: string, index: number) => (
                  <div
                    key={index}
                    className={`mb-1 ${line.startsWith('•') ? 'text-orange-600 dark:text-orange-400' : ''}`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <strong>Rewards:</strong> {formatRewards(card.rewards)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <strong>Annual Fee:</strong> ${card.annual_fee}
                </p>
                {formatConditions(card.rewards) && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <strong>Conditions:</strong> {formatConditions(card.rewards)}
                  </p>
                )}
                {card.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Notes:</strong> {card.notes}
                  </p>
                )}
              </>
            )}
        </div>

        {rightContent && (
          <div className="text-right ml-4">
            {rightContent}
          </div>
        )}
    </div>
  );
}