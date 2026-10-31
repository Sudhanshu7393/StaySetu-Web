import React from 'react';
import { Search, MessageSquare, CheckCircle } from 'lucide-react';

const steps = [
    {
        title: '1. Search & Shortlist',
        description: 'Browse verified stays and flats with transparent rent, deposit, and real photos.',
        icon: Search,
    },
    {
        title: '2. Direct WhatsApp Connect',
        description: 'Chat directly with owners or schedule an in-person site visit with zero broker fees.',
        icon: MessageSquare,
    },
    {
        title: '3. Move in Confidently',
        description: 'Inspect the property, finalize your agreement, and shift into your new home smoothly.',
        icon: CheckCircle,
    },
];

const HowItWorks = () => {
    return (
        <section className="py-12 sm:py-16 bg-white text-zinc-900 border-b border-zinc-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-xl mx-auto mb-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider border border-rose-200/80 mb-2.5">
                        Simple & Fast
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">
                        How StaySetu Works
                    </h2>
                    <p className="text-zinc-500 font-normal text-xs sm:text-sm mt-1.5">
                        Three simple steps from finding a place to moving into your new home.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {steps.map((step, index) => (
                        <div key={index} className="p-6 sm:p-7 bg-[#F8FAFC] rounded-3xl border border-zinc-200/80 hover:border-rose-300 hover:bg-white shadow-2xs hover:shadow-md transition-all duration-300 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                <step.icon size={22} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 mb-1">{step.title}</h3>
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
