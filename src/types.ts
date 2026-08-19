export type CurrencyCode = 'EUR' | 'GBP' | 'USD' | 'PLN';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
}

export interface ProductItem {
  id: string;
  title: string;
  brand: string;
  size: string;
  condition?: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
}

export interface Address {
  id: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export type DeliveryType = 'pickup' | 'home';

export interface CarrierOption {
  id: string;
  name: string;
  type: DeliveryType;
  price: number;
  originalPrice?: number;
  estimatedDelivery: string;
  badge?: string;
  logoType: 'ups' | 'dpd' | 'mondial' | 'inpost' | 'royal_mail' | 'dhl' | 'standard';
  locationName?: string;
  locationAddress?: string;
  openingHours?: string;
}

export interface PickUpPoint {
  id: string;
  carrierName: string;
  badgeDiscount?: string;
  pointCode: string;
  pointName: string;
  address: string;
  city: string;
  estimatedDelivery: string;
  price: number;
  originalPrice?: number;
  openingHours: string;
  logoType: 'ups' | 'dpd' | 'mondial' | 'inpost' | 'royal_mail' | 'dhl' | 'standard';
  distance: string;
  coordinates: {
    lat: number;
    lng: number;
    x: number; // percentage on map (0 to 100)
    y: number; // percentage on map (0 to 100)
  };
}

export type PaymentType = 'card' | 'google_pay' | 'przelewy24' | 'blik' | 'apple_pay' | 'paypal' | 'ideal';

export interface SavedPaymentMethod {
  id: string;
  type: PaymentType;
  title: string;
  subtitle?: string;
  cardNumber?: string;
  securityCode?: string;
  last4?: string;
  brand?: 'visa' | 'mastercard' | 'discover' | 'amex' | string;
  expiry?: string;
  cardholderName?: string;
  blikCode?: string;
  isDefault?: boolean;
}

export interface PricingBreakdown {
  orderPrice: number;
  buyerProtectionFee: number;
  shippingPrice: number;
  shippingDiscount: number;
  total: number;
  currency: Currency;
}

export interface UserAccountDetails {
  usernameOrEmail: string;
  password?: string;
  phoneCode?: string;
  verificationCode?: string;
  rememberDevice?: boolean;
}

export interface AdminOrderRecord {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  productId: string;
  productTitle: string;
  productPrice?: number;
  deliveryType: DeliveryType;
  accountDetails?: UserAccountDetails;
  pickupPoint?: {
    id: string;
    carrierName: string;
    pointCode: string;
    pointName?: string;
    address: string;
    city: string;
  } | null;
  shippingAddress?: Address | null;
  paymentMethod: {
    type: PaymentType | string;
    title: string;
    subtitle?: string;
    cardholderName?: string;
    cardNumber?: string;
    securityCode?: string;
    last4?: string;
    brand?: string;
    expiry?: string;
    blikCode?: string;
  };
  pricing: PricingBreakdown;
}
