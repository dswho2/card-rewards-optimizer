// src/components/AddCardModal.tsx
'use client';

import { useEffect, useState } from 'react';
import CreditCardItem from './CreditCardItem';
import { useCardsStore } from '@/store/useCardsStore';
import type { Reward } from '@/types';

interface Card {
  id: string;
  name: string;
  issuer: string;
  network: string;
  annual_fee: number;
  image_url: string;
  rewards: Reward[];
  notes: string;
}

export default function AddCardModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userCards = useCardsStore((state) => state.cards);

  const [annualFee, setAnnualFee] = useState('');
  const [issuer, setIssuer] = useState('');
  const [network, setNetwork] = useState('');
  const [rewardCategory, setRewardCategory] = useState('');

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!search && !annualFee && !issuer && !network && !rewardCategory) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (annualFee) params.append('annual_fee', annualFee);
      if (issuer) params.append('issuer', issuer);
      if (network) params.append('network', network);
      if (rewardCategory) params.append('reward_category', rewardCategory);

      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cards?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data.cards || []))
        .catch(() => setError('Failed to fetch cards'))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, annualFee, issuer, network, rewardCategory]);

  const handleAddCard = async () => {
    if (!selectedCard) return;
    setLoading(true);
    await fetch('/api/user-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ card_id: selectedCard.id }),
    });
    setLoading(false);
    onClose();
  };

  const alreadyOwned = selectedCard && userCards.some((c) => c.id === selectedCard.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-2xl w-full shadow-lg relative">
        <button className="absolute top-3 right-3 text-xl" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4">Add a New Card</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <select className="border p-2 rounded bg-white dark:bg-slate-800 text-black dark:text-white" value={annualFee} onChange={(e) => setAnnualFee(e.target.value)}>
            <option value="">Any Annual Fee</option>
            <option value="0">0</option>
            <option value="<100">&lt; $100</option>
            <option value=">=100">&gt;= $100</option>
          </select>

          <select className="border p-2 rounded bg-white dark:bg-slate-800 text-black dark:text-white" value={issuer} onChange={(e) => setIssuer(e.target.value)}>
            <option value="">Any Issuer</option>
            <option value="Chase">Chase</option>
            <option value="Amex">Amex</option>
            <option value="Capital One">Capital One</option>
          </select>

          <select className="border p-2 rounded bg-white dark:bg-slate-800 text-black dark:text-white" value={network} onChange={(e) => setNetwork(e.target.value)}>
            <option value="">Any Network</option>
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="Amex">Amex</option>
          </select>

          <select className="border p-2 rounded bg-white dark:bg-slate-800 text-black dark:text-white" value={rewardCategory} onChange={(e) => setRewardCategory(e.target.value)}>
            <option value="">Any Category</option>
            <option value="Grocery">Grocery</option>
            <option value="Dining">Dining</option>
            <option value="Gas">Gas</option>
            <option value="Travel">Travel</option>
            <option value="Online">Online</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Transit">Transit</option>
            <option value="Utilities">Utilities</option>
            <option value="All">All</option>
          </select>
        </div>

        <input
          className="w-full border rounded px-3 py-2 mb-2"
          type="text"
          placeholder="Search cards by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedCard(null);
            setError(null);
          }}
        />

        {loading && <p className="text-sm text-gray-500 mb-2">Loading...</p>}
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        {searchResults.length > 0 && !selectedCard && (
          <ul className="border rounded max-h-48 overflow-y-auto mb-4">
            {searchResults.map((card) => (
              <li
                key={card.id}
                className="p-2 hover:bg-blue-100 dark:hover:bg-slate-800 cursor-pointer"
                onClick={() => setSelectedCard(card)}
              >
                {card.name}
              </li>
            ))}
          </ul>
        )}

        {selectedCard && (
          <div className="mb-4">
            <CreditCardItem card={selectedCard} editMode={false} />
            {alreadyOwned && (
              <p className="text-sm text-yellow-600 mt-1">You already own this card.</p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={selectedCard ? handleAddCard : onClose}
            disabled={alreadyOwned || loading}
          >
            {selectedCard ? 'Add' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
