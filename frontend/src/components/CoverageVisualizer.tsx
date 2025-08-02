// src/components/CoverageVisualizer.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Rewards } from '@/types';

interface Card {
  id: string;
  name: string;
  image: string;
  rewards: Rewards;
  annualFee: string;
  notes: string;
}

interface Props {
  cards: Card[];
}

const allCategories = [
  'Grocery',
  'Dining',
  'Gas',
  'Travel',
  'Online',
  'Entertainment',
  'Transit',
  'Utilities',
];

function DraggableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const lockedTransform = transform
    ? { ...transform, x: 0, scaleX: 1, scaleY: 1 }
    : { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  const style = {
    transform: CSS.Transform.toString(lockedTransform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="cursor-move"
    >
      {children}
    </tr>
  );
}

export default function CoverageVisualizer({ cards }: Props) {
  const [sortedCards, setSortedCards] = useState<Card[]>(cards);

  useEffect(() => {
    setSortedCards(cards);
  }, [cards]);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<string[]>(allCategories);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [categoryOrder, setCategoryOrder] = useState(allCategories);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const toggleCategory = (cat: string) => {
    setVisibleCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSelectAll = () => setVisibleCategories([...allCategories]);
  const handleClearAll = () => setVisibleCategories([]);
  const handleResetCategoryOrder = () => setCategoryOrder(allCategories);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (categoryOrder.includes(active.id as string)) {
      const oldIndex = categoryOrder.indexOf(active.id as string);
      const newIndex = categoryOrder.indexOf(over.id as string);
      setCategoryOrder(arrayMove(categoryOrder, oldIndex, newIndex));
    }
  };

  const sortedCategories = categoryOrder.filter((cat) => visibleCategories.includes(cat));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto relative min-h-[400px]">
        <div className="absolute z-10" ref={dropdownRef}>
          <div className="relative">
            <button
              className="p-2 text-left w-[130px] sticky left-0 bg-white dark:bg-slate-950 flex items-center gap-1"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              Category <span className="text-sm">▼</span>
            </button>
                        <button
              className="mt-1 p-1 w-[130px] sticky left-0 bg-zinc-100 dark:bg-zinc-800 text-sm text-center border border-zinc-300 dark:border-zinc-700 rounded"
              onClick={() => {
                const bestCardsPerCategory = sortedCategories.map((category) => {
                  let bestCard = cards[0];
                  let bestReward = 0;
                  for (const card of cards) {
                    const reward = Math.max(
                      card.rewards[category as keyof Rewards] ?? 0,
                      card.rewards['All'] ?? 0
                    );
                    if (reward > bestReward) {
                      bestReward = reward;
                      bestCard = card;
                    }
                  }
                  return bestCard.id;
                });

                const uniqueBestOrder = Array.from(new Set(bestCardsPerCategory));
                const remaining = cards.map(c => c.id).filter(id => !uniqueBestOrder.includes(id));
                const newOrder = [...uniqueBestOrder, ...remaining];

                const reordered = newOrder.map(id => cards.find(c => c.id === id)!);
                setSortedCards(reordered);
              }}
            >
              Sort Cards
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 shadow-md rounded border border-gray-300 dark:border-gray-700 w-48">
                <div className="flex justify-between mb-2 text-sm font-semibold">
                  <button onClick={handleSelectAll} className="text-blue-600 hover:underline">Select All</button>
                  <button onClick={handleClearAll} className="text-red-500 hover:underline">Clear All</button>
                </div>
                <button onClick={handleResetCategoryOrder} className="mb-2 w-full text-center text-blue-600 hover:underline text-sm">
                  Reset Category Order
                </button>
                
                {allCategories.map((cat) => (
                  <label key={cat} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={visibleCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <table className="w-full table-fixed border-separate border-spacing-0 mt-10">
          <thead>
            <tr>
              <th className="p-2 text-left w-[130px] sticky left-0 bg-white dark:bg-slate-950"></th>
              {sortedCards.map((card) => (
                <th key={card.id} className="p-2 text-left w-[120px]">
                  {card.name}
                </th>
              ))}
            </tr>
          </thead>
          <SortableContext items={sortedCategories} strategy={verticalListSortingStrategy}>
            <tbody>
              {sortedCategories.map((category, categoryIndex) => {
                const rowRewards = sortedCards.map((card) => {
                  const categoryReward = card.rewards[category as keyof Rewards];
                  const allReward = card.rewards['All'];
                  return Math.max(categoryReward ?? 0, allReward ?? 0);
                });
                const maxReward = Math.max(...rowRewards);

                const bestInCard: number[] = sortedCards.map((card) => {
                  let best = 0;
                  for (const cat of allCategories) {
                    const r = Math.max(card.rewards[cat as keyof Rewards] ?? 0, card.rewards['All'] ?? 0);
                    if (r > best) best = r;
                  }
                  return best;
                });

                return (
                  <DraggableRow key={category} id={category}>
                    <td
                      className="p-2 font-medium sticky left-0 bg-white dark:bg-slate-950 border-t-0 cursor-pointer"
                      onMouseEnter={() => setHoveredCategoryIndex(categoryIndex)}
                      onMouseLeave={() => setHoveredCategoryIndex(null)}
                    >
                      {category}
                    </td>
                    {sortedCards.map((card, colIndex) => {
                      const categoryReward = card.rewards[category as keyof Rewards];
                      const allReward = card.rewards['All'];
                      const reward = Math.max(categoryReward ?? 0, allReward ?? 0);
                      const intensity = reward ? Math.min(reward / 5, 1) : 0;
                      const bgColor = reward ? getHeatColor(intensity) : 'transparent';

                      const isBestInRow = reward === maxReward && reward > 0;
                      const isBestInCol = hoveredCardIndex === colIndex && reward === bestInCard[colIndex] && reward > 0;
                      const isHoveredCell = hoveredCell?.row === categoryIndex && hoveredCell?.col === colIndex;

                      const isDimmed =
                        (hoveredCategoryIndex !== null && hoveredCategoryIndex !== categoryIndex) ||
                        (hoveredCardIndex !== null && hoveredCardIndex !== colIndex) ||
                        (hoveredCell && hoveredCell.row !== categoryIndex && hoveredCell.col !== colIndex);

                      const isHighlighted =
                        isHoveredCell ||
                        (hoveredCategoryIndex === categoryIndex && isBestInRow) ||
                        isBestInCol;

                      return (
                        <td
                          key={card.id + category}
                          className={`p-2 text-center w-[120px] transition-opacity duration-200 border-[2px] border-transparent box-border ${
                            isHighlighted ? 'border-yellow-400 shadow-md' : ''
                          } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                          style={{ backgroundColor: bgColor }}
                          onMouseEnter={() => setHoveredCell({ row: categoryIndex, col: colIndex })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {reward ? `${reward}x` : '-'}
                        </td>
                      );
                    })}
                  </DraggableRow>
                );
              })}
            </tbody>
          </SortableContext>
        </table>
      </div>
    </DndContext>
  );
}

function getHeatColor(intensity: number): string {
  const r = Math.floor(255 * intensity);
  const g = Math.floor(80 * (1 - intensity));
  const b = Math.floor(255 * (1 - intensity));
  return `rgb(${r},${g},${b})`;
}
