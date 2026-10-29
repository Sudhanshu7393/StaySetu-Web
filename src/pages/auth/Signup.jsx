import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, UserCircle, Briefcase, User, Mail, Lock, User as UserIcon } from 'lucide-react';
import GoogleButton from '../../components/auth/GoogleButton';

const Signup = () => {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading, signInWithGoogle, signUpWithEmail } = useAuth();
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // If already logged in, redirect
    useEffect(() => {
        if (!authLoading && user && profile) {
            const r = profile.role || 'student';
            navigate((r === 'owner' || r === 'broker') ? '/owner-dashboard' : '/dashboard', { replace: true });
        }
    }, [user, profile, authLoading, navigate]);

    if (authLoading || (user && profile)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-plum-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-900 font-black uppercase tracking-widest text-sm animate-pulse">Setting up your experience...</p>
            </div>
        );
    }

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        if (!fullName || !email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await signUpWithEmail(email, password, fullName, role);
        } catch (err) {
            setError(err?.message || 'Account creation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            setLoading(true);
            setError(null);
            await signInWithGoogle(role);
        } catch (err) {
            setError(err?.message || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { id: 'student', label: 'Student', icon: UserCircle, desc: 'Find PGs & Flatmates' },
        { id: 'owner', label: 'Owner', icon: Briefcase, desc: 'List & Manage Property' },
        { id: 'broker', label: 'Broker', icon: User, desc: 'Manage Multiple Stays' },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-surface relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="card-elevated p-8 animate-slide-up">

                    {/* Logo & Brand */}
                    <div className="text-center mb-6">
                        <Link to="/" className="inline-flex items-center gap-2.5 group mb-3">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2 bg-rose-50/60 border border-rose-100 shadow-xs transition-transform duration-300 group-hover:scale-105">
                                <img src="/logo.png?v=8" alt="StaySetu Logo" className="w-full h-full object-contain filter drop-shadow-xs" />
                            </div>
                            <div className="flex items-center tracking-tight font-black text-2xl font-outfit text-slate-900">
                                <span>Stay</span>
                                <span className="text-rose-600">Setu</span>
                            </div>
                        </Link>
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Join StaySetu</h1>
                        <p className="text-slate-500 text-xs font-normal">Find your next stay or tenant in minutes</p>
                    </div>

                    {error && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 animate-fade-in text-left">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="mb-5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">I want to join as</label>
                        <div className="grid grid-cols-3 gap-2">
                            {roles.map((r) => {
                                const Icon = r.icon;
                                const isSelected = role === r.id;
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id)}
                                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center ${
                                            isSelected
                                                ? 'border-plum-500 bg-plum-50/50 text-slate-900 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-plum-600' : 'text-slate-400'}`} />
                                        <span className="font-bold text-xs">{r.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleEmailSignup} className="space-y-3.5 text-left mb-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                            <div className="relative">
                                <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Your Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-plum-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    placeholder="you@college.edu"
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
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-plum-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all mt-2"
                        >
                            {loading ? 'Creating Account...' : `Register as ${roles.find(r => r.id === role)?.label}`}
                        </button>
                    </form>

                    <div className="relative my-4 text-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <span className="relative bg-white px-3 text-xs text-slate-400 uppercase font-bold tracking-wider">Or</span>
                    </div>

                    <GoogleButton onClick={handleGoogleSignup} loading={loading} />

                    <p className="mt-5 text-center text-slate-400 text-xs">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>

                <p className="mt-6 text-center text-slate-500 font-normal text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-900 hover:text-blue-800 font-bold underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
