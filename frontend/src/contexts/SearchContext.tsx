'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { RecommendationResponse } from '@/types';

interface SearchContextType {
  // Search state
  input: string;
  setInput: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  error: string | null;
  setError: (value: string | null) => void;
  recommendations: RecommendationResponse | null;
  setRecommendations: (value: RecommendationResponse | null) => void;
  currentMode: 'purchase' | 'discovery';
  setCurrentMode: (value: 'purchase' | 'discovery') => void;
  reanalyzingMethod: string | null;
  setReanalyzingMethod: (value: string | null) => void;

  // Actions
  handleNewSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [currentMode, setCurrentMode] = useState<'purchase' | 'discovery'>('purchase');
  const [reanalyzingMethod, setReanalyzingMethod] = useState<string | null>(null);

  const handleNewSearch = useCallback(() => {
    setRecommendations(null);
    setInput('');
    setAmount('');
    setError(null);
    setReanalyzingMethod(null);
  }, []);

  const value: SearchContextType = {
    input,
    setInput,
    amount,
    setAmount,
    loading,
    setLoading,
    error,
    setError,
    recommendations,
    setRecommendations,
    currentMode,
    setCurrentMode,
    reanalyzingMethod,
    setReanalyzingMethod,
    handleNewSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}