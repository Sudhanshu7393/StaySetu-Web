import React, { useState, useEffect, useRef } from 'react';
import { Search, Building, MapPin, ChevronDown, ArrowRight, Star, Crosshair, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION, Query } from '../../lib/supabase';

const VIKRANT_PG_DEFAULT = {
    $id: '69cbc4bc0023a8c61505',
    id: '69cbc4bc0023a8c61505',
    title: 'VIKRANT GIRLS PG',
    price: 10000,
    location: 'Arihant Ambience, Crossings Republik',
    type: 'PG',
    genderPreference: 'girls',
    listedBy: 'owner',
    images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80'
    ],
    amenities: ['WiFi', 'Food', 'Parking', 'Laundry', 'Security', 'Attached Bath', 'Power Backup'],
    whatsappNumber: '7393011350',
};

const Hero = () => {
    const [purpose, setPurpose] = useState('rent');
    const [propertyType, setPropertyType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [city, setCity] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [featuredProperty, setFeaturedProperty] = useState(VIKRANT_PG_DEFAULT);
    const searchRef = useRef(null);
    const navigate = useNavigate();

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

                    // Pick spotlight property (admin chosen or Vikrant PG by default)
                    const customId = localStorage.getItem('staysetu_hero_featured_id');
                    let chosen = null;
                    if (customId) {
                        chosen = res.documents.find(d => (d.$id === customId || d.id === customId));
                    }
                    if (!chosen) {
                        chosen = res.documents.find(d => d.title && d.title.toLowerCase().includes('vikrant'));
                    }
                    if (!chosen) {
                        chosen = res.documents.find(d => d.featured) || res.documents[0];
                    }
                    if (chosen) {
                        setFeaturedProperty(chosen);
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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams();
        if (purpose) params.append('purpose', purpose);
        if (searchQuery.trim()) params.append('q', searchQuery.trim());
        if (propertyType !== 'All') params.append('type', propertyType);
        if (city && city !== 'All India') params.append('city', city);
        navigate(`/listings?${params.toString()}`);
    };

    const handleNearMe = () => {
        if (!navigator.geolocation) {
            navigate('/listings?view=map');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                navigate(`/listings?purpose=${purpose}&lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&view=map`);
            },
            () => {
                navigate(`/listings?purpose=${purpose}&view=map`);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    return (
        <div className="relative bg-[#FAFAFB] pt-20 pb-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                
                {/* Curved Hero Banner Card matching reference screenshot */}
                <div className="relative rounded-[2.5rem] bg-gradient-to-br from-rose-50/90 via-white to-rose-100/50 border border-rose-100 p-6 sm:p-10 lg:p-12 shadow-sm overflow-hidden">
                    
                    {/* Decorative Background Blob */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                        
                        {/* Left Column: Heading, Subtitle & Search */}
                        <div className="lg:col-span-7 space-y-5 text-left">
                            
                            {/* Top row: City Pill + Purpose Toggle */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-rose-200/90 text-rose-600 shadow-2xs">
                                    <MapPin size={13} className="text-rose-500 fill-rose-500 shrink-0" />
                                    <select
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="text-xs font-bold bg-transparent border-0 focus:outline-none cursor-pointer text-rose-700"
                                    >
                                        <option value="">All India (All Cities)</option>
                                        <option value="Crossings Republik">Crossings Republik (Ghaziabad)</option>
                                        <option value="Ghaziabad">Ghaziabad / ABES</option>
                                        <option value="Noida">Noida / Gr. Noida</option>
                                        <option value="Delhi NCR">Delhi NCR</option>
                                        <option value="Lucknow">Lucknow</option>
                                    </select>
                                </div>

                                <div className="inline-flex items-center gap-1 p-1 bg-white/90 backdrop-blur-md rounded-full border border-rose-200/90 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setPurpose('rent')}
                                        className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                                            purpose === 'rent'
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'text-zinc-600 hover:text-zinc-950'
                                        }`}
                                    >
                                        🏠 Rent
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPurpose('sell')}
                                        className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                                            purpose === 'sell'
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'text-zinc-600 hover:text-zinc-950'
                                        }`}
                                    >
                                        🏷️ Buy / Sell
                                    </button>
                                </div>
                            </div>

                            {/* Main Display Headline */}
                            {purpose === 'sell' ? (
                                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight leading-[1.18]">
                                    Verified Properties for Sale, <br className="hidden sm:inline" />
                                    <span className="text-zinc-900">With 100% </span>
                                    <span className="text-rose-600">Pricing Clarity.</span>
                                </h1>
                            ) : (
                                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight leading-[1.18]">
                                    Find Verified Student Stays, <br className="hidden sm:inline" />
                                    <span className="text-zinc-900">Right Near </span>
                                    <span className="text-rose-600">Your Campus.</span>
                                </h1>
                            )}

                            {/* Subtitle */}
                            <p className="text-zinc-600 text-xs sm:text-sm md:text-base font-normal max-w-lg leading-relaxed">
                                {purpose === 'sell'
                                    ? 'Flats, plots and independent villas in prime locations. Direct owner and verified broker deals with 100% upfront pricing.'
                                    : 'Explore vetted PGs, hostels & apartments with upfront rent, clear deposits, and honest broker terms. Connect directly on WhatsApp.'}
                            </p>

                            {/* Search Bar matching modern pill design */}
                            <form
                                onSubmit={handleSearch}
                                ref={searchRef}
                                className="relative max-w-xl bg-white rounded-2xl sm:rounded-full p-2 sm:p-2 border border-zinc-200/80 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                            >
                                <div className="flex-1 flex items-center px-3 py-1 relative">
                                    <Search size={18} className="text-rose-500 mr-2.5 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder={
                                            purpose === 'sell'
                                                ? "Search flats, plots, villas across India (e.g. Crossings Republik, Lucknow)..."
                                                : "Search any area, college, city across India (e.g. Crossings Republik, ABES, Noida)..."
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
                                        className="w-full text-xs sm:text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                                    />
                                    
                                    <button
                                        type="button"
                                        onClick={handleNearMe}
                                        className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors shrink-0"
                                        title="Near me"
                                    >
                                        <Crosshair size={15} />
                                    </button>

                                    {/* Dropdown Suggestions */}
                                    {showSuggestions && filteredSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-zinc-100 z-50 overflow-hidden text-left py-1">
                                            {filteredSuggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchQuery(suggestion);
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50 transition-colors flex items-center gap-2.5 text-zinc-800"
                                                >
                                                    <MapPin size={13} className="text-rose-500 shrink-0" />
                                                    <span className="text-xs font-semibold">{suggestion}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-500/25 shrink-0"
                                >
                                    <Search size={15} />
                                    <span>Search Rooms</span>
                                </button>
                            </form>

                            {/* Property Types & Popular Hubs Quick Click */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-500">
                                <span className="font-bold text-zinc-400">Filter:</span>
                                {['All', 'Girls PG', 'Boys PG', 'Flat'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                            setPropertyType(t);
                                            navigate(`/listings?purpose=${purpose}${t !== 'All' ? `&type=${encodeURIComponent(t)}` : ''}`);
                                        }}
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                            propertyType === t
                                                ? 'bg-rose-500 text-white border-rose-500'
                                                : 'bg-white/80 hover:bg-rose-50 text-zinc-700 border-zinc-200/60'
                                        }`}
                                    >
                                        {t === 'All' ? 'All Stays' : t}
                                    </button>
                                ))}
                                {['Crossings Republik', 'ABES Engg', 'Noida Sec 62', 'Indirapuram', 'Lucknow'].map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(tag);
                                            navigate(`/listings?q=${encodeURIComponent(tag)}`);
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-rose-50 text-zinc-700 hover:text-rose-600 border border-zinc-200/60 font-medium transition-colors"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                        </div>

                        {/* Right Column: Featured Spotlight Property Card */}
                        <div className="lg:col-span-5 relative group">
                            <Link
                                to={`/property/${featuredProperty?.$id || featuredProperty?.id || '69cbc4bc0023a8c61505'}`}
                                className="block relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
                            >
                                <img
                                    src={
                                        (Array.isArray(featuredProperty?.images) && featuredProperty.images.length > 0)
                                            ? featuredProperty.images[0]
                                            : (typeof featuredProperty?.images === 'string' && featuredProperty.images.startsWith('[')
                                                ? JSON.parse(featuredProperty.images)[0]
                                                : (featuredProperty?.images || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80'))
                                    }
                                    alt={featuredProperty?.title || 'VIKRANT GIRLS PG'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                                {/* Top Floating Badges */}
                                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-zinc-900 text-xs font-black shadow-md border border-white/50">
                                        <Sparkles size={13} className="text-rose-500 fill-rose-500" />
                                        Featured Spotlight
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black shadow-md">
                                        {featuredProperty?.genderPreference === 'girls' ? '🌸 Girls PG' : (featuredProperty?.type || 'PG')}
                                    </span>
                                </div>

                                {/* Bottom Info Glass Card */}
                                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl border border-zinc-100 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-sm sm:text-base font-black text-zinc-900 truncate">
                                            {featuredProperty?.title || 'VIKRANT GIRLS PG'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mt-0.5">
                                            <span className="flex items-center gap-1 truncate text-zinc-600">
                                                <MapPin size={12} className="text-rose-500 shrink-0" />
                                                {featuredProperty?.location || 'Arihant Ambience'}
                                            </span>
                                            <span>•</span>
                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100 shrink-0">
                                                {String(featuredProperty?.listedBy || 'owner').toLowerCase() === 'owner' ? '🏠 ₹0 Brokerage' : '🤝 Broker Fee Disclosed'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Starts at</div>
                                        <div className="text-base sm:text-lg font-black text-zinc-950">
                                            ₹{Number(featuredProperty?.price || 10000).toLocaleString()}
                                            <span className="text-[10px] text-zinc-400 font-medium">/mo</span>
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
