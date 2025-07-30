// src/app/visualize/page.tsx
export default function VisualizePage() {
  const cards = ['Credit Card 1', 'Credit Card 2', 'Credit Card 3', 'Credit Card 4'];
  const categories = ['Grocery', 'Restaurant', 'Gas', 'Online Shopping'];

  // Example data input: rows = categories, columns = cards
  const data = [
    [5, 2, 1, 4],
    [3, 4, 2, 1],
    [1, 3, 2, 3],
    [2, 2, 5, 3],
  ];

  function getHeatColor(value: number) {
    const min = 1;
    const max = 5;
    const ratio = (value - min) / (max - min);
    const r = Math.round(255 * ratio);
    const g = Math.round(80 * (1 - ratio));
    const b = Math.round(255 * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
  }

  const svgWidth = 800;
const marginX = 100;
const plotWidth = svgWidth - 2 * marginX;
const columnSpacing = plotWidth / Math.max(cards.length - 1, 1);
const xStart = marginX;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center">Category Coverage</h2>
      <div className="relative w-full h-[500px]">
        <svg viewBox="0 0 800 500" className="w-full h-full">
          {/* Y Axis Labels */}
          {categories.map((category, row) => (
            <text key={category} x={20}
              y={100 + row * 100}
              className="fill-black dark:fill-white text-sm"
            >
              {category}
            </text>
          ))}

          {/* X Axis Labels */}
          {cards.map((card, col) => (
            <text key={card} x={xStart + col * columnSpacing}
              y={40}
              className="fill-black dark:fill-white text-sm"
              textAnchor="middle"
            >
              {card}
            </text>
          ))}

          {/* Circles + Text */}
          {data.map((rowData, row) =>
            rowData.map((value, col) => {
              const radius = 10 + value * 5;
              const color = getHeatColor(value);
              const cx = xStart + col * columnSpacing;
              const cy = 100 + row * 100;
              return (
                <g key={`${row}-${col}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={color}
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    className="fill-white text-xs"
                    textAnchor="middle"
                  >
                    {value}x
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>
      <p className="text-center text-sm text-gray-500 mt-4 dark:text-gray-400">
        Circle size and color represent cashback strength. Larger & more red = better. Value shown as multiplier.
      </p>
    </main>
  );
}