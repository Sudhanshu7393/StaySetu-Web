import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION, parseJsonField } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, Upload, MapPin, IndianRupee, Home,
    CheckCircle2, AlertCircle, Save, X, Plus, Locate, Search,
    Building2, Users, Image as ImageIcon, Camera, Trash2, Star, Sparkles
} from 'lucide-react';
import PropertyMap from '../../components/common/PropertyMap';

// High-quality verified sample photos
const SAMPLE_PHOTOS = [
    { name: 'Society Highrise', url: '/properties/crossings/crossings_republik_towers.jpg' },
    { name: 'Balcony View', url: '/properties/crossings/indian_tower_balconies.jpg' },
    { name: 'Drawing Room', url: '/properties/crossings/indian_drawing_room.jpg' },
    { name: 'Bedroom', url: '/properties/crossings/indian_bedroom.jpg' },
];

// Client-side image compression
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

const EditListing = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [customUrl, setCustomUrl] = useState('');

    const [formData, setFormData] = useState({
        purpose: 'rent',
        title: '',
        description: '',
        price: '',
        area: '',
        society: '',
        ownership: 'Freehold',
        possession: 'Ready to Move',
        bedrooms: '2',
        type: 'Flat',
        furnishing: 'Semi-Furnished',
        location: '',
        latitude: '28.6139',
        longitude: '77.4273',
        gender_preference: 'any',
        phone_number: '',
        whatsapp_number: '',
        amenities: [],
        images: [],
        listed_by: 'owner',
        brokerage_fee: '₹0 (Direct Owner - Free)',
        occupancy: ['single'],
        occupancy_pricing: { single: '' },
        association: '',
        nearbyCollege: ''
    });

    const amenityOptions = ['WiFi', 'AC', 'Food', 'Parking', 'Power Backup', 'Lift', 'Security', 'Gym', 'Attached Bath', 'Balcony'];

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const data = await databases.getDocument(DATABASE_ID, COLLECTION.listings, id);
                if (data) {
                    const amenities = parseJsonField(data.amenities);
                    const images = parseJsonField(data.images);
                    const rawOccupancy = parseJsonField(data.occupancy);
                    const normalizedOccupancy = [];
                    const pricingMap = {};

                    (rawOccupancy.length ? rawOccupancy : ['single']).forEach(item => {
                        if (typeof item === 'object' && item !== null) {
                            normalizedOccupancy.push(item.type);
                            pricingMap[item.type] = item.price || '';
                        } else {
                            normalizedOccupancy.push(item);
                            pricingMap[item] = '';
                        }
                    });

                    setFormData({
                        purpose: data.purpose || (Number(data.price) > 500000 ? 'sell' : 'rent'),
                        title: data.title || '',
                        description: data.description || '',
                        price: data.price ? data.price.toString() : '',
                        area: data.area || '',
                        society: data.society || data.association || '',
                        ownership: data.ownership || 'Freehold',
                        possession: data.possession || 'Ready to Move',
                        bedrooms: data.bedrooms ? data.bedrooms.toString() : '2',
                        location: data.location || '',
                        latitude: data.latitude ? data.latitude.toString() : '28.6139',
                        longitude: data.longitude ? data.longitude.toString() : '77.4273',
                        type: data.type || (data.purpose === 'sell' ? 'Flat' : 'Flat'),
                        furnishing: data.furnishing || 'Semi-Furnished',
                        phone_number: data.phoneNumber || data.ownerPhone || data.owner_phone || '',
                        whatsapp_number: data.whatsappNumber || data.whatsapp_number || '',
                        amenities: amenities,
                        images: images.length > 0 ? images : [],
                        listed_by: data.listedBy || data.listed_by || 'owner',
                        brokerage_fee: data.brokerageFee || data.brokerage_fee || (data.listedBy === 'broker' ? '15 Days Rent' : '₹0 (Direct Owner)'),
                        occupancy: normalizedOccupancy,
                        occupancy_pricing: pricingMap,
                        gender_preference: data.genderPreference || data.gender_preference || 'any',
                        association: data.society || data.association || '',
                        nearbyCollege: data.nearbyCollege || ''
                    });
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load listing for editing.');
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [id]);

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
            setError('Failed to process one or more images.');
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
                }
            },
            (err) => {
                setError('Unable to retrieve location.');
                console.error(err);
            }
        );
    };

    const searchAddressOnMap = async () => {
        if (!formData.location || formData.location.trim().length < 4) {
            setError('Please enter a location to search on the map.');
            return;
        }

        try {
            const query = encodeURIComponent(formData.location);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                handleLocationChange(parseFloat(lat), parseFloat(lon));
            } else {
                setError('Could not pin address automatically. Please tap map to pin.');
            }
        } catch (err) {
            console.error(err);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (!user) throw new Error('You must be logged in to edit a listing');

            let finalImages = [...formData.images].filter(Boolean);
            if (finalImages.length === 0) {
                finalImages = [SAMPLE_PHOTOS[0].url];
            }

            const occupancyData = formData.occupancy.map(type => ({
                type,
                price: parseFloat(formData.occupancy_pricing[type]) || parseFloat(formData.price) || 0
            }));

            const mainPrice = parseFloat(formData.price) || 0;

            await databases.updateDocument(DATABASE_ID, COLLECTION.listings, id, {
                purpose: formData.purpose || 'rent',
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: mainPrice,
                area: formData.area || '',
                society: formData.society || formData.association || '',
                ownership: formData.ownership || 'Freehold',
                possession: formData.possession || 'Ready to Move',
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                location: formData.location.trim(),
                latitude: formData.latitude,
                longitude: formData.longitude,
                type: formData.type,
                furnishing: formData.furnishing || 'Semi-Furnished',
                phoneNumber: formData.phone_number,
                whatsappNumber: formData.whatsapp_number,
                owner_phone: formData.phone_number,
                amenities: formData.amenities,
                images: finalImages,
                genderPreference: formData.gender_preference || 'any',
                listedBy: formData.listed_by || 'owner',
                brokerageFee: (formData.brokerage_fee && formData.brokerage_fee.trim() !== '') ? formData.brokerage_fee : '₹0',
                occupancy: occupancyData,
                association: formData.society || formData.association || '',
                nearbyCollege: formData.nearbyCollege || '',
                status: 'approved',
                updatedAt: new Date().toISOString(),
            });

            setSuccess(true);
            setTimeout(() => navigate(`/property/${id}`), 1200);
        } catch (err) {
            setError(err.message || 'Failed to update listing.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

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
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    Edit Property Listing
                                </h1>
                                <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
                                    Update details, photos, and pricing for this property.
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
                        
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                <span className="font-semibold">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm">
                                <CheckCircle2 size={20} className="shrink-0" />
                                <span className="font-bold">Property updated successfully! Redirecting...</span>
                            </div>
                        )}

                        {/* Basic Details */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Home size={16} className="text-rose-500" /> Basic Details
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Property Type
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
                                        <option value="5">5+ BHK</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Society / Building Name
                                    </label>
                                    <input
                                        type="text"
                                        name="society"
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
                                        value={formData.area}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <IndianRupee size={16} className="text-rose-500" /> Pricing
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        {formData.purpose === 'sell' ? 'Total Price (₹) *' : 'Monthly Rent (₹) *'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            name="price"
                                            required
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900"
                                        />
                                    </div>
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
                            </div>
                        </div>

                        {/* Photos */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Camera size={16} className="text-rose-500" /> Photos ({formData.images.length})
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(!showUrlInput)}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-700"
                                >
                                    {showUrlInput ? 'Cancel' : '+ Add Image URL'}
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-rose-200 hover:border-rose-500 rounded-3xl p-6 text-center bg-rose-50/20 hover:bg-rose-50/40 transition-all cursor-pointer"
                            >
                                <Upload size={24} className="mx-auto mb-2 text-rose-500" />
                                <p className="text-sm font-bold text-slate-800">
                                    {uploadingPhotos ? 'Optimizing & adding photos...' : 'Tap to Upload More Photos from Gallery or Camera'}
                                </p>
                            </div>

                            {showUrlInput && (
                                <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <input
                                        type="url"
                                        placeholder="Paste image URL (https://...)"
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomUrl}
                                        className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            {/* Preset Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {SAMPLE_PHOTOS.map((sample) => (
                                    <button
                                        key={sample.name}
                                        type="button"
                                        onClick={() => handleAddPresetPhoto(sample.url)}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-rose-400 bg-white flex items-center gap-1.5"
                                    >
                                        <Plus size={13} className="text-rose-500" />
                                        <span>{sample.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Grid of uploaded images */}
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {formData.images.map((imgUrl, index) => (
                                        <div
                                            key={index}
                                            className="group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-xs"
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`Photo ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {index === 0 && (
                                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <Star size={10} className="fill-white" /> Cover
                                                </span>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                {index !== 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetCoverPhoto(index)}
                                                        className="p-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold"
                                                    >
                                                        Cover
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePhoto(index)}
                                                    className="p-1.5 bg-rose-500 text-white rounded-lg text-xs"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={16} className="text-rose-500" /> Location
                                </h2>
                                <button
                                    type="button"
                                    onClick={useCurrentLocation}
                                    className="text-xs font-bold text-rose-600 flex items-center gap-1"
                                >
                                    <Locate size={14} /> Auto-detect GPS
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="location"
                                    required
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold text-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={searchAddressOnMap}
                                    className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-all shrink-0"
                                >
                                    <Search size={14} /> Find
                                </button>
                            </div>

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

                        {/* Amenities */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                Amenities
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

                        {/* Description */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                Description
                            </h2>
                            <textarea
                                name="description"
                                rows="4"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-medium text-slate-900"
                            ></textarea>
                        </div>

                        {/* Contact */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Users size={16} className="text-rose-500" /> Contact Numbers
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
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        WhatsApp Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="whatsapp_number"
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
                                disabled={saving || uploadingPhotos}
                                className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Save Changes & View Property</span>
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

export default EditListing;
