import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, MapPin, IndianRupee, Save, X, Plus,
    AlertCircle, CheckCircle2, Locate, Search
} from 'lucide-react';
import PropertyMap from '../../components/common/PropertyMap';

const EditListing = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        purpose: 'rent',
        title: '',
        description: '',
        price: '',
        area: '',
        ownership: 'Freehold',
        possession: 'Ready to Move',
        bedrooms: '',
        location: '',
        latitude: '',
        longitude: '',
        type: 'PG',
        phone_number: '',
        whatsapp_number: '',
        amenities: [],
        images: [''],
        listed_by: 'owner',
        brokerage_fee: '15 Days Rent',
        occupancy: [],
        occupancy_pricing: {},
        association: '',
        nearbyCollege: ''
    });

    const amenityOptions = ['WiFi', 'AC', 'Food', 'Parking', 'Laundry', 'Security', 'Gym', 'Attached Bath'];

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const data = await databases.getDocument(DATABASE_ID, COLLECTION.listings, id);
                if (data) {
                    const amenities = typeof data.amenities === 'string' ? JSON.parse(data.amenities) : (data.amenities || []);
                    const images = typeof data.images === 'string' ? JSON.parse(data.images) : (data.images || ['']);
                    const rawOccupancy = data.occupancy ? JSON.parse(data.occupancy) : ['single'];
                    const normalizedOccupancy = [];
                    const pricingMap = {};

                    rawOccupancy.forEach(item => {
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
                        ownership: data.ownership || 'Freehold',
                        possession: data.possession || 'Ready to Move',
                        bedrooms: data.bedrooms ? data.bedrooms.toString() : '',
                        location: data.location || '',
                        latitude: data.latitude || '',
                        longitude: data.longitude || '',
                        type: data.type || 'PG',
                        phone_number: data.phoneNumber || '',
                        whatsapp_number: data.whatsappNumber || '',
                        amenities: amenities,
                        images: images.length > 0 ? images : [''],
                        listed_by: data.listedBy || 'owner',
                        brokerage_fee: data.brokerageFee || data.brokerage_fee || (data.purpose === 'sell' ? '1% - 2%' : '15 Days Rent'),
                        occupancy: normalizedOccupancy,
                        occupancy_pricing: pricingMap,
                        gender_preference: data.genderPreference || 'any',
                        association: data.association || '',
                        nearbyCollege: data.nearbyCollege || ''
                    });
                }
            } catch (err) {
                console.error('Fetch error:', err);
            }
            setLoading(false);
        };

        fetchListing();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = (lat, lng) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
        }));
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setSaving(true);
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
                    setSaving(false);
                }
            },
            (err) => {
                setError('Unable to retrieve your location. Please ensure location services are enabled.');
                console.error(err);
                setSaving(false);
            }
        );
    };

    const searchAddressOnMap = async () => {
        if (!formData.location || formData.location.trim().length < 5) {
            setError('Please enter a more specific address to search on the map.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const query = encodeURIComponent(formData.location);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                handleLocationChange(parseFloat(lat), parseFloat(lon));
            } else {
                setError('Could not find this address on the map. Please pin it manually.');
            }
        } catch (err) {
            setError('Error searching address. Please try pinning manually.');
            console.error(err);
        } finally {
            setSaving(false);
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
            
            // Sync pricing object
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

    const handleImageUrlChange = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const addImageField = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
    };

    const removeImageField = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (!user) throw new Error('You must be logged in to edit a listing');

            const imageUrls = formData.images.filter(url => url && url.trim());

            const occupancyData = formData.occupancy.map(type => ({
                type,
                price: parseFloat(formData.occupancy_pricing[type]) || parseFloat(formData.price) || 0
            }));

            // Main price for search is the lowest available
            const mainPrice = Math.min(...occupancyData.map(o => o.price).filter(p => p > 0)) || parseFloat(formData.price) || 0;

            await databases.updateDocument(DATABASE_ID, COLLECTION.listings, id, {
                purpose: formData.purpose || 'rent',
                title: formData.title,
                description: formData.description,
                price: mainPrice,
                area: formData.area || '',
                ownership: formData.ownership || 'Freehold',
                possession: formData.possession || 'Ready to Move',
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                location: formData.location,
                latitude: formData.latitude,
                longitude: formData.longitude,
                type: formData.type,
                phoneNumber: formData.phone_number,
                whatsappNumber: formData.whatsapp_number,
                amenities: JSON.stringify(formData.amenities),
                images: JSON.stringify(imageUrls),
                genderPreference: formData.gender_preference || 'any',
                listedBy: formData.listed_by || 'owner',
                brokerageFee: formData.listed_by === 'broker' ? (formData.brokerage_fee || (formData.purpose === 'sell' ? '1% - 2%' : '15 Days Rent')) : '₹0 (Direct Owner)',
                brokerage_fee: formData.listed_by === 'broker' ? (formData.brokerage_fee || (formData.purpose === 'sell' ? '1% - 2%' : '15 Days Rent')) : '₹0 (Direct Owner)',
                occupancy: JSON.stringify(occupancyData),
                association: formData.association || '',
                nearbyCollege: formData.nearbyCollege || '',
                updatedAt: new Date().toISOString(),
            });

            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-plum-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-slate-600 hover:text-plum-500 font-bold mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-premium overflow-hidden border border-slate-100">
                    <div className="p-8 md:p-12 border-b border-slate-50">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Edit Property</h1>
                        <p className="text-slate-500 font-medium tracking-tight">Update your property details to keep information accurate.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <p className="text-sm text-red-600 font-medium">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start space-x-3 font-bold text-green-600">
                                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                                <p>Listing updated successfully!</p>
                            </div>
                        )}

                        {/* Basic Info */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 font-black uppercase tracking-widest text-[10px] text-rose-500">Step 1 — Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Purpose Switcher: Rent vs Sell */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Listing Purpose</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, purpose: 'rent', type: 'PG' }))}
                                            className={`flex-1 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2 ${formData.purpose === 'rent'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                                                : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            <span>🏠 Rent Out (किराया)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, purpose: 'sell', type: 'Flat' }))}
                                            className={`flex-1 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2 ${formData.purpose === 'sell'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                                                : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            <span>🏷️ Sell Property (बेचना)</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Are you an Owner or a Broker?</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, listed_by: 'owner' }))}
                                            className={`flex-1 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm ${formData.listed_by === 'owner'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            Owner
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, listed_by: 'broker' }))}
                                            className={`flex-1 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm ${formData.listed_by === 'broker'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            Broker
                                        </button>
                                    </div>
                                </div>

                                {formData.listed_by === 'broker' && (
                                    <div className="md:col-span-2 p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl animate-fade-in">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <label className="block text-sm font-black text-amber-950 uppercase tracking-wider">
                                                Disclosed Broker Fee / Commission *
                                            </label>
                                            <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                                                Transparent Pricing
                                            </span>
                                        </div>
                                        <p className="text-xs text-amber-800/80 mb-3 font-medium">
                                            Students aur clients ko hidden surprise na mile, isliye aapka broker fee upfront transparently show hoga.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {(formData.purpose === 'sell' 
                                                ? ['1% Deal Value', '2% Deal Value', '1.5% Deal Value', '₹25,000 Flat']
                                                : ['15 Days Rent', '1 Month Rent', '₹5,000 Flat', '₹2,500 Flat']
                                            ).map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, brokerage_fee: opt }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                        formData.brokerage_fee === opt
                                                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                                            : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400'
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            name="brokerage_fee"
                                            value={formData.brokerage_fee}
                                            onChange={handleChange}
                                            placeholder="Custom brokerage e.g. 15 Days Rent or 1% Deal Value"
                                            className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            required={formData.listed_by === 'broker'}
                                        />
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Property Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        placeholder={formData.purpose === 'sell' ? "e.g. 3 BHK Luxury Apartment in Crossings Republik" : "e.g. Modern Girls PG near ABES College"}
                                        className="input-field"
                                        value={formData.title}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Property Type</label>
                                    <select
                                        name="type"
                                        className="input-field cursor-pointer"
                                        value={formData.type}
                                        onChange={handleChange}
                                    >
                                        {formData.purpose === 'sell' ? (
                                            <>
                                                <option value="Flat">Flat / Apartment</option>
                                                <option value="House/Villa">Independent Villa / Kothi</option>
                                                <option value="Plot">Residential Plot</option>
                                                <option value="Studio">Studio Suite</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="PG">PG (Paying Guest)</option>
                                                <option value="Flat">Flat / Apartment</option>
                                                <option value="Hostel">Hostel</option>
                                                <option value="Studio">Studio Flat</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {formData.purpose === 'sell' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Super Built-up Area</label>
                                            <input
                                                type="text"
                                                name="area"
                                                placeholder="e.g. 1,580 sq.ft"
                                                className="input-field"
                                                value={formData.area}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bedrooms (BHK)</label>
                                            <input
                                                type="number"
                                                name="bedrooms"
                                                placeholder="e.g. 3"
                                                className="input-field"
                                                value={formData.bedrooms}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ownership Title</label>
                                            <select
                                                name="ownership"
                                                className="input-field cursor-pointer"
                                                value={formData.ownership}
                                                onChange={handleChange}
                                            >
                                                <option value="Freehold">Freehold Title</option>
                                                <option value="Leasehold">Leasehold</option>
                                                <option value="Power of Attorney">Power of Attorney</option>
                                                <option value="Co-operative Society">Co-operative Society</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Possession Status</label>
                                            <select
                                                name="possession"
                                                className="input-field cursor-pointer"
                                                value={formData.possession}
                                                onChange={handleChange}
                                            >
                                                <option value="Ready to Move">Ready to Move</option>
                                                <option value="Under Construction">Under Construction</option>
                                                <option value="Immediate Registry">Immediate Registry</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Foundation / Association Name</label>
                                            <input
                                                type="text"
                                                name="association"
                                                placeholder="e.g. Crossings Republik / Delhi NCR PG Association"
                                                className="input-field"
                                                value={formData.association}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Nearby College / Landmark</label>
                                            <input
                                                type="text"
                                                name="nearbyCollege"
                                                placeholder="e.g. ABES EC, IMS Ghaziabad, AKGEC"
                                                className="input-field"
                                                value={formData.nearbyCollege}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Room Occupancy</label>
                                            <div className="flex flex-wrap gap-4">
                                                {[
                                                    { id: 'single', label: 'Single' },
                                                    { id: 'double', label: 'Double Sharing' },
                                                    { id: 'triple', label: 'Triple Sharing' },
                                                    { id: 'four', label: 'Four Sharing' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => toggleOccupancy(opt.id)}
                                                        className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.occupancy.includes(opt.id)
                                                            ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                            : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        {formData.purpose === 'sell'
                                            ? 'Total Selling Price (₹)'
                                            : (formData.type === 'Hostel' ? 'Starting Price (Monthly Rent ₹)' : 'Monthly Rent (₹)')}
                                    </label>
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            name="price"
                                            required={formData.type !== 'Hostel'}
                                            placeholder={formData.purpose === 'sell' ? "6500000" : "8500"}
                                            className="input-field pl-10"
                                            value={formData.price}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                        {formData.purpose === 'sell'
                                            ? '* Enter total expected sale price in Rupees (e.g. 5000000 for 50 Lac)'
                                            : (formData.type === 'Hostel' ? '* Default price used if specific room prices aren\'t set.' : '')}
                                    </p>
                                </div>

                                {formData.type === 'Hostel' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Set Prices for Selected Room Types</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {formData.occupancy.map(type => (
                                                <div key={type} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                                    <span className="font-bold text-slate-700 text-xs uppercase">{type.replace('-', ' ')} Sharing</span>
                                                    <div className="relative w-32 shrink-0">
                                                        <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="number"
                                                            placeholder="Price"
                                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-sm font-bold focus:outline-none focus:border-plum-500"
                                                            value={formData.occupancy_pricing[type] || ''}
                                                            onChange={(e) => handlePriceForOccupancy(type, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <div className="flex gap-2 mb-6">
                                        <div className="relative flex-1">
                                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                name="location"
                                                required
                                                placeholder="e.g. Arihant Ambience, Crossings Republik, Ghaziabad"
                                                className="input-field pl-10"
                                                value={formData.location}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={searchAddressOnMap}
                                            className="px-6 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shrink-0"
                                        >
                                            <Search size={14} />
                                            <span className="hidden sm:inline">Find on Map</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Pin Precise Location on Map</label>
                                        <button
                                            type="button"
                                            onClick={useCurrentLocation}
                                            className="flex items-center gap-1.5 text-xs font-black text-plum-600 hover:text-plum-700 transition-colors uppercase tracking-widest"
                                        >
                                            <Locate size={14} />
                                            Use Live Location
                                        </button>
                                    </div>
                                    <PropertyMap
                                        isPicker={true}
                                        position={formData.latitude && formData.longitude ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } : null}
                                        onLocationChange={handleLocationChange}
                                    />
                                    {(formData.latitude && formData.longitude) ? (
                                        <p className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center">
                                            <Locate size={10} className="mr-1" /> Coordinates pinned: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-[11px] text-amber-600 font-bold flex items-center">
                                            <AlertCircle size={10} className="mr-1" /> Please click on the map to pin the exact property location
                                        </p>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        placeholder="Tell students about the rooms, food, environment etc..."
                                        className="input-field resize-none"
                                        value={formData.description}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 font-black uppercase tracking-widest text-[10px] text-plum-500">Step 2 — Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {amenityOptions.map(amenity => (
                                    <button
                                        key={amenity}
                                        type="button"
                                        onClick={() => toggleAmenity(amenity)}
                                        className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all font-bold text-sm ${formData.amenities.includes(amenity)
                                            ? 'border-plum-500 bg-plum-50 text-plum-700'
                                            : 'border-slate-50 text-slate-500 hover:border-slate-100'
                                            }`}
                                    >
                                        {amenity}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Photos & Videos */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 font-black uppercase tracking-widest text-[10px] text-plum-500">Step 3 — Photos & Videos</h3>
                            <div className="space-y-4">
                                {formData.images.map((url, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="url"
                                            placeholder="https://example.com/image.jpg"
                                            className="input-field"
                                            value={url}
                                            onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                        />
                                        {formData.images.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeImageField(index)}
                                                className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addImageField}
                                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 flex items-center justify-center space-x-2 hover:border-plum-300 hover:text-plum-500 transition-all font-bold"
                                >
                                    <Plus size={20} />
                                    <span>Add Another Media URL</span>
                                </button>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 font-black uppercase tracking-widest text-[10px] text-plum-500">Step 4 — Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        required
                                        placeholder="+91 XXXXX XXXXX"
                                        className="input-field"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">WhatsApp Number</label>
                                    <input
                                        type="tel"
                                        name="whatsapp_number"
                                        required
                                        placeholder="+91 XXXXX XXXXX"
                                        className="input-field"
                                        value={formData.whatsapp_number}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 btn-primary py-5 rounded-2xl text-lg flex items-center justify-center space-x-3 shadow-premium"
                            >
                                {saving ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn-secondary py-5 px-10 rounded-2xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditListing;
