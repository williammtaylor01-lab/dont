import { Address, CarrierOption, Currency, PickUpPoint, ProductItem, SavedPaymentMethod } from '../types';

export const DEFAULT_CURRENCY: Currency = {
  code: 'EUR',
  symbol: '€',
};

// Configurable mock database item representing the fetched checkout item
export const INITIAL_PRODUCT: ProductItem = {
  id: 'prod_984321',
  title: 'Mewtwo GX Pokémon Card Full Art Secret Rare',
  brand: 'Pokémon TCG',
  size: 'Standard / Mint',
  condition: 'Very good',
  imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=800&q=80',
  price: 8.00,
  originalPrice: 10.00,
};

export const INITIAL_ADDRESSES: Address[] = [
  {
    id: 'addr_krakow',
    fullName: 'Alex Dubois',
    line1: 'Henryka Siemiradzkiego 1',
    city: 'Kraków',
    postalCode: '31-140',
    country: 'Poland',
    phoneNumber: '+48 12 345 67 89',
    isDefault: true,
  },
  {
    id: 'addr_1',
    fullName: 'Alex Dubois',
    line1: '14 Rue de Rivoli',
    line2: 'Apt 4B',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    phoneNumber: '+33 6 45 89 12 30',
    isDefault: false,
  },
  {
    id: 'addr_2',
    fullName: 'Alex Dubois',
    line1: '28 Oxford Street',
    city: 'London',
    postalCode: 'W1D 1BS',
    country: 'United Kingdom',
    phoneNumber: '',
    isDefault: false,
  },
];

export const INITIAL_CARRIERS: CarrierOption[] = [
  // Home Delivery options
  {
    id: 'c_ups_home',
    name: 'UPS Home',
    type: 'home',
    price: 8.49,
    estimatedDelivery: '2 - 5 business days',
    logoType: 'ups',
  },
  {
    id: 'c_dhl_home',
    name: 'DHL Express Home',
    type: 'home',
    price: 9.99,
    estimatedDelivery: '1 - 2 business days',
    logoType: 'dhl',
  },
  {
    id: 'c_standard_home',
    name: 'Standard Home Post',
    type: 'home',
    price: 6.99,
    estimatedDelivery: '3 - 5 business days',
    logoType: 'standard',
  },
  // Pick-up Point options
  {
    id: 'c_inpost_locker',
    name: 'InPost Paczkomat 24/7',
    type: 'pickup',
    price: 0.00,
    originalPrice: 8.59,
    estimatedDelivery: '1 - 2 business days',
    logoType: 'inpost',
    locationName: 'Paczkomat KRA02H',
    locationAddress: 'Szlak 1A, 31-161, Kraków',
    openingHours: 'Open 24/7',
  },
  {
    id: 'c_mondial_relay',
    name: 'Mondial Relay Point',
    type: 'pickup',
    price: 3.49,
    originalPrice: 5.49,
    estimatedDelivery: '3 - 5 business days',
    logoType: 'mondial',
    locationName: 'Relay Tabac Presse Rivoli',
    locationAddress: '18 Rue de Rivoli, 75001 Paris',
    openingHours: 'Mon - Sat: 08:00 - 19:30',
  },
  {
    id: 'c_dpd_pickup',
    name: 'DPD Pickup Station',
    type: 'pickup',
    price: 4.19,
    estimatedDelivery: '2 - 3 business days',
    logoType: 'dpd',
    locationName: 'DPD Pickup Kremerowska',
    locationAddress: 'Kremerowska 8, 31-130, Kraków',
    openingHours: 'Mon - Fri: 09:00 - 18:30',
  },
];

export const INITIAL_PICKUP_POINTS: PickUpPoint[] = [
  {
    id: 'pt_kra_02h',
    carrierName: 'InPost Paczkomat 24/7',
    badgeDiscount: '(-100%)',
    pointCode: 'Paczkomat KRA02H',
    pointName: 'Paczkomat KRA02H',
    address: 'Szlak 1A, 31-161, Kraków',
    city: 'Kraków',
    estimatedDelivery: 'At pick-up point in 1 - 2 business days',
    price: 0.00,
    originalPrice: 8.59,
    openingHours: 'Open 24/7',
    logoType: 'inpost',
    distance: '150 m',
    coordinates: {
      lat: 50.0682,
      lng: 19.9362,
      x: 58,
      y: 40,
    },
  },
  {
    id: 'pt_kra_14m',
    carrierName: 'InPost Paczkomat 24/7',
    badgeDiscount: '(-100%)',
    pointCode: 'Paczkomat KRA14M',
    pointName: 'Paczkomat KRA14M',
    address: 'Karmelicka 27, 31-131, Kraków',
    city: 'Kraków',
    estimatedDelivery: 'At pick-up point in 1 - 2 business days',
    price: 0.00,
    originalPrice: 8.59,
    openingHours: 'Open 24/7',
    logoType: 'inpost',
    distance: '280 m',
    coordinates: {
      lat: 50.0655,
      lng: 19.9325,
      x: 42,
      y: 58,
    },
  },
  {
    id: 'pt_kra_dpd',
    carrierName: 'DPD Pickup Point',
    pointCode: 'DPD-KRA-09',
    pointName: 'Sklep Żabka DPD',
    address: 'Kremerowska 8, 31-130, Kraków',
    city: 'Kraków',
    estimatedDelivery: 'At pick-up point in 2 - 3 business days',
    price: 3.99,
    originalPrice: 6.99,
    openingHours: 'Mon - Sun: 06:00 - 23:00',
    logoType: 'dpd',
    distance: '350 m',
    coordinates: {
      lat: 50.0671,
      lng: 19.9312,
      x: 35,
      y: 50,
    },
  },
  {
    id: 'pt_kra_poczta',
    carrierName: 'Poczta Polska / Orlen Paczka',
    pointCode: 'ORL-3101',
    pointName: 'Stacja Paliw Orlen',
    address: 'Garbarska 12, 31-131, Kraków',
    city: 'Kraków',
    estimatedDelivery: 'At pick-up point in 2 - 4 business days',
    price: 0.00,
    originalPrice: 5.99,
    openingHours: 'Open 24/7',
    logoType: 'standard',
    distance: '480 m',
    coordinates: {
      lat: 50.0642,
      lng: 19.9351,
      x: 62,
      y: 68,
    },
  },
  {
    id: 'pt_kra_dhl',
    carrierName: 'DHL POP Punkt',
    pointCode: 'DHL-POP-24',
    pointName: 'Salonik Prasowy Inmedio',
    address: 'Długa 19, 31-147, Kraków',
    city: 'Kraków',
    estimatedDelivery: 'At pick-up point in 1 - 2 business days',
    price: 2.49,
    openingHours: 'Mon - Fri: 08:00 - 19:00',
    logoType: 'dhl',
    distance: '550 m',
    coordinates: {
      lat: 50.0694,
      lng: 19.9388,
      x: 74,
      y: 30,
    },
  },
  {
    id: 'pt_paris_inpost',
    carrierName: 'InPost Locker 24/7',
    pointCode: 'Locker PAR048',
    pointName: 'Locker Rivoli',
    address: '24 Rue Saint-Honoré, 75001 Paris',
    city: 'Paris',
    estimatedDelivery: 'At pick-up point in 2 - 4 business days',
    price: 3.89,
    openingHours: 'Open 24/7',
    logoType: 'inpost',
    distance: '210 m',
    coordinates: {
      lat: 48.8606,
      lng: 2.3376,
      x: 50,
      y: 45,
    },
  },
  {
    id: 'pt_paris_mondial',
    carrierName: 'Mondial Relay Point',
    pointCode: 'MR-7501',
    pointName: 'Relay Tabac Presse Rivoli',
    address: '18 Rue de Rivoli, 75001 Paris',
    city: 'Paris',
    estimatedDelivery: 'At pick-up point in 3 - 5 business days',
    price: 3.49,
    originalPrice: 5.49,
    openingHours: 'Mon - Sat: 08:00 - 19:30',
    logoType: 'mondial',
    distance: '320 m',
    coordinates: {
      lat: 48.8575,
      lng: 2.3518,
      x: 65,
      y: 60,
    },
  },
];

export const INITIAL_PAYMENT_METHODS: SavedPaymentMethod[] = [
  {
    id: 'pm_gpay',
    type: 'google_pay',
    title: 'Google Pay',
    subtitle: 'Finalise payment with Google Pay',
    isDefault: false,
  },
  {
    id: 'pm_p24',
    type: 'przelewy24',
    title: 'Przelewy24',
    subtitle: 'Finalise payment through your bank using Przelewy24',
    isDefault: false,
  },
  {
    id: 'pm_blik',
    type: 'blik',
    title: 'Blik',
    subtitle: 'Finalise payment through your bank using Blik',
    isDefault: false,
  },
  {
    id: 'pm_card_1',
    type: 'card',
    title: 'Bank card',
    subtitle: 'Use a credit or debit card',
    cardholderName: 'Hard Reset',
    last4: '5490',
    brand: 'visa',
    expiry: '07/30',
    isDefault: true,
  },
];

export function calculateBuyerProtectionFee(price: number, currencyCode: string = 'PLN'): number {
  // Standard Vinted-style fee: Fixed base + 5% of item price
  // PLN base is 2.90 PLN, EUR/GBP/USD base is 0.70
  const base = currencyCode === 'PLN' ? 2.90 : 0.70;
  const variable = price * 0.05;
  return Number((base + variable).toFixed(2));
}

export function formatPrice(amount: number, currency: Currency = DEFAULT_CURRENCY): string {
  if (currency.code === 'PLN') {
    return `PLN${amount.toFixed(2)}`;
  }
  return `${currency.symbol}${amount.toFixed(2)}`;
}
