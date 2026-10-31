import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Home, Users, Sparkles, ArrowRight, CheckCircle2, Building2,
    MessageCircle, Instagram
} from 'lucide-react';

const EcosystemBenefits = () => {
    return (
        <section className="py-12 sm:py-16 bg-[#F8FAFC] border-b border-zinc-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider border border-rose-200/80 mb-2.5">
                        <CheckCircle2 size={13} className="text-rose-600" />
                        Everything You Need in One Place
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">
                        Living Made Simple & Transparent
                    </h2>
                    <p className="text-zinc-500 font-normal text-xs sm:text-sm mt-1.5 max-w-lg mx-auto">
                        Verified homes, compatible flatmates, and trusted local help with zero hidden charges.
                    </p>
                </div>

                {/* 3 Clean Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
                    
                    {/* 1. Verified Stays */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 hover:border-rose-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 group-hover:scale-105 transition-transform">
                                <Home size={22} />
                            </div>
                            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 mb-1.5">
                                Verified Stays & Flats
                            </h3>
                            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed mb-4">
                                Vetted apartments, flats, and rooms with 100% upfront pricing, real photos, and direct WhatsApp connect.
                            </p>
                        </div>

                        <Link
                            to="/listings"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 pt-3 border-t border-zinc-100 group-hover:translate-x-1 transition-all"
                        >
                            <span>Browse verified stays</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* 2. Roommates */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 hover:border-rose-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-105 transition-transform">
                                <Users size={22} />
                            </div>
                            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 mb-1.5">
                                Flatmate & Roommate Finder
                            </h3>
                            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed mb-4">
                                Split flat rent and match with compatible roommates based on campus, budget, and lifestyle habits.
                            </p>
                        </div>

                        <Link
                            to="/roommates"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 pt-3 border-t border-zinc-100 group-hover:translate-x-1 transition-all"
                        >
                            <span>Find roommates</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* 3. Maids & Cooks */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 hover:border-rose-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-105 transition-transform">
                                <Sparkles size={22} />
                            </div>
                            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 mb-1.5">
                                Cooks & Housekeeping
                            </h3>
                            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed mb-4">
                                Find trusted home cooks and daily housekeeping staff across Crossings Republik and nearby areas.
                            </p>
                        </div>

                        <Link
                            to="/maids"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-3 border-t border-zinc-100 group-hover:translate-x-1 transition-all"
                        >
                            <span>View helper directory</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                </div>

                {/* Sleek Owner & Community Banner */}
                <div className="rounded-3xl bg-white p-5 sm:p-7 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm sm:text-base font-extrabold text-zinc-900">
                                Own a flat or PG? List it for ₹0 Free
                            </h4>
                            <p className="text-zinc-500 text-xs mt-0.5">
                                Reach genuine buyers and tenants with direct WhatsApp inquiries.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                        <Link
                            to="/dashboard/add-listing"
                            className="flex-1 sm:flex-none bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-5 py-2.5 rounded-full text-xs text-center transition-all shadow-xs"
                        >
                            + List Property
                        </Link>
                        <a
                            href="https://www.instagram.com/stay.setu/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-full bg-zinc-100 hover:bg-pink-50 text-zinc-700 hover:text-pink-600 border border-zinc-200/80 transition-colors shrink-0"
                            title="Follow @stay.setu on Instagram"
                        >
                            <Instagram size={16} />
                        </a>
                        <a
                            href="https://wa.me/917393011350?text=Hi%20StaySetu%20Team%2C%20I%20am%20interested%20in%20listing%20my%20property."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors shrink-0"
                            title="Connect on WhatsApp"
                        >
                            <MessageCircle size={16} />
                        </a>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default EcosystemBenefits;
