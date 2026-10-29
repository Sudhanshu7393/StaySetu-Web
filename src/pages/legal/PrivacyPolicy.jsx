import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    useEffect(() => {
        document.title = 'Privacy Policy | StaySetu';
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFB] text-zinc-900 pt-28 pb-20">
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
                <div className="bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200/80 shadow-xs mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider border border-rose-200/70 mb-4">
                        <ShieldCheck size={14} />
                        Official Policy
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
                        Privacy Policy
                    </h1>
                    <p className="text-zinc-500 text-xs sm:text-sm">
                        Last Updated: October 2026 • Effective Immediately across StaySetu Platform
                    </p>
                    <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <strong className="font-bold">100% Free & Anti-Spam Guarantee:</strong> StaySetu never sells, rents, or monetizes student or owner personal data. Your contact details are only shared directly when you choose to connect regarding a stay, roommate, or housekeeping service.
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-6 text-zinc-700 text-sm leading-relaxed">
                    
                    {/* Section 1 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">1</span>
                            Information We Collect
                        </h2>
                        <p className="mb-4 text-xs sm:text-sm text-zinc-600">
                            We collect only the essential information necessary to provide seamless housing connections:
                        </p>
                        <ul className="space-y-2.5 list-disc list-inside text-xs sm:text-sm text-zinc-600">
                            <li><strong className="text-zinc-900">Account Details:</strong> Your name, email address, phone number, and student/owner role when you register.</li>
                            <li><strong className="text-zinc-900">Student & Roommate Preferences:</strong> Target college or campus (e.g. ABES, IMS, AKGEC, DU), gender preference, budget, and move-in timeline.</li>
                            <li><strong className="text-zinc-900">Property Listings:</strong> Photos, location, amenities, rent, and contact number provided by property owners.</li>
                            <li><strong className="text-zinc-900">Domestic Service Listings:</strong> Name, service type, preferred timings, and contact numbers for cooks and housekeepers.</li>
                        </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">2</span>
                            How We Use Your Information
                        </h2>
                        <ul className="space-y-2.5 list-disc list-inside text-xs sm:text-sm text-zinc-600">
                            <li>To display verified property and roommate listings to relevant students.</li>
                            <li>To enable direct WhatsApp / phone connections between students and verified property owners without middlemen.</li>
                            <li>To verify listing authenticity, prevent fraudulent posts, and protect students from scams.</li>
                            <li>To notify you about visit scheduling requests and connection inquiries.</li>
                        </ul>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">3</span>
                            Data Security & Storage
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 mb-3">
                            StaySetu employs state-of-the-art cloud infrastructure powered by Supabase with Row Level Security (RLS) and SSL/TLS encryption for all data in transit and at rest.
                        </p>
                        <p className="text-xs sm:text-sm text-zinc-600">
                            Passwords are cryptographic hashes and can never be viewed in plain text by anyone, including administrators.
                        </p>
                    </div>

                    {/* Section 4 */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">4</span>
                            Your Rights & Account Deletion
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600">
                            You have full control over your personal data. You may update your profile or delete your listings at any time from your dashboard. If you wish to permanently delete your account and all associated data, simply contact us at <a href="mailto:staysetu26@gmail.com" className="text-rose-600 font-bold hover:underline">staysetu26@gmail.com</a>.
                        </p>
                    </div>

                    {/* Section 5 - Official Contact */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-black">5</span>
                            Contact Us
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 mb-4">
                            For any privacy inquiries, grievance redressal, or questions about this policy:
                        </p>
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

export default PrivacyPolicy;
