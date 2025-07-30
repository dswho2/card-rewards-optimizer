// src/app/page.tsx
export default function Home() {
  return (
    <main className="p-6 max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">What's your purchase?</h1>
      <input
        type="text"
        placeholder="e.g. Booking a hotel in NYC"
        className="w-full p-3 border rounded-md dark:bg-gray-800 dark:text-white"
      />
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Get Recommendation
      </button>
    </main>
  );
}
