import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION, ID } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, Upload, MapPin, IndianRupee, Home,
    CheckCircle2, AlertCircle, Save, X, Plus, Locate, Search,
    Building2, Users, Image as ImageIcon, Camera, Trash2, Star, Sparkles
} from 'lucide-react';
import PropertyMap from '../../components/common/PropertyMap';

// High-quality verified sample photos for quick 1-click addition
const SAMPLE_PHOTOS = [
    { name: 'Society Highrise', url: '/properties/crossings/crossings_republik_towers.jpg' },
    { name: 'Balcony View', url: '/properties/crossings/indian_tower_balconies.jpg' },
    { name: 'Drawing Room', url: '/properties/crossings/indian_drawing_room.jpg' },
    { name: 'Bedroom', url: '/properties/crossings/indian_bedroom.jpg' },
];

// Client-side image compression to lightweight responsive JPEG (~80-120KB)
const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const maxWidth = 1280;
                const maxHeight = 1280;
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const AddListing = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fileInputRef = useRef(null);

    const initialPurpose = searchParams.get('purpose') === 'sell' ? 'sell' : 'rent';

    const [loading, setLoading] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [customUrl, setCustomUrl] = useState('');

    const [formData, setFormData] = useState({
        purpose: initialPurpose, // 'rent' | 'sell'
        title: '',
        description: '',
        price: '',
        area: '',
        society: '',
        ownership: 'Freehold',
        possession: 'Ready to Move',
        bedrooms: '2',
        type: initialPurpose === 'sell' ? 'Flat' : 'Flat',
        furnishing: 'Semi-Furnished',
        location: 'Crossings Republik, Ghaziabad',
        latitude: '28.6139',
        longitude: '77.4273',
        gender_preference: 'any',
        phone_number: profile?.phone || '',
        whatsapp_number: profile?.phone || '',
        amenities: ['WiFi', 'Parking', 'Security', 'Attached Bath'],
        images: [], // List of image URLs or base64 strings
        listed_by: 'owner', // 'owner' | 'broker'
        brokerage_fee: '₹0 (Direct Owner - Free)',
        occupancy: ['single', 'double'],
        occupancy_pricing: { single: '', double: '' },
        association: '',
        nearbyCollege: ''
    });

    const amenityOptions = ['WiFi', 'AC', 'Food', 'Parking', 'Power Backup', 'Lift', 'Security', 'Gym', 'Attached Bath', 'Balcony'];

    // Update purpose if URL changes
    useEffect(() => {
        const queryPurpose = searchParams.get('purpose');
        if (queryPurpose && (queryPurpose === 'sell' || queryPurpose === 'rent')) {
            setFormData(prev => ({
                ...prev,
                purpose: queryPurpose,
                type: queryPurpose === 'sell' ? (prev.type === 'PG' ? 'Flat' : prev.type) : prev.type,
                brokerage_fee: prev.listed_by === 'owner' ? '₹0 (Direct Owner - Free)' : (queryPurpose === 'sell' ? '1% - 2%' : '15 Days Rent')
            }));
        }
    }, [searchParams]);

    const handlePurposeSwitch = (purpose) => {
        setFormData(prev => ({
            ...prev,
            purpose,
            type: purpose === 'sell' ? 'Flat' : 'Flat',
            brokerage_fee: prev.listed_by === 'owner' ? '₹0 (Direct Owner - Free)' : (purpose === 'sell' ? '1% - 2%' : '15 Days Rent')
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'listed_by') {
                updated.brokerage_fee = value === 'owner' 
                    ? '₹0 (Direct Owner - Free)' 
                    : (updated.purpose === 'sell' ? '1% - 2%' : '15 Days Rent');
            }
            return updated;
        });
    };

    const handleLocationChange = (lat, lng) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
        }));
    };

    // Photo File Selection & Compression
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploadingPhotos(true);
        setError(null);

        try {
            const compressedUrls = [];
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const dataUrl = await compressImageFile(file);
                    compressedUrls.push(dataUrl);
                }
            }

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...compressedUrls]
            }));
        } catch (err) {
            console.error('Image compression error:', err);
            setError('Failed to process one or more images. Please try selecting again.');
        } finally {
            setUploadingPhotos(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddPresetPhoto = (url) => {
        if (!formData.images.includes(url)) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, url]
            }));
        }
    };

    const handleAddCustomUrl = () => {
        if (!customUrl.trim()) return;
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, customUrl.trim()]
        }));
        setCustomUrl('');
        setShowUrlInput(false);
    };

    const handleRemovePhoto = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSetCoverPhoto = (index) => {
        if (index === 0) return;
        setFormData(prev => {
            const imgs = [...prev.images];
            const [selected] = imgs.splice(index, 1);
            return {
                ...prev,
                images: [selected, ...imgs]
            };
        });
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                handleLocationChange(latitude, longitude);

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.display_name) {
                        setFormData(prev => ({
                            ...prev,
                            location: data.display_name
                        }));
                    }
                } catch (err) {
                    console.error('Reverse geocoding error:', err);
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError('Unable to retrieve your location. Please ensure location services are enabled.');
                console.error(err);
                setLoading(false);
            }
        );
    };

    const searchAddressOnMap = async () => {
        if (!formData.location || formData.location.trim().length < 4) {
            setError('Please enter a location or society name to search on the map.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const query = encodeURIComponent(formData.location);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                handleLocationChange(parseFloat(lat), parseFloat(lon));
            } else {
                setError('Could not pin this address automatically. Please tap the map to pin it manually.');
            }
        } catch (err) {
            setError('Error searching address. Please pin manually on map.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAmenity = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const toggleOccupancy = (type) => {
        setFormData(prev => {
            const newOccupancy = prev.occupancy.includes(type)
                ? (prev.occupancy.length > 1 ? prev.occupancy.filter(o => o !== type) : prev.occupancy)
                : [...prev.occupancy, type];
            
            const newPricing = { ...prev.occupancy_pricing };
            if (!newOccupancy.includes(type)) {
                delete newPricing[type];
            } else if (newPricing[type] === undefined) {
                newPricing[type] = '';
            }

            return { ...prev, occupancy: newOccupancy, occupancy_pricing: newPricing };
        });
    };

    const handlePriceForOccupancy = (type, value) => {
        setFormData(prev => ({
            ...prev,
            occupancy_pricing: {
                ...prev.occupancy_pricing,
                [type]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!user) throw new Error('You must be logged in to list a property. Please log in first.');
            if (!formData.title.trim()) throw new Error('Please enter a title for your property listing.');
            if (!formData.price || parseFloat(formData.price) <= 0) throw new Error('Please enter a valid price.');
            if (!formData.location.trim()) throw new Error('Please specify property location / address.');

            // Ensure images exist or provide a fallback
            let finalImages = [...formData.images].filter(Boolean);
            if (finalImages.length === 0) {
                finalImages = [SAMPLE_PHOTOS[0].url, SAMPLE_PHOTOS[2].url];
            }

            const occupancyData = formData.occupancy.map(type => ({
                type,
                price: parseFloat(formData.occupancy_pricing[type]) || parseFloat(formData.price) || 0
            }));

            const mainPrice = parseFloat(formData.price) || 0;
            const docId = ID.unique();

            const newListingPayload = {
                id: docId,
                purpose: formData.purpose || 'rent',
                title: formData.title.trim(),
                description: formData.description.trim() || `${formData.title} in ${formData.location}. Direct verified listing with all transparent details.`,
                price: mainPrice,
                area: formData.area || (formData.purpose === 'sell' ? '1,450 sq.ft' : ''),
                society: formData.society || formData.association || '',
                ownership: formData.ownership || 'Freehold',
                possession: formData.possession || 'Ready to Move',
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                location: formData.location.trim(),
                latitude: formData.latitude || '28.6139',
                longitude: formData.longitude || '77.4273',
                type: formData.type || 'Flat',
                furnishing: formData.furnishing || 'Semi-Furnished',
                phoneNumber: formData.phone_number || profile?.phone || '',
                whatsappNumber: formData.whatsapp_number || formData.phone_number || profile?.phone || '',
                owner_phone: formData.phone_number || profile?.phone || '',
                owner_name: profile?.fullName || profile?.name || user?.name || 'Property Owner',
                amenities: formData.amenities,
                images: finalImages,
                ownerId: user.$id || user.id,
                status: 'approved', // Live immediately!
                genderPreference: formData.gender_preference || 'any',
                listedBy: formData.listed_by || 'owner',
                brokerageFee: (formData.brokerage_fee && formData.brokerage_fee.trim() !== '') 
                    ? formData.brokerage_fee 
                    : (formData.listed_by === 'broker' ? (formData.purpose === 'sell' ? '1% - 2%' : '15 Days Rent') : '₹0 (Direct Owner)'),
                occupancy: occupancyData,
                association: formData.society || formData.association || '',
                nearbyCollege: formData.nearbyCollege || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await databases.createDocument(DATABASE_ID, COLLECTION.listings, docId, newListingPayload);

            setSuccess(true);
            // Redirect straight to live property details so owner can see their listing immediately!
            setTimeout(() => {
                navigate(`/property/${docId}`);
            }, 1200);

        } catch (err) {
            console.error('Submit listing error:', err);
            setError(err.message || 'Failed to publish listing. Please check your connection.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center text-slate-600 hover:text-rose-600 font-bold mb-6 transition-colors text-sm"
                >
                    <ArrowLeft size={18} className="mr-2" /> Back
                </button>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
                    
                    {/* Header */}
                    <div className="p-6 sm:p-8 md:p-10 border-b border-slate-100 bg-gradient-to-br from-white via-rose-50/20 to-zinc-50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 font-extrabold text-xs uppercase tracking-wider mb-2">
                                    <Sparkles size={12} /> Instant Live Listing
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    List Your Property
                                </h1>
                                <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
                                    Post verified flats for sale, rent, PGs, and apartments with direct contact.
                                </p>
                            </div>

                            {/* Purpose Toggle */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 self-start sm:self-center">
                                <button
                                    type="button"
                                    onClick={() => handlePurposeSwitch('rent')}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                        formData.purpose === 'rent'
                                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    🏠 For Rent
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePurposeSwitch('sell')}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                        formData.purpose === 'sell'
                                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    🏷️ For Sale
                                </button>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 md:p-10 space-y-8">
                        
                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                <span className="font-semibold">{error}</span>
                            </div>
                        )}

                        {/* Success Alert */}
                        {success && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm">
                                <CheckCircle2 size={20} className="shrink-0" />
                                <span className="font-bold">Property listed successfully! Redirecting to your live property page...</span>
                            </div>
                        )}

                        {/* 1. Basic Details */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Home size={16} className="text-rose-500" /> 1. Property Basic Details
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Property Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        placeholder={formData.purpose === 'sell' ? 'e.g. 3 BHK Luxury Flat in GH 07, Crossings Republik' : 'e.g. Fully Furnished 2 BHK Flat / PG for Girls in Crossings Republik'}
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Property Type *
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900 bg-white"
                                    >
                                        <option value="Flat">Flat / High-Rise Apartment</option>
                                        <option value="Villa">Independent House / Villa</option>
                                        <option value="Plot">Residential Plot / Land</option>
                                        <option value="PG">PG / Student Hostel</option>
                                        <option value="Room">Single / Shared Room</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Bedrooms (BHK)
                                    </label>
                                    <select
                                        name="bedrooms"
                                        value={formData.bedrooms}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900 bg-white"
                                    >
                                        <option value="1">1 BHK / 1 RK</option>
                                        <option value="2">2 BHK</option>
                                        <option value="3">3 BHK</option>
                                        <option value="4">4 BHK</option>
                                        <option value="5">5+ BHK / Penthouse</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Society / Building / Project Name
                                    </label>
                                    <input
                                        type="text"
                                        name="society"
                                        placeholder="e.g. GH 07 / Proview Laboni / Gaur City"
                                        value={formData.society}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Super Built-up Area
                                    </label>
                                    <input
                                        type="text"
                                        name="area"
                                        placeholder="e.g. 1,450 sq.ft or 120 sq.yd"
                                        value={formData.area}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold text-slate-900"
                                    />
                                </div>

                                {formData.purpose === 'sell' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Possession Status
                                            </label>
                                            <select
                                                name="possession"
                                                value={formData.possession}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900 bg-white"
                                            >
                                                <option value="Ready to Move">Ready to Move</option>
                                                <option value="Under Construction">Under Construction</option>
                                                <option value="Within 3 Months">Possession within 3 Months</option>
                                                <option value="Within 6 Months">Possession within 6 Months</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Ownership Title
                                            </label>
                                            <select
                                                name="ownership"
                                                value={formData.ownership}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900 bg-white"
                                            >
                                                <option value="Freehold">Freehold Title</option>
                                                <option value="Power of Attorney">Power of Attorney</option>
                                                <option value="Leasehold">Leasehold</option>
                                                <option value="Cooperative Society">Cooperative Society</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Furnishing Status
                                            </label>
                                            <select
                                                name="furnishing"
                                                value={formData.furnishing}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900 bg-white"
                                            >
                                                <option value="Fully Furnished">Fully Furnished</option>
                                                <option value="Semi-Furnished">Semi-Furnished</option>
                                                <option value="Unfurnished">Unfurnished</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Tenant Preference
                                            </label>
                                            <select
                                                name="gender_preference"
                                                value={formData.gender_preference}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900 bg-white"
                                            >
                                                <option value="any">Anyone (Family / Bachelors)</option>
                                                <option value="female">Girls / Women Only</option>
                                                <option value="male">Boys / Men Only</option>
                                                <option value="family">Families Only</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 2. Pricing & Pricing Breakdown */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <IndianRupee size={16} className="text-rose-500" /> 2. Pricing
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        {formData.purpose === 'sell' ? 'Total Sale Price (₹) *' : 'Monthly Rent (₹) *'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            name="price"
                                            required
                                            placeholder={formData.purpose === 'sell' ? 'e.g. 8500000 (85 Lakhs)' : 'e.g. 15000'}
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900"
                                        />
                                    </div>
                                    {formData.purpose === 'sell' && formData.price && (
                                        <p className="text-[11px] font-bold text-rose-600 mt-1">
                                            {Number(formData.price) >= 10000000
                                                ? `₹${(Number(formData.price) / 10000000).toFixed(2)} Crore`
                                                : `₹${(Number(formData.price) / 100000).toFixed(2)} Lakhs`}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Listed By
                                    </label>
                                    <select
                                        name="listed_by"
                                        value={formData.listed_by}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900 bg-white"
                                    >
                                        <option value="owner">Direct Owner (₹0 Free)</option>
                                        <option value="broker">Verified Agent / Broker</option>
                                    </select>
                                </div>

                                {formData.listed_by === 'broker' && (
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Brokerage / Service Fee
                                        </label>
                                        <input
                                            type="text"
                                            name="brokerage_fee"
                                            placeholder={formData.purpose === 'sell' ? 'e.g. 1% to 2%' : 'e.g. 15 Days Rent'}
                                            value={formData.brokerage_fee}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold text-slate-900"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* PG/Hostel Occupancy sharing options */}
                            {formData.purpose === 'rent' && (formData.type === 'PG' || formData.type === 'Room') && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                        Occupancy Types & Rent
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['single', 'double', 'triple', 'four'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggleOccupancy(type)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                                                    formData.occupancy.includes(type)
                                                        ? 'bg-rose-500 text-white border-rose-500'
                                                        : 'bg-white text-slate-700 border-slate-200'
                                                }`}
                                            >
                                                {type} Sharing
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        {formData.occupancy.map(type => (
                                            <div key={type} className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-700 capitalize w-24">{type} Rent:</span>
                                                <input
                                                    type="number"
                                                    placeholder="₹ / month"
                                                    value={formData.occupancy_pricing[type] || ''}
                                                    onChange={(e) => handlePriceForOccupancy(type, e.target.value)}
                                                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Photo Upload with Live Previews */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Camera size={16} className="text-rose-500" /> 3. Property Photos ({formData.images.length})
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(!showUrlInput)}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                                >
                                    {showUrlInput ? 'Cancel' : '+ Add Image URL'}
                                </button>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {/* Drop / Click Upload Box */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-rose-200 hover:border-rose-500 rounded-3xl p-6 sm:p-8 text-center bg-rose-50/20 hover:bg-rose-50/40 transition-all cursor-pointer group"
                            >
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-rose-100 text-rose-500 group-hover:scale-110 transition-transform">
                                    <Upload size={24} />
                                </div>
                                <p className="text-sm font-bold text-slate-800">
                                    {uploadingPhotos ? 'Optimizing & uploading photos...' : 'Tap to Upload Photos from Phone Gallery or Camera'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    JPEG, PNG, WebP supported. High resolution photos attract 3x more inquiries!
                                </p>
                            </div>

                            {/* Manual URL input fallback */}
                            {showUrlInput && (
                                <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <input
                                        type="url"
                                        placeholder="Paste image link (e.g. https://...)"
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomUrl}
                                        className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            {/* One-click Sample Photo Presets */}
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                    Or tap to quickly add verified sample photos:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {SAMPLE_PHOTOS.map((sample) => (
                                        <button
                                            key={sample.name}
                                            type="button"
                                            onClick={() => handleAddPresetPhoto(sample.url)}
                                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-rose-400 hover:text-rose-600 bg-white transition-all flex items-center gap-1.5 shadow-2xs"
                                        >
                                            <Plus size={13} className="text-rose-500" />
                                            <span>{sample.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Live Thumbnail Grid */}
                            {formData.images.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-xs font-extrabold text-slate-700">Uploaded Photos ({formData.images.length}):</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {formData.images.map((imgUrl, index) => (
                                            <div
                                                key={index}
                                                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-xs"
                                            >
                                                <img
                                                    src={imgUrl}
                                                    alt={`Upload ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Cover badge on index 0 */}
                                                {index === 0 && (
                                                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                                        <Star size={10} className="fill-white" /> Cover
                                                    </span>
                                                )}

                                                {/* Overlay actions */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    {index !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetCoverPhoto(index)}
                                                            className="p-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-rose-50 hover:text-rose-600"
                                                            title="Set as Main Cover Photo"
                                                        >
                                                            Make Cover
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePhoto(index)}
                                                        className="p-1.5 bg-rose-500 text-white rounded-lg text-xs hover:bg-rose-600"
                                                        title="Delete Photo"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Location & Map Pin */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={16} className="text-rose-500" /> 4. Location & Map Pin
                                </h2>
                                <button
                                    type="button"
                                    onClick={useCurrentLocation}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                                >
                                    <Locate size={14} /> Auto-detect My GPS
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="location"
                                    required
                                    placeholder="e.g. GH 07, Crossings Republik, Ghaziabad"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold text-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={searchAddressOnMap}
                                    className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-all shrink-0"
                                >
                                    <Search size={14} /> Find on Map
                                </button>
                            </div>

                            {/* Interactive Leaflet Map */}
                            <div className="rounded-2xl overflow-hidden border border-slate-200">
                                <PropertyMap
                                    position={{
                                        lat: parseFloat(formData.latitude) || 28.6139,
                                        lng: parseFloat(formData.longitude) || 77.4273
                                    }}
                                    onLocationChange={handleLocationChange}
                                    editable={true}
                                />
                            </div>
                        </div>

                        {/* 5. Amenities & Facilities */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                5. Amenities & Facilities
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                {amenityOptions.map((amenity) => {
                                    const selected = formData.amenities.includes(amenity);
                                    return (
                                        <button
                                            key={amenity}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity)}
                                            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                selected
                                                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            {selected && <CheckCircle2 size={13} />}
                                            <span>{amenity}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 6. Description */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                6. Detailed Description
                            </h2>
                            <textarea
                                name="description"
                                rows="4"
                                placeholder="Describe the flat, tower, floor, balcony view, nearby markets, colleges, and any special features..."
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-medium text-slate-900"
                            ></textarea>
                        </div>

                        {/* 7. Direct Contact Details */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Users size={16} className="text-rose-500" /> 7. Contact for Inquiries
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Calling Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        required
                                        placeholder="e.g. +91 98765 43210"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        WhatsApp Number (for direct chat)
                                    </label>
                                    <input
                                        type="tel"
                                        name="whatsapp_number"
                                        placeholder="e.g. +91 98765 43210"
                                        value={formData.whatsapp_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading || uploadingPhotos}
                                className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Publish & Go Live Now</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddListing;
