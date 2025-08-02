// src/api/user.ts

export const getCardRec = async (description: string) => {
  const res = await fetch('http://localhost:4000/api/recommend-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error ${res.status}: ${errorText || res.statusText}`);
  }

  const data = await res.json();
  return data.category as string;
}

export async function getUserCards() {
  // Simulate delay
  await new Promise((r) => setTimeout(r, 300));

  return [
  {
    id: 'card-1',
    name: 'Chase Sapphire Preferred',
    image: '/card1.png',
    rewards: {
      Travel: 2,
      Dining: 3,
      All: 1
    },
    annualFee: '$95',
    notes: 'Great for travel bookings, no foreign transaction fees.',
  },
  {
    id: 'card-2',
    name: 'Amex Blue Cash Everyday',
    image: '/card2.png',
    rewards: {
      Grocery: 3,
      Gas: 3,
      Online: 2,
    },
    annualFee: '$0',
    notes: 'Solid grocery and gas rewards for no annual fee.',
  },
  {
    id: 'card-3',
    name: '3',
    image: '/card1.png',
    rewards: {
      Travel: 2,
      Dining: 1,
      Online: 3
    },
    annualFee: '$2005',
    notes: 'poop.',
  },
  {
    id: 'card-4',
    name: '4',
    image: '/card1.png',
    rewards: {
      All: 1,
      Dining: 2,
      Utilities: 3
    },
    annualFee: '$2005',
    notes: 'poop.',
  },
  {
    id: 'card-5',
    name: '5',
    image: '/card1.png',
    rewards: {
      Travel: 2,
      Transit: 3
    },
    annualFee: '$2005',
    notes: 'poop.',
  },
  {
    id: 'card-6',
    name: '6',
    image: '/card1.png',
    rewards: {
      Entertainment: 3,
      All: 1
    },
    annualFee: '$2005',
    notes: 'poop.',
  },
  {
    id: 'card-7',
    name: '7',
    image: '/card1.png',
    rewards: {
      Gas: 4,
      Dining: 2,
      All: 1.5
    },
    annualFee: '$2005',
    notes: 'poop.',
  }
];
}