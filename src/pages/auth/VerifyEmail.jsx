import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { account } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkUser, profile } = useAuth();

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');
    const hasParams = Boolean(userId && secret);

    const [status, setStatus] = useState(hasParams ? 'verifying' : 'error');
    const [errorMsg, setErrorMsg] = useState(hasParams ? '' : 'Invalid verification link. Please request a new one.');

    useEffect(() => {
        if (!hasParams) return;

        let active = true;
        const verify = async () => {
            try {
                await account.updateVerification(userId, secret);
                await checkUser();
                if (active) {
                    setStatus('success');
                    setTimeout(() => {
                        const role = profile?.role || 'student';
                        navigate((role === 'owner' || role === 'broker') ? '/owner-dashboard' : '/dashboard', { replace: true });
                    }, 2500);
                }
            } catch (err) {
                if (active) {
                    setStatus('error');
                    if (err.code === 401) {
                        setErrorMsg('This verification link has expired or already been used.');
                    } else {
                        setErrorMsg(err.message || 'Verification failed. Please try again.');
                    }
                }
            }
        };

        verify();
        return () => { active = false; };
    }, [hasParams, userId, secret, checkUser, navigate, profile?.role]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="card-elevated p-10 animate-slide-up text-center">

                    {/* Logo */}
                    <div className="w-32 h-16 rounded-3xl flex items-center justify-center mx-auto mb-8 p-2 bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <img src="/logo.png?v=8" alt="StaySetu Logo" className="w-full h-full object-contain" />
                    </div>

                    {/* Verifying */}
                    {status === 'verifying' && (
                        <div className="animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
                                <Loader2 className="text-blue-600 animate-spin" size={28} />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 mb-2">
                                Verifying your email…
                            </h1>
                            <p className="text-slate-500 text-sm">Please wait a moment.</p>
                        </div>
                    )}

                    {/* Success */}
                    {status === 'success' && (
                        <div className="animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                                <CheckCircle2 className="text-emerald-500" size={32} />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 mb-2">
                                Email Verified! 🎉
                            </h1>
                            <p className="text-slate-500 text-sm">Your account is confirmed. Redirecting to your dashboard…</p>
                        </div>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <div className="animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                                <XCircle className="text-red-500" size={32} />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 mb-2">
                                Verification Failed
                            </h1>
                            <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary w-full py-3"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
