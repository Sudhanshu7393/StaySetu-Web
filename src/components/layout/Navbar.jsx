import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, LayoutDashboard, Search, Users, ChevronDown, Bell, PlusCircle, Instagram, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ADMIN_EMAILS = ['staysetu26@gmail.com', 'yutkarsh669@gmail.com'];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrolled(currentScrollY > 10);

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const handleLogout = async () => {
        await signOut();
        setIsOpen(false);
        setDropdownOpen(false);
        navigate('/');
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        const [pathname, search] = path.split('?');
        if (location.pathname !== pathname) return false;
        if (!search) return !location.search || location.search.includes('purpose=all');
        const targetPurpose = new URLSearchParams(search).get('purpose');
        const currentPurpose = new URLSearchParams(location.search).get('purpose');
        return targetPurpose === currentPurpose;
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Rent', path: '/listings?purpose=rent' },
        { name: 'Buy / Sell', path: '/listings?purpose=sell' },
        { name: 'Roommates', path: '/roommates' },
        { name: 'Maids & Cooks', path: '/maids' },
    ];

    const role = profile?.role || 'student';
    const isAdmin = profile?.role === 'admin' || (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
    const dashPath = (role === 'owner' || role === 'broker') ? '/owner-dashboard' : '/dashboard';

    return (
        <>
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-300 px-4 py-2 ${
                    scrolled
                        ? 'bg-white/95 backdrop-blur-xl border-b border-zinc-200/80 shadow-sm'
                        : 'bg-white/90 backdrop-blur-md border-b border-zinc-100'
                } ${isVisible ? 'translate-y-0' : '-translate-y-full shadow-none'}`}
            >
                <div className="max-w-7xl mx-auto px-2">
                    <div className="flex justify-between h-16 items-center relative">
                        
                        {/* Logo on Left */}
                        <div className="flex items-center gap-6 lg:gap-8">
                            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group select-none" onClick={() => setIsOpen(false)}>
                                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center p-0.5 transition-transform duration-300 group-hover:scale-105 bg-rose-50/40 border border-rose-100/60 shadow-2xs">
                                    <img src="/logo.png" alt="StaySetu Logo" className="h-full w-full object-contain filter drop-shadow-xs" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <div className="flex items-center tracking-tight font-black text-xl sm:text-2xl font-outfit text-zinc-950">
                                        <span>Stay</span>
                                        <span className="bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 bg-clip-text text-transparent">Setu</span>
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 ml-0.5 animate-pulse" />
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 font-sans mt-0.5">
                                        Verified Student Living
                                    </span>
                                </div>
                            </Link>

                            {/* Centered Desktop Nav Links */}
                            <div className="hidden md:flex items-center gap-6">
                                {navLinks.map((link) => {
                                    const active = isActive(link.path);
                                    return (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            className={`relative py-1.5 text-xs font-extrabold transition-all ${
                                                active
                                                    ? 'text-rose-600'
                                                    : 'text-zinc-600 hover:text-zinc-950'
                                            }`}
                                        >
                                            {link.name}
                                            {active && (
                                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Desktop Auth on Right */}
                        <div className="hidden md:flex items-center gap-2.5">
                            <a 
                                href="https://www.instagram.com/stay.setu/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hidden lg:flex items-center gap-1.5 text-xs font-extrabold text-rose-600 hover:text-white bg-rose-50 hover:bg-gradient-to-r hover:from-purple-500 hover:via-pink-500 hover:to-rose-500 border border-rose-200/90 px-3 py-1.5 rounded-full transition-all duration-200 shadow-2xs group"
                                title="Follow StaySetu on Instagram (@stay.setu)"
                            >
                                <Instagram size={13} className="text-rose-600 group-hover:text-white transition-colors" />
                                <span>Instagram</span>
                            </a>

                            <Link 
                                to="/signup" 
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>List Property</span>
                            </Link>

                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 pl-1.5 pr-3 py-1.5 rounded-full transition-all shadow-xs text-zinc-900 group"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-extrabold shadow-xs">
                                            {(profile?.fullName || profile?.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold text-zinc-800">
                                            {(profile?.fullName || profile?.name || 'User').split(' ')[0]}
                                        </span>
                                        <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {dropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                                            <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200/90 rounded-2xl shadow-xl z-50 py-2 animate-fade-in origin-top-right overflow-hidden text-zinc-900">
                                                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/70">
                                                    <p className="text-xs font-bold text-zinc-900 truncate">{profile?.fullName || profile?.name || user?.email}</p>
                                                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user?.email}</p>
                                                </div>
                                                <div className="p-1.5">
                                                    {isAdmin && (
                                                        <Link
                                                            to="/admin"
                                                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-xl transition-all"
                                                            onClick={() => setDropdownOpen(false)}
                                                        >
                                                            <ShieldCheck size={14} className="text-amber-600" /> Admin Panel
                                                        </Link>
                                                    )}
                                                    <Link
                                                        to={dashPath}
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                                        onClick={() => setDropdownOpen(false)}
                                                    >
                                                        <LayoutDashboard size={14} /> Dashboard
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all mt-1"
                                                    >
                                                        <LogOut size={14} /> Log out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link to="/login" className="text-xs font-extrabold text-zinc-700 hover:text-zinc-950 px-3 py-1.5 transition-colors">
                                        Log In
                                    </Link>
                                    <Link 
                                        to="/signup" 
                                        className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-2 px-5 text-xs rounded-full shadow-sm shadow-rose-500/20 transition-all hover:scale-[1.02]"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-zinc-900 bg-zinc-100 border border-zinc-200"
                        >
                            {isOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Drawer */}
                {isOpen && (
                    <div className="md:hidden bg-white border-t border-zinc-100 animate-fade-in shadow-xl rounded-b-2xl p-4 text-zinc-900">
                        <div className="space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-extrabold transition-all ${
                                        isActive(link.path)
                                            ? 'bg-rose-50 text-rose-600'
                                            : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50'
                                    }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span>{link.name}</span>
                                    {isActive(link.path) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                                </Link>
                            ))}

                            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
                                <a
                                    href="https://www.instagram.com/stay.setu/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50/80 border border-rose-200 flex items-center justify-between"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="flex items-center gap-2">
                                        <Instagram size={15} className="text-rose-600" />
                                        <span>Follow on Instagram (@stay.setu)</span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Community</span>
                                </a>

                                <Link
                                    to="/signup"
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/70 border border-rose-200"
                                    onClick={() => setIsOpen(false)}
                                >
                                    + List Property Free (Owners)
                                </Link>

                                {user ? (
                                    <>
                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 flex items-center gap-2"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <ShieldCheck size={15} className="text-amber-600" /> Admin Panel
                                            </Link>
                                        )}
                                        <Link
                                            to={dashPath}
                                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-800 bg-zinc-50"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                                        >
                                            Log out
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <Link 
                                            to="/login" 
                                            className="block text-center py-2.5 text-xs font-bold text-zinc-800 rounded-xl bg-zinc-100 border border-zinc-200"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Log In
                                        </Link>
                                        <Link 
                                            to="/signup" 
                                            className="block text-center py-2.5 text-xs font-extrabold text-white bg-rose-500 rounded-xl shadow-sm shadow-rose-500/20"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navbar;
