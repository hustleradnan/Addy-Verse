import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/account';

  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email.trim()) {
      setError('Email daalna zaroori hai.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setError('OTP bhejne mein error: ' + error.message);
    } else {
      setInfo('Aapke email par ek 6-digit code bheja gaya hai. Kripya apna inbox check karein.');
      setStep('otp');
    }

    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!otp.trim()) {
      setError('OTP daalna zaroori hai.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });

    if (error) {
      setError('OTP galat hai ya expire ho gaya hai: ' + error.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      navigate(redirectTo, { replace: true });
    } else {
      setError('Login fail ho gaya. Dobara try karein.');
    }

    setLoading(false);
  }

  async function handleResendOtp() {
    setError('');
    setInfo('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setError('OTP dobara bhejne mein error: ' + error.message);
    } else {
      setInfo('Naya OTP bhej diya gaya hai.');
    }

    setLoading(false);
  }

  function handleChangeEmail() {
    setStep('email');
    setOtp('');
    setError('');
    setInfo('');
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-card p-8">
        <h1 className="text-2xl font-serif font-bold text-navy-900 mb-2 text-center">
          Login / Sign Up
        </h1>
        <p className="text-navy-500 text-sm text-center mb-8">
          {step === 'email'
            ? 'Apna email daalein, hum aapko ek OTP bhejenge.'
            : `Hum ne ${email} par OTP bheja hai.`}
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {info}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Bhej rahe hain...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="w-full px-4 py-2.5 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 tracking-widest text-center text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Verify ho raha hai...' : 'Verify & Login'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleChangeEmail}
                className="text-navy-500 hover:text-navy-700 transition"
              >
                ← Email change karein
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-gold-600 hover:text-gold-700 transition disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-navy-400 text-xs mt-8">
          Staff member hain?{' '}
          <Link to="/admin/login" className="text-navy-600 hover:underline">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}
