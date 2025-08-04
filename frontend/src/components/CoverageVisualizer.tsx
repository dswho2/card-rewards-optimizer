// Updated CoverageVisualizer.tsx with hoveredCardIndex used
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
        <table className="w-full table-fixed border-separate border-spacing-0 mt-10">
          <thead>
            <tr>
              <th className="p-2 text-left w-[130px] sticky left-0 bg-white dark:bg-slate-950"></th>
              {sortedCards.map((card, colIndex) => (
                <th
                  key={card.id}
                  className="p-2 text-left w-[120px]"
                  onMouseEnter={() => setHoveredCardIndex(colIndex)}
                  onMouseLeave={() => setHoveredCardIndex(null)}
                >
                  {card.name}
                </th>
              ))}
            </tr>
          </thead>
          <SortableContext items={sortedCategories} strategy={verticalListSortingStrategy}>
            <tbody>
              {sortedCategories.map((category, categoryIndex) => (
                <DraggableRow key={category} id={category}>
                  <td className="p-2 sticky left-0 bg-white dark:bg-slate-950">
                    {category}
                  </td>
                  {sortedCards.map((card, colIndex) => {
                    const reward = Math.max(
                      card.rewards[category as keyof Rewards] ?? 0,
                      card.rewards['All'] ?? 0
                    );
                    const intensity = reward ? Math.min(reward / 5, 1) : 0;
                    const bgColor = reward ? getHeatColor(intensity) : 'transparent';

                    return (
                      <td
                        key={card.id + category}
                        className="p-2 text-center w-[120px]"
                        style={{ backgroundColor: bgColor }}
                        onMouseEnter={() => setHoveredCell({ row: categoryIndex, col: colIndex })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {reward ? `${reward}x` : '-'}
                      </td>
                    );
                  })}
                </DraggableRow>
              ))}
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
