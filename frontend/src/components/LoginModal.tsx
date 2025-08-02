// src/components/LoginModal.tsx

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (res?.ok) {
      onClose();
    } else {
      setError('Invalid username or password');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md text-center w-80">
        <h2 className="text-xl font-semibold mb-4">Sign In</h2>

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
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

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
