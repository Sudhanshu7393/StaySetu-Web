import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Home, Users, Sparkles, MapPin, Phone, MessageCircle, 
    ArrowRight, CheckCircle2, ShieldCheck, Clock, Building2,
    Calendar, HeartHandshake, Eye, Youtube
} from 'lucide-react';

const EcosystemBenefits = () => {
    return (
        <section className="py-16 md:py-24 bg-[#F8FAFC] relative overflow-hidden border-b border-zinc-200/60">
            {/* Subtle Brand Ambient Glows */}
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-rose-400/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-500/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200 mb-3 shadow-2xs">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>100% Free Forever • ₹0 Brokerage • Direct Connect</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                        The 3 Biggest Student Living Needs, <span className="text-rose-600">Solved in One Platform</span>
                    </h2>
                    <p className="text-zinc-500 font-normal text-sm sm:text-base mt-2.5 leading-relaxed">
                        Finding a clean room, a compatible roommate, and reliable local housekeeping shouldn't be stressful. StaySetu brings complete clarity, zero fees, and direct connections to your campus life.
                    </p>
                </div>

                {/* 3 Real Feature Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
                    
                    {/* 1. VERIFIED STAYS */}
                    <div className="bg-white rounded-3xl p-7 sm:p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            {/* Icon & Badge */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-13 h-13 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
                                    <Home size={26} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 text-zinc-700">
                                    1. Stays
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 mb-2">
                                Verified PGs, Hostels & Flats
                            </h3>
                            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed mb-6">
                                Explore vetted student stays around premier campuses with upfront pricing, real photos, and accurate locations.
                            </p>

                            {/* Real Points */}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Interactive <strong>Map Search</strong> to find stays within walking distance of campus</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Rent, security deposit, and broker fee <strong>100% transparently disclosed</strong></span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Schedule a <strong>Free In-Person Visit</strong> before paying any token amount</span>
                                </div>
                            </div>
                        </div>

                        {/* Direct Button */}
                        <div className="pt-4 border-t border-zinc-100 flex items-center gap-2">
                            <Link
                                to="/listings"
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-3 px-4 rounded-full text-center tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/20"
                            >
                                <span>Browse Stays</span>
                                <ArrowRight size={13} />
                            </Link>
                            <Link
                                to="/listings?view=map"
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold py-3 px-3.5 rounded-full transition-all"
                                title="Open Map"
                            >
                                🗺️ Map
                            </Link>
                        </div>
                    </div>

                    {/* 2. ROOMMATE FINDER */}
                    <div className="bg-white rounded-3xl p-7 sm:p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            {/* Icon & Badge */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-13 h-13 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
                                    <Users size={26} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 text-zinc-700">
                                    2. Roommates
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 mb-2">
                                Campus Roommate Matching
                            </h3>
                            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed mb-6">
                                Split your flat rent by 50% and find compatible batchmates from your college, department, or year.
                            </p>

                            {/* Real Points */}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Filter profiles by university, branch, and target move-in date</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Match sleep schedules, study habits, and dietary preferences</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Direct connection on WhatsApp with zero middlemen</span>
                                </div>
                            </div>
                        </div>

                        {/* Direct Button */}
                        <div className="pt-4 border-t border-zinc-100">
                            <Link
                                to="/roommates"
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-3 px-4 rounded-full text-center tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <span>Find Roommates</span>
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>

                    {/* 3. MAID & COOK DIRECTORY */}
                    <div className="bg-white rounded-3xl p-7 sm:p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            {/* Icon & Badge */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-13 h-13 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
                                    <Sparkles size={26} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-100 text-zinc-700">
                                    3. Maids & Cooks
                                </span>
                            </div>

                            <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 mb-2">
                                Verified Housekeeping & Cooks
                            </h3>
                            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed mb-6">
                                Settle into your flat with trusted home-cooked meals and daily cleaning assistance from verified neighborhood helpers.
                            </p>

                            {/* Real Points */}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Direct contact with local cooks and housekeeping specialists</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Compare monthly rates, food preferences (North/South Indian), and timings</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-700">
                                    <CheckCircle2 size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                    <span>Direct phone & WhatsApp connect with zero commission or fees</span>
                                </div>
                            </div>
                        </div>

                        {/* Direct Button */}
                        <div className="pt-4 border-t border-zinc-100">
                            <Link
                                to="/maids"
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-3 px-4 rounded-full text-center tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <span>Find Maid & Cook</span>
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>

                </div>

                {/* YouTube Video Tours Showcase Card */}
                <div className="rounded-3xl bg-gradient-to-r from-red-50/90 via-white to-red-100/50 p-6 sm:p-8 border border-red-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-500/25">
                            <Youtube size={24} className="fill-current" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200/80 inline-block mb-1">
                                Official YouTube Channel • @Sudhanshu_vision
                            </span>
                            <h4 className="text-base sm:text-lg font-black text-zinc-900">
                                Watch Honest PG & Campus Walkthrough Videos
                            </h4>
                            <p className="text-zinc-600 text-xs sm:text-sm mt-0.5 max-w-2xl">
                                Watch real room tours, mess food reviews, hostel amenities, and college neighborhood guides before you visit or book.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        <a
                            href="https://www.youtube.com/@Sudhanshu_vision"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-full text-xs text-center transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2"
                        >
                            <Youtube size={15} className="fill-current" />
                            <span>Subscribe @Sudhanshu_vision</span>
                        </a>
                    </div>
                </div>

                {/* Real Bottom Callout for Property Owners */}
                <div className="rounded-3xl bg-white p-6 sm:p-8 border border-zinc-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/70 inline-block mb-1">
                                For Property Owners & Landlords
                            </span>
                            <h4 className="text-base sm:text-lg font-black text-zinc-900">
                                Have a vacant PG, hostel, or flat near a campus?
                            </h4>
                            <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
                                List for free on StaySetu to connect directly with genuine students, working professionals, and parents.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        <Link
                            to="/signup"
                            className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-6 py-3 rounded-full text-xs text-center transition-all shadow-sm shadow-rose-500/25"
                        >
                            List Property Free
                        </Link>
                        <a
                            href="https://wa.me/917393011350?text=Hi%20StaySetu%20Team%2C%20I%20am%20a%20property%20owner%20and%20want%20to%20list%20my%20PG%2FFlat."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold px-5 py-3 rounded-full text-xs text-center border border-zinc-200/80 transition-all flex items-center justify-center gap-1.5"
                        >
                            <MessageCircle size={14} className="text-emerald-600" />
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default EcosystemBenefits;
