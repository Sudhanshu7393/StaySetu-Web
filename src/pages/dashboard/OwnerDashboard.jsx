import React, { useState, useEffect, useRef } from 'react';
import { databases, storage, DATABASE_ID, COLLECTION, BUCKET_ID, Query, ID, parseJsonField, getImageUrl } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit2, Trash2, Eye,
    MapPin, IndianRupee, Clock, CheckCircle, AlertCircle,
    Home, TrendingUp, Users, ChevronRight, Star,
    BarChart3, ArrowUpRight, ArrowLeft, Upload,
    Save, X, User, LogOut, Shield, Briefcase,
    Phone, Send, Bell, Settings, Building2,
    ChevronLeft, MoreVertical, Filter, Locate, Brush, Loader2
} from 'lucide-react';
import PropertyMap from '../../components/common/PropertyMap';
import { formatPropertyPrice, getPropertyTypeLabel } from '../../lib/formatters';

const OwnerDashboard = () => {
    const { user, profile, signOut, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [roleUpdating, setRoleUpdating] = useState(false);
    const [roleSuccess, setRoleSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0, approved: 0, pending: 0, rented: 0, views: 0
    });
    const [incomingRequests, setIncomingRequests] = useState([]);

    // Add listing form state
    const [formData, setFormData] = useState({
        title: '', description: '', price: '',
        location: '', type: 'PG',
        phone_number: '', whatsapp_number: '',
        amenities: [], images: [''],
        gender_preference: 'any',
        occupancy: ['single'],
        deposit: '',
        available_from: '',
        latitude: '',
        longitude: '',
        listed_by: 'owner',
        brokerage_fee: '₹0 (Zero Brokerage - Free)',
        association: '',
        nearbyCollege: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(false);

    const amenityOptions = [
        'WiFi', 'AC', 'Food', 'Parking', 'Laundry',
        'Security', 'Gym', 'Attached Bath', 'Power Backup',
        'CCTV', 'Geyser', 'Fridge'
    ];

    const fetchIncomingRequests = React.useCallback(async () => {
        if (!user) return;
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION.roommateConnectRequests,
                [Query.equal('posterId', user.$id), Query.orderDesc('$createdAt')]
            );
            setIncomingRequests(res.documents);
        } catch (err) {
            console.error('Fetch incoming requests error:', err);
        }
    }, [user]);

    const fetchUserListings = React.useCallback(async () => {
        if (!user) return;
        try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION.listings, [
                Query.equal('ownerId', user.$id),
                Query.orderDesc('$createdAt'),
                Query.limit(100),
            ]);
            const data = res.documents;
            setListings(data);
            const total = data.length;
            const approved = data.filter(l => l.status === 'approved').length;
            const rented = data.filter(l => l.status === 'rented' || l.status === 'sold').length;
            const pending = total - approved - rented;
            const views = data.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);
            setStats(prev => ({ ...prev, total, approved, pending, rented, views }));
        } catch (err) {
            console.error('Fetch error:', err);
        }
    }, [user]);

    const fetchAllData = React.useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchUserListings(),
            fetchIncomingRequests()
        ]);
        setLoading(false);
    }, [fetchUserListings, fetchIncomingRequests]);

    useEffect(() => {
        if (user) fetchAllData();
    }, [user, fetchAllData]);


    const handleToggleRented = async (id, currentStatus) => {
        const isRentedOrSold = currentStatus === 'rented' || currentStatus === 'sold';
        const targetListing = listings.find(l => l.$id === id);
        const isSale = targetListing?.purpose === 'sell';
        const newStatus = isRentedOrSold ? 'approved' : (isSale ? 'sold' : 'rented');
        const confirmMsg = isRentedOrSold 
            ? 'Mark this property as available again?' 
            : (isSale ? 'Mark this property as sold out? It will remain visible but labeled as Sold.' : 'Mark this property as rented out? It will still be visible but labeled as rented.');

        if (window.confirm(confirmMsg)) {
            try {
                await databases.updateDocument(DATABASE_ID, COLLECTION.listings, id, {
                    status: newStatus
                });
                setListings(listings.map(l => l.$id === id ? { ...l, status: newStatus } : l));
                await fetchUserListings(); // Refresh stats
            } catch (err) {
                console.error('Update error:', err);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTION.listings, id);
                setListings(listings.filter(l => l.$id !== id));
                setStats(prev => ({
                    ...prev,
                    total: prev.total - 1,
                    approved: prev.approved - (listings.find(l => l.$id === id)?.status === 'approved' ? 1 : 0),
                    pending: prev.pending - (listings.find(l => l.$id === id)?.status !== 'approved' ? 1 : 0)
                }));
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    };

    // Form handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        setFormData(prev => ({
            ...prev,
            occupancy: prev.occupancy.includes(type)
                ? (prev.occupancy.length > 1 ? prev.occupancy.filter(o => o !== type) : prev.occupancy)
                : [...prev.occupancy, type]
        }));
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
            setFormError('Geolocation is not supported by your browser');
            return;
        }

        setFormLoading(true);
        setFormError(null);

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
                    setFormLoading(false);
                }
            },
            (err) => {
                setFormError('Unable to retrieve your location. Please ensure location services are enabled.');
                console.error(err);
                setFormLoading(false);
            }
        );
    };

    const searchAddressOnMap = async () => {
        if (!formData.location || formData.location.trim().length < 5) {
            setFormError('Please enter a more specific address to search on the map.');
            return;
        }

        setFormLoading(true);
        setFormError(null);

        try {
            const query = encodeURIComponent(formData.location);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                handleLocationChange(parseFloat(lat), parseFloat(lon));
            } else {
                setFormError('Could not find this address on the map. Please pin it manually.');
            }
        } catch (err) {
            setFormError('Error searching address. Please try pinning manually.');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const [uploadingImages, setUploadingImages] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const remaining = 8 - uploadedImages.length;
        const toUpload = files.slice(0, remaining);

        setUploadingImages(true);
        const newUploads = [];

        for (const file of toUpload) {
            try {
                const result = await storage.createFile(BUCKET_ID, ID.unique(), file);
                let url = result.url || result.viewUrl || getImageUrl(result.$id);
                if (file.type.startsWith('video/')) {
                    url += (url.includes('?') ? '&' : '?') + 'is_video=true';
                }
                newUploads.push({ url, name: file.name, fileId: result.$id, isVideo: file.type.startsWith('video/') });
            } catch (err) {
                console.error('Upload error:', err);
                alert(`Failed to upload ${file.name}: ${err.message}`);
            }
        }

        setUploadedImages(prev => [...prev, ...newUploads]);
        setUploadingImages(false);
        e.target.value = '';
    };

    const removeUploadedImage = (index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitListing = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);

        try {
            if (!user) throw new Error('You must be logged in to add a listing');

            const imageUrls = uploadedImages.map(img => img.url);

            await databases.createDocument(DATABASE_ID, COLLECTION.listings, ID.unique(), {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                location: formData.location,
                latitude: formData.latitude,
                longitude: formData.longitude,
                type: formData.type,
                phoneNumber: formData.phone_number,
                whatsappNumber: formData.whatsapp_number,
                amenities: JSON.stringify(formData.amenities),
                images: JSON.stringify(imageUrls.length > 0 ? imageUrls : []),
                ownerId: user.$id,
                listedBy: formData.listed_by || 'owner',
                brokerageFee: formData.listed_by === 'broker' ? (formData.brokerage_fee || '15 Days Rent') : '₹0 (Direct Owner)',
                brokerage_fee: formData.listed_by === 'broker' ? (formData.brokerage_fee || '15 Days Rent') : '₹0 (Direct Owner)',
                status: 'pending',
                genderPreference: formData.gender_preference || 'any',
                occupancy: JSON.stringify(formData.occupancy),
                deposit: formData.deposit || null,
                availableFrom: formData.available_from || null,
                association: formData.association || '',
                nearbyCollege: formData.nearbyCollege || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            setFormSuccess(true);
            setFormData({
                title: '', description: '', price: '',
                location: '', type: 'PG',
                phone_number: '', whatsapp_number: '',
                amenities: [], images: [''],
                gender_preference: 'any', occupancy: ['single'],
                deposit: '', available_from: '',
                latitude: '', longitude: '',
                listed_by: 'owner',
                brokerage_fee: '₹0 (Zero Brokerage - Free)',
                association: '',
                nearbyCollege: ''
            });
            setUploadedImages([]);

            await fetchUserListings();
            setTimeout(() => {
                setFormSuccess(false);
                setActiveTab('overview');
            }, 2500);

        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    // Maid service form state
    const [maidForm, setMaidForm] = useState({
        title: '', description: '', location: '', serviceType: 'all-in-one',
        timing: '', price: '', whatsappNumber: '', phoneNumber: '', genderPreference: 'any',
        image: null
    });
    const [maidImageFile, setMaidImageFile] = useState(null);
    const [maidImagePreview, setMaidImagePreview] = useState(null);
    const [maidFormLoading, setMaidFormLoading] = useState(false);

    const maidImageInputRef = useRef(null);

    const handleMaidChange = (e) => setMaidForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleMaidImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMaidImageFile(file);
            setMaidImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitMaid = async (e) => {
        e.preventDefault();
        setMaidFormLoading(true);
        try {
            let imageId = null;
            if (maidImageFile) {
                const uploadRes = await storage.createFile(BUCKET_ID, ID.unique(), maidImageFile);
                imageId = uploadRes.$id;
            }

            await databases.createDocument(DATABASE_ID, COLLECTION.maidServices, ID.unique(), {
                title: maidForm.title,
                description: maidForm.description,
                location: maidForm.location,
                serviceType: maidForm.serviceType,
                timing: maidForm.timing,
                price: maidForm.price ? parseFloat(maidForm.price) : null,
                whatsappNumber: maidForm.whatsappNumber,
                phoneNumber: maidForm.phoneNumber,
                postedBy: user.$id,
                posterName: profile?.fullName || profile?.name || 'Owner',
                genderPreference: maidForm.genderPreference,
                image: imageId,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
            alert('Maid service posted! It will be visible after admin approval.');
            setMaidForm({ title: '', description: '', location: '', serviceType: 'all-in-one', timing: '', price: '', whatsappNumber: '', phoneNumber: '', genderPreference: 'any', image: null });
            setMaidImageFile(null);
            setMaidImagePreview(null);
            setActiveTab('overview');
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setMaidFormLoading(false);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'rented', label: 'Rented Out', icon: CheckCircle, count: stats.rented },
        { id: 'add', label: 'Add Listing', icon: Plus },
        { id: 'maid', label: 'Post Maid', icon: Brush },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-normal text-sm">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8 pt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 20px -4px rgba(59,130,246,0.3)' }}>
                                    <Building2 size={22} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                                        Owner Dashboard
                                    </h1>
                                    <p className="text-slate-400 font-normal text-sm">
                                        Welcome, {profile?.name || 'Owner'}. Manage your properties & inquiries.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setActiveTab('add')}
                            className="btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm"
                        >
                            <Plus size={16} />
                            <span>Add New Property</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total, icon: Home, gradient: 'from-blue-950 to-blue-600' },
                        { label: 'Live', value: stats.approved, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-600' },
                        { label: 'Rented', value: stats.rented, icon: Building2, gradient: 'from-indigo-500 to-blue-600' },
                        { label: 'Views', value: stats.views, icon: Eye, gradient: 'from-blue-500 to-purple-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-3xl p-5 flex flex-col gap-2 border border-slate-200 shadow-sm">
                            <div className={`bg-gradient-to-br ${stat.gradient} w-10 h-10 rounded-xl flex items-center justify-center text-white`}
                                style={{ boxShadow: '0 4px 12px -2px rgba(0,0,0,0.1)' }}>
                                <stat.icon size={18} />
                            </div>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="bg-slate-50 rounded-2xl p-1.5 border border-slate-200 shadow-sm mb-8 flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-blue-500 text-white'
                                : 'text-slate-400 hover:bg-white hover:text-slate-900'
                                }`}
                            style={activeTab === tab.id ? { boxShadow: '0 4px 14px -2px rgba(59,130,246,0.35)' } : {}}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Incoming Roommate Requests */}
                {incomingRequests.length > 0 && (
                    <div className="mb-10 animate-fade-in">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                                {incomingRequests.length}
                            </div>
                            <h3 className="text-lg font-black text-slate-900">Interest Requests Received</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {incomingRequests.map((request) => (
                                <div key={request.$id} className="bg-white border-2 border-emerald-100 rounded-[2rem] p-6 shadow-sm shadow-emerald-50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black">
                                                {request.requesterName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{request.requesterName}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{timeAgo(request.$createdAt)}</p>
                                            </div>
                                        </div>
                                        <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 italic">Interested</span>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Interested in Post</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{request.postLocation || 'Roommate Post'}</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {request.requesterPhone && !request.requesterPhone.includes('@') ? (
                                            <>
                                                <a
                                                    href={`tel:${request.requesterPhone}`}
                                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-xl text-xs hover:bg-slate-800 transition-all shadow-md shadow-slate-100"
                                                >
                                                    <Phone size={14} /> Call: {request.requesterPhone}
                                                </a>
                                                <a
                                                    href={`https://wa.me/${request.requesterPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${request.requesterName}, I saw your interest in my roommate requirement on StaySetu!`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl text-xs hover:bg-[#128C7E] transition-all shadow-md shadow-green-50"
                                                >
                                                    <MessageCircle size={14} /> WhatsApp
                                                </a>
                                            </>
                                        ) : (
                                            <a
                                                href={`mailto:${request.requesterPhone}`}
                                                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-xl text-xs hover:bg-slate-800 transition-all shadow-md shadow-slate-100"
                                            >
                                                <Mail size={14} /> Email: {request.requesterPhone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== OVERVIEW TAB ===== */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in">
                        <div className="card-elevated overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Your Properties</h3>
                                    <p className="text-slate-400 text-sm font-normal">Manage and track all your listed stays.</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-100 transition-all"
                                >
                                    <Plus size={16} />
                                    Add Property
                                </button>
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Property</th>
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type & Purpose</th>
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Price / Rent</th>
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Views</th>
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {listings.filter(l => l.status !== 'rented' && l.status !== 'sold').length > 0 ? listings.filter(l => l.status !== 'rented' && l.status !== 'sold').map((listing) => (
                                            <tr key={listing.$id} className="hover:bg-[#0a080a]/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 mr-4 shrink-0 border border-white/5 shadow-sm">
                                                            {parseJsonField(listing.images)?.[0]?.includes('is_video=true') ? (
                                                                <video src={parseJsonField(listing.images)[0]} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                                                            ) : (
                                                                <img
                                                                    src={parseJsonField(listing.images)?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=80'}
                                                                    alt={listing.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-semibold text-slate-900 truncate max-w-[200px]">{listing.title}</h4>
                                                            <span className="text-xs font-normal text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <MapPin size={10} className="text-blue-400 shrink-0" />
                                                                <span className="truncate max-w-[180px]">{listing.location}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 border border-slate-200">
                                                            {getPropertyTypeLabel(listing.type)}
                                                        </span>
                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                                            listing.purpose === 'sell'
                                                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {listing.purpose === 'sell' ? '🏷️ For Sale' : '🏠 Rent'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-rose-600">
                                                        {formatPropertyPrice(listing.price, listing.purpose)}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-normal">
                                                        {listing.purpose === 'sell' ? 'Total Price' : '/month'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={
                                                        listing.status === 'approved' ? 'chip-approved' :
                                                            listing.status === 'sold' ? 'bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider' :
                                                            listing.status === 'rented' ? 'bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider' :
                                                                'chip-pending'
                                                    }>
                                                        {listing.status === 'approved' ? 'Live' :
                                                            listing.status === 'sold' ? 'Sold Out' :
                                                            listing.status === 'rented' ? 'Rented' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-1 text-slate-300 font-bold text-sm">
                                                        <Eye size={14} className="text-slate-400" />
                                                        {listing.viewsCount || 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            to={`/property/${listing.$id}`}
                                                            className="w-9 h-9 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye size={16} />
                                                        </Link>
                                                        <Link
                                                            to={`/dashboard/edit-listing/${listing.$id}`}
                                                            className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-950 rounded-lg flex items-center justify-center transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </Link>
                                                        {listing.status === 'approved' && (
                                                            <button
                                                                onClick={() => handleToggleRented(listing.$id, listing.status)}
                                                                className="w-9 h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center transition-colors"
                                                                title={listing.purpose === 'sell' ? "Mark as Sold" : "Mark as Rented"}
                                                            >
                                                                <Home size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(listing.$id)}
                                                            className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="max-w-xs mx-auto">
                                                        <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                                            <Home size={32} />
                                                        </div>
                                                        <h4 className="text-lg font-bold text-slate-900 mb-1">No listings yet</h4>
                                                        <p className="text-sm text-slate-400 font-medium mb-6">Start by adding your first property.</p>
                                                        <button onClick={() => setActiveTab('add')} className="btn-primary py-3 px-6 text-sm">
                                                            Add Your First Property
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden p-4 space-y-2">
                                {listings.filter(l => l.status !== 'rented' && l.status !== 'sold').length > 0 ? listings.filter(l => l.status !== 'rented' && l.status !== 'sold').map((listing) => (
                                    <div key={listing.$id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-white/10">
                                                {parseJsonField(listing.images)?.[0]?.includes('is_video=true') ? (
                                                    <video src={parseJsonField(listing.images)[0]} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                                                ) : (
                                                    <img
                                                        src={parseJsonField(listing.images)?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=80'}
                                                        alt={listing.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-slate-900 truncate">{listing.title}</h4>
                                                <span className="text-xs text-slate-400 flex items-center font-medium">
                                                    <MapPin size={10} className="mr-1" /> {listing.location}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-rose-600 font-black text-sm">
                                                        {formatPropertyPrice(listing.price, listing.purpose)}
                                                    </span>
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                                        listing.purpose === 'sell' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {listing.purpose === 'sell' ? 'Sale' : 'Rent'}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${listing.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {listing.status === 'approved' ? 'Live' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link to={`/property/${listing.$id}`} className="flex-1 bg-white text-center py-2 rounded-lg text-sm font-bold text-slate-500 border border-slate-200">View</Link>
                                            <Link to={`/dashboard/edit-listing/${listing.$id}`} className="flex-1 bg-blue-50 text-center py-2 rounded-lg text-sm font-bold text-blue-600">Edit</Link>
                                            <button onClick={() => handleDelete(listing.$id)} className="bg-red-50 px-4 py-2 rounded-lg text-sm font-bold text-red-500">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-16 text-center">
                                        <Home size={40} className="mx-auto mb-4 text-slate-300" />
                                        <p className="font-bold text-slate-900 mb-2">No listings yet</p>
                                        <button onClick={() => setActiveTab('add')} className="btn-primary py-3 px-6 text-sm">Add Property</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== RENTED TAB ===== */}
                {activeTab === 'rented' && (
                    <div className="animate-fade-in">
                        <div className="card-elevated overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Rented & Sold Properties</h3>
                                    <p className="text-slate-400 text-sm font-normal">Properties currently marked as rented or sold out.</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Property</th>
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type & Purpose</th>
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Price / Rent</th>
                                            <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {listings.filter(l => l.status === 'rented' || l.status === 'sold').length > 0 ? listings.filter(l => l.status === 'rented' || l.status === 'sold').map((listing) => (
                                            <tr key={listing.$id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 mr-4 shrink-0 border border-slate-200 shadow-sm">
                                                            {parseJsonField(listing.images)?.[0]?.includes('is_video=true') ? (
                                                                <video src={parseJsonField(listing.images)[0]} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                                                            ) : (
                                                                <img
                                                                    src={parseJsonField(listing.images)?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=80'}
                                                                    alt={listing.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-semibold text-slate-900 truncate max-w-[200px]">{listing.title}</h4>
                                                            <span className="text-xs font-normal text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <MapPin size={10} className="text-blue-400 shrink-0" />
                                                                <span className="truncate max-w-[180px]">{listing.location}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 border border-slate-200">
                                                            {getPropertyTypeLabel(listing.type)}
                                                        </span>
                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                                            listing.purpose === 'sell'
                                                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {listing.purpose === 'sell' ? 'Sold Out' : 'Rented'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-rose-600">
                                                        {formatPropertyPrice(listing.price, listing.purpose)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleToggleRented(listing.$id, listing.status)}
                                                            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                                        >
                                                            <CheckCircle size={14} /> Mark as Available
                                                        </button>
                                                        <Link
                                                            to={`/dashboard/edit-listing/${listing.$id}`}
                                                            className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-950 rounded-lg flex items-center justify-center transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 text-sm font-medium">
                                                    No rented properties found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'add' && (
                    <div className="animate-fade-in max-w-4xl mx-auto">
                        <div className="card-elevated overflow-hidden">
                            <div className="p-8 md:p-10 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Add New Property</h2>
                                        <p className="text-slate-400 font-normal text-sm">Provide details to attract students to your stay.</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitListing} className="p-8 md:p-12 space-y-10">
                                {formError && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-fade-in">
                                        <AlertCircle className="text-red-500 shrink-0" size={20} />
                                        <p className="text-sm text-red-600 font-medium">{formError}</p>
                                    </div>
                                )}

                                {formSuccess && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 animate-fade-in">
                                        <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                                        <p className="text-sm text-emerald-600 font-bold">Listing submitted! It's now awaiting admin approval.</p>
                                    </div>
                                )}

                                {/* Step 1 - Basic Info */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">1</span>
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Are you an Owner or a Broker?</label>
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, listed_by: 'owner' }))}
                                                    className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.listed_by === 'owner'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-slate-50 text-slate-500 hover:border-slate-100 bg-white'
                                                        }`}
                                                >
                                                    Owner
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, listed_by: 'broker' }))}
                                                    className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.listed_by === 'broker'
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-slate-50 text-slate-500 hover:border-slate-100 bg-white'
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
                                                    {['15 Days Rent', '1 Month Rent', '₹5,000 Flat', '₹2,500 Flat', '1% Deal Value'].map((opt) => (
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
                                                    placeholder="Custom brokerage e.g. 15 Days Rent"
                                                    className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    required={formData.listed_by === 'broker'}
                                                />
                                            </div>
                                        )}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Property Title *</label>
                                            <input type="text" name="title" required placeholder="e.g. Modern PG near ABES EC / Crossings Republik"
                                                className="input-field" value={formData.title} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Property Type *</label>
                                            <select name="type" className="input-field cursor-pointer" value={formData.type} onChange={handleChange}>
                                                <option value="PG">PG (Paying Guest)</option>
                                                <option value="Flat">Flat / Apartment</option>
                                                <option value="Hostel">Hostel</option>
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
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Nearby College / University</label>
                                            <div className="relative">
                                                <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" name="nearbyCollege" placeholder="e.g. ABES EC, IMS Ghaziabad, AKGEC"
                                                    className="input-field pl-10" value={formData.nearbyCollege} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Monthly Rent (₹) *</label>
                                            <div className="relative">
                                                <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="number" name="price" required placeholder="8500"
                                                    className="input-field pl-10" value={formData.price} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Gender Preference</label>
                                            <select name="gender_preference" className="input-field cursor-pointer" value={formData.gender_preference} onChange={handleChange}>
                                                <option value="any">Any</option>
                                                <option value="boys">Boys Only</option>
                                                <option value="girls">Girls Only</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Room Occupancy</label>
                                            <div className="flex flex-wrap gap-2">
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
                                                        className={`px-4 py-2 rounded-xl border-2 transition-all font-bold text-xs ${formData.occupancy.includes(opt.id)
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-slate-50 text-slate-500 hover:border-slate-100 bg-white'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <div className="flex gap-2 mb-6">
                                                <div className="relative flex-1">
                                                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input type="text" name="location" required placeholder="e.g. Arihant Ambience, Crossings Republik, Ghaziabad"
                                                        className="input-field pl-10" value={formData.location} onChange={handleChange} />
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
                                                <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Pin Precise Location on Map (Required)</label>
                                                <button
                                                    type="button"
                                                    onClick={useCurrentLocation}
                                                    className="flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
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
                                            <textarea name="description" rows={4} placeholder="Describe your property — facilities, environment, rules, nearby colleges..."
                                                className="input-field resize-none" value={formData.description} onChange={handleChange}></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 - Amenities */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">2</span>
                                        Amenities & Facilities
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {amenityOptions.map(amenity => (
                                            <button
                                                key={amenity}
                                                type="button"
                                                onClick={() => toggleAmenity(amenity)}
                                                className={`flex items-center justify-center p-3.5 rounded-xl border transition-all font-medium text-sm ${formData.amenities.includes(amenity)
                                                    ? 'border-blue-300 bg-blue-50 text-blue-600'
                                                    : 'border-white/10/60 text-slate-400 hover:border-blue-200 hover:bg-[#0a080a]'
                                                    }`}
                                            >
                                                {formData.amenities.includes(amenity) && <CheckCircle size={14} className="mr-2" />}
                                                {amenity}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 3 - Photos */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">3</span>
                                        Property Photos & Videos
                                    </h3>

                                    {/* Upload Zone */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        style={{ display: 'none' }}
                                        onChange={handleImageUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                        disabled={uploadingImages || uploadedImages.length >= 8}
                                        className={`w-full flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-2xl transition-all ${uploadingImages
                                            ? 'border-blue-300 bg-blue-50 cursor-wait'
                                            : uploadedImages.length >= 8
                                                ? 'border-white/5 bg-[#0a080a] opacity-50 cursor-not-allowed'
                                                : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer'
                                            }`}
                                    >
                                        {uploadingImages ? (
                                            <>
                                                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                                                <p className="font-semibold text-blue-600 text-sm">Uploading photos...</p>
                                                <p className="text-xs text-slate-400 mt-1">Please wait</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                                                    <Upload size={28} />
                                                </div>
                                                <p className="font-semibold text-slate-900 mb-1 text-sm">Click to upload photos/videos</p>
                                                <p className="text-xs text-slate-400 font-normal">
                                                    JPG, PNG, WEBP, MP4 — up to 8 items · {uploadedImages.length}/8 uploaded
                                                </p>
                                            </>
                                        )}
                                    </button>

                                    {/* Uploaded Image Previews */}
                                    {uploadedImages.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                            {uploadedImages.map((img, index) => (
                                                <div key={index} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-100">
                                                    {(img.isVideo || img.url.includes('is_video=true')) ? (
                                                        <video src={img.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                                    ) : (
                                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                                    )}
                                                    {index === 0 && (
                                                        <span className="absolute top-2 left-2 text-[9px] font-semibold bg-blue-500 text-white px-2 py-0.5 rounded-md uppercase">Cover</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeUploadedImage(index)}
                                                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Step 4 - Contact */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">4</span>
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Phone Number *</label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="tel" name="phone_number" required placeholder="+91 XXXXX XXXXX"
                                                    className="input-field pl-11" value={formData.phone_number} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">WhatsApp Number *</label>
                                            <div className="relative">
                                                <Send size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="tel" name="whatsapp_number" required placeholder="+91 XXXXX XXXXX"
                                                    className="input-field pl-11" value={formData.whatsapp_number} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row gap-4">
                                    <button type="submit" disabled={formLoading}
                                        className="flex-1 btn-primary py-4 rounded-2xl text-sm flex items-center justify-center gap-2">
                                        {formLoading ? (
                                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                <span>Submit for Approval</span>
                                            </>
                                        )}
                                    </button>
                                    <button type="button" onClick={() => setActiveTab('overview')}
                                        className="btn-secondary py-5 px-10 rounded-2xl">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}



                {/* ===== POST MAID TAB ===== */}
                {activeTab === 'maid' && (
                    <div className="animate-fade-in max-w-4xl mx-auto">
                        <div className="card-elevated overflow-hidden">
                            <div className="p-8 md:p-10 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                                        <Brush size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Post Maid Service</h2>
                                        <p className="text-slate-400 font-normal text-sm">Submit a maid/helper listing for admin approval.</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitMaid} className="p-8 md:p-12 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Service Title *</label>
                                        <input type="text" name="title" required placeholder="e.g. Experienced Cook Available in Crossings Republik"
                                            className="input-field" value={maidForm.title} onChange={handleMaidChange} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Service Type *</label>
                                        <select name="serviceType" className="input-field cursor-pointer" value={maidForm.serviceType} onChange={handleMaidChange}>
                                            <option value="all-in-one">⭐ All-in-One</option>
                                            <option value="cooking">🍳 Cooking</option>
                                            <option value="cleaning">🧹 Cleaning</option>
                                            <option value="laundry">👕 Laundry</option>
                                            <option value="babysitting">👶 Babysitting</option>
                                            <option value="elderly-care">🧓 Elderly Care</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Gender Preference</label>
                                        <select name="genderPreference" className="input-field cursor-pointer" value={maidForm.genderPreference} onChange={handleMaidChange}>
                                            <option value="any">Any</option>
                                            <option value="female">Female Only</option>
                                            <option value="male">Male Only</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Location *</label>
                                        <div className="relative">
                                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text" name="location" required placeholder="e.g. Crossings Republik, Ghaziabad"
                                                className="input-field pl-10" value={maidForm.location} onChange={handleMaidChange} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Timing</label>
                                        <input type="text" name="timing" placeholder="e.g. Morning 8-11 AM"
                                            className="input-field" value={maidForm.timing} onChange={handleMaidChange} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Monthly Charge (₹)</label>
                                        <div className="relative">
                                            <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="number" name="price" placeholder="3000"
                                                className="input-field pl-10" value={maidForm.price} onChange={handleMaidChange} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">WhatsApp Number *</label>
                                        <div className="relative">
                                            <Send size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="tel" name="whatsappNumber" required placeholder="+91 XXXXX XXXXX"
                                                className="input-field pl-11" value={maidForm.whatsappNumber} onChange={handleMaidChange} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Phone Number *</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="tel" name="phoneNumber" required placeholder="+91 XXXXX XXXXX"
                                                className="input-field pl-11" value={maidForm.phoneNumber} onChange={handleMaidChange} />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Maid's Photo (Recommended)</label>
                                        <input
                                            ref={maidImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleMaidImageSelect}
                                        />
                                        <div
                                            onClick={() => maidImageInputRef.current?.click()}
                                            className="w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all overflow-hidden relative"
                                        >
                                            {maidImagePreview ? (
                                                <>
                                                    <img src={maidImagePreview} alt="Maid Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <span className="text-white text-xs font-bold uppercase tracking-widest">Change Photo</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="text-slate-300 mb-2" size={32} />
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Click to Upload Photo</p>
                                                    <p className="text-[10px] text-slate-300 mt-1">PNG, JPG up to 5MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Description</label>
                                        <textarea name="description" rows={3} placeholder="Describe the service — experience, specialties, schedule..."
                                            className="input-field resize-none" value={maidForm.description} onChange={handleMaidChange}></textarea>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50">
                                    <button type="submit" disabled={maidFormLoading}
                                        className="w-full btn-primary py-4 rounded-2xl text-sm flex items-center justify-center gap-2">
                                        {maidFormLoading ? (
                                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <><Brush size={16} /> Submit Maid Service for Approval</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ===== PROFILE TAB ===== */}
                {activeTab === 'profile' && (
                    <div className="animate-fade-in max-w-2xl">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Owner Profile</h2>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            {/* Profile Header */}
                            <div className="p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                                <div className="relative flex items-center gap-5">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-2 border-white/30">
                                        {profile?.name?.charAt(0)?.toUpperCase() || 'O'}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{profile?.name || 'Owner'}</h3>
                                        <p className="text-white/70 font-medium">{user?.email}</p>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-[10px] font-semibold uppercase tracking-wider text-white mt-2">
                                            <Briefcase size={10} />
                                            Owner / Broker
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Content */}
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Listings', value: stats.total },
                                        { label: 'Approved', value: stats.approved },
                                        { label: 'Total Views', value: stats.views },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                                            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Role Switcher ── */}
                                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Switch Account Type</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'student', label: 'Student', icon: User },
                                            { id: 'owner', label: 'Owner', icon: Home },
                                            { id: 'broker', label: 'Broker', icon: Settings },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                disabled={roleUpdating}
                                                onClick={async () => {
                                                    if (profile?.role === item.id) return;
                                                    setRoleUpdating(true);
                                                    setRoleSuccess(false);
                                                    try {
                                                        await databases.updateDocument(
                                                            DATABASE_ID,
                                                            COLLECTION.profiles,
                                                            profile.$id,
                                                            { role: item.id, updatedAt: new Date().toISOString() }
                                                        );
                                                        await refreshProfile();
                                                        setRoleSuccess(true);
                                                        setTimeout(() => {
                                                            if (item.id === 'student') navigate('/dashboard');
                                                            else window.location.reload();
                                                        }, 800);
                                                    } catch (err) {
                                                        console.error('Role update error:', err);
                                                    } finally {
                                                        setRoleUpdating(false);
                                                    }
                                                }}
                                                className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-300 ${
                                                    profile?.role === item.id
                                                        ? 'border-blue-500 bg-white shadow-md shadow-blue-100/50 text-blue-700'
                                                        : 'border-white bg-white/50 hover:border-blue-200 hover:bg-white text-slate-400 hover:text-blue-500'
                                                } disabled:opacity-50`}
                                            >
                                                <item.icon size={20} className={profile?.role === item.id ? 'animate-bounce-subtle' : ''} />
                                                <span className="text-[10px] font-black mt-2 uppercase tracking-wider">{item.label}</span>
                                                {profile?.role === item.id && (
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {roleSuccess && (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs animate-fade-in">
                                            <CheckCircle size={14} /> Role updated! Refreshing...
                                        </div>
                                    )}
                                    {roleUpdating && (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-blue-600 font-bold text-xs animate-fade-in">
                                            <Loader2 size={14} className="animate-spin" /> Updating role...
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    {[
                                        { icon: User, label: 'Full Name', value: profile?.name || 'Not set' },
                                        { icon: MapPin, label: 'Email', value: user?.email || 'Not set' },
                                        { icon: Briefcase, label: 'Account Type', value: profile?.role === 'owner' ? 'Owner / Broker' : profile?.role || 'Owner' },
                                        { icon: Clock, label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 py-3">
                                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <item.icon size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                <p className="text-slate-900 font-bold">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => { signOut(); navigate('/'); }}
                                    className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 px-6 rounded-2xl hover:bg-red-100 transition-all"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default OwnerDashboard;
