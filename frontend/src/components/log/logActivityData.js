// =============================================================================
// SECTION: Log Activity static data
// Emission categories/factors, travel-mode mapping, and a carbon colour helper.
// =============================================================================

export const CATEGORIES = [
  {
    id: 'transport', label: 'Transport', icon: 'commute',
    bg: 'bg-blue-50', color: 'text-blue-600', accent: '#3b82f6',
    subtypes: [
      { id: 'car_petrol', label: 'Car (Petrol)', factor: 0.21,  unit: 'km' },
      { id: 'car_ev',     label: 'Car (EV)',     factor: 0.05,  unit: 'km' },
      { id: 'bus',        label: 'Bus',          factor: 0.089, unit: 'km' },
      { id: 'train',      label: 'Train',        factor: 0.041, unit: 'km' },
      { id: 'flight',     label: 'Flight',       factor: 0.255, unit: 'km' },
      { id: 'cycle',      label: 'Cycling',      factor: 0,     unit: 'km' },
    ],
  },
  {
    id: 'diet', label: 'Diet', icon: 'restaurant',
    bg: 'bg-orange-50', color: 'text-orange-600', accent: '#f97316',
    subtypes: [
      { id: 'beef',    label: 'Beef meal',    factor: 6.61, unit: 'serving' },
      { id: 'chicken', label: 'Chicken meal', factor: 1.26, unit: 'serving' },
      { id: 'fish',    label: 'Fish meal',    factor: 2.04, unit: 'serving' },
      { id: 'vegan',   label: 'Vegan meal',   factor: 0.50, unit: 'serving' },
      { id: 'dairy',   label: 'Dairy (milk)', factor: 3.15, unit: 'litre' },
    ],
  },
  {
    id: 'energy', label: 'Energy', icon: 'bolt',
    bg: 'bg-yellow-50', color: 'text-yellow-600', accent: '#eab308',
    subtypes: [
      { id: 'elec',    label: 'Electricity',  factor: 0.233, unit: 'kWh' },
      { id: 'gas',     label: 'Natural gas',  factor: 2.04,  unit: 'm³' },
      { id: 'heating', label: 'Oil heating',  factor: 2.52,  unit: 'litre' },
    ],
  },
  {
    id: 'shopping', label: 'Shopping', icon: 'shopping_bag',
    bg: 'bg-purple-50', color: 'text-purple-600', accent: '#9333ea',
    subtypes: [
      { id: 'clothing', label: 'New clothing item', factor: 8.1,  unit: 'item' },
      { id: 'laptop',   label: 'Laptop/device',     factor: 300,  unit: 'item' },
      { id: 'online',   label: 'Online parcel',     factor: 0.43, unit: 'parcel' },
    ],
  },
  {
    id: 'waste', label: 'Waste', icon: 'delete',
    bg: 'bg-teal-50', color: 'text-teal-600', accent: '#14b8a6',
    subtypes: [
      { id: 'landfill', label: 'Landfill waste',    factor: 0.57, unit: 'kg' },
      { id: 'recycled', label: 'Recycled waste',    factor: 0.02, unit: 'kg' },
      { id: 'compost',  label: 'Composted organic', factor: 0.01, unit: 'kg' },
    ],
  },
];

export const TRAVEL_MODE_MAP = {
  car_petrol: 'DRIVE', car_ev: 'DRIVE',
  bus: 'TRANSIT', train: 'TRANSIT',
  flight: 'DRIVE', cycle: 'BICYCLE',
};

/** Tailwind text-colour class for a carbon value (green/amber/red). */
export function carbonColor(kg) {
  if (kg <= 2) return 'text-[#006b2c]';
  if (kg <= 8) return 'text-[#d97706]';
  return 'text-[#dc2626]';
}
