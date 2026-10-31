import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Building, MapPin, ChevronDown, ArrowRight, Star, Crosshair, Sparkles, X, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION, Query } from '../../lib/supabase';
import { REGIONS_LIST, ALL_INDIAN_CITIES } from '../../lib/indianCities';
import { formatPropertyPrice } from '../../lib/formatters';

const VIKRANT_PG_DEFAULT = {
    $id: '69cbc4bc0023a8c61505',
    id: '69cbc4bc0023a8c61505',
    title: 'VIKRANT GIRLS PG',
    price: 10000,
    location: 'Arihant Ambience, Crossings Republik',
    type: 'PG',
    genderPreference: 'girls',
    listedBy: 'owner',
    purpose: 'rent',
    images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80'
    ],
    amenities: ['WiFi', 'Food', 'Parking', 'Laundry', 'Security', 'Attached Bath', 'Power Backup'],
    whatsappNumber: '7393011350',
};

const SALE_SPOTLIGHT_DEFAULT = {
    $id: 'c5fa45a1-6fed-4782-89bc-6f35cb73d93c',
    id: 'c5fa45a1-6fed-4782-89bc-6f35cb73d93c',
    title: '3 BHK Flat in GH 07, Crossings Republik',
    price: 11000000,
    location: 'GH 07, Crossings Republik, Ghaziabad',
    type: 'Flat',
    purpose: 'sell',
    listedBy: 'owner',
    images: [
        '/properties/crossings/crossings_republik_towers.jpg',
        '/properties/crossings/indian_tower_balconies.jpg'
    ],
    amenities: ['Power Backup', 'Gym', 'Swimming Pool', 'Security', 'Covered Parking', 'Club House'],
    whatsappNumber: '7393011350',
};

const Hero = ({ purpose = 'rent', onPurposeChange }) => {
    const [localPurpose, setLocalPurpose] = useState('rent');
    const activePurpose = onPurposeChange ? purpose : localPurpose;

    const handleSetPurpose = (newPurpose) => {
        if (onPurposeChange) {
            onPurposeChange(newPurpose);
        } else {
            setLocalPurpose(newPurpose);
        }
    };

    const [propertyType, setPropertyType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [city, setCity] = useState('');
    const [isCityOpen, setIsCityOpen] = useState(false);
    const [citySearchText, setCitySearchText] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('All India');
    const [suggestions, setSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [featuredRentProperty, setFeaturedRentProperty] = useState(VIKRANT_PG_DEFAULT);
    const [featuredSaleProperty, setFeaturedSaleProperty] = useState(SALE_SPOTLIGHT_DEFAULT);
    const searchRef = useRef(null);
    const cityRef = useRef(null);
    const navigate = useNavigate();

    const filteredHubs = useMemo(() => {
        let list = ALL_INDIAN_CITIES;
        if (selectedRegion !== 'All India') {
            list = list.filter(c => c.region === selectedRegion);
        }
        if (citySearchText.trim()) {
            const q = citySearchText.toLowerCase().trim();
            list = ALL_INDIAN_CITIES.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.state.toLowerCase().includes(q) ||
                c.region.toLowerCase().includes(q) ||
                c.badge.toLowerCase().includes(q)
            );
        }
        return list;
    }, [selectedRegion, citySearchText]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION.listings,
                    [
                        Query.equal('status', 'approved'),
                        Query.limit(50),
                    ]
                );

                if (res.documents.length > 0) {
                    const vals = new Set();
                    res.documents.forEach(doc => {
                        if (doc.location) {
                            vals.add(doc.location);
                            const parts = doc.location.split(',');
                            if (parts[0]) vals.add(parts[0].trim());
                        }
                        if (doc.nearbyCollege) vals.add(doc.nearbyCollege);
                    });
                    setSuggestions(Array.from(vals));

                    // Pick rent spotlight property (admin chosen or Vikrant PG by default)
                    const customId = localStorage.getItem('staysetu_hero_featured_id');
                    let chosenRent = null;
                    if (customId) {
                        chosenRent = res.documents.find(d => (d.$id === customId || d.id === customId));
                    }
                    if (!chosenRent) {
                        chosenRent = res.documents.find(d => d.title && d.title.toLowerCase().includes('vikrant'));
                    }
                    if (!chosenRent) {
                        chosenRent = res.documents.find(d => d.purpose !== 'sell' && d.purpose !== 'sale') || res.documents[0];
                    }
                    if (chosenRent) {
                        setFeaturedRentProperty(chosenRent);
                    }

                    // Pick sale spotlight property
                    const chosenSale = res.documents.find(d => d.purpose === 'sell' || d.purpose === 'sale' || Number(d.price) >= 500000);
                    if (chosenSale) {
                        setFeaturedSaleProperty(chosenSale);
                    }
                }
            } catch (err) {
                console.error('Fetch suggestions error:', err);
            }
        };

        fetchSuggestions();

        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
            if (cityRef.current && !cityRef.current.contains(e.target)) {
                setIsCityOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentSpotlight = activePurpose === 'sell' ? (featuredSaleProperty || SALE_SPOTLIGHT_DEFAULT) : (featuredRentProperty || VIKRANT_PG_DEFAULT);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams();
        if (activePurpose) params.append('purpose', activePurpose);
        if (searchQuery.trim()) params.append('q', searchQuery.trim());
        if (propertyType !== 'All') params.append('type', propertyType);
        if (city && city !== 'All India') params.append('city', city);
        navigate(`/listings?${params.toString()}`);
    };

    const handleNearMe = () => {
        if (!navigator.geolocation) {
            navigate(`/listings?purpose=${activePurpose}&view=map`);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                navigate(`/listings?purpose=${activePurpose}&lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&view=map`);
            },
            () => {
                navigate(`/listings?purpose=${activePurpose}&view=map`);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    return (
        <div className="relative w-full bg-zinc-950">
            
            {/* =========================================================================
                1. MOBILE VIEW (Full-Screen Immersive UI matching user mockup)
               ========================================================================= */}
            <div className="sm:hidden relative w-full h-[93dvh] min-h-[580px] flex flex-col justify-between overflow-hidden text-white pt-20 pb-6 px-4">
                
                {/* Full-bleed Architectural Backgrounds with Smooth Crossfade */}
                <img
                    src="/hero/hero_apartments_rent.jpg"
                    alt="Modern Residential Apartments"
                    className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-in-out ${
                        activePurpose === 'rent' ? 'opacity-100' : 'opacity-0'
                    }`}
                />
                <img
                    src="/hero/hero_dream_house_buy.jpg"
                    alt="Luxury Dream House Architecture"
                    className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-in-out ${
                        activePurpose === 'sell' ? 'opacity-100' : 'opacity-0'
                    }`}
                />

                {/* Dramatic Gradient Overlay for Readability & Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/35 pointer-events-none" />

                {/* Top Section: Frosted Glass Purpose Switcher */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center p-1 bg-black/40 backdrop-blur-xl rounded-full border border-white/20 shadow-lg">
                        <button
                            type="button"
                            onClick={() => handleSetPurpose('rent')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                                activePurpose === 'rent'
                                    ? 'bg-rose-500 text-white shadow-md'
                                    : 'text-zinc-200 hover:text-white'
                            }`}
                        >
                            🏠 Rent
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSetPurpose('sell')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                                activePurpose === 'sell'
                                    ? 'bg-rose-500 text-white shadow-md'
                                    : 'text-zinc-200 hover:text-white'
                            }`}
                        >
                            🏷️ Buy / Sell
                        </button>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xs">
                        <Sparkles size={12} className="text-rose-400 fill-rose-400" />
                        0% Brokerage
                    </span>
                </div>

                {/* Bottom Section: Typography, Search Bar & 2 Primary Action Buttons (Mockup Exact Match) */}
                <div className="relative z-10 space-y-4 pb-2">
                    
                    {/* Typography matching reference mockup */}
                    <div className="space-y-1.5">
                        <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight font-serif drop-shadow-md">
                            {activePurpose === 'sell' ? 'Search Your Dream House' : 'Find Your Dream Stay & Home'}
                        </h1>
                        <p className="text-zinc-300 text-xs font-normal leading-relaxed max-w-sm drop-shadow-sm">
                            &ldquo;Discover your ideal home with us, whether you&rsquo;re looking to buy or rent with 100% upfront pricing.&rdquo;
                        </p>
                    </div>

                    {/* Compact Glass Search Bar */}
                    <form
                        onSubmit={handleSearch}
                        className="bg-black/45 backdrop-blur-xl rounded-2xl p-1.5 border border-white/25 shadow-xl flex items-center gap-1.5"
                    >
                        {/* City Selector */}
                        <div className="relative" ref={cityRef}>
                            <button
                                type="button"
                                onClick={() => setIsCityOpen(!isCityOpen)}
                                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10 shrink-0"
                            >
                                <MapPin size={12} className="text-rose-400 shrink-0" />
                                <span className="truncate max-w-[85px]">{city || 'All Cities'}</span>
                                <ChevronDown size={11} className={`text-zinc-400 transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isCityOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-72 bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 z-50 p-2.5 text-xs text-white animate-fade-in">
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => { setCity(''); setIsCityOpen(false); }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold ${!city ? 'bg-rose-500 text-white' : 'hover:bg-white/10 text-zinc-300'}`}
                                        >
                                            <span>🇮🇳 All India (All Cities)</span>
                                            {!city && <Check size={12} />}
                                        </button>
                                        {['Crossings Republik', 'Ghaziabad', 'Noida', 'Greater Noida', 'Lucknow', 'Delhi NCR'].map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => { setCity(c); setIsCityOpen(false); }}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold ${city === c ? 'bg-rose-500 text-white' : 'hover:bg-white/10 text-zinc-300'}`}
                                            >
                                                <span>📍 {c}</span>
                                                {city === c && <Check size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="flex-1 min-w-0 pr-1">
                            <input
                                type="text"
                                placeholder={activePurpose === 'sell' ? 'Search 2/3 BHK flat, plot...' : 'Search PG, flat, area...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-xs font-semibold text-white placeholder:text-zinc-400 focus:outline-none truncate"
                            />
                        </div>

                        {/* Search Action */}
                        <button
                            type="submit"
                            className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30 cursor-pointer"
                        >
                            <Search size={14} />
                        </button>
                    </form>

                    {/* 2 Main Action Buttons exactly like the reference photo */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <Link
                            to={`/listings?purpose=${activePurpose}`}
                            className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-2xl flex items-center justify-center gap-1.5 text-center shadow-lg shadow-rose-500/30 transition-all"
                        >
                            <span>Explore Stays</span>
                            <ArrowRight size={14} />
                        </Link>
                        <Link
                            to={`/dashboard/add-listing?purpose=${activePurpose}`}
                            className="w-full bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/35 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-2xl flex items-center justify-center gap-1.5 text-center transition-all shadow-md"
                        >
                            <span>+ List Property</span>
                        </Link>
                    </div>

                    {/* Quick Popular Location Tags on Mobile */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap pt-1">
                        {['Crossings Republik', 'Noida', 'Greater Noida', 'Ghaziabad', 'Lucknow'].map((loc) => (
                            <button
                                key={loc}
                                type="button"
                                onClick={() => {
                                    setSearchQuery(loc);
                                    navigate(`/listings?purpose=${activePurpose}&q=${encodeURIComponent(loc)}`);
                                }}
                                className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[10px] font-bold text-zinc-200 shrink-0 whitespace-nowrap"
                            >
                                📍 {loc}
                            </button>
                        ))}
                    </div>

                </div>
            </div>

            {/* =========================================================================
                2. DESKTOP & TABLET VIEW (Cinematic Wide Hero with Glass Search)
               ========================================================================= */}
            <div className="hidden sm:block relative w-full pt-20 sm:pt-24 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="relative rounded-[2.5rem] overflow-hidden min-h-[540px] flex items-center p-8 sm:p-12 lg:p-14 border border-zinc-200/80 shadow-xl bg-zinc-950">
                    
                    {/* Background Images with Dynamic Purpose Crossfade */}
                    <img
                        src="/hero/hero_apartments_rent.jpg"
                        alt="Modern Residential Apartments"
                        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-in-out ${
                            activePurpose === 'rent' ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                    <img
                        src="/hero/hero_dream_house_buy.jpg"
                        alt="Luxury Dream House Architecture"
                        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-in-out ${
                            activePurpose === 'sell' ? 'opacity-100' : 'opacity-0'
                        }`}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/25 pointer-events-none" />

                    <div className="relative z-10 max-w-2xl space-y-6 text-left text-white">
                        
                        {/* Purpose Toggle: Rent vs Buy/Sell */}
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center p-1 bg-white/15 backdrop-blur-xl rounded-full border border-white/20 shadow-md">
                                <button
                                    type="button"
                                    onClick={() => handleSetPurpose('rent')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                                        activePurpose === 'rent'
                                            ? 'bg-rose-500 text-white shadow-md'
                                            : 'text-zinc-200 hover:text-white'
                                    }`}
                                >
                                    🏠 Rent Stays
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetPurpose('sell')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                                        activePurpose === 'sell'
                                            ? 'bg-rose-500 text-white shadow-md'
                                            : 'text-zinc-200 hover:text-white'
                                    }`}
                                >
                                    🏷️ Buy / Sell
                                </button>
                            </div>

                            <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                <Check size={13} className="text-emerald-400" />
                                100% Upfront Pricing • 0% Brokerage
                            </span>
                        </div>

                        {/* Main Headline */}
                        <div className="space-y-2">
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.18] font-serif">
                                {activePurpose === 'sell' ? (
                                    <>Search Your Dream House & Property</>
                                ) : (
                                    <>Find Your Dream Stay, Room & Flat</>
                                )}
                            </h1>
                            <p className="text-zinc-300 text-sm md:text-base font-normal max-w-lg leading-relaxed">
                                {activePurpose === 'sell'
                                    ? 'Discover verified flats, plots, and luxury residences with direct seller connects and transparent pricing.'
                                    : 'Vetted student rooms, PGs, and apartments near college campuses with 100% upfront rent and direct WhatsApp contact.'}
                            </p>
                        </div>

                        {/* Desktop Search Console */}
                        <form
                            onSubmit={handleSearch}
                            ref={searchRef}
                            className="bg-black/50 backdrop-blur-xl rounded-full p-2 border border-white/25 shadow-2xl flex items-center gap-2 max-w-xl"
                        >
                            {/* City Dropdown Trigger */}
                            <div className="relative shrink-0" ref={cityRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsCityOpen(!isCityOpen)}
                                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                                >
                                    <MapPin size={14} className="text-rose-400 shrink-0" />
                                    <span className="truncate max-w-[120px]">{city || 'All India'}</span>
                                    <ChevronDown size={12} className={`text-zinc-400 transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCityOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 z-50 p-2.5 text-xs text-white animate-fade-in">
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => { setCity(''); setIsCityOpen(false); }}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold ${!city ? 'bg-rose-500 text-white' : 'hover:bg-white/10 text-zinc-300'}`}
                                            >
                                                <span>🇮🇳 All India (All Cities)</span>
                                                {!city && <Check size={12} />}
                                            </button>
                                            {['Crossings Republik', 'Ghaziabad', 'Noida', 'Greater Noida', 'Lucknow', 'Delhi NCR'].map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => { setCity(c); setIsCityOpen(false); }}
                                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold ${city === c ? 'bg-rose-500 text-white' : 'hover:bg-white/10 text-zinc-300'}`}
                                                >
                                                    <span>📍 {c}</span>
                                                    {city === c && <Check size={12} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search Input */}
                            <div className="flex-1 flex items-center px-2 relative min-w-0">
                                <input
                                    type="text"
                                    placeholder={activePurpose === 'sell' ? 'Search 2/3 BHK flat, plot, area...' : 'Search PG, flat, campus, area...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full text-sm font-semibold text-white placeholder:text-zinc-400 focus:outline-none bg-transparent truncate"
                                />
                                <button
                                    type="button"
                                    onClick={handleNearMe}
                                    className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors shrink-0"
                                    title="Near me"
                                >
                                    <Crosshair size={15} />
                                </button>
                            </div>

                            {/* Search Button */}
                            <button
                                type="submit"
                                className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-sm py-2.5 px-6 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/25 shrink-0 cursor-pointer"
                            >
                                <Search size={14} />
                                <span>Search</span>
                            </button>
                        </form>

                        {/* Quick Action Chips & Links */}
                        <div className="flex items-center gap-3 pt-2">
                            <Link
                                to={`/listings?purpose=${activePurpose}`}
                                className="inline-flex items-center gap-2 bg-white text-zinc-900 font-extrabold text-xs px-5 py-2.5 rounded-full hover:bg-zinc-100 transition-all shadow-md"
                            >
                                <span>Browse All Listings</span>
                                <ArrowRight size={13} />
                            </Link>
                            <Link
                                to={`/dashboard/add-listing?purpose=${activePurpose}`}
                                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs px-5 py-2.5 rounded-full border border-white/30 backdrop-blur-md transition-all shadow-sm"
                            >
                                <span>+ List Property Free</span>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
};

export default Hero;
