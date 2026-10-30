import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    MapPin, Navigation, Compass, IndianRupee, ArrowRight, 
    Star, GraduationCap, Phone, CheckCircle2, Crosshair, X, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Well-known coordinates for Crossings Republik, Ghaziabad & Delhi NCR college hubs
const COLLEGE_HUBS = [
    { name: 'Crossings Republik', lat: 28.6280, lng: 77.4385, college: 'Crossings Republik' },
    { name: 'ABES College', lat: 28.6360, lng: 77.4470, college: 'ABES Engineering College' },
    { name: 'IMS Ghaziabad', lat: 28.6750, lng: 77.4520, college: 'IMS Ghaziabad' },
    { name: 'AKGEC', lat: 28.6766, lng: 77.5028, college: 'AKGEC Ghaziabad' },
    { name: 'Noida Sec 62', lat: 28.6258, lng: 77.3688, college: 'Noida Sector 62' },
    { name: 'Indirapuram', lat: 28.6410, lng: 77.3750, college: 'Indirapuram' },
    { name: 'Sharda / Galgotias', lat: 28.4731, lng: 77.4938, college: 'Sharda University' },
];

// Helper to determine coordinates for any listing
const getListingCoords = (listing, index = 0) => {
    if (listing?.latitude && listing?.longitude) {
        const lat = parseFloat(listing.latitude);
        const lng = parseFloat(listing.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return { lat, lng };
        }
    }

    if (listing?.lat && listing?.lng) {
        const lat = parseFloat(listing.lat);
        const lng = parseFloat(listing.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
        }
    }

    const text = `${listing?.title || ''} ${listing?.location || ''} ${listing?.city || ''} ${listing?.locality || ''} ${listing?.nearbyCollege || ''}`.toLowerCase();

    // Crossings Republik, Ghaziabad (Core Headquarters)
    if (text.includes('crossings') || text.includes('arihant') || text.includes('gh 7') || text.includes('gh7') || text.includes('vikrant')) {
        return { lat: 28.6280 + (index % 5) * 0.0012, lng: 77.4385 + (index % 4) * 0.0015 };
    }
    if (text.includes('abes')) return { lat: 28.6360 + (index % 4) * 0.0012, lng: 77.4470 + (index % 4) * 0.0015 };
    if (text.includes('ims')) return { lat: 28.6750 + (index % 4) * 0.0014, lng: 77.4520 + (index % 4) * 0.0012 };
    if (text.includes('akgec') || text.includes('ajay kumar')) return { lat: 28.6766 + (index % 4) * 0.0012, lng: 77.5028 + (index % 4) * 0.0014 };
    if (text.includes('indirapuram') || text.includes('vaishali')) return { lat: 28.6410 + (index % 5) * 0.0014, lng: 77.3750 + (index % 4) * 0.0012 };
    if (text.includes('ghaziabad') || text.includes('raj nagar')) return { lat: 28.6692 + (index % 5) * 0.0015, lng: 77.4538 + (index % 4) * 0.0012 };
    if (text.includes('sector 62') || text.includes('noida 62')) return { lat: 28.6258 + (index % 5) * 0.0015, lng: 77.3688 + (index % 4) * 0.0012 };
    if (text.includes('lucknow') || text.includes('gomti') || text.includes('alambagh')) return { lat: 26.8467 + (index % 5) * 0.002, lng: 80.9462 + (index % 4) * 0.002 };
    if (text.includes('sharda')) return { lat: 28.4731 + (index % 5) * 0.0012, lng: 77.4938 + (index % 4) * 0.0015 };
    if (text.includes('galgotia')) return { lat: 28.4619 + (index % 5) * 0.0014, lng: 77.4975 + (index % 4) * 0.0012 };
    if (text.includes('amity')) return { lat: 28.5449 + (index % 5) * 0.0015, lng: 77.3332 + (index % 4) * 0.0012 };

    // Default student hub center (Crossings Republik, Ghaziabad) with gentle deterministic distribution
    const angle = (index * 67.5) * (Math.PI / 180);
    const radius = 0.004 + (index % 6) * 0.0025;
    return {
        lat: 28.6280 + Math.sin(angle) * radius,
        lng: 77.4385 + Math.cos(angle) * radius
    };
};

// Distance calculation in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Controller to fly or update map center
const MapViewController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 14, { duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
};

// Create custom price pin element for Leaflet
const createCustomPriceIcon = (price, isSelected, title, purpose) => {
    const isSale = purpose === 'sell' || purpose === 'sale' || Number(price || 0) >= 500000;
    let formattedPrice;
    if (isSale) {
        const num = Number(price || 0);
        if (num >= 10000000) {
            formattedPrice = `₹${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
        } else if (num >= 100000) {
            formattedPrice = `₹${(num / 100000).toFixed(1).replace(/\.0$/, '')} L`;
        } else {
            formattedPrice = `₹${num.toLocaleString('en-IN')}`;
        }
    } else {
        formattedPrice = Number(price || 0) >= 1000 
            ? `₹${(Number(price) / 1000).toFixed(1)}k` 
            : `₹${Number(price || 0)}`;
    }

    const bg = isSelected ? '#FBBF24' : '#1c1f26';
    const text = isSelected ? '#09090b' : '#ffffff';
    const border = isSelected ? '#ffffff' : 'rgba(251, 191, 36, 0.7)';
    const scale = isSelected ? 'scale(1.15)' : 'scale(1)';
    const safeTitle = (title || '').replace(/"/g, '&quot;');

    return L.divIcon({
        className: 'staysetu-price-pin',
        html: `
            <div title="${safeTitle}" style="
                background: ${bg};
                color: ${text};
                border: 2px solid ${border};
                border-radius: 9999px;
                padding: 4px 10px;
                font-family: inherit;
                font-size: 11px;
                font-weight: 800;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                white-space: nowrap;
                cursor: pointer;
                transform: translate(-50%, -50%) ${scale};
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: flex;
                align-items: center;
                gap: 3px;
            ">
                <span style="color: ${isSelected ? '#09090b' : '#FBBF24'}">●</span>
                <span>${formattedPrice}</span>
            </div>
        `,
        iconSize: [64, 28],
        iconAnchor: [32, 14]
    });
};

// User Location Pin
const createUserLocationIcon = () => {
    return L.divIcon({
        className: 'user-location-pin',
        html: `
            <div style="
                width: 22px;
                height: 22px;
                background: #3B82F6;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.35), 0 4px 12px rgba(0,0,0,0.4);
                transform: translate(-50%, -50%);
            "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });
};

const ListingMapSearch = ({ 
    listings = [], 
    userCoords, 
    onSelectLocation,
    onListingSelect,
    selectedListingId
}) => {
    const [selectedListing, setSelectedListing] = useState(null);
    const [mapStyle, setMapStyle] = useState('streets'); // 'streets' | 'satellite'
    const [mapCenter, setMapCenter] = useState([28.6280, 77.4385]);
    const [mapZoom, setMapZoom] = useState(13);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState(null);

    // Map each listing to its coordinate
    const listingsWithCoords = useMemo(() => {
        return listings.map((item, idx) => {
            const coords = getListingCoords(item, idx);
            const dist = userCoords 
                ? calculateDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng)
                : null;
            return {
                ...item,
                coords,
                distanceKm: dist
            };
        });
    }, [listings, userCoords]);

    // Handle user location button
    const handleNearMeClick = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        setLocating(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLoc = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                setMapCenter([userLoc.lat, userLoc.lng]);
                setMapZoom(14);
                setLocating(false);
                if (onSelectLocation) {
                    onSelectLocation(userLoc);
                }
            },
            () => {
                setLocating(false);
                setLocationError('Unable to retrieve your location. Showing Crossings Republik, Ghaziabad.');
                // Fallback to Crossings Republik
                setMapCenter([28.6280, 77.4385]);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // When a college button is clicked
    const handleCollegeJump = (hub) => {
        setMapCenter([hub.lat, hub.lng]);
        setMapZoom(15);
    };

    // Auto-select listing if passed externally
    useEffect(() => {
        if (!selectedListingId) return;
        const found = listingsWithCoords.find(l => (l.$id || l.id) === selectedListingId);
        if (found) {
            const timer = setTimeout(() => {
                setSelectedListing(found);
                setMapCenter([found.coords.lat, found.coords.lng]);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [selectedListingId, listingsWithCoords]);

    return (
        <div className="relative w-full h-[620px] rounded-3xl overflow-hidden border border-white/10 bg-[#121418] shadow-2xl flex flex-col">
            
            {/* Top Interactive Controls Bar */}
            <div className="z-[500] bg-[#16181f]/95 backdrop-blur-md border-b border-white/10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                
                {/* College Quick Jump Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
                    <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                        <GraduationCap size={13} className="text-[#FBBF24]" />
                        Hubs:
                    </span>
                    {COLLEGE_HUBS.map((hub) => (
                        <button
                            key={hub.name}
                            onClick={() => handleCollegeJump(hub)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-[#1c1f26] border border-white/10 text-zinc-300 hover:text-white hover:border-[#FBBF24]/50 hover:bg-[#FBBF24]/10 transition-all"
                        >
                            {hub.name}
                        </button>
                    ))}
                </div>

                {/* Right Action: Layer Switcher & Near Me GPS Button */}
                <div className="flex items-center gap-2">
                    {/* Layer Switcher */}
                    <div className="flex items-center bg-[#121418] border border-white/10 rounded-full p-0.5 text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setMapStyle('streets')}
                            className={`px-2.5 py-1 rounded-full transition-all ${
                                mapStyle === 'streets'
                                    ? 'bg-[#FBBF24] text-zinc-950 font-black shadow-sm'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            Streets
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapStyle('satellite')}
                            className={`px-2.5 py-1 rounded-full transition-all ${
                                mapStyle === 'satellite'
                                    ? 'bg-[#FBBF24] text-zinc-950 font-black shadow-sm'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            Satellite
                        </button>
                    </div>

                    <button
                        onClick={handleNearMeClick}
                        disabled={locating}
                        className="bg-[#FBBF24] hover:bg-[#F59E0B] text-zinc-950 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-60"
                        title="Locate properties near me"
                    >
                        <Crosshair size={14} className={locating ? 'animate-spin' : ''} />
                        <span>{locating ? 'Locating...' : 'Near Me'}</span>
                    </button>
                    
                    <span className="text-zinc-500 text-xs hidden sm:inline">
                        • {listingsWithCoords.length} pins
                    </span>
                </div>
            </div>

            {/* Notification / Error banner if any */}
            {locationError && (
                <div className="z-[500] bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
                    <span>{locationError}</span>
                    <button onClick={() => setLocationError(null)}><X size={13} /></button>
                </div>
            )}

            {/* Map Canvas Container */}
            <div className="relative flex-1 w-full h-full">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%', backgroundColor: '#121418' }}
                    className="z-0"
                >
                    {/* Free Watermark-Free High Definition Tiles */}
                    {mapStyle === 'satellite' ? (
                        <TileLayer
                            key="esri-satellite"
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution='Tiles &copy; Esri'
                            maxZoom={19}
                        />
                    ) : (
                        <TileLayer
                            key="osm-streets"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            maxZoom={19}
                        />
                    )}

                    {/* Smooth map controller */}
                    <MapViewController center={mapCenter} zoom={mapZoom} />

                    {/* User GPS Pin */}
                    {userCoords && (
                        <Marker
                            position={[userCoords.lat, userCoords.lng]}
                            icon={createUserLocationIcon()}
                        >
                            <Popup className="dark-leaflet-popup">
                                <div className="text-center p-1 text-xs">
                                    <strong className="text-zinc-900 block">📍 Your Location</strong>
                                    <span className="text-zinc-500 text-[10px]">Searching stays around you</span>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Property Price Pins */}
                    {listingsWithCoords.map((item) => {
                        const isSelected = selectedListing && (selectedListing.$id || selectedListing.id) === (item.$id || item.id);
                        return (
                            <Marker
                                key={item.$id || item.id}
                                position={[item.coords.lat, item.coords.lng]}
                                icon={createCustomPriceIcon(item.price, isSelected, item.title, item.purpose)}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedListing(item);
                                        if (onListingSelect) onListingSelect(item);
                                    }
                                }}
                            />
                        );
                    })}
                </MapContainer>

                {/* Floating Bottom Card Preview for Selected Property */}
                {selectedListing && (
                    <div className="absolute bottom-5 left-4 right-4 sm:left-6 sm:max-w-md z-[1000] animate-slide-up">
                        <div className="bg-[#1c1f26]/95 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl text-white relative">
                            
                            {/* Close Card Button */}
                            <button
                                onClick={() => setSelectedListing(null)}
                                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>

                            <div className="flex gap-4 items-center">
                                {/* Thumbnail */}
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/40 shrink-0 relative">
                                    <img
                                        src={
                                            Array.isArray(selectedListing.images) && selectedListing.images[0]
                                                ? selectedListing.images[0]
                                                : typeof selectedListing.images === 'string' && selectedListing.images.startsWith('[')
                                                    ? JSON.parse(selectedListing.images)[0]
                                                    : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80'
                                        }
                                        alt={selectedListing.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80';
                                        }}
                                    />
                                    <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-[#FBBF24]">
                                        {selectedListing.type || 'Stay'}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                                            ✓ {String(selectedListing.listedBy || 'Owner').toLowerCase() === 'owner' ? 'Direct Owner' : 'Verified Agent'}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-extrabold text-white truncate mb-1">
                                        {selectedListing.title}
                                    </h4>

                                    <p className="text-zinc-400 text-xs truncate flex items-center gap-1 mb-2">
                                        <MapPin size={11} className="text-[#FBBF24] shrink-0" />
                                        {selectedListing.location || selectedListing.nearbyCollege || 'Greater Noida'}
                                    </p>

                                    {/* Price & Action */}
                                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                                        <div>
                                            <span className="text-base font-black text-[#FBBF24]">
                                                {(selectedListing.purpose === 'sell' || Number(selectedListing.price || 0) >= 500000)
                                                    ? (Number(selectedListing.price) >= 10000000 
                                                        ? `₹${(Number(selectedListing.price) / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`
                                                        : (Number(selectedListing.price) >= 100000
                                                            ? `₹${(Number(selectedListing.price) / 100000).toFixed(2).replace(/\.00$/, '')} Lac`
                                                            : `₹${Number(selectedListing.price || 0).toLocaleString()}`))
                                                    : `₹${Number(selectedListing.price || 0).toLocaleString()}`}
                                            </span>
                                            {selectedListing.purpose !== 'sell' && Number(selectedListing.price || 0) < 500000 && (
                                                <span className="text-[10px] text-zinc-400 font-normal"> / mo</span>
                                            )}
                                        </div>

                                        <Link
                                            to={`/property/${selectedListing.$id || selectedListing.id}`}
                                            className="bg-[#FBBF24] hover:bg-[#F59E0B] text-zinc-950 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                                        >
                                            <span>View</span>
                                            <ArrowRight size={12} />
                                        </Link>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </div>

        </div>
    );
};

export default ListingMapSearch;
