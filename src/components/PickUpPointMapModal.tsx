import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  MapPin,
  Clock,
  Package,
  ChevronRight,
  Info,
  Navigation,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import { PickUpPoint, Currency, Address } from '../types';
import { CarrierBadge } from './CarrierBadge';
import { formatPrice } from '../data/mockData';

interface PickUpPointMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickupPoints: PickUpPoint[];
  selectedPointId: string | null;
  onSelectPoint: (point: PickUpPoint) => void;
  currency: Currency;
  userAddress: Address | null;
}

export const PickUpPointMapModal: React.FC<PickUpPointMapModalProps> = ({
  isOpen,
  onClose,
  pickupPoints,
  selectedPointId,
  onSelectPoint,
  currency,
  userAddress,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState(
    userAddress
      ? `${userAddress.line1}, ${userAddress.postalCode} ${userAddress.city}, ${userAddress.country}`
      : 'Henryka Siemiradzkiego 1, 31-140 Kraków, Poland'
  );
  const [activePointId, setActivePointId] = useState<string>(
    selectedPointId || pickupPoints[0]?.id || ''
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showPromoInfo, setShowPromoInfo] = useState(false);

  // Sync activePointId when selectedPointId changes or modal opens
  React.useEffect(() => {
    if (selectedPointId) {
      setActivePointId(selectedPointId);
    } else if (pickupPoints[0]) {
      setActivePointId(pickupPoints[0].id);
    }
  }, [selectedPointId, isOpen, pickupPoints]);

  const activePoint = useMemo(
    () => pickupPoints.find((p) => p.id === activePointId) || pickupPoints[0],
    [pickupPoints, activePointId]
  );

  const filteredPoints = useMemo(() => {
    if (!searchQuery.trim()) return pickupPoints;
    const q = searchQuery.toLowerCase();
    return pickupPoints.filter(
      (p) =>
        p.pointCode.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.carrierName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [pickupPoints, searchQuery]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    if (pickupPoints[0]) {
      setActivePointId(pickupPoints[0].id);
    }
  };

  const handleConfirmChoice = () => {
    if (activePoint) {
      onSelectPoint(activePoint);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top App Bar with Back Button & Title */}
        <div className="px-4 py-3.5 bg-white border-b border-gray-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1 -ml-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            Choose a pick-up point
          </h1>
        </div>

        {/* Search Bar matching Screenshot 2 */}
        <div className="px-4 pt-3 pb-2 bg-white shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, address or locker code"
              className="w-full pl-9.5 pr-8 py-2.5 bg-gray-50/90 hover:bg-gray-100/80 focus:bg-white text-xs sm:text-sm text-gray-800 rounded-lg border border-gray-200 focus:border-[#007782] focus:ring-1 focus:ring-[#007782] outline-hidden transition-all truncate"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Segmented Tabs: Map | List */}
        <div className="px-4 bg-white border-b border-gray-200 flex shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2.5 text-sm font-medium text-center relative transition-colors cursor-pointer ${
              activeTab === 'map'
                ? 'text-[#007782] font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Map
            {activeTab === 'map' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007782]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 text-sm font-medium text-center relative transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'text-[#007782] font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            List ({filteredPoints.length})
            {activeTab === 'list' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007782]" />
            )}
          </button>
        </div>

        {/* Modal Main Viewport */}
        {activeTab === 'map' ? (
          <div className="flex-1 relative flex flex-col overflow-hidden bg-[#F2EFE9]">
            {/* Interactive Vector Map Canvas */}
            <div
              className="flex-1 w-full h-full relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Map SVG Canvas with real-style Kraków roads and landmarks */}
              <div
                className="absolute inset-0 transition-transform duration-75"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
              >
                <svg
                  className="w-full h-full min-w-[600px] min-h-[600px]"
                  viewBox="0 0 600 600"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background Land */}
                  <rect width="600" height="600" fill="#F4F3F0" />

                  {/* Parks & Greenery */}
                  <path
                    d="M 20 20 Q 80 40 120 20 L 140 100 Q 60 120 20 100 Z"
                    fill="#D9EBD0"
                    opacity="0.8"
                  />
                  <path
                    d="M 420 380 Q 520 400 580 440 L 580 580 Q 460 560 400 480 Z"
                    fill="#D9EBD0"
                    opacity="0.8"
                  />

                  {/* Secondary Streets */}
                  <g stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="40" y1="180" x2="560" y2="280" />
                    <line x1="80" y1="520" x2="520" y2="80" />
                    <line x1="150" y1="60" x2="190" y2="540" />
                    <line x1="320" y1="40" x2="380" y2="560" />
                    <line x1="480" y1="100" x2="490" y2="550" />
                    <line x1="30" y1="360" x2="560" y2="340" />
                    <line x1="60" y1="450" x2="540" y2="480" />
                  </g>

                  {/* Secondary Street Borders */}
                  <g stroke="#E3E1DB" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="40" y1="174" x2="560" y2="274" />
                    <line x1="40" y1="186" x2="560" y2="286" />
                    <line x1="74" y1="520" x2="514" y2="80" />
                    <line x1="86" y1="520" x2="526" y2="80" />
                    <line x1="30" y1="354" x2="560" y2="334" />
                    <line x1="30" y1="366" x2="560" y2="346" />
                  </g>

                  {/* Primary Avenues / Roads */}
                  <path
                    d="M 40 140 Q 200 180 340 140 T 560 100"
                    stroke="#FFDE99"
                    strokeWidth="14"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 120 540 Q 220 360 320 280 T 520 180"
                    stroke="#FFDE99"
                    strokeWidth="14"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Street Labels */}
                  <text x="210" y="145" fontSize="8" fill="#757575" fontWeight="500" letterSpacing="0.5">
                    Aleje Słowackiego
                  </text>
                  <text x="180" y="320" fontSize="8" fill="#757575" fontWeight="500" transform="rotate(-30 180 320)">
                    Kremerowska
                  </text>
                  <text x="260" y="340" fontSize="8" fill="#757575" fontWeight="500">
                    Stefana Batorego
                  </text>
                  <text x="340" y="380" fontSize="8" fill="#757575" fontWeight="500" transform="rotate(-15 340 380)">
                    Garbarska
                  </text>
                  <text x="320" y="210" fontSize="8" fill="#757575" fontWeight="500" transform="rotate(35 320 210)">
                    Krowoderska
                  </text>
                  <text x="440" y="420" fontSize="7" fill="#4B7764" fontWeight="600">
                    Muzeum Książąt Czartoryskich
                  </text>
                  <text x="290" y="280" fontSize="9" fill="#9E9E9E" fontWeight="700" letterSpacing="1">
                    PIASEK PÓŁNOC
                  </text>
                  <text x="450" y="320" fontSize="8" fill="#9E9E9E" fontWeight="600" letterSpacing="0.5">
                    STARY KLEPARZ
                  </text>
                  <text x="70" y="210" fontSize="8" fill="#5F6368" fontWeight="500">
                    Radio Kraków
                  </text>
                </svg>

                {/* User Address Pin (Red marker with drop shadow) */}
                <div
                  className="absolute z-20 flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-full"
                  style={{ left: '50%', top: '48%' }}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-[#E53935] flex items-center justify-center shadow-md border-2 border-white">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-[#E53935] rotate-45 -mt-1 shadow-xs" />
                  <span className="mt-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-xs text-[9px] font-bold text-gray-800 rounded shadow-xs border border-gray-200">
                    Your location
                  </span>
                </div>

                {/* Pickup Point Location Pins */}
                {filteredPoints.map((point) => {
                  const isSelected = point.id === activePointId;

                  return (
                    <button
                      key={point.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePointId(point.id);
                      }}
                      className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 cursor-pointer focus:outline-hidden group"
                      style={{
                        left: `${point.coordinates.x}%`,
                        top: `${point.coordinates.y}%`,
                      }}
                      aria-label={`Select ${point.pointCode}`}
                    >
                      {isSelected ? (
                        /* Selected Pin Callout bubble matching Screenshot 2 */
                        <div className="flex flex-col items-center scale-110 drop-shadow-lg animate-in zoom-in-75 duration-150">
                          <div className="bg-black text-white px-2 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-gray-700">
                            {point.logoType === 'inpost' ? (
                              <div className="w-4 h-3 rounded-[2px] bg-[#FFCC00] flex items-center justify-center">
                                <span className="text-[7px] font-black text-black leading-none">InP</span>
                              </div>
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full bg-red-600 flex items-center justify-center text-[7px] font-bold text-white">
                                D
                              </div>
                            )}
                            <span className="text-[10px] font-bold tracking-tight">
                              {point.pointCode.split(' ')[0]}
                            </span>
                          </div>
                          <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1.5 shadow-md" />
                        </div>
                      ) : (
                        /* Unselected Minimal Marker Pin */
                        <div className="transition-transform group-hover:scale-115">
                          {point.logoType === 'inpost' ? (
                            <div className="w-6 h-4 rounded-[3px] bg-[#FFCC00] border border-black/80 flex items-center justify-center shadow-md">
                              <span className="text-[7px] font-black text-black tracking-tighter leading-none">
                                InPost
                              </span>
                            </div>
                          ) : point.logoType === 'dpd' ? (
                            <div className="w-5 h-5 rounded-full bg-[#DC0032] border border-white flex items-center justify-center shadow-md text-white text-[8px] font-black">
                              D
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#007782] border border-white flex items-center justify-center shadow-md text-white text-[8px] font-black">
                              <MapPin className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Watermark Attribution (bottom-left of map) */}
            <div className="absolute left-3 bottom-[215px] sm:bottom-[215px] z-20 pointer-events-none opacity-80">
              <span className="text-[11px] font-semibold text-gray-500 bg-white/70 px-1.5 py-0.5 rounded shadow-2xs">
                Google
              </span>
            </div>

            {/* Map Controls: Zoom & Recenter Navigation Button (bottom-right of map) */}
            <div className="absolute right-3 bottom-[215px] sm:bottom-[215px] z-30 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRecenter}
                className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#007782] hover:bg-gray-50 transition-colors cursor-pointer"
                title="Recenter to my address"
              >
                <Navigation className="w-4 h-4" />
              </button>
              <div className="flex flex-col bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden divide-y divide-gray-100">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
                  title="Zoom in"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.7))}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
                  title="Zoom out"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Floating Point Details Bottom Sheet matching Screenshot 2 */}
            {activePoint && (
              <div className="bg-white border-t border-gray-200 p-4 shadow-xl z-40 shrink-0 space-y-3">
                {/* Header: Carrier Name + Discount Tag */}
                <div className="flex items-center gap-2">
                  <CarrierBadge type={activePoint.logoType} size="sm" className="w-5 h-4.5 rounded-[3px]" />
                  <span className="text-sm font-semibold text-gray-900">
                    {activePoint.carrierName}
                  </span>
                  {activePoint.badgeDiscount && (
                    <span className="text-xs font-semibold text-[#007782]">
                      {activePoint.badgeDiscount}
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-gray-900">
                    {formatPrice(activePoint.price, currency)}
                  </span>
                  {activePoint.originalPrice !== undefined && activePoint.originalPrice > activePoint.price && (
                    <span className="line-through text-gray-400 text-xs">
                      {formatPrice(activePoint.originalPrice, currency)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPromoInfo(!showPromoInfo)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                    title="Shipping promotion details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showPromoInfo && (
                  <div className="text-[11px] text-[#007782] bg-teal-50 p-2 rounded-md border border-teal-100">
                    100% discount applied for pickup locker delivery promotion.
                  </div>
                )}

                {/* Point Identifier / Locker Code */}
                <div className="flex items-center justify-between text-xs text-gray-800 pt-0.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="font-medium text-gray-900">{activePoint.pointCode}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                {/* Address */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{activePoint.address}</span>
                </div>

                {/* ETA */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{activePoint.estimatedDelivery}</span>
                </div>

                {/* Primary CTA: Choose this pick-up point */}
                <button
                  type="button"
                  onClick={handleConfirmChoice}
                  className="w-full py-3 bg-[#007782] hover:bg-[#006069] active:bg-[#004f56] text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer text-center"
                >
                  Choose this pick-up point
                </button>
              </div>
            )}
          </div>
        ) : (
          /* List Mode */
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {filteredPoints.map((point) => {
              const isSelected = point.id === activePointId;

              return (
                <div
                  key={point.id}
                  onClick={() => setActivePointId(point.id)}
                  className={`bg-white rounded-xl p-4 border transition-all cursor-pointer shadow-2xs space-y-2.5 ${
                    isSelected
                      ? 'border-[#007782] ring-1 ring-[#007782]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CarrierBadge type={point.logoType} size="sm" className="w-5 h-4.5 rounded-[3px]" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{point.pointCode}</p>
                        <p className="text-xs text-gray-500">{point.carrierName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatPrice(point.price, currency)}
                      </p>
                      <span className="text-[11px] text-gray-500 font-medium">{point.distance}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{point.address}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{point.estimatedDelivery} • {point.openingHours}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPoint(point);
                      onClose();
                    }}
                    className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#007782] text-white hover:bg-[#006069]'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? 'Choose this pick-up point' : 'Select point'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
