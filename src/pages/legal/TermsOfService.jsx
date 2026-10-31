import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, AlertTriangle, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';

const TermsOfService = () => {
    useEffect(() => {
        document.title = 'Terms of Service | StaySetu';
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider border border-rose-200/70 mb-4">
                        <FileText size={14} />
                        Terms of Use
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
                        Terms of Service
                    </h1>
                    <p className="text-zinc-500 text-xs sm:text-sm">
                        Last Updated: October 2026 • Please read these terms carefully before using StaySetu
                    </p>
                    <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <strong className="font-bold">100% Free Community Platform:</strong> StaySetu connects college students and property owners across India directly with transparent pricing, ₹0 listing fees, and zero hidden platform charges.
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-6 text-zinc-700 text-sm leading-relaxed">
                    
                    {/* Section 1 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">1</span>
                            Acceptance of Terms
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600">
                            By accessing or using the StaySetu website and services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                        </p>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">2</span>
                            Transparent Pricing & Direct Connect Policy
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 mb-3">
                            StaySetu is built to ensure complete pricing transparency and direct connects:
                        </p>
                        <ul className="space-y-2.5 list-disc list-inside text-xs sm:text-sm text-zinc-600">
                            <li><strong className="text-zinc-900">For Students:</strong> Searching, filtering, viewing room tours, and contacting property owners or roommates is 100% free of charge.</li>
                            <li><strong className="text-zinc-900">For Property Owners:</strong> Listing your PG, hostel, or flat on StaySetu is 100% free with no hidden commissions.</li>
                            <li><strong className="text-zinc-900">No Paywalls:</strong> We do not charge fees to unlock owner phone numbers or schedule visits.</li>
                        </ul>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">3</span>
                            Listing Authenticity & Rules
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 mb-3">
                            To ensure high safety standards for college students:
                        </p>
                        <ul className="space-y-2.5 list-disc list-inside text-xs sm:text-sm text-zinc-600">
                            <li>Owners must post accurate photos, authentic monthly rents, and valid contact numbers.</li>
                            <li>Any listing containing false information, misleading photos, or predatory practices will be immediately removed by our moderation team.</li>
                            <li>Users must not post discriminatory, offensive, or harassing content in roommate descriptions or messages.</li>
                        </ul>
                    </div>

                    {/* Section 4 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">4</span>
                            Safety & Inspection Disclaimer
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 mb-3">
                            StaySetu provides a direct connection platform between students, owners, and service providers. While we actively vet listings:
                        </p>
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Always inspect in person:</strong> Students are strongly advised to schedule an in-person physical visit, inspect room amenities, verify lock and security, and review the rental terms before transferring any security deposit or token money.</span>
                        </div>
                    </div>

                    {/* Section 5 - Contact */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">5</span>
                            Contact & Support
                        </h2>
                        <div className="space-y-2 text-xs sm:text-sm font-semibold text-zinc-800">
                            <div className="flex items-center gap-2">
                                <Mail size={15} className="text-rose-600" />
                                <span>staysetu26@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={15} className="text-emerald-600" />
                                <span>+91 7393011350 (WhatsApp / Call)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={15} className="text-rose-600" />
                                <span>Crossings Republik, Ghaziabad, Uttar Pradesh 201016, India</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default TermsOfService;
