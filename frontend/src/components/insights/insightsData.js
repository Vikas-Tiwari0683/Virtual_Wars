// =============================================================================
// SECTION: Insights page static display data
// Colours, reduction opportunities, and the deterministic heatmap matrix.
// =============================================================================

export const HEAT_COLORS = ['#f1f3ff', '#b1f2be', '#62df7d', '#2e6a41', '#006b2c'];

export const CAT_COLORS = {
  transport: '#3b82f6', diet: '#f97316', energy: '#eab308',
  shopping: '#9333ea', waste: '#14b8a6',
};

export const OPPORTUNITIES = [
  { icon: 'directions_bus', category: 'Transport', action: 'Switch Tuesday commute to public transit', saving: 45, pct: 13, difficulty: 'Easy' },
  { icon: 'restaurant',     category: 'Diet',      action: 'Replace 2 beef meals/week with chicken',  saving: 32, pct: 9,  difficulty: 'Easy' },
  { icon: 'wb_sunny',       category: 'Energy',    action: 'Install solar on your hot water system',   saving: 28, pct: 8,  difficulty: 'Hard' },
];

// Deterministic display heatmap — fixed pseudo-pattern, no randomness.
export const HEATMAP_DATA = Array.from({ length: 12 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ((week * 7 + day) * 7 + 3) % 5)
);
