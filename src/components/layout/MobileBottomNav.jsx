import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav = () => {
    const location = useLocation();
    const { user, profile } = useAuth();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const role = profile?.role || 'student';
    const profilePath = user ? ((role === 'owner' || role === 'broker') ? '/owner-dashboard' : '/dashboard') : '/login';

    const navItems = [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Explore', path: '/listings', icon: Search },
        { label: 'Saved', path: user ? '/dashboard?tab=saved' : '/login', icon: Heart },
        { label: 'Messages', path: user ? '/messages' : '/login', icon: MessageSquare },
        { label: 'Profile', path: profilePath, icon: User },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-zinc-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-3 py-1.5 pb-safe">
            <div className="flex items-center justify-around max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                                active ? 'text-rose-600' : 'text-zinc-400 hover:text-zinc-600'
                            }`}
                        >
                            <div className={`p-1 rounded-full transition-all ${active ? 'bg-rose-50 text-rose-600' : ''}`}>
                                <Icon size={20} strokeWidth={active ? 2.5 : 2} fill={active && item.label === 'Saved' ? 'currentColor' : 'none'} />
                            </div>
                            <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'font-extrabold text-rose-600' : 'font-medium text-zinc-500'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
