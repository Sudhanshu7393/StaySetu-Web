import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, Home, IndianRupee, X, Check, Map, LayoutGrid, Crosshair, Navigation } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTION, Query, parseJsonField } from '../lib/supabase';
import PropertyCard from '../components/common/PropertyCard';
import ListingMapSearch from '../components/common/ListingMapSearch';
import { formatPropertyPrice } from '../lib/formatters';

const Listings = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const initialPurpose = searchParams.get('purpose') || 'all';
    const [purposeFilter, setPurposeFilter] = useState(initialPurpose);
    const [viewMode, setViewMode] = useState(searchParams.get('view') || 'grid');
    const [selectedListingId, setSelectedListingId] = useState(null);

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'all');
    const [genderFilter, setGenderFilter] = useState(searchParams.get('gender') || 'all');
    const [priceRange, setPriceRange] = useState(
        parseInt(searchParams.get('price')) || (initialPurpose === 'sell' ? 30000000 : 100000)
    );
    const [amenities, setAmenities] = useState(searchParams.get('amenities')?.split(',') || []);
    const [userCoords, setUserCoords] = useState(
        searchParams.get('lat') && searchParams.get('lng')
            ? { lat: parseFloat(searchParams.get('lat')), lng: parseFloat(searchParams.get('lng')) }
            : null
    );
    const [collegeFilter, setCollegeFilter] = useState('all');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const colleges = [
        { id: 'all', label: 'All Cities & Hubs' },
        { id: 'Crossings', label: '📍 Crossings Republik' },
        { id: 'ABES', label: '🎓 ABES Engg College' },
        { id: 'IMS', label: '🎓 IMS Ghaziabad' },
        { id: 'AKGEC', label: '🎓 AKGEC Ghaziabad' },
        { id: 'Noida', label: '📍 Noida / Gr. Noida' },
        { id: 'Lucknow', label: '📍 Lucknow' },
    ];

    const amenityOptions = ['WiFi', 'AC', 'Food', 'Parking', 'Laundry'];

    // Haversine formula to calculate distance in KM
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const fetchListings = async () => {
        setLoading(true);

        try {
            // Build query filters
            const queries = [
                Query.equal('status', ['approved', 'active', 'rented', 'sold']),
                Query.orderDesc('$createdAt'),
                Query.limit(100),
            ];

            if (propertyType !== 'all') {
                queries.push(Query.equal('type', propertyType));
            }

            const res = await databases.listDocuments(DATABASE_ID, COLLECTION.listings, queries);

            let results = res.documents || [];

            // College / Area filter
            if (collegeFilter !== 'all') {
                results = results.filter(l => {
                    const text = `${l.nearbyCollege || ''} ${l.nearby_college || ''} ${l.location || ''} ${l.city || ''} ${l.locality || ''} ${l.title || ''}`.toLowerCase();
                    return text.includes(collegeFilter.toLowerCase());
                });
            }

            // Filter by Purpose: 'rent' or 'sell'
            if (purposeFilter !== 'all') {
                results = results.filter(l => {
                    const p = l.purpose || ((l.price && Number(l.price) > 500000) ? 'sell' : 'rent');
                    return p === purposeFilter;
                });
            }

            // Client-side filtering for search (All India support)
            if (searchQuery) {
                const q = searchQuery.toLowerCase().trim();
                results = results.filter(l =>
                    (l.title || '').toLowerCase().includes(q) ||
                    (l.location || '').toLowerCase().includes(q) ||
                    (l.city || '').toLowerCase().includes(q) ||
                    (l.locality || '').toLowerCase().includes(q) ||
                    (l.address || '').toLowerCase().includes(q) ||
                    (l.description || '').toLowerCase().includes(q) ||
                    (l.nearbyCollege || l.nearby_college || '').toLowerCase().includes(q)
                );
            }

            results = results.filter(l => (l.price || 0) <= priceRange);

            if (amenities.length > 0) {
                results = results.filter(l => {
                    const listingAmenities = parseJsonField(l.amenities) || [];
                    return amenities.every(a => listingAmenities.includes(a));
                });
            }

            if (genderFilter !== 'all') {
                const genderValue = genderFilter === 'male' ? 'boys' : 'girls';
                results = results.filter(l =>
                    l.genderPreference === genderValue || l.genderPreference === 'any' || !l.genderPreference
                );
            }

            // Distance sorting
            if (userCoords) {
                results = results.map(l => {
                    const lat = parseFloat(l.latitude);
                    const lng = parseFloat(l.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        return { ...l, distance: getDistance(userCoords.lat, userCoords.lng, lat, lng) };
                    }
                    return { ...l, distance: Infinity };
                });
                results.sort((a, b) => a.distance - b.distance);
            }

            setListings(results);
        } catch (err) {
            console.error('Fetch listings error:', err);
        }
        setLoading(false);
    };

    const handlePurposeChange = (newPurpose) => {
        setPurposeFilter(newPurpose);
        setPropertyType('all');
        if (newPurpose === 'sell') {
            setPriceRange(30000000);
        } else if (newPurpose === 'rent') {
            setPriceRange(50000);
        } else {
            setPriceRange(30000000);
        }
    };

    const fetchSuggestions = async (query) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
            const data = await res.json();
            setSuggestions(data.map(item => ({
                display_name: item.display_name,
                lat: item.lat,
                lon: item.lon
            })));
            setShowSuggestions(true);
        } catch (err) {
            console.error('Fetch suggestions error:', err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length > 2 && !showSuggestions) {
                fetchSuggestions(searchQuery);
            } else if (searchQuery.length <= 2) {
                setSuggestions([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, showSuggestions]);

    // Re-fetch when search params or internal state changes
    useEffect(() => {
        document.title = purposeFilter === 'sell'
            ? 'Verified Properties & Flats for Sale | StaySetu'
            : 'Verified Student PGs & Rooms for Rent | StaySetu';
        fetchListings();
        // Sync URL (de-bounced manually via useEffect)
        const params = new URLSearchParams();
        if (purposeFilter !== 'all') params.set('purpose', purposeFilter);
        if (searchQuery) params.set('q', searchQuery);
        if (propertyType !== 'all') params.set('type', propertyType);
        if (genderFilter !== 'all') params.set('gender', genderFilter);
        if (priceRange) params.set('price', priceRange);
        if (amenities.length > 0) params.set('amenities', amenities.join(','));
        if (viewMode === 'map') params.set('view', 'map');
        if (userCoords) {
            params.set('lat', userCoords.lat);
            params.set('lng', userCoords.lng);
        }
        setSearchParams(params, { replace: true });
    }, [purposeFilter, searchQuery, propertyType, genderFilter, priceRange, amenities, userCoords, collegeFilter, viewMode]);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserCoords(coords);
                setViewMode('map');
            },
            () => {
                alert('Could not access current location. Centering on Crossings Republik, Ghaziabad.');
                setViewMode('map');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        fetchListings();
    };

    const toggleAmenity = (amenity) => {
        const newAmenities = amenities.includes(amenity)
            ? amenities.filter(a => a !== amenity)
            : [...amenities, amenity];
        setAmenities(newAmenities);
    };

    const renderFilterPanel = (className = '') => (
        <div className={className}>
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-zinc-900">Filters</h3>
                <button
                    onClick={() => {
                        setSearchQuery('');
                        setPropertyType('all');
                        setGenderFilter('all');
                        setPriceRange(purposeFilter === 'sell' ? 30000000 : 100000);
                        setAmenities([]);
                        setUserCoords(null);
                        setSearchParams({});
                    }}
                    className="text-rose-600 text-xs font-semibold hover:text-rose-700 transition-colors"
                >
                    Reset
                </button>
            </div>

            {/* Purpose Filter within Panel */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">Listing Purpose</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 rounded-2xl border border-zinc-200/80">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'rent', label: 'Rent' },
                        { id: 'sell', label: 'Buy/Sale' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handlePurposeChange(tab.id)}
                            className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                                purposeFilter === tab.id
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Property Type */}
            <div className="mb-8">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Property Type</label>
                <div className="space-y-1.5">
                    {(purposeFilter === 'sell'
                        ? [
                            { id: 'all', label: 'Any Sale Property' },
                            { id: 'Flat', label: 'Apartment / Flat' },
                            { id: 'House/Villa', label: 'Villa / Kothi' },
                            { id: 'Plot', label: 'Residential Plot' },
                            { id: 'Studio', label: 'Studio Suite' }
                        ]
                        : purposeFilter === 'rent'
                            ? [
                                { id: 'all', label: 'Any Stay' },
                                { id: 'PG', label: 'PG / Co-Living' },
                                { id: 'Flat', label: 'Flat' },
                                { id: 'Hostel', label: 'Hostel' },
                                { id: 'Studio', label: 'Studio Flat' }
                            ]
                            : [
                                { id: 'all', label: 'Any Type' },
                                { id: 'PG', label: 'PG' },
                                { id: 'Flat', label: 'Flat / Apartment' },
                                { id: 'House/Villa', label: 'Villa / Kothi' },
                                { id: 'Plot', label: 'Plot' },
                                { id: 'Hostel', label: 'Hostel' }
                            ]
                    ).map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setPropertyType(id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-sm font-medium ${propertyType === id
                                ? 'border-rose-400 bg-rose-50 text-rose-900 shadow-xs'
                                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                                }`}
                        >
                            <span>{label}</span>
                            {propertyType === id && <Check size={14} className="text-rose-600" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gender Preference (Only for Rentals/PGs) */}
            {purposeFilter !== 'sell' && (
                <div className="mb-8">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Tenant / Gender</label>
                    <div className="space-y-1.5">
                        {[{ key: 'all', label: 'Any' }, { key: 'male', label: 'Boys' }, { key: 'female', label: 'Girls' }].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setGenderFilter(key)}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-sm font-medium ${genderFilter === key
                                    ? 'border-rose-400 bg-rose-50 text-rose-900 shadow-xs'
                                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                                    }`}
                            >
                                <span>{label}</span>
                                {genderFilter === key && <Check size={14} className="text-rose-600" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Range */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {purposeFilter === 'sell' ? 'Max Budget' : 'Max Rent'}
                    </label>
                    <span className="text-zinc-900 font-black flex items-center text-sm">
                        <IndianRupee size={14} className="mr-0.5 text-rose-600" />
                        {purposeFilter === 'sell'
                            ? formatPropertyPrice(priceRange, 'sell').replace('₹', '')
                            : priceRange.toLocaleString()}
                    </span>
                </div>
                <input
                    type="range"
                    min={purposeFilter === 'sell' ? 1000000 : 2000}
                    max={purposeFilter === 'sell' ? 30000000 : 50000}
                    step={purposeFilter === 'sell' ? 500000 : 500}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                />
                <div className="flex justify-between mt-2 text-[10px] font-medium text-zinc-400">
                    <span>{purposeFilter === 'sell' ? '₹10 Lac' : '₹2,000'}</span>
                    <span>{purposeFilter === 'sell' ? '₹3 Cr+' : '₹50,000+'}</span>
                </div>
            </div>

            {/* Amenities */}
            <div className="mb-8">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Amenities</label>
                <div className="space-y-2">
                    {amenityOptions.map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2.5 cursor-pointer group">
                            <div
                                onClick={() => toggleAmenity(amenity)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${amenities.includes(amenity)
                                    ? 'bg-rose-500 border-rose-500 shadow-xs text-white'
                                    : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                                    }`}
                            >
                                {amenities.includes(amenity) && <Check size={12} className="text-white stroke-[3]" />}
                            </div>
                            <span className={`text-sm font-medium transition-colors ${amenities.includes(amenity) ? 'text-zinc-900 font-bold' : 'text-zinc-600'}`}>
                                {amenity}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <button
                onClick={() => { fetchListings(); setShowFilters(false); }}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3 text-xs uppercase tracking-wider rounded-full transition-all shadow-md shadow-rose-500/25 hover:scale-[1.02]"
            >
                Apply Filters
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFAFB] text-zinc-900 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Top Search & Filter Bar matching screenshot 2 */}
                <div className="bg-white rounded-3xl p-3 sm:p-5 border border-zinc-200/90 shadow-sm mb-6">
                    
                    {/* Top Segment: Purpose Tabs (All | For Rent | For Sale) */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-100/90 rounded-full w-fit mb-3.5 border border-zinc-200/80">
                        {[
                            { id: 'all', label: 'All Properties' },
                            { id: 'rent', label: '🏠 For Rent (किराया)' },
                            { id: 'sell', label: '🏷️ Buy / For Sale (खरीदें / बेचें)' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handlePurposeChange(tab.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                                    purposeFilter === tab.id
                                        ? 'bg-rose-500 text-white shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-950'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        
                        {/* City / Location Dropdown Pill */}
                        <div className="relative shrink-0">
                            <select
                                value={collegeFilter}
                                onChange={(e) => {
                                    setCollegeFilter(e.target.value);
                                }}
                                className="appearance-none bg-zinc-50 border border-zinc-200 rounded-full pl-8 pr-8 py-2.5 text-xs font-bold text-zinc-800 focus:outline-none focus:border-rose-400 cursor-pointer w-full sm:w-auto"
                            >
                                <option value="all">🇮🇳 All India (All Cities)</option>
                                <option value="Crossings">📍 Crossings Republik</option>
                                <option value="ABES">🎓 ABES Engg College (NH-24)</option>
                                <option value="Ghaziabad">📍 Ghaziabad (Indirapuram / NH-24)</option>
                                <option value="Noida">📍 Noida / Greater Noida</option>
                                <option value="IMS">🎓 IMS Ghaziabad</option>
                                <option value="AKGEC">🎓 AKGEC Ghaziabad</option>
                                <option value="Lucknow">📍 Lucknow</option>
                            </select>
                            <MapPin size={13} className="text-rose-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Search Input with Location Button */}
                        <form onSubmit={handleSearch} className="flex-1 group relative">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder={
                                        purposeFilter === 'sell'
                                            ? "Search flats for sale, plots across India..."
                                            : "Search any area, city, college across India (e.g. Crossings Republik, ABES, Noida)..."
                                    }
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-full pl-10 pr-9 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                />
                                <button
                                    type="button"
                                    onClick={detectLocation}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                                    title="Locate around me"
                                >
                                    <Crosshair size={15} />
                                </button>
                            </div>

                            {/* Recommendation Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-200 z-50 overflow-hidden animate-scale-in">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery(s.display_name.split(',')[0]);
                                                setUserCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                                                setShowSuggestions(false);
                                                fetchListings();
                                            }}
                                            className="w-full text-left px-5 py-3.5 hover:bg-rose-50 transition-colors border-b border-zinc-100 last:border-0 flex items-start gap-3"
                                        >
                                            <MapPin size={14} className="text-rose-500 mt-1 shrink-0" />
                                            <span className="text-xs font-medium text-zinc-800 line-clamp-2">{s.display_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </form>

                        {/* Filters Trigger Pill */}
                        <button
                            onClick={() => setShowFilters(true)}
                            className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-full flex items-center justify-center space-x-2 py-2.5 px-4 transition-all shrink-0"
                        >
                            <SlidersHorizontal size={14} className="text-rose-500" />
                            <span className="text-xs font-bold">Filters</span>
                        </button>

                        {/* View Mode Switcher: Cards vs Map */}
                        <div className="inline-flex items-center bg-zinc-100 p-1 rounded-full border border-zinc-200 shrink-0">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-zinc-900 shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                <LayoutGrid size={13} />
                                <span>Cards</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'map'
                                        ? 'bg-rose-500 text-white shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                <Map size={13} />
                                <span>Map</span>
                            </button>
                        </div>

                    </div>
                </div>

                {/* Subheader matching screenshot 2 with dynamic label for Rent vs Sale */}
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900">
                        {listings.length} {
                            purposeFilter === 'sell'
                                ? (listings.length === 1 ? 'property for sale' : 'properties for sale')
                                : purposeFilter === 'rent'
                                    ? (listings.length === 1 ? 'rental stay' : 'rental stays')
                                    : (listings.length === 1 ? 'property' : 'properties')
                        } in {collegeFilter !== 'all' ? collegeFilter : 'Lucknow'}
                    </h2>
                    <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                        Sorted by relevance
                    </span>
                </div>

                {userCoords && (
                    <div className="flex items-center gap-3 mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 animate-fade-in">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 border border-emerald-300 shadow-xs">
                            <MapPin size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Location Filter Active</h4>
                            <p className="text-[11px] text-emerald-700 font-medium">Showing properties sorted by proximity to you</p>
                        </div>
                        <button
                            onClick={() => {
                                setUserCoords(null);
                                const params = new URLSearchParams(searchParams);
                                params.delete('lat');
                                params.delete('lng');
                                setSearchParams(params);
                            }}
                            className="px-4 py-2 bg-white text-zinc-900 border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all shadow-xs"
                        >
                            Clear Location
                        </button>
                    </div>
                )}

                <div className="flex gap-8">
                    {/* Desktop Filters */}
                    <div className="hidden md:block w-60 shrink-0">
                        {renderFilterPanel("bg-white rounded-3xl border border-zinc-200/80 p-6 sticky top-24 shadow-md text-zinc-900")}
                    </div>

                    {/* Listings Grid */}
                    <div className="flex-1">
                        
                        {/* Interactive Map View Search Section */}
                        {viewMode === 'map' && (
                            <div className="mb-8 animate-fade-in">
                                <ListingMapSearch 
                                    listings={listings}
                                    userCoords={userCoords}
                                    onSelectLocation={(coords) => {
                                        setUserCoords(coords);
                                    }}
                                    onListingSelect={(item) => {
                                        setSelectedListingId(item.$id || item.id);
                                    }}
                                    selectedListingId={selectedListingId}
                                />
                            </div>
                        )}

                        {/* College Quick Filters */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-5 scrollbar-none">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">Colleges:</span>
                            {colleges.map((col) => {
                                const isActive = collegeFilter === col.id;
                                return (
                                    <button
                                        key={col.id}
                                        onClick={() => setCollegeFilter(col.id)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                                            isActive
                                                ? 'bg-zinc-900 text-white shadow-sm scale-105'
                                                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                                        }`}
                                    >
                                        {col.label}
                                    </button>
                                );
                            })}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-white rounded-3xl animate-pulse h-48 border border-zinc-200"></div>
                                ))}
                            </div>
                        ) : listings.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                                {listings.map((listing) => {
                                    const isHighlighted = selectedListingId === (listing.$id || listing.id);
                                    return (
                                        <div 
                                            key={listing.$id || listing.id} 
                                            className={`transition-all duration-300 rounded-3xl ${isHighlighted ? 'ring-2 ring-rose-400 scale-[1.01]' : ''}`}
                                        >
                                            <PropertyCard property={listing} />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] p-12 sm:p-16 text-center border border-dashed border-zinc-200 max-w-md mx-auto my-6">
                                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Home size={30} />
                                </div>
                                <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No properties found</h3>
                                <p className="text-zinc-500 font-normal mb-6 max-w-xs mx-auto text-xs sm:text-sm leading-relaxed">
                                    No live listings match your current filters. Be the first to list or reset your search.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <Link
                                        to="/dashboard/add-listing"
                                        className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-5 py-2.5 rounded-full text-xs transition-all shadow-xs"
                                    >
                                        + List Your Property
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setPropertyType('all');
                                            setGenderFilter('all');
                                            setPriceRange(purposeFilter === 'sell' ? 30000000 : 100000);
                                            setAmenities([]);
                                            setSearchParams({});
                                        }}
                                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold px-5 py-2.5 rounded-full text-xs transition-all"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filters Modal */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] bg-[#121418] text-white animate-fade-in md:hidden">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Filters</h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-[#16181f]">
                            {renderFilterPanel()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Listings;
