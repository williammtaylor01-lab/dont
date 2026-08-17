import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  MapPin,
  Clock,
  Check,
  LocateFixed,
  Navigation,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Currency, PickUpPoint, Address } from '../types';
import { formatPrice } from '../data/mockData';

interface PickupMapPageProps {
  onSelectPoint: (point: PickUpPoint) => void;
  onClose: () => void;
  currency: Currency;
  userAddress: Address | null;
  selectedPointId?: string | null;
}

export const PickupMapPage: React.FC<PickupMapPageProps> = ({
  onSelectPoint,
  onClose,
  currency,
  userAddress,
  selectedPointId,
}) => {
  const [searchQuery, setSearchQuery] = useState(
    userAddress?.city ? `${userAddress.city} ${userAddress.postalCode}` : ''
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [selectedPoint, setSelectedPoint] = useState<PickUpPoint | null>(null);

  // Dynamic list of locker points generated around user's live position or current search
  const [nearbyPoints, setNearbyPoints] = useState<PickUpPoint[]>([]);

  // Function to generate dynamic pickup lockers near any lat/lng
  const generateLockersForLocation = (lat: number, lng: number, cityName: string) => {
    const lockers: PickUpPoint[] = [
      {
        id: `pt_live_inpost_1`,
        carrierName: 'InPost Paczkomat 24/7',
        badgeDiscount: '(-100%)',
        pointCode: 'Paczkomat ' + cityName.substring(0, 3).toUpperCase() + '01A',
        pointName: 'Paczkomat 24/7 Locker Hub',
        address: 'Main Street 12',
        city: cityName,
        estimatedDelivery: 'At pick-up point in 1 - 2 business days',
        price: 0.00,
        originalPrice: 8.59,
        openingHours: 'Open 24/7',
        logoType: 'inpost',
        distance: '180 m away',
        coordinates: {
          lat: lat + 0.0015,
          lng: lng + 0.0012,
          x: 52,
          y: 42,
        },
      },
      {
        id: `pt_live_inpost_2`,
        carrierName: 'InPost Paczkomat 24/7',
        badgeDiscount: '(-100%)',
        pointCode: 'Paczkomat ' + cityName.substring(0, 3).toUpperCase() + '09X',
        pointName: 'Paczkomat Station Express',
        address: 'Station Plaza 4',
        city: cityName,
        estimatedDelivery: 'At pick-up point in 1 - 2 business days',
        price: 0.00,
        originalPrice: 8.59,
        openingHours: 'Open 24/7',
        logoType: 'inpost',
        distance: '340 m away',
        coordinates: {
          lat: lat - 0.0022,
          lng: lng + 0.0028,
          x: 68,
          y: 65,
        },
      },
      {
        id: `pt_live_dpd`,
        carrierName: 'DPD Pickup Station',
        pointCode: 'DPD-' + cityName.substring(0, 3).toUpperCase() + '-44',
        pointName: 'Convenience Market DPD',
        address: 'Boulevard Central 88',
        city: cityName,
        estimatedDelivery: 'At pick-up point in 2 - 3 business days',
        price: 3.49,
        originalPrice: 5.99,
        openingHours: 'Mon - Sat: 07:00 - 22:00',
        logoType: 'dpd',
        distance: '450 m away',
        coordinates: {
          lat: lat + 0.0031,
          lng: lng - 0.0025,
          x: 35,
          y: 30,
        },
      },
      {
        id: `pt_live_mondial`,
        carrierName: 'Mondial Relay Point',
        pointCode: 'MR-' + cityName.substring(0, 3).toUpperCase() + '-10',
        pointName: 'Tabac Presse Relay',
        address: 'Avenue de la Paix 23',
        city: cityName,
        estimatedDelivery: 'At pick-up point in 2 - 4 business days',
        price: 2.99,
        originalPrice: 4.99,
        openingHours: 'Mon - Sat: 08:00 - 20:00',
        logoType: 'mondial',
        distance: '620 m away',
        coordinates: {
          lat: lat - 0.0018,
          lng: lng - 0.0035,
          x: 28,
          y: 72,
        },
      },
    ];
    return lockers;
  };

  // Trigger live browser geolocation
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Detecting your live GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoords({ lat, lng });
        setIsLocating(false);
        setLocationStatus('Showing lockers nearest to your current live location.');

        const points = generateLockersForLocation(lat, lng, 'Your Area');
        setNearbyPoints(points);
        setSelectedPoint(points[0]);
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation lookup notice:', error.message);
        setLocationStatus('Location permission denied or unavailable. Showing central lockers.');
        // Fallback
        const defaultLat = 50.0647;
        const defaultLng = 19.945;
        setUserCoords({ lat: defaultLat, lng: defaultLng });
        const points = generateLockersForLocation(defaultLat, defaultLng, 'Central');
        setNearbyPoints(points);
        setSelectedPoint(points[0]);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    // Initial auto-detection
    handleGetLiveLocation();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const cityClean = searchQuery.trim();
    const points = generateLockersForLocation(48.8566, 2.3522, cityClean);
    setNearbyPoints(points);
    setSelectedPoint(points[0]);
    setLocationStatus(`Found lockers around "${cityClean}"`);
  };

  const handleConfirm = () => {
    if (selectedPoint) {
      onSelectPoint(selectedPoint);
      onClose();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-13 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="p-1 -ml-1 text-gray-700 hover:text-gray-950 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          Choose pick-up point
        </h1>
        <div className="w-6" />
      </header>

      {/* Search & Live GPS Bar */}
      <div className="bg-white border-b border-gray-200 p-3 space-y-2">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, street, or postcode..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:outline-hidden transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleGetLiveLocation}
            disabled={isLocating}
            title="Use live GPS location"
            className="p-2.5 rounded-lg border border-teal-200 bg-teal-50 text-[#007782] hover:bg-teal-100 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">My Live Location</span>
          </button>
        </form>

        {locationStatus && (
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#007782]" />
            {locationStatus}
          </p>
        )}
      </div>

      {/* Interactive Map Canvas Section */}
      <div className="relative h-64 sm:h-72 bg-[#E6ECEF] overflow-hidden border-b border-gray-200">
        {/* Styled Vector Map Grid & Roads */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* River & Road vector simulation */}
        <div className="absolute top-1/3 left-0 right-0 h-4 bg-blue-200/50 -rotate-6 transform" />
        <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-white/70 shadow-xs" />
        <div className="absolute top-1/2 left-0 right-0 h-3 bg-white/70 shadow-xs" />

        {/* Live User Position Indicator */}
        {userCoords && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
          >
            <div className="w-4 h-4 rounded-full bg-[#007782] ring-4 ring-[#007782]/30 animate-pulse flex items-center justify-center text-[8px] text-white font-bold" />
            <span className="text-[10px] font-bold bg-white text-gray-900 px-1.5 py-0.5 rounded-full shadow-md mt-1 border border-gray-200">
              You are here
            </span>
          </div>
        )}

        {/* Interactive Pickup Locker Pins */}
        {nearbyPoints.map((point) => {
          const isSelected = selectedPoint?.id === point.id;
          return (
            <button
              key={point.id}
              type="button"
              onClick={() => setSelectedPoint(point)}
              style={{
                top: `${point.coordinates.y}%`,
                left: `${point.coordinates.x}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all cursor-pointer ${
                isSelected ? 'scale-115 z-30' : 'hover:scale-105'
              }`}
            >
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full shadow-md font-bold text-xs border ${
                  isSelected
                    ? 'bg-[#007782] text-white border-white ring-2 ring-[#007782]/40'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[80px]">{point.carrierName.split(' ')[0]}</span>
                <span className="text-[10px] opacity-90">
                  {point.price === 0 ? 'Free' : formatPrice(point.price, currency)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* List of Lockers and Selection */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Nearby pickup points & lockers ({nearbyPoints.length})
        </h3>

        <div className="space-y-2.5">
          {nearbyPoints.map((point) => {
            const isSelected = selectedPoint?.id === point.id;
            return (
              <div
                key={point.id}
                onClick={() => setSelectedPoint(point)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-[#007782] ring-1 ring-[#007782] shadow-xs'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {point.pointName}
                      </span>
                      {point.badgeDiscount && (
                        <span className="text-[10px] font-bold bg-teal-50 text-[#007782] px-1.5 py-0.5 rounded-sm">
                          Free shipping
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {point.address}, {point.city}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-[#007782]" />
                        {point.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {point.openingHours}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {point.price === 0 ? 'Free' : formatPrice(point.price, currency)}
                    </p>
                    {point.originalPrice && (
                      <p className="text-[11px] text-gray-400 line-through">
                        {formatPrice(point.originalPrice, currency)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Select and Confirm Button */}
        {selectedPoint && (
          <div className="sticky bottom-3 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3.5 bg-[#007782] hover:bg-[#00626b] active:bg-[#004f56] text-white font-semibold text-base rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Select {selectedPoint.pointName}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
