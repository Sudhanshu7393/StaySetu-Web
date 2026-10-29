import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTION, Query, ID } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PropertyCard from '../../components/common/PropertyCard';
import {
    Search, Heart, User, Home, MapPin,
    Star, BookmarkCheck, Bell, TrendingUp, Eye, Clock,
    ChevronRight, Filter, IndianRupee, Sparkles, Shield,
    LogOut, Settings, X, Users, Phone, Plus, Loader2,
    CheckCircle, Calendar, UserCheck, Trash2,
    MessageCircle, Mail
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, profile, signOut, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [roleUpdating, setRoleUpdating] = useState(false);
    const [roleSuccess, setRoleSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'visits');
    const [listings, setListings] = useState([]);
    const [savedListings, setSavedListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [purposeFilter, setPurposeFilter] = useState('all');
    const [propertyType, setPropertyType] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [priceRange, setPriceRange] = useState(100000);
    const [stats, setStats] = useState({ saved: 0, viewed: 0 });

    // Visits / Bookings state
    const [visitFilter, setVisitFilter] = useState('all');
    const [visits, setVisits] = useState([]);

    // Roommate state
    const [roommateRequests, setRoommateRequests] = useState([]);
    const [roommateLoading, setRoommateLoading] = useState(false);
    const [showRoommateForm, setShowRoommateForm] = useState(false);
    const [roommateSubmitting, setRoommateSubmitting] = useState(false);
    const [roommateSuccess, setRoommateSuccess] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [roommateForm, setRoommateForm] = useState({
        location: '',
        budget: '',
        gender_preference: 'any',
        move_in_date: '',
        description: '',
        whatsapp: '',
        college: '',
    });

    const fetchIncomingRequests = React.useCallback(async () => {
        if (!user) return;
        setRequestsLoading(true);
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION.roommateConnectRequests,
                [Query.equal('posterId', user.$id), Query.orderDesc('$createdAt')]
            );
            setIncomingRequests(res.documents);
        } catch (err) {
            console.error('Fetch incoming requests error:', err);
        } finally {
            setRequestsLoading(false);
        }
    }, [user]);

    const fetchListings = React.useCallback(async () => {
        try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION.listings, [
                Query.equal('status', 'approved'),
                Query.orderDesc('$createdAt'),
                Query.limit(100),
            ]);
            setListings(res.documents);
        } catch (err) {
            console.error('Fetch listings error:', err);
        }
    }, []);

    const fetchSavedListings = React.useCallback(async () => {
        if (!user) return;
        try {
            const favRes = await databases.listDocuments(DATABASE_ID, COLLECTION.favorites, [
                Query.equal('userId', user.$id),
            ]);
            if (favRes.documents.length > 0) {
                const listingsArr = [];
                for (const fav of favRes.documents) {
                    try {
                        const doc = await databases.getDocument(DATABASE_ID, COLLECTION.listings, fav.listingId);
                        listingsArr.push(doc);
                    } catch { /* empty */ }
                }
                setSavedListings(listingsArr);
                setStats(prev => ({ ...prev, saved: listingsArr.length }));
            }
        } catch (err) {
            console.error('Fetch saved error:', err);
        }
    }, [user]);

    const fetchAllData = React.useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchListings(),
            fetchSavedListings(),
        ]);
        setLoading(false);
    }, [fetchListings, fetchSavedListings]);

    const fetchRoommateRequests = React.useCallback(async () => {
        if (!user) return;
        setRoommateLoading(true);
        try {
            const approvedRes = await databases.listDocuments(DATABASE_ID, COLLECTION.roommateRequests, [
                Query.equal('status', 'approved'), Query.orderDesc('$createdAt'),
            ]);
            const myRes = await databases.listDocuments(DATABASE_ID, COLLECTION.roommateRequests, [
                Query.equal('userId', user.$id), Query.orderDesc('$createdAt'),
            ]);
            const allDocs = [...approvedRes.documents, ...myRes.documents];
            const unique = Array.from(new Map(allDocs.map(d => [d.$id, d])).values());
            setRoommateRequests(unique);
        } catch (err) {
            console.error('Roommate fetch error:', err);
        } finally {
            setRoommateLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchAllData();
            fetchRoommateRequests();
            fetchIncomingRequests();
        }
    }, [user, fetchAllData, fetchRoommateRequests, fetchIncomingRequests]);

    const handleRoommateSubmit = async (e) => {
        e.preventDefault();
        setRoommateSubmitting(true);
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION.roommateRequests, ID.unique(), {
                userId: user.$id,
                name: profile?.fullName || profile?.name || user.email,
                location: roommateForm.location,
                budget: parseFloat(roommateForm.budget) || null,
                genderPreference: roommateForm.gender_preference,
                moveInDate: roommateForm.move_in_date || null,
                description: roommateForm.description,
                whatsapp: roommateForm.whatsapp,
                college: roommateForm.college,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });
            setRoommateSuccess(true);
            setRoommateForm({ location: '', budget: '', gender_preference: 'any', move_in_date: '', description: '', whatsapp: '', college: '' });
            await fetchRoommateRequests();
            setTimeout(() => { setRoommateSuccess(false); setShowRoommateForm(false); }, 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setRoommateSubmitting(false);
        }
    };

    const toggleSave = async (listingId) => {
        if (!user) return navigate('/login');
        const isSaved = savedListings.some(l => l.$id === listingId);
        if (isSaved) {
            const favRes = await databases.listDocuments(DATABASE_ID, COLLECTION.favorites, [
                Query.equal('userId', user.$id), Query.equal('listingId', listingId),
            ]);
            for (const fav of favRes.documents) {
                await databases.deleteDocument(DATABASE_ID, COLLECTION.favorites, fav.$id);
            }
            setSavedListings(prev => prev.filter(l => l.$id !== listingId));
            setStats(prev => ({ ...prev, saved: prev.saved - 1 }));
        } else {
            await databases.createDocument(DATABASE_ID, COLLECTION.favorites, ID.unique(), {
                userId: user.$id, listingId: listingId, createdAt: new Date().toISOString(),
            });
            const listing = listings.find(l => l.$id === listingId);
            if (listing) {
                setSavedListings(prev => [...prev, listing]);
                setStats(prev => ({ ...prev, saved: prev.saved + 1 }));
            }
        }
    };

    const filteredListings = listings.filter(listing => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            listing.title?.toLowerCase().includes(searchLower) ||
            listing.location?.toLowerCase().includes(searchLower) ||
            listing.type?.toLowerCase().includes(searchLower) ||
            listing.college?.toLowerCase().includes(searchLower) ||
            listing.description?.toLowerCase().includes(searchLower);

        const matchesType = propertyType === 'all' || listing.type === propertyType;
        const matchesPrice = Number(listing.price) <= priceRange;

        const matchesPurpose = purposeFilter === 'all' ||
            (purposeFilter === 'sell'
                ? (listing.purpose === 'sell' || Number(listing.price) > 500000)
                : (listing.purpose !== 'sell' && Number(listing.price) <= 500000));

        let matchesGender = true;
        if (genderFilter !== 'all' && purposeFilter !== 'sell') {
            const genderValue = genderFilter === 'male' ? 'boys' : 'girls';
            // Check both camelCase and snake_case for compatibility
            const propertyGender = listing.genderPreference || listing.gender_preference || listing.gender;
            matchesGender = propertyGender === genderValue || propertyGender === 'any';
        }

        return matchesPurpose && matchesSearch && matchesType && matchesPrice && matchesGender;
    });

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const tabs = [
        { id: 'visits', label: 'Bookings & Visits', icon: Calendar, count: visits.length },
        { id: 'browse', label: 'Browse Stays', icon: Search, count: listings.length },
        { id: 'roommate', label: 'Find Roommate', icon: Users, count: roommateRequests.length },
        { id: 'saved', label: 'Saved', icon: Heart, count: stats.saved },
        { id: 'profile', label: 'My Profile', icon: User },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFB]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-500 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFB] pt-20 pb-28 sm:pb-16 text-zinc-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Welcome Header */}
                <div className="mb-8 pt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-rose-500/20">
                                    {profile?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900">
                                        Hey, {profile?.name?.split(' ')[0] || 'Student'} 👋
                                    </h1>
                                    <p className="text-zinc-500 font-medium text-sm">Find your perfect home away from home.</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {[
                                { label: 'Visits', value: visits.length, icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50' },
                                { label: 'Saved', value: stats.saved, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                                { label: 'Available', value: listings.length, icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center gap-2 sm:gap-3">
                                    <div className={`${stat.bg} ${stat.color} w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0`}>
                                        <stat.icon size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base sm:text-lg font-black text-zinc-900 leading-tight">{stat.value}</p>
                                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest block truncate">{stat.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-zinc-100 rounded-2xl p-1.5 border border-zinc-200/80 shadow-xs mb-8 flex gap-1 overflow-x-auto scrollbar-none flex-nowrap">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                                : 'text-zinc-600 hover:bg-white hover:text-zinc-950'
                                }`}
                        >
                            <tab.icon size={15} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-zinc-200 text-zinc-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Bookings & Visits Tab matching user screenshot 4 */}
                {activeTab === 'visits' && (
                    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
                        
                        {/* Curved Hero Banner Card */}
                        <div className="bg-gradient-to-r from-rose-50/90 via-white to-rose-100/40 rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs flex items-center justify-between gap-6 relative overflow-hidden">
                            <div className="space-y-1.5 max-w-md">
                                <span className="text-[11px] font-black uppercase tracking-widest text-rose-600 block">
                                    ROOM SEEKER
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                                    Bookings & Visits
                                </h2>
                                <p className="text-zinc-500 text-xs sm:text-sm font-normal">
                                    Track your room visits and their current status.
                                </p>
                            </div>

                            {/* Calendar Illustration Box */}
                            <div className="hidden sm:flex w-24 h-24 rounded-3xl bg-white border border-rose-200/80 shadow-xs items-center justify-center text-rose-500 shrink-0">
                                <div className="text-center">
                                    <Calendar size={36} className="mx-auto mb-1 text-rose-500" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-700">StaySetu</span>
                                </div>
                            </div>
                        </div>

                        {/* Filter Pills matching screenshot 4 */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {[
                                { key: 'all', label: 'All', count: visits.length },
                                { key: 'upcoming', label: 'Upcoming', count: visits.filter(v => v.status === 'Upcoming' || v.status === 'Pending').length },
                                { key: 'accepted', label: 'Accepted', count: visits.filter(v => v.status === 'Accepted').length },
                                { key: 'canceled', label: 'Canceled', count: visits.filter(v => v.status === 'Canceled').length },
                            ].map((pill) => (
                                <button
                                    key={pill.key}
                                    onClick={() => setVisitFilter(pill.key)}
                                    className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all shrink-0 ${
                                        visitFilter === pill.key
                                            ? 'bg-rose-500 text-white shadow-xs'
                                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                                    }`}
                                >
                                    <span>{pill.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${visitFilter === pill.key ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                        {pill.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Visit Cards List */}
                        <div className="space-y-4">
                            {visits.filter(v => {
                                if (visitFilter === 'all') return true;
                                if (visitFilter === 'upcoming') return v.status === 'Upcoming' || v.status === 'Pending';
                                return v.status.toLowerCase() === visitFilter.toLowerCase();
                            }).length > 0 ? (
                                visits
                                    .filter(v => {
                                        if (visitFilter === 'all') return true;
                                        if (visitFilter === 'upcoming') return v.status === 'Upcoming' || v.status === 'Pending';
                                        return v.status.toLowerCase() === visitFilter.toLowerCase();
                                    })
                                    .map((visit) => (
                                        <div
                                            key={visit.id}
                                            className="bg-white rounded-3xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 sm:gap-5"
                                        >
                                            {/* Left: Thumbnail with Heart icon */}
                                            <div className="relative w-full sm:w-44 md:w-52 aspect-[16/10] sm:aspect-square shrink-0 rounded-2xl overflow-hidden bg-zinc-100">
                                                <img
                                                    src={visit.image}
                                                    alt={visit.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 text-zinc-600 hover:text-rose-500 flex items-center justify-center shadow-xs"
                                                >
                                                    <Heart size={13} />
                                                </button>
                                            </div>

                                            {/* Right: Info, Tags, Date, Note & Actions */}
                                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    {/* Header: Title + Status Pill */}
                                                    <div className="flex items-start justify-between gap-3 mb-1">
                                                        <h3 className="font-extrabold text-zinc-900 text-sm sm:text-base line-clamp-1">
                                                            {visit.title}
                                                        </h3>
                                                        <span className={`shrink-0 text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                                                            visit.status === 'Canceled'
                                                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                                : visit.status === 'Accepted'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {visit.status}
                                                        </span>
                                                    </div>

                                                    {/* Location */}
                                                    <div className="flex items-center text-xs text-zinc-500 mb-2.5">
                                                        <MapPin size={12} className="text-rose-500 mr-1 shrink-0" />
                                                        <span className="truncate">{visit.location}</span>
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                                        {visit.tags.map((tag, i) => (
                                                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Date & Time */}
                                                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-700 mb-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={13} className="text-zinc-400" />
                                                            <span>{visit.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={13} className="text-zinc-400" />
                                                            <span>{visit.time}</span>
                                                        </div>
                                                    </div>

                                                    {/* Message note bubble */}
                                                    {visit.note && (
                                                        <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs text-zinc-600 font-medium mb-3">
                                                            {visit.note}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                                                    {visit.status === 'Canceled' ? (
                                                        <button
                                                            onClick={() => setVisits(prev => prev.filter(v => v.id !== visit.id))}
                                                            className="text-xs font-bold text-zinc-500 hover:text-rose-600 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-zinc-50 transition-colors"
                                                        >
                                                            <Trash2 size={13} />
                                                            <span>Clear</span>
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: 'Canceled' } : v));
                                                                }}
                                                                className="text-xs font-bold text-zinc-600 hover:text-rose-600 py-2 px-4 rounded-full border border-zinc-200 transition-colors"
                                                            >
                                                                ✕ Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => navigate('/listings')}
                                                                className="text-xs font-extrabold text-white bg-rose-500 hover:bg-rose-600 py-2 px-5 rounded-full shadow-xs transition-all flex items-center gap-1.5"
                                                            >
                                                                <Calendar size={13} />
                                                                <span>Reschedule</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-zinc-200">
                                    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Calendar size={24} />
                                    </div>
                                    <h3 className="text-base font-extrabold text-zinc-900 mb-1">No visit bookings yet</h3>
                                    <p className="text-zinc-500 text-xs sm:text-sm font-normal mb-5 max-w-xs mx-auto">
                                        When you schedule property visits, they will show up here with live status updates.
                                    </p>
                                    <button
                                        onClick={() => navigate('/listings')}
                                        className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-2.5 px-5 rounded-full text-xs transition-all shadow-xs"
                                    >
                                        Browse Available Stays
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* Browse Tab */}
                {activeTab === 'browse' && (
                    <div className="animate-fade-in">
                        {/* Search & Filter Bar */}
                        <div className="bg-slate-50 rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm mb-8">
                            
                            {/* Purpose Switcher: Rent vs Buy/Sell */}
                            <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl w-fit mb-4 border border-slate-200 shadow-2xs max-w-full overflow-x-auto scrollbar-none flex-nowrap">
                                {[
                                    { id: 'all', label: 'All Stays' },
                                    { id: 'rent', label: '🏠 For Rent' },
                                    { id: 'sell', label: '🏷️ Buy / Sell' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => {
                                            setPurposeFilter(tab.id);
                                            setPropertyType('all');
                                            if (tab.id === 'sell') setPriceRange(30000000);
                                            else setPriceRange(100000);
                                        }}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                                            purposeFilter === tab.id
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by location, property name, or college..."
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all font-medium text-xs sm:text-sm text-slate-900"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2 overflow-x-auto scrollbar-none flex-nowrap shrink-0">
                                    {(purposeFilter === 'sell' ? ['all', 'Flat', 'House/Villa', 'Plot'] : ['all', 'PG', 'Flat', 'Hostel']).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setPropertyType(type)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${propertyType === type
                                                ? 'bg-zinc-900 text-white shadow-xs'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            {type === 'all' ? 'All Types' : type}
                                        </button>
                                    ))}
                                </div>

                                {purposeFilter !== 'sell' && (
                                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-nowrap shrink-0">
                                        {[{ key: 'all', label: 'All' }, { key: 'male', label: 'Boys' }, { key: 'female', label: 'Girls' }].map(({ key, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => setGenderFilter(key)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${genderFilter === key
                                                    ? 'bg-rose-500 text-white shadow-xs'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Price Range */}
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 sm:gap-4">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    {purposeFilter === 'sell' ? 'Max Budget' : 'Max Rent'}
                                </span>
                                <input
                                    type="range"
                                    min={purposeFilter === 'sell' ? 1000000 : 2000}
                                    max={purposeFilter === 'sell' ? 50000000 : 100000}
                                    step={purposeFilter === 'sell' ? 500000 : 500}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                />
                                <span className="text-rose-600 font-black flex items-center text-xs sm:text-sm min-w-[75px] justify-end whitespace-nowrap">
                                    <IndianRupee size={13} />
                                    {purposeFilter === 'sell' && priceRange >= 10000000
                                        ? `${(priceRange / 10000000).toFixed(1)} Cr`
                                        : purposeFilter === 'sell' && priceRange >= 100000
                                            ? `${(priceRange / 100000).toFixed(0)} Lac`
                                            : priceRange.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-slate-400 font-medium">
                                <span className="text-slate-900 font-black">{filteredListings.length}</span> properties found
                            </p>
                        </div>

                        {filteredListings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredListings.map((listing) => (
                                    <div key={listing.$id} className="relative">
                                        <PropertyCard property={listing} />
                                        <button
                                            onClick={() => toggleSave(listing.$id)}
                                            className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${savedListings.some(l => l.$id === listing.$id)
                                                ? 'bg-rose-500 text-white'
                                                : 'bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 border border-slate-100'
                                                }`}
                                        >
                                            <Heart size={18} fill={savedListings.some(l => l.$id === listing.$id) ? 'currentColor' : 'none'} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-[2.5rem] p-20 text-center border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 border border-slate-100">
                                    <Home size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">No properties found</h3>
                                <p className="text-slate-400 font-medium mb-6">Try adjusting your filters or search.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setPropertyType('all'); setPriceRange(100000); }}
                                    className="btn-secondary"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ ROOMMATE TAB ══════════════════════════════════════════ */}
                {activeTab === 'roommate' && (
                    <div className="animate-fade-in">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Find a Roommate</h2>
                                <p className="text-slate-400 font-medium text-sm">Post your requirement and connect with compatible students.</p>
                            </div>
                            <button
                                onClick={() => setShowRoommateForm(f => !f)}
                                className="btn-primary py-3 px-6 flex items-center gap-2 shrink-0"
                            >
                                {showRoommateForm ? <X size={18} /> : <Plus size={18} />}
                                {showRoommateForm ? 'Cancel' : 'Post My Requirement'}
                            </button>
                        </div>

                        {/* Incoming Requests Section */}
                        {incomingRequests.length > 0 && (
                            <div className="mb-10 animate-slide-up">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                                        {incomingRequests.length}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">Interest Requests Received</h3>
                                    {requestsLoading && (
                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin ml-2" />
                                    )}
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
                                                <p className="text-xs font-bold text-slate-700 truncate">{request.postLocation} ({request.postCollege})</p>
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

                        {/* Post Form */}
                        {showRoommateForm && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <UserCheck size={20} className="text-blue-500" />
                                    Tell others what you're looking for
                                </h3>
                                {roommateSuccess ? (
                                    <div className="flex flex-col items-center py-10 text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4">
                                            <CheckCircle size={32} />
                                        </div>
                                        <p className="font-bold text-slate-900 text-lg">Submitted for Review!</p>
                                        <p className="text-slate-400 text-sm mt-1">Your requirement is pending admin verification. It will go live once approved.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRoommateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Preferred Location *</label>
                                            <div className="relative">
                                                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input required type="text" placeholder="e.g. Crossings Republik, Ghaziabad, Noida"
                                                    className="input-field pl-9 text-sm"
                                                    value={roommateForm.location}
                                                    onChange={e => setRoommateForm(p => ({ ...p, location: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">College / University</label>
                                            <input type="text" placeholder="e.g. ABES EC, IMS Ghaziabad, AKGEC..."
                                                className="input-field text-sm"
                                                value={roommateForm.college}
                                                onChange={e => setRoommateForm(p => ({ ...p, college: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Monthly Budget (₹)</label>
                                            <div className="relative">
                                                <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="number" placeholder="e.g. 6000"
                                                    className="input-field pl-9 text-sm"
                                                    value={roommateForm.budget}
                                                    onChange={e => setRoommateForm(p => ({ ...p, budget: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Move-in Date</label>
                                            <div className="relative">
                                                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="date"
                                                    className="input-field pl-9 text-sm"
                                                    value={roommateForm.move_in_date}
                                                    onChange={e => setRoommateForm(p => ({ ...p, move_in_date: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Roommate Preference</label>
                                            <select className="input-field text-sm"
                                                value={roommateForm.gender_preference}
                                                onChange={e => setRoommateForm(p => ({ ...p, gender_preference: e.target.value }))}>
                                                <option value="any">Any Gender</option>
                                                <option value="male">Male Only</option>
                                                <option value="female">Female Only</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">WhatsApp Number *</label>
                                            <div className="relative">
                                                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input required type="tel" placeholder="+91 XXXXX XXXXX"
                                                    className="input-field pl-9 text-sm"
                                                    value={roommateForm.whatsapp}
                                                    onChange={e => setRoommateForm(p => ({ ...p, whatsapp: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">About You & What You Need</label>
                                            <textarea rows={3} placeholder="I am a 2nd year B.Tech student looking for a clean, quiet roommate. Prefer non-smoker..."
                                                className="input-field text-sm resize-none"
                                                value={roommateForm.description}
                                                onChange={e => setRoommateForm(p => ({ ...p, description: e.target.value }))} />
                                        </div>
                                        <div className="md:col-span-2 flex justify-end">
                                            <button type="submit" disabled={roommateSubmitting}
                                                className="btn-primary py-3 px-8 flex items-center gap-2">
                                                {roommateSubmitting
                                                    ? <><Loader2 size={16} className="animate-spin" /> Posting...</>
                                                    : <><Plus size={16} /> Post Requirement</>
                                                }
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Requests List */}
                        {roommateLoading ? (
                            <div className="flex items-center justify-center py-20 text-slate-400">
                                <Loader2 size={28} className="animate-spin mr-3" /> Loading posts...
                            </div>
                        ) : roommateRequests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {roommateRequests.map((req) => (
                                    <div key={req.$id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                        {/* Card Header */}
                                        <div className="bg-slate-50 p-5 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md">
                                                    {(req.name || req.student?.full_name || 'S').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{req.name || req.student?.full_name || 'Student'}</h4>
                                                    {req.college && (
                                                        <p className="text-xs text-slate-400 font-medium">{req.college}</p>
                                                    )}
                                                </div>
                                                <span className={`ml-auto text-[9px] font-black px-2 py-1 rounded-full uppercase ${req.genderPreference === 'female' ? 'bg-pink-100 text-pink-600'
                                                    : req.genderPreference === 'male' ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {req.genderPreference === 'any' ? 'Any Gender' : req.genderPreference + ' only'}
                                                </span>
                                            </div>
                                            {req.status === 'pending' && req.userId === user.$id && (
                                                <div className="mt-3 flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
                                                    <Clock size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Admin Verification</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <MapPin size={14} className="text-blue-400 shrink-0" />
                                                <span className="truncate">{req.location}</span>
                                            </div>
                                            {req.budget && (
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                    <IndianRupee size={14} className="text-emerald-500 shrink-0" />
                                                    <span>Budget: <span className="font-bold text-slate-900">₹{Number(req.budget).toLocaleString()}/mo</span></span>
                                                </div>
                                            )}
                                            {req.move_in_date && (
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                    <Calendar size={14} className="text-amber-500 shrink-0" />
                                                    <span>Move-in: <span className="font-bold text-slate-900">{new Date(req.move_in_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                                                </div>
                                            )}
                                            {req.description && (
                                                <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2 pt-1">
                                                    {req.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Connect Button */}
                                        {req.whatsapp && req.userId !== user.$id && (
                                            <div className="px-5 pb-5">
                                                <a
                                                    href={`https://wa.me/${req.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi! I saw your roommate requirement on StaySetu. I'm also looking in ${req.location}. Let's connect!`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-2xl transition-all active:scale-95 text-sm shadow-md shadow-green-100"
                                                >
                                                    <Phone size={16} />
                                                    Connect on WhatsApp
                                                </a>
                                            </div>
                                        )}
                                        {req.userId === user.$id && (
                                            <div className="px-5 pb-5">
                                                <span className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-3 rounded-2xl text-sm">
                                                    <CheckCircle size={16} /> Your Post
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-[2.5rem] p-20 text-center border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300 border border-slate-100">
                                    <Users size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">No roommate posts yet</h3>
                                <p className="text-slate-400 font-medium mb-6">Be the first to post your requirement!</p>
                                <button onClick={() => setShowRoommateForm(true)} className="btn-primary">
                                    Post My Requirement
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Saved Properties</h2>
                                <p className="text-slate-400 font-medium text-sm">Your bookmarked stays for easy access.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl">
                                <Heart size={16} fill="currentColor" />
                                <span className="font-bold text-sm">{savedListings.length} saved</span>
                            </div>
                        </div>

                        {savedListings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {savedListings.map((listing) => (
                                    <div key={listing.$id} className="relative">
                                        <PropertyCard property={listing} />
                                        <button
                                            onClick={() => toggleSave(listing.$id)}
                                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center transition-all shadow-sm hover:bg-rose-600"
                                        >
                                            <Heart size={18} fill="currentColor" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-[2.5rem] p-20 text-center border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-rose-300 border border-slate-100">
                                    <Heart size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">No saved stays yet</h3>
                                <p className="text-slate-400 font-medium mb-6">Browse listings and tap the heart to save them here.</p>
                                <button onClick={() => setActiveTab('browse')} className="btn-primary">
                                    Browse Stays
                                </button>
                            </div>
                        )}
                    </div>
                )}


                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="animate-fade-in max-w-2xl">
                        <h2 className="text-2xl font-black text-slate-900 mb-6">My Profile</h2>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Profile Header */}
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                                <div className="relative flex items-center gap-5">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-black border-2 border-white/30">
                                        {profile?.name?.charAt(0)?.toUpperCase() || 'S'}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{profile?.name || 'Student'}</h3>
                                        <p className="text-white/70 font-medium">{user?.email}</p>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest text-white mt-2">
                                            <Shield size={10} />
                                            Student Account
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saved Stays</span>
                                        <p className="text-2xl font-black text-slate-900 mt-1">{stats.saved}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversations</span>
                                        <p className="text-2xl font-black text-slate-900 mt-1">{stats.messages}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</span>
                                                <p className="text-slate-900 font-bold">{profile?.name || 'Not set'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                                                <p className="text-slate-900 font-bold">{user?.email || 'Not set'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member Since</span>
                                                <p className="text-slate-900 font-bold">
                                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Role Switcher ── */}
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Switch Account Type</p>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
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
                                                            if (item.id === 'owner' || item.id === 'broker') navigate('/owner-dashboard');
                                                        }, 800);
                                                    } catch (err) {
                                                        console.error('Role update error:', err);
                                                    } finally {
                                                        setRoleUpdating(false);
                                                    }
                                                }}
                                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 ${
                                                    profile?.role === item.id
                                                        ? 'border-blue-300 bg-blue-50 text-blue-900'
                                                        : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-slate-500'
                                                } disabled:opacity-50`}
                                            >
                                                <item.icon size={18} />
                                                <span className="text-[10px] font-bold mt-1">{item.label}</span>
                                                {profile?.role === item.id && <span className="text-[8px] text-blue-600 font-black uppercase mt-0.5">Current</span>}
                                            </button>
                                        ))}
                                    </div>
                                    {roleSuccess && (
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl text-sm font-bold animate-fade-in">
                                            <CheckCircle size={16} /> Role updated successfully!
                                        </div>
                                    )}
                                    {roleUpdating && (
                                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl text-sm font-bold animate-fade-in">
                                            <Loader2 size={16} className="animate-spin" /> Updating...
                                        </div>
                                    )}
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

export default StudentDashboard;
