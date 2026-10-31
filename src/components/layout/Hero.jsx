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
        <div className="relative bg-[#FAFAFB] pt-20 sm:pt-24 pb-4 sm:pb-8 px-3 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                
                {/* Modern Hero Card */}
                <div className="relative rounded-3xl sm:rounded-[2.5rem] bg-white border border-zinc-200/80 p-5 sm:p-8 lg:p-10 shadow-sm overflow-hidden">
                    
                    {/* Subtle ambient gradient in background */}
                    <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-bl from-rose-100/50 via-rose-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
                        
                        {/* Left Column: Headline, Purpose Switcher, Search */}
                        <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
                            
                            {/* Purpose Toggle: Rent vs Buy/Sell */}
                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center p-1 bg-zinc-100/90 rounded-full border border-zinc-200/60 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => handleSetPurpose('rent')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                                            activePurpose === 'rent'
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'text-zinc-600 hover:text-zinc-950'
                                        }`}
                                    >
                                        🏠 Rent Stays
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetPurpose('sell')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                                            activePurpose === 'sell'
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'text-zinc-600 hover:text-zinc-950'
                                        }`}
                                    >
                                        🏷️ Buy / Sell
                                    </button>
                                </div>

                                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                                    <Check size={12} className="text-emerald-600" />
                                    100% Upfront Pricing
                                </span>
                            </div>

                            {/* Headline */}
                            <div>
                                <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-zinc-950 tracking-tight leading-[1.2]">
                                    {activePurpose === 'sell' ? (
                                        <>
                                            Verified Properties for Sale, <br className="hidden sm:inline" />
                                            <span className="text-rose-600">With 100% Direct Connect.</span>
                                        </>
                                    ) : (
                                        <>
                                            Find Verified Rooms & Flats, <br className="hidden sm:inline" />
                                            <span className="text-rose-600">Right Where You Need.</span>
                                        </>
                                    )}
                                </h1>
                                <p className="text-zinc-500 text-xs sm:text-sm font-normal mt-2 max-w-lg leading-relaxed">
                                    {activePurpose === 'sell'
                                        ? 'Flats, plots and luxury villas in prime locations with verified titles and direct seller connects.'
                                        : 'Vetted student PGs, hostels, flats, and rooms with clear rent, honest deposits, and direct WhatsApp contact.'}
                                </p>
                            </div>

                            {/* Unified Search Bar */}
                            <form
                                onSubmit={handleSearch}
                                ref={searchRef}
                                className="bg-zinc-50 hover:bg-white focus-within:bg-white rounded-2xl sm:rounded-full p-1.5 sm:p-2 border border-zinc-200 focus-within:border-rose-400 focus-within:shadow-md transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl"
                            >
                                {/* City Popover Trigger */}
                                <div className="relative shrink-0" ref={cityRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsCityOpen(!isCityOpen)}
                                        className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 px-3 py-2 rounded-xl sm:rounded-full bg-white sm:bg-transparent border sm:border-r sm:border-0 border-zinc-200 text-xs font-bold text-zinc-800 hover:text-rose-600 transition-colors"
                                    >
                                        <MapPin size={14} className="text-rose-500 shrink-0" />
                                        <span className="truncate max-w-[140px] text-left">
                                            {city || 'All India'}
                                        </span>
                                        <ChevronDown size={13} className={`text-zinc-400 transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* City Dropdown Menu */}
                                    {isCityOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-zinc-200 z-50 p-2.5 text-xs animate-fade-in">
                                            <div className="relative mb-2">
                                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                <input
                                                    type="text"
                                                    value={citySearchText}
                                                    onChange={(e) => setCitySearchText(e.target.value)}
                                                    placeholder="Search city or campus..."
                                                    autoFocus
                                                    className="w-full pl-7 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400"
                                                />
                                            </div>

                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                                <button
                                                    type="button"
                                                    onClick={() => { setCity(''); setIsCityOpen(false); }}
                                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold ${!city ? 'bg-rose-50 text-rose-600' : 'hover:bg-zinc-50 text-zinc-700'}`}
                                                >
                                                    <span>🇮🇳 All India (All Cities)</span>
                                                    {!city && <Check size={12} className="text-rose-600" />}
                                                </button>
                                                {['Crossings Republik', 'Ghaziabad', 'Noida', 'Greater Noida', 'Lucknow', 'Delhi NCR'].map((c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => { setCity(c); setIsCityOpen(false); }}
                                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold ${city === c ? 'bg-rose-50 text-rose-600' : 'hover:bg-zinc-50 text-zinc-700'}`}
                                                    >
                                                        <span>📍 {c}</span>
                                                        {city === c && <Check size={12} className="text-rose-600" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Text Search Input */}
                                <div className="flex-1 flex items-center px-2 relative min-w-0">
                                    <input
                                        type="text"
                                        placeholder={
                                            activePurpose === 'sell'
                                                ? 'Search 2/3 BHK flats, plots, society...'
                                                : 'Search PG, flat, college or area...'
                                        }
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSearchQuery(val);
                                            if (val.length > 1) {
                                                const filtered = suggestions.filter(s =>
                                                    s.toLowerCase().includes(val.toLowerCase())
                                                ).slice(0, 5);
                                                setFilteredSuggestions(filtered);
                                                setShowSuggestions(filtered.length > 0);
                                            } else {
                                                setShowSuggestions(false);
                                            }
                                        }}
                                        onFocus={() => {
                                            if (searchQuery.length > 1 && filteredSuggestions.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        className="w-full text-xs sm:text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent truncate"
                                    />

                                    <button
                                        type="button"
                                        onClick={handleNearMe}
                                        className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors shrink-0"
                                        title="Near me"
                                    >
                                        <Crosshair size={15} />
                                    </button>

                                    {/* Auto-suggestions dropdown */}
                                    {showSuggestions && filteredSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 z-50 overflow-hidden text-left py-1">
                                            {filteredSuggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchQuery(suggestion);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 transition-colors flex items-center gap-2 text-zinc-800 text-xs font-semibold"
                                                >
                                                    <MapPin size={12} className="text-rose-500 shrink-0" />
                                                    <span>{suggestion}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl sm:rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-rose-500/20 shrink-0 cursor-pointer"
                                >
                                    <Search size={14} />
                                    <span>Search</span>
                                </button>
                            </form>

                            {/* Popular Quick Location Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap pt-0.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 shrink-0">
                                    Popular:
                                </span>
                                {(activePurpose === 'sell' ? [
                                    { label: 'Crossings Republik', q: 'Crossings Republik' },
                                    { label: 'Gomti Nagar Lucknow', q: 'Gomti Nagar' },
                                    { label: 'Noida Expressway', q: 'Noida' },
                                    { label: 'Indirapuram', q: 'Indirapuram' },
                                    { label: 'Greater Noida', q: 'Greater Noida' },
                                ] : [
                                    { label: 'ABES College', q: 'ABES' },
                                    { label: 'Crossings Republik', q: 'Crossings Republik' },
                                    { label: 'IMS Ghaziabad', q: 'IMS' },
                                    { label: 'Noida Sec 62', q: 'Noida' },
                                    { label: 'Lucknow', q: 'Lucknow' },
                                ]).map((tag) => (
                                    <button
                                        key={tag.label}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(tag.q);
                                            navigate(`/listings?purpose=${activePurpose}&q=${encodeURIComponent(tag.q)}`);
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-zinc-50 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-zinc-200/80 text-[11px] font-bold transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                                    >
                                        📍 {tag.label}
                                    </button>
                                ))}
                            </div>

                        </div>

                        {/* Right Column: Featured Spotlight Card */}
                        <div className="lg:col-span-5 relative group">
                            <Link
                                to={`/property/${currentSpotlight?.$id || currentSpotlight?.id || '69cbc4bc0023a8c61505'}`}
                                className="block relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border-2 border-white transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
                            >
                                <img
                                    src={
                                        (Array.isArray(currentSpotlight?.images) && currentSpotlight.images.length > 0)
                                            ? currentSpotlight.images[0]
                                            : (typeof currentSpotlight?.images === 'string' && currentSpotlight.images.startsWith('[')
                                                ? JSON.parse(currentSpotlight.images)[0]
                                                : (currentSpotlight?.images || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80'))
                                    }
                                    alt={currentSpotlight?.title || 'Property'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                                {/* Top Floating Badges */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-zinc-900 text-[11px] font-black shadow-xs">
                                        <Sparkles size={12} className="text-rose-500 fill-rose-500" />
                                        {activePurpose === 'sell' ? 'Verified Sale Deal' : 'Featured Stay'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black shadow-xs">
                                        {activePurpose === 'sell'
                                            ? '🏷️ For Sale'
                                            : (currentSpotlight?.genderPreference === 'girls' ? '🌸 Girls PG' : (currentSpotlight?.type || 'PG'))}
                                    </span>
                                </div>

                                {/* Bottom Info Glass Card */}
                                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 shadow-lg border border-zinc-100 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-sm font-black text-zinc-900 truncate">
                                            {currentSpotlight?.title || 'VIKRANT GIRLS PG'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium mt-0.5 truncate">
                                            <MapPin size={11} className="text-rose-500 shrink-0" />
                                            <span className="truncate">{currentSpotlight?.location || 'Crossings Republik'}</span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                            {activePurpose === 'sell' ? 'Price' : 'Rent'}
                                        </div>
                                        <div className="text-sm sm:text-base font-black text-zinc-950">
                                            {activePurpose === 'sell'
                                                ? formatPropertyPrice(currentSpotlight?.price, 'sell')
                                                : `₹${Number(currentSpotlight?.price || 10000).toLocaleString()}`}
                                            {activePurpose !== 'sell' && (
                                                <span className="text-[10px] text-zinc-400 font-medium">/mo</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Hero;
