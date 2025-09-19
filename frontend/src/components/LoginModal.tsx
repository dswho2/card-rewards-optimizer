// src/components/LoginModal.tsx
'use client';

import { useState } from 'react';
import { loginOrSignup } from '../app/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useUser } from '@/contexts/UserContext';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);
  const setUser = useAuthStore((s) => s.setUser);
  const { refetchCards } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const response = await loginOrSignup({ username, password, isLogin });

    if (response.success) {
      if (response.token) {
        localStorage.setItem('auth_token', response.token);

        // Decode token to get userId
        try {
          const payload = response.token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          setUser(decoded.id);
          setLoggedIn(true);

          // UserContext will automatically fetch cards when auth state changes
          // No need for setTimeout - it will happen automatically
        } catch (error) {
          console.error('Failed to decode token:', error);
          setLoggedIn(true);
          setUser(null);
        }
      }
      onClose();
    } else {
      setError(response.message || 'Something went wrong');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md text-center w-80">
        <h2 className="text-xl font-semibold mb-4">{isLogin ? 'Sign In' : 'Sign Up'}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (isLogin ? 'Logging in...' : 'Signing up...') : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

        <p className="mt-4 text-sm">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="underline text-blue-600 hover:text-blue-800"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
