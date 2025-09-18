// src/components/AddCardModal.tsx
'use client';

import { useEffect, useState } from 'react';
import CreditCardItem from './CreditCardItem';
import { saveUserCard, searchCards, type ApiCard } from '@/app/api/user';
import { useUser } from '@/contexts/UserContext';

interface AddCardModalProps {
  onClose: () => void;
}

export default function AddCardModal({ onClose }: AddCardModalProps) {
  const { cards: userCards, addCard, refetchCards } = useUser();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ApiCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ApiCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      searchCards({
        search,
        annual_fee: annualFee,
        issuer,
        network,
        reward_category: rewardCategory,
      })
        .then(setSearchResults)
        .catch(() => setError('Failed to fetch cards'))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, annualFee, issuer, network, rewardCategory]);

  const handleAddCard = async () => {
    if (!selectedCard) {
      setError('Please select a card first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await saveUserCard(selectedCard.id);
      if (data.success) {
        // Add card to context immediately for optimistic UI
        addCard(selectedCard);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to add card');
      }
    } catch (error) {
      console.error('Failed to add card:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add card';
      setError(errorMessage);
      
      // Refresh cards to ensure consistency with server state
      await refetchCards();
    } finally {
      setLoading(false);
    }
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
          <div>
            <label htmlFor="annual-fee" className="block text-sm font-medium mb-1">Annual Fee</label>
            <select 
              id="annual-fee"
              className="w-full border p-2 rounded bg-white dark:bg-slate-800 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={annualFee} 
              onChange={(e) => setAnnualFee(e.target.value)}
            >
              <option value="">Any Annual Fee</option>
              <option value="0">No Fee</option>
              <option value="<100">Under $100</option>
              <option value=">=100">$100 or more</option>
            </select>
          </div>

          <div>
            <label htmlFor="issuer" className="block text-sm font-medium mb-1">Issuer</label>
            <select 
              id="issuer"
              className="w-full border p-2 rounded bg-white dark:bg-slate-800 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={issuer} 
              onChange={(e) => setIssuer(e.target.value)}
            >
              <option value="">Any Issuer</option>
              <option value="Chase">Chase</option>
              <option value="American Express">American Express</option>
              <option value="Bank of America">Bank of America</option>
              <option value="Capital One">Capital One</option>
              <option value="Citi">Citi</option>
            </select>
          </div>

          <div>
            <label htmlFor="network" className="block text-sm font-medium mb-1">Network</label>
            <select 
              id="network"
              className="w-full border p-2 rounded bg-white dark:bg-slate-800 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={network} 
              onChange={(e) => setNetwork(e.target.value)}
            >
              <option value="">Any Network</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="American Express">American Express</option>
              <option value="Discover">Discover</option>
            </select>
          </div>

          <div>
            <label htmlFor="reward-category" className="block text-sm font-medium mb-1">Reward Category</label>
            <select 
              id="reward-category"
              className="w-full border p-2 rounded bg-white dark:bg-slate-800 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={rewardCategory} 
              onChange={(e) => setRewardCategory(e.target.value)}
            >
              <option value="">Any Category</option>
              <option value="Grocery">Grocery</option>
              <option value="Dining">Dining</option>
              <option value="Gas">Gas</option>
              <option value="Travel">Travel</option>
              <option value="Online">Online Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Transit">Transit</option>
              <option value="Utilities">Utilities</option>
              <option value="All">All Categories</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium mb-1">Search by Card Name</label>
          <input
            id="search"
            className="w-full border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="e.g., Chase Sapphire, Amex Gold..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedCard(null);
              setError(null);
            }}
            disabled={loading}
          />
        </div>

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

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          {selectedCard && (
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleAddCard}
              disabled={alreadyOwned || loading}
            >
              {loading ? 'Adding...' : 'Add Card'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
