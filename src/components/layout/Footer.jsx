import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowUpRight, Instagram, Youtube, Phone } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative z-10 bg-[#0e1015] text-zinc-400 pt-16 pb-10 overflow-hidden border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

                    {/* Brand */}
                    <div className="col-span-1 lg:col-span-1">
                        <Link to="/" className="flex items-center gap-3 mb-5 group select-none">
                            <div className="h-11 w-11 rounded-2xl flex items-center justify-center p-1.5 bg-white shadow-sm border border-white/20 transition-transform duration-300 group-hover:scale-105 overflow-hidden">
                                <img src="/logo-icon.png" alt="StaySetu Logo" className="h-full w-full object-contain" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <div className="flex items-center tracking-tight font-black text-2xl font-outfit text-white">
                                    <span>Stay</span>
                                    <span className="bg-gradient-to-r from-rose-400 to-rose-500 bg-clip-text text-transparent">Setu</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                                    Your Bridge to Better Living
                                </span>
                            </div>
                        </Link>
                        <p className="text-zinc-400 mb-6 leading-relaxed text-xs sm:text-sm font-normal">
                            Your bridge to better living. We connect students with safe, verified, and affordable housing options across India's top college hubs.
                        </p>
                        <div className="flex items-center space-x-2 mb-4">
                            <a
                                href="https://www.instagram.com/stay.setu/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-all border border-white/10"
                                title="Instagram @stay.setu"
                            >
                                <Instagram size={15} />
                            </a>
                            <a
                                href="https://www.youtube.com/@Sudhanshu_vision"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/10"
                                title="YouTube @Sudhanshu_vision"
                            >
                                <Youtube size={15} />
                            </a>
                        </div>
                        <a
                            href="https://www.instagram.com/stay.setu/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-[11px] font-bold transition-all"
                        >
                            <Instagram size={13} className="text-rose-500" />
                            <span>Follow @stay.setu</span>
                        </a>
                    </div>

                    {/* Explore */}
                    <div>
                        <h3 className="text-white font-extrabold text-sm mb-5">Explore Stays</h3>
                        <ul className="space-y-3">
                            {[
                                { id: 'e1', label: 'Boys PG', to: '/listings?type=PG&gender=Boys', desc: 'Secure and safe stays for students.' },
                                { id: 'e2', label: 'Girls PG', to: '/listings?type=PG&gender=Girls', desc: 'Vetted and verified girls only spaces.' },
                                { id: 'e3', label: 'Flats & Apartments', to: '/listings?type=Flat', desc: 'Independent student flats.' },
                                { id: 'e4', label: 'Student Hostels', to: '/listings?type=Hostel', desc: 'Hostels with mess & security.' },
                                { id: 'e5', label: 'List Your Property', to: '/signup', desc: 'Earn by listing your vacant property.' },
                            ].map((link) => (
                                <li key={link.label} className="group">
                                    <Link to={link.to} className="flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors">
                                        <span>{link.label}</span>
                                        <ArrowUpRight size={13} className="text-zinc-600 group-hover:text-rose-400 transition-colors" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-extrabold text-sm mb-5">Company</h3>
                        <ul className="space-y-3">
                            {[
                                { label: 'Roommates Finder', to: '/roommates' },
                                { label: 'Verified Maids & Cooks', to: '/maids' },
                                { label: 'How StaySetu Works', to: '/listings' },
                                { label: 'Owner Dashboard', to: '/owner-dashboard' },
                                { label: 'Student Login', to: '/login' },
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link to={item.to} className="text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-extrabold text-sm mb-5">Get in Touch</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-2.5 text-xs text-zinc-400">
                                <div className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/20">
                                    <Phone size={13} />
                                </div>
                                <a href="https://wa.me/917393011350?text=Hi%20StaySetu%2C%20I%20have%20an%20inquiry" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-emerald-400 transition-colors">
                                    +91 7393011350 (WhatsApp / Call)
                                </a>
                            </li>
                            <li className="flex items-center space-x-2.5 text-xs text-zinc-400">
                                <div className="w-7 h-7 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center shrink-0 border border-rose-500/20">
                                    <Mail size={13} />
                                </div>
                                <span className="font-medium">staysetu26@gmail.com</span>
                            </li>
                            <li className="flex items-center space-x-2.5 text-xs text-zinc-400">
                                <div className="w-7 h-7 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center shrink-0 border border-rose-500/20">
                                    <Instagram size={13} />
                                </div>
                                <a href="https://www.instagram.com/stay.setu/" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-rose-400 transition-colors">
                                    @stay.setu
                                </a>
                            </li>
                            <li className="flex items-center space-x-2.5 text-xs text-zinc-400">
                                <div className="w-7 h-7 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center shrink-0 border border-red-500/20">
                                    <Youtube size={13} />
                                </div>
                                <a href="https://www.youtube.com/@Sudhanshu_vision" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-red-400 transition-colors">
                                    @Sudhanshu_vision (YouTube)
                                </a>
                            </li>
                            <li className="flex items-center space-x-2.5 text-xs text-zinc-400">
                                <div className="w-7 h-7 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center shrink-0 border border-rose-500/20">
                                    <MapPin size={13} />
                                </div>
                                <span className="font-medium">Crossings Republik, Ghaziabad, UP (Delhi NCR)</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <p>© {new Date().getFullYear()} StaySetu. Made for Indian students with care.</p>
                        <span className="hidden sm:inline text-zinc-600">•</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[11px]">
                            100% Free Platform • Transparent Pricing
                        </span>
                    </div>
                    <div className="flex space-x-5">
                        <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/security" className="hover:text-white transition-colors">Security Standards</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
