import React from 'react';
import { UserPlus, Search, MessageSquare, Home } from 'lucide-react';

const steps = [
    {
        title: 'Select Your Area or Campus',
        description: 'Search stays across Crossings Republik, Ghaziabad, Noida, Lucknow, or any campus across India.',
        icon: Search,
    },
    {
        title: 'Review Transparent Pricing',
        description: 'Monthly rent, refundable security deposit, and exact broker fee — all 100% disclosed upfront.',
        icon: Home,
    },
    {
        title: 'Connect Directly on WhatsApp',
        description: 'Chat instantly with property owners or verified brokers to ask questions and schedule a visit.',
        icon: MessageSquare,
    },
    {
        title: 'Inspect & Move In Confidently',
        description: 'Take an in-person tour, verify room amenities, finalize your booking, and shift in smoothly.',
        icon: UserPlus,
    },
];

const HowItWorks = () => {
    return (
        <section className="py-20 md:py-24 bg-white text-zinc-900 relative overflow-hidden border-b border-zinc-200/60">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider border border-rose-200/80 mb-3 shadow-xs">
                        Simple & Transparent
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                        Finding Your Ideal Stay in 4 Easy Steps
                    </h2>
                    <p className="text-zinc-500 font-normal text-xs sm:text-sm md:text-base mt-2">
                        Zero hidden surprises — complete clarity from your initial search to move-in day.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {steps.map((step, index) => (
                        <div key={index} className="relative z-10 flex flex-col items-center text-center group">
                            {/* Card */}
                            <div className="p-7 flex-1 w-full bg-[#F8FAFC] rounded-3xl border border-zinc-200/80 hover:border-rose-300 hover:bg-white shadow-xs hover:shadow-lg flex flex-col items-center transition-all duration-300">
                                {/* Step number + icon */}
                                <div className="relative mb-5">
                                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-xs">
                                        <step.icon size={24} />
                                    </div>
                                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-xs">
                                        {index + 1}
                                    </div>
                                </div>

                                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 mb-2">{step.title}</h3>
                                <p className="text-zinc-500 text-xs leading-relaxed font-normal">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
