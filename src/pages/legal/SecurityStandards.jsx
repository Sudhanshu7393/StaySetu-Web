import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, AlertCircle, CheckCircle2, ArrowLeft, Phone, Mail, MapPin } from 'lucide-react';

const SecurityStandards = () => {
    useEffect(() => {
        document.title = 'Security & Safety Standards | StaySetu';
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFB] text-zinc-900 pt-20 sm:pt-28 pb-28 sm:pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Back button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-rose-600 transition-colors mb-6"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Home</span>
                </Link>

                {/* Header */}
                <div className="bg-white rounded-3xl p-5 sm:p-10 border border-zinc-200/80 shadow-xs mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200/70 mb-4">
                        <ShieldCheck size={14} />
                        Student Safety First
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
                        Security & Trust Standards
                    </h1>
                    <p className="text-zinc-500 text-xs sm:text-sm">
                        How StaySetu protects students, verifies property owners, and ensures safe campus housing.
                    </p>
                </div>

                {/* Standards Grid */}
                <div className="space-y-6 text-zinc-700 text-sm leading-relaxed">
                    
                    {/* 1 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">1</span>
                            Owner & Phone Verification
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 mb-3">
                            Every property listing submitted to StaySetu is reviewed by our administration before being set to live. We verify contact numbers and check for duplicate or suspicious entries.
                        </p>
                    </div>

                    {/* 2 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">2</span>
                            Zero Advance Token Policy Recommendation
                        </h2>
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <strong className="font-bold">Golden Safety Rule:</strong> Never transfer money online (Google Pay / PhonePe / Paytm) before physically seeing the room and meeting the owner in person. StaySetu will never ask you to pay any token money or booking fee online.
                            </div>
                        </div>
                    </div>

                    {/* 3 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">3</span>
                            Student Identity & Privacy Protection
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600">
                            When using our Roommate Finder or browsing stays, your personal email is kept strictly private. Connections happen directly on your terms via WhatsApp only when you decide to reach out.
                        </p>
                    </div>

                    {/* 4 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">4</span>
                            Report a Suspicious Listing / Emergency Helpline
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 mb-4">
                            If you encounter any misleading photos, unprofessional behavior, or suspicious demand for money, reach out immediately:
                        </p>
                        <div className="space-y-2 text-xs sm:text-sm font-semibold text-zinc-800">
                            <div className="flex items-center gap-2">
                                <Phone size={15} className="text-emerald-600" />
                                <span>+91 7393011350 (Instant WhatsApp Helpline)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={15} className="text-rose-600" />
                                <span>staysetu26@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={15} className="text-rose-600" />
                                <span>Crossings Republik, Ghaziabad, UP, India</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default SecurityStandards;
