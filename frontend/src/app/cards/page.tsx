// src/app/cards/page.tsx

"use client";
import { useState } from 'react';

const cards = [
  {
    name: 'Chase Sapphire Preferred',
    image: '/card1.png',
    rewards: '2x Travel, 3x Dining',
    annualFee: '$95',
    notes: 'Great for travel bookings, no foreign transaction fees.',
  },
  {
    name: 'Amex Blue Cash Everyday',
    image: '/card2.png',
    rewards: '3% Supermarkets, 3% Gas',
    annualFee: '$0',
    notes: 'Solid grocery and gas rewards for no annual fee.',
  },
];

export default function CardsPage() {
  const [deleteMode, setDeleteMode] = useState(false);
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Your Cards</h2>
      <div className="flex flex-col gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="relative flex flex-col md:flex-row gap-4 p-4 border rounded shadow dark:bg-gray-800"
          >
            {deleteMode && (
              <button className="absolute top-2 right-2 text-red-600 text-sm hover:underline">
                Delete
              </button>
            )}
            <img
              src={card.image}
              alt={card.name}
              className="w-full md:w-48 h-auto object-contain border rounded"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1">{card.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                <strong>Rewards:</strong> {card.rewards}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                <strong>Annual Fee:</strong> {card.annualFee}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Notes:</strong> {card.notes}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-10">
        <button
          className="border px-4 py-2 rounded"
          onClick={() => setDeleteMode(!deleteMode)}
        >
          {deleteMode ? 'Cancel' : 'Delete Cards'}
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add New Card
        </button>
      </div>
    </main>
  );
}
