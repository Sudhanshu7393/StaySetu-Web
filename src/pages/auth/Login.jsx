import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import GoogleButton from '../../components/auth/GoogleButton';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, loading: authLoading, signInWithGoogle, signInWithEmail, signInWithDemo } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Only allow dev demo mode if explicitly passed in URL query e.g. /login?dev=true
    const isDevMode = new URLSearchParams(location.search).get('dev') === 'true';

    // If already logged in, redirect
    useEffect(() => {
        if (!authLoading && user && profile) {
            const role = profile.role || 'student';
            if (role === 'admin') {
                navigate('/admin', { replace: true });
            } else if (role === 'owner' || role === 'broker') {
                navigate('/owner-dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [user, profile, authLoading, navigate]);

    if (authLoading || (user && profile)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
                <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-900 font-extrabold uppercase tracking-widest text-xs sm:text-sm animate-pulse text-center">
                    Checking your status...
                </p>
            </div>
        );
    }

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await signInWithEmail(email, password);
        } catch (err) {
            setError(err?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError(null);
            await signInWithGoogle();
        } catch (err) {
            setError(err?.message || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-[#FAFAFB] relative overflow-x-hidden">
            <div className="w-full max-w-md relative z-10 mx-auto">
                
                {/* Main Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xl shadow-zinc-200/50">

                    {/* Logo & Brand Header */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <Link to="/" className="flex items-center gap-2.5 group mb-2" title="Go to StaySetu Home">
                            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center p-2 bg-rose-50/70 border border-rose-100 shadow-xs transition-transform duration-300 group-hover:scale-105">
                                <img src="/logo.png?v=8" alt="StaySetu Logo" className="w-full h-full object-contain filter drop-shadow-xs" />
                            </div>
                            <div className="flex items-center tracking-tight font-black text-2xl sm:text-3xl text-zinc-900">
                                <span>Stay</span>
                                <span className="text-rose-600">Setu</span>
                            </div>
                        </Link>
                    </div>

                    <div className="text-center mb-6">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mb-1 tracking-tight">Welcome back</h1>
                        <p className="text-zinc-500 text-xs sm:text-sm font-normal">Sign in to explore & manage your verified stays</p>
                    </div>

                    {error && (
                        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-left">
                            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
                        </div>
                    )}

                    {/* Email / Password Login Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-rose-500 hover:bg-rose-600 active:scale-[0.99] text-white py-3.5 rounded-2xl text-sm font-extrabold uppercase tracking-wider shadow-md shadow-rose-500/25 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="relative my-6 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200"></div>
                        </div>
                        <span className="relative bg-white px-3 text-xs text-zinc-400 uppercase font-extrabold tracking-wider">
                            Or
                        </span>
                    </div>

                    <GoogleButton onClick={handleGoogleLogin} loading={loading} />

                    <p className="mt-6 text-center text-zinc-400 text-xs leading-relaxed">
                        By continuing, you agree to our{' '}
                        <Link to="/terms-of-service" className="text-zinc-600 underline hover:text-zinc-900">Terms</Link>
                        {' '}and{' '}
                        <Link to="/privacy-policy" className="text-zinc-600 underline hover:text-zinc-900">Privacy Policy</Link>.
                    </p>

                    {/* Secret dev test mode only if explicitly appended in URL: ?dev=true */}
                    {isDevMode && (
                        <div className="mt-6 pt-4 border-t border-dashed border-amber-300 bg-amber-50/60 p-3 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">
                                ⚙️ Developer Fast-Test
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => signInWithDemo('student')}
                                    className="flex-1 py-1.5 text-xs font-bold bg-white text-blue-700 border border-blue-200 rounded-xl"
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => signInWithDemo('owner')}
                                    className="flex-1 py-1.5 text-xs font-bold bg-white text-emerald-700 border border-emerald-200 rounded-xl"
                                >
                                    Owner
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Switcher */}
                <p className="mt-6 text-center text-zinc-600 font-medium text-xs sm:text-sm">
                    New to StaySetu?{' '}
                    <Link to="/signup" className="text-rose-600 hover:text-rose-700 font-extrabold underline ml-1">
                        Create a free account
                    </Link>
                </p>

            </div>
        </div>
    );
};

export default Login;