import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION, ID } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, Upload, MapPin, IndianRupee, Home,
    CheckCircle2, AlertCircle, Save, X, Plus, Locate, Search, Building2, Users
} from 'lucide-react';
import PropertyMap from '../../components/common/PropertyMap';

const AddListing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        purpose: 'rent', // 'rent' | 'sell'
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
        gender_preference: 'any',
        phone_number: '',
        whatsapp_number: '',
        amenities: [],
        images: [''], // Array of image URLs
        listed_by: 'owner', // owner or broker
        brokerage_fee: '₹0 (Zero Brokerage - Free)',
        occupancy: ['single'],
        occupancy_pricing: { single: '' },
        association: '',
        nearbyCollege: ''
    });

    const amenityOptions = ['WiFi', 'AC', 'Food', 'Parking', 'Laundry', 'Security', 'Gym', 'Attached Bath'];

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
        if (!formData.location || formData.location.trim().length < 5) {
            setError('Please enter a more specific address to search on the map.');
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
                setError('Could not find this address on the map. Please pin it manually.');
            }
        } catch (err) {
            setError('Error searching address. Please try pinning manually.');
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
        setLoading(true);
        setError(null);

        try {
            if (!user) throw new Error('You must be logged in to add a listing');

            const imageUrls = formData.images.filter(url => url.trim());

            const occupancyData = formData.occupancy.map(type => ({
                type,
                price: parseFloat(formData.occupancy_pricing[type]) || parseFloat(formData.price) || 0
            }));

            // Main price for search is the lowest available
            const mainPrice = Math.min(...occupancyData.map(o => o.price).filter(p => p > 0)) || parseFloat(formData.price) || 0;

            await databases.createDocument(DATABASE_ID, COLLECTION.listings, ID.unique(), {
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
                ownerId: user.$id,
                status: 'pending',
                genderPreference: formData.gender_preference || 'any',
                listedBy: formData.listed_by || 'owner',
                brokerageFee: (formData.brokerage_fee && formData.brokerage_fee.trim() !== '') ? formData.brokerage_fee : (formData.listed_by === 'broker' ? (formData.purpose === 'sell' ? '1% - 2%' : '15 Days Rent') : '₹0'),
                brokerage_fee: (formData.brokerage_fee && formData.brokerage_fee.trim() !== '') ? formData.brokerage_fee : (formData.listed_by === 'broker' ? (formData.purpose === 'sell' ? '1% - 2%' : '15 Days Rent') : '₹0'),
                occupancy: JSON.stringify(occupancyData),
                association: formData.association || '',
                nearbyCollege: formData.nearbyCollege || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-slate-600 hover:text-plum-500 font-bold mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </button>

                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-premium overflow-hidden border border-slate-100">
                    <div className="p-5 sm:p-8 md:p-12 border-b border-slate-50">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Add New Property</h1>
                        <p className="text-slate-500 font-medium tracking-tight text-xs sm:text-sm">Provide detailed information about your stay to attract students.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-8 md:p-12 space-y-8 sm:space-y-10">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <p className="text-sm text-red-600 font-medium">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start space-x-3 font-bold text-green-600">
                                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                                <p>Listing submitted successfully! Waiting for admin approval.</p>
                            </div>
                        )}

                        {/* 100% Free Guarantee Banner */}
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                            <div>
                                <strong className="font-bold">100% Free Listing:</strong> StaySetu charges ₹0 listing fees and takes 0% commission. Verified students connect directly with your WhatsApp!
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Purpose Switcher: Rent vs Sell */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">What do you want to do?</label>
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, purpose: 'rent', type: 'PG' }))}
                                            className={`flex-1 py-3.5 sm:py-4 rounded-2xl border-2 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 ${formData.purpose === 'rent'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                                                : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            <span>🏠 Rent Out (किराए पर देना है)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, purpose: 'sell', type: 'Flat' }))}
                                            className={`flex-1 py-3.5 sm:py-4 rounded-2xl border-2 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 ${formData.purpose === 'sell'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                                                : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            <span>🏷️ Sell Property (प्रॉपर्टी बेचनी है)</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Are you an Owner or a Broker?</label>
                                    <div className="flex gap-3 sm:gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, listed_by: 'owner' }))}
                                            className={`flex-1 py-3 sm:py-3.5 rounded-2xl border-2 transition-all font-bold text-xs sm:text-sm ${formData.listed_by === 'owner'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            Owner
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, listed_by: 'broker' }))}
                                            className={`flex-1 py-3 sm:py-3.5 rounded-2xl border-2 transition-all font-bold text-xs sm:text-sm ${formData.listed_by === 'broker'
                                                ? 'border-rose-500 bg-rose-50 text-rose-700'
                                                : 'border-slate-100 text-slate-500 hover:border-slate-200 bg-white'
                                                }`}
                                        >
                                            Broker
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-2 p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl animate-fade-in">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider">
                                            {formData.listed_by === 'broker' ? 'Disclosed Broker Fee / Commission' : 'Brokerage Fee (Optional - Defaults to ₹0)'}
                                        </label>
                                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${formData.listed_by === 'broker' ? 'text-amber-800 bg-amber-100' : 'text-emerald-800 bg-emerald-100'}`}>
                                            {formData.listed_by === 'broker' ? 'Transparent Brokerage' : '₹0 Brokerage Default'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 mb-3 font-medium">
                                        Agar aap koi brokerage fee lete hain toh yahan bharein. Agar nahi lete toh khali chhod dein (clients ko ₹0 show hoga).
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {[
                                            '₹0 (Zero Brokerage)',
                                            ...(formData.purpose === 'sell' 
                                                ? ['1% Deal Value', '2% Deal Value', '₹25,000 Flat']
                                                : ['15 Days Rent', '1 Month Rent', '₹5,000 Flat'])
                                        ].map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, brokerage_fee: opt }))}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                    formData.brokerage_fee === opt
                                                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
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
                                        placeholder="Brokerage fee e.g. ₹0 or 15 Days Rent"
                                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Property Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        placeholder={
                                            formData.purpose === 'sell'
                                                ? "e.g. 3 BHK Luxury Flat in Gomti Nagar Extension"
                                                : "e.g. Modern Boys PG near Knowledge Park"
                                        }
                                        className="input-field"
                                        value={formData.title}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Property Type</label>
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
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Super Built-up Area</label>
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
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Bedrooms (BHK)</label>
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
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Ownership Title</label>
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
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Possession Status</label>
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
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Gender Preference</label>
                                            <select
                                                name="gender_preference"
                                                className="input-field cursor-pointer"
                                                value={formData.gender_preference}
                                                onChange={handleChange}
                                            >
                                                <option value="any">Any (Co-living)</option>
                                                <option value="boys">Boys Only</option>
                                                <option value="girls">Girls Only</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Foundation / Association Name</label>
                                            <div className="relative">
                                                <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" name="association" placeholder="e.g. Crossings Republik / Delhi NCR PG Association"
                                                    className="input-field pl-10" value={formData.association} onChange={handleChange} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Nearby College / Landmark</label>
                                            <div className="relative">
                                                <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" name="nearbyCollege" placeholder="e.g. ABES EC, IMS Ghaziabad, AKGEC"
                                                    className="input-field pl-10" value={formData.nearbyCollege} onChange={handleChange} />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Room Occupancy</label>
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
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
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
                                            : (formData.type === 'Hostel' ? '* If prices not specified above, this default price will be used.' : '')}
                                    </p>
                                </div>

                                {formData.type === 'Hostel' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Set Prices for Selected Room Types</label>
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
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Pin Precise Location on Map</label>
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
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Description</label>
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
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-plum-100 text-plum-600 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                                Amenities & Facilities
                            </h3>
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

                        {/* Photos */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-plum-100 text-plum-600 rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
                                Property Photos & Videos (URLs)
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Paste image or video URLs from the web (Unsplash, etc.)</p>
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
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-plum-100 text-plum-600 rounded-lg flex items-center justify-center mr-3 text-sm">4</span>
                                Contact Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Phone Number</label>
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
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">WhatsApp Number</label>
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
                                disabled={loading}
                                className="flex-1 btn-primary py-5 rounded-2xl text-lg flex items-center justify-center space-x-3 shadow-premium"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Submit Listing for Approval</span>
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

export default AddListing;
