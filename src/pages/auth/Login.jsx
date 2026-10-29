import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, User, Briefcase, ShieldCheck, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import GoogleButton from '../../components/auth/GoogleButton';

const Login = () => {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signInWithGoogle, signInWithDemo, signInWithEmail } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState('email'); // Real authentication default

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
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-plum-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-900 font-black uppercase tracking-widest text-sm animate-pulse">Checking your status...</p>
            </div>
        );
    }

    const handleDemoLogin = async (role) => {
        try {
            setLoading(true);
            setError(null);
            await signInWithDemo(role);
        } catch (err) {
            setError(err?.message || 'Demo sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-surface relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="card-elevated p-8 animate-slide-up">

                    {/* Logo & Brand */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <Link to="/" className="flex items-center gap-2.5 group mb-2">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2 bg-rose-50/60 border border-rose-100 shadow-xs transition-transform duration-300 group-hover:scale-105">
                                <img src="/logo.png?v=8" alt="StaySetu Logo" className="w-full h-full object-contain filter drop-shadow-xs" />
                            </div>
                            <div className="flex items-center tracking-tight font-black text-2xl font-outfit text-slate-900">
                                <span>Stay</span>
                                <span className="text-rose-600">Setu</span>
                            </div>
                        </Link>
                    </div>

                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back</h1>
                        <p className="text-slate-500 text-xs font-normal">Sign in to explore & manage stays</p>
                    </div>

                    {error && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 animate-fade-in text-left">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setAuthMode('demo')}
                            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${authMode === 'demo' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Sparkles size={14} className="text-amber-500" /> Quick 1-Click Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setAuthMode('email')}
                            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${authMode === 'email' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Mail size={14} /> Email / Password
                        </button>
                    </div>

                    {authMode === 'demo' ? (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 font-medium text-center mb-2">Select a role to test the platform instantly:</p>
                            
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('student')}
                                disabled={loading}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-plum-500 hover:bg-plum-50/40 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700">Student Account</p>
                                        <p className="text-xs text-slate-400">student@staysetu.com</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDemoLogin('owner')}
                                disabled={loading}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                        <Briefcase size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">Property Owner Account</p>
                                        <p className="text-xs text-slate-400">owner@staysetu.com</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin')}
                                disabled={loading}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-purple-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-purple-700">Super Admin Panel</p>
                                        <p className="text-xs text-slate-400">staysetu26@gmail.com</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-plum-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-plum-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    <div className="relative my-6 text-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <span className="relative bg-white px-3 text-xs text-slate-400 uppercase font-bold tracking-wider">Or</span>
                    </div>

                    <GoogleButton onClick={handleGoogleLogin} loading={loading} />

                    <p className="mt-6 text-center text-slate-400 text-xs">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>

                <p className="mt-6 text-center text-slate-500 font-normal text-sm">
                    New to StaySetu?{' '}
                    <Link to="/signup" className="text-blue-900 hover:text-blue-800 font-bold underline">Create an account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
