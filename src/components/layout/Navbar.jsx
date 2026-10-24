import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, LayoutDashboard, Search, Users, ChevronDown, Bell, PlusCircle, Youtube } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
                    <div className="flex justify-between h-14 items-center relative">
                        
                        {/* Logo on Left */}
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
                                <div className="h-10 px-1 py-0.5 flex items-center justify-center">
                                    <img src="/logo.png" alt="StaySetu Logo" className="h-9 w-auto object-contain" />
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
                                href="https://www.youtube.com/@Sudhanshu_vision" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hidden lg:flex items-center gap-1.5 text-xs font-extrabold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200/90 hover:border-red-600 px-3 py-1.5 rounded-full transition-all duration-200 shadow-2xs group"
                                title="Watch Campus & PG Video Tours on YouTube (@Sudhanshu_vision)"
                            >
                                <Youtube size={13} className="text-red-600 group-hover:text-white fill-current transition-colors" />
                                <span>YouTube</span>
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
                                    href="https://www.youtube.com/@Sudhanshu_vision"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50/80 border border-red-200 flex items-center justify-between"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="flex items-center gap-2">
                                        <Youtube size={15} className="fill-current text-red-600" />
                                        <span>Watch on YouTube (@Sudhanshu_vision)</span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Videos</span>
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
