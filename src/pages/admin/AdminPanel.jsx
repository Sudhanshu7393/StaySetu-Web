import React, { useState, useEffect } from 'react';
import {
    CheckCircle, Users, Home, MapPin, IndianRupee,
    Clock, Trash2, ShieldCheck, LogOut, Loader2, Plus,
    Upload, X, Image as ImageIcon, Save, Phone, Download, MessageCircle, Brush, Star,
    Share2, PhoneCall, CheckCircle2, Send, Eye, ExternalLink, Calendar,
    ChevronDown, ChevronUp, Mail, FileText
} from 'lucide-react';
import { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { databases, storage, DATABASE_ID, COLLECTION, BUCKET_ID, Query, ID, parseJsonField, getImageUrl } from '../../lib/supabase';
import { forwardLeadToOwner, contactStudentForReview } from '../../lib/whatsappTracker';

const AdminPanel = () => {
    const { user, profile, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('listings');
    const [listings, setListings] = useState([]);
    const [roommates, setRoommates] = useState([]);
    const [whatsappLeads, setWhatsappLeads] = useState([]);
    const [maidServices, setMaidServices] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [stats, setStats] = useState({ users: 0, pending: 0, approved: 0, rented: 0, total: 0, roommate_pending: 0, wa_leads: 0, maid_pending: 0, sold: 0 });
    const [actionLoading, setActionLoading] = useState(null);
    const [editingItem, setEditingItem] = useState(null); // For editing photos
    const [expandedLeadId, setExpandedLeadId] = useState(null);
    const [featuredHeroId, setFeaturedHeroId] = useState(() => localStorage.getItem('staysetu_hero_featured_id') || '69cbc4bc0023a8c61505');
    const fileInputRef = useRef(null);
    const editFileInputRef = useRef(null);

    // Add Listing Form State
    const [formData, setFormData] = useState({
        title: '', price: '', location: '', type: 'PG',
        whatsapp: '', description: '', gender: 'any',
        amenities: []
    });
    const [maidFormData, setMaidFormData] = useState({
        title: '', description: '', location: '', serviceType: 'all-in-one',
        timing: '', price: '', whatsappNumber: '', phoneNumber: '', genderPreference: 'any'
    });
    const [maidImageFile, setMaidImageFile] = useState(null);
    const [maidImagePreview, setMaidImagePreview] = useState(null);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [maidFormLoading, setMaidFormLoading] = useState(false);

    const amenityOptions = ['WiFi', 'AC', 'Food', 'Parking', 'Laundry', 'Security'];

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleAmenity = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploading(true);

        for (const file of files) {
            try {
                const result = await storage.createFile(BUCKET_ID, ID.unique(), file);
                let url = result.url || result.viewUrl || getImageUrl(result.$id);
                if (file.type.startsWith('video/')) {
                    url += (url.includes('?') ? '&' : '?') + 'is_video=true';
                }
                setUploadedImages(prev => [...prev, url]);
            } catch (err) {
                console.error('Upload error:', err);
                alert(`Failed to upload ${file.name}: ${err.message}`);
            }
        }
        setUploading(false);
    };

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'listings' || activeTab === 'sold_listings') {
                const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
                if (activeTab === 'sold_listings') {
                    queries.push(Query.equal('status', 'sold'));
                } else if (filter !== 'all') {
                    queries.push(Query.equal('status', filter));
                }
                const res = await databases.listDocuments(DATABASE_ID, COLLECTION.listings, queries);
                setListings(res.documents);
            } else if (activeTab === 'whatsapp_leads') {
                const queries = [Query.orderDesc('$createdAt'), Query.limit(200)];
                const res = await databases.listDocuments(DATABASE_ID, COLLECTION.whatsappLeads, queries);
                setWhatsappLeads(res.documents);
            } else if (activeTab === 'maids') {
                const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
                if (filter !== 'all') queries.push(Query.equal('status', filter));
                const res = await databases.listDocuments(DATABASE_ID, COLLECTION.maidServices, queries);
                setMaidServices(res.documents);
            } else if (activeTab === 'users') {
                const res = await databases.listDocuments(DATABASE_ID, COLLECTION.profiles, [Query.orderDesc('$createdAt'), Query.limit(200)]);
                setUsersList(res.documents);
            } else if (activeTab !== 'add' && activeTab !== 'add_maid') {
                const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
                if (filter !== 'all') queries.push(Query.equal('status', filter));
                const res = await databases.listDocuments(DATABASE_ID, COLLECTION.roommateRequests, queries);
                setRoommates(res.documents);
            }

            // Fetch stats
            const [profilesRes, pendingRes, approvedRes, rentedRes, totalRes, rmPendingRes, waLeadsRes, maidPendingRes, soldRes] = await Promise.all([
                databases.listDocuments(DATABASE_ID, COLLECTION.profiles, [Query.limit(1)]),
                databases.listDocuments(DATABASE_ID, COLLECTION.listings, [Query.equal('status', 'pending'), Query.limit(1)]),
                databases.listDocuments(DATABASE_ID, COLLECTION.listings, [Query.equal('status', 'approved'), Query.limit(1)]),
                databases.listDocuments(DATABASE_ID, COLLECTION.listings, [Query.equal('status', 'rented'), Query.limit(1)]),
                databases.listDocuments(DATABASE_ID, COLLECTION.listings, [Query.limit(1)]),
                databases.listDocuments(DATABASE_ID, COLLECTION.roommateRequests, [Query.equal('status', 'pending'), Query.limit(1)]),
                databases.listDocuments(DATABASE_ID, COLLECTION.whatsappLeads, [Query.limit(1)]).catch(() => ({ total: 0 })),
                databases.listDocuments(DATABASE_ID, COLLECTION.maidServices, [Query.equal('status', 'pending'), Query.limit(1)]).catch(() => ({ total: 0 })),
                databases.listDocuments(DATABASE_ID, COLLECTION.listings, [Query.equal('status', 'sold'), Query.limit(1)]).catch(() => ({ total: 0 })),
            ]);

            setStats({
                users: profilesRes.total || 0,
                pending: pendingRes.total || 0,
                approved: approvedRes.total || 0,
                rented: rentedRes.total || 0,
                total: totalRes.total || 0,
                roommate_pending: rmPendingRes.total || 0,
                wa_leads: waLeadsRes.total || 0,
                maid_pending: maidPendingRes.total || 0,
                sold: soldRes.total || 0,
            });
        } catch (err) {
            console.error('Fetch error:', err);
        }
        setLoading(false);
    }, [filter, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const submitListing = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION.listings, ID.unique(), {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                location: formData.location,
                type: formData.type,
                whatsappNumber: formData.whatsapp,
                genderPreference: formData.gender || 'any',
                amenities: JSON.stringify(formData.amenities),
                images: JSON.stringify(uploadedImages),
                ownerId: user.$id,
                status: 'approved',
                featured: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            alert('Property listed successfully!');
            setFormData({ title: '', price: '', location: '', type: 'PG', whatsapp: '', description: '', gender: 'any', amenities: [] });
            setUploadedImages([]);
            setActiveTab('listings');
            fetchData();
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setFormLoading(false);
    };

    const submitMaidService = async (e) => {
        e.preventDefault();
        setMaidFormLoading(true);
        try {
            let imageId = null;
            if (maidImageFile) {
                const uploadRes = await storage.createFile(BUCKET_ID, ID.unique(), maidImageFile);
                imageId = uploadRes.$id;
            }

            await databases.createDocument(DATABASE_ID, COLLECTION.maidServices, ID.unique(), {
                title: maidFormData.title,
                description: maidFormData.description,
                location: maidFormData.location,
                serviceType: maidFormData.serviceType,
                timing: maidFormData.timing,
                price: maidFormData.price ? parseFloat(maidFormData.price) : null,
                whatsappNumber: maidFormData.whatsappNumber,
                phoneNumber: maidFormData.phoneNumber,
                postedBy: user.$id,
                posterName: 'Admin',
                genderPreference: maidFormData.genderPreference,
                image: imageId,
                status: 'approved', // Admin posts are auto-approved
                createdAt: new Date().toISOString(),
            });

            alert('Maid service posted successfully!');
            setMaidFormData({ title: '', description: '', location: '', serviceType: 'all-in-one', timing: '', price: '', whatsappNumber: '', phoneNumber: '', genderPreference: 'any' });
            setMaidImageFile(null);
            setMaidImagePreview(null);
            setActiveTab('maids');
            fetchData();
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setMaidFormLoading(false);
    };


    const getCollectionForTab = () => {
        if (activeTab === 'listings' || activeTab === 'sold_listings') return COLLECTION.listings;
        if (activeTab === 'maids') return COLLECTION.maidServices;
        return COLLECTION.roommateRequests;
    };

    const approve = async (id) => {
        setActionLoading(id + '_approve');
        try {
            await databases.updateDocument(DATABASE_ID, getCollectionForTab(), id, { status: 'approved' });
            await fetchData();
        } catch (err) {
            console.error('Approve error:', err);
        }
        setActionLoading(null);
    };

    const toggleRented = async (id, currentStatus) => {
        const newStatus = currentStatus === 'rented' ? 'approved' : 'rented';
        setActionLoading(id + '_rented');
        try {
            await databases.updateDocument(DATABASE_ID, getCollectionForTab(), id, { status: newStatus });
            await fetchData();
        } catch (err) {
            console.error('Toggle rented error:', err);
        }
        setActionLoading(null);
    };

    const toggleSold = async (id, currentStatus) => {
        const newStatus = currentStatus === 'sold' ? 'approved' : 'sold';
        setActionLoading(id + '_sold');
        try {
            await databases.updateDocument(DATABASE_ID, getCollectionForTab(), id, { status: newStatus });
            await fetchData();
        } catch (err) {
            console.error('Toggle sold error:', err);
        }
        setActionLoading(null);
    };

    const reject = async (id) => {
        if (!window.confirm('Permanently DELETE this item?')) return;
        setActionLoading(id + '_reject');
        try {
            await databases.deleteDocument(DATABASE_ID, getCollectionForTab(), id);
            if (activeTab === 'listings' || activeTab === 'sold_listings') setListings(prev => prev.filter(l => l.$id !== id));
            else if (activeTab === 'maids') setMaidServices(prev => prev.filter(m => m.$id !== id));
            else setRoommates(prev => prev.filter(r => r.$id !== id));
        } catch (err) {
            console.error('Reject error:', err);
        }
        setActionLoading(null);
    };

    const deleteLead = async (id) => {
        if (!window.confirm('Delete this inquiry / WhatsApp lead permanently?')) return;
        setActionLoading(id + '_lead_del');
        try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION.whatsappLeads, id);
            setWhatsappLeads(prev => prev.filter(l => (l.$id || l.id) !== id));
            setStats(prev => ({ ...prev, wa_leads: Math.max(0, (prev.wa_leads || 1) - 1) }));
        } catch (err) {
            console.error('Delete lead error:', err);
            alert('Failed to delete lead: ' + err.message);
        }
        setActionLoading(null);
    };

    const handleEditImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length || !editingItem) return;
        setUploading(true);
        const newImages = [...(parseJsonField(editingItem.images) || [])];

        for (const file of files) {
            try {
                const result = await storage.createFile(BUCKET_ID, ID.unique(), file);
                let url = result.url || result.viewUrl || getImageUrl(result.$id);
                if (file.type.startsWith('video/')) {
                    url += (url.includes('?') ? '&' : '?') + 'is_video=true';
                }
                newImages.push(url);
            } catch (err) {
                console.error('Upload error:', err);
            }
        }

        setEditingItem(prev => ({ ...prev, images: JSON.stringify(newImages) }));
        setUploading(false);
    };

    const saveEditedItem = async () => {
        if (!editingItem) return;
        setActionLoading(editingItem.$id + '_save');
        try {
            await databases.updateDocument(DATABASE_ID, getCollectionForTab(), editingItem.$id, {
                images: editingItem.images
            });
            await fetchData();
            setEditingItem(null);
            alert('Photos updated successfully!');
        } catch (err) {
            alert('Save error: ' + err.message);
        }
        setActionLoading(null);
    };

    return (
        <div className="min-h-screen bg-white pt-20 sm:pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 20px -4px rgba(99,102,241,0.3)' }}>
                                <ShieldCheck size={20} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
                        </div>
                        <p className="text-slate-400 font-normal text-sm">
                            Logged in as <span className="font-semibold text-slate-700">{profile?.fullName || profile?.name || user?.email}</span>
                            <span className="ml-2 text-[10px] font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">Admin</span>
                        </p>
                    </div>
                    <button
                        onClick={signOut}
                        className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
                    >
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                    {[
                        { label: 'Users', value: stats.users, icon: Users, gradient: 'from-blue-500 to-purple-600' },
                        { label: 'Listings', value: stats.total, icon: Home, gradient: 'from-blue-950 to-blue-600' },
                        { label: 'Pending', value: stats.pending, icon: Clock, gradient: 'from-amber-500 to-orange-600' },
                        { label: 'Live', value: stats.approved, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-600' },
                        { label: 'Rented', value: stats.rented, icon: Home, gradient: 'from-indigo-500 to-blue-600' },
                        { label: 'Sold Out', value: stats.sold, icon: ShieldCheck, gradient: 'from-red-500 to-pink-600' },
                        { label: 'WA Leads', value: stats.wa_leads, icon: Phone, gradient: 'from-green-500 to-emerald-600' },
                        { label: 'Maid Req', value: stats.maid_pending, icon: Brush, gradient: 'from-amber-500 to-yellow-600' },
                    ].map((s, i) => (
                        <div key={i} className="card-elevated p-5 flex flex-col gap-2">
                            <div className={`bg-gradient-to-br ${s.gradient} w-10 h-10 rounded-xl flex items-center justify-center text-white`}
                                style={{ boxShadow: '0 4px 12px -2px rgba(0,0,0,0.15)' }}>
                                <s.icon size={18} />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 leading-none">{s.value}</p>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="card-elevated overflow-hidden">
                    {/* Tab Switcher */}
                    <div className="flex border-b border-slate-100/80 overflow-x-auto scrollbar-none">
                        <button
                            onClick={() => { setActiveTab('listings'); setFilter('pending'); }}
                            className={`px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === 'listings'
                                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Properties ({stats.total})
                        </button>
                        <button
                            onClick={() => { setActiveTab('roommates'); setFilter('pending'); }}
                            className={`px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === 'roommates'
                                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Roommate Req ({stats.roommate_pending})
                        </button>
                        <button
                            onClick={() => { setActiveTab('sold_listings'); }}
                            className={`px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === 'sold_listings'
                                ? 'text-red-600 border-b-2 border-red-500 bg-red-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Sold Out ({stats.sold})
                        </button>
                        <button
                            onClick={() => setActiveTab('add')}
                            className={`px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === 'add'
                                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            + Add Property
                        </button>
                        <button
                            onClick={() => { setActiveTab('whatsapp_leads'); }}
                            className={`px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${activeTab === 'whatsapp_leads'
                                ? 'text-green-600 border-b-2 border-green-500 bg-green-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <MessageCircle size={14} /> WA Leads ({stats.wa_leads})
                        </button>
                        <button
                            onClick={() => { setActiveTab('maids'); setFilter('pending'); }}
                            className={`px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${activeTab === 'maids'
                                ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Brush size={14} /> Maids ({stats.maid_pending})
                        </button>
                        <button
                            onClick={() => { setActiveTab('users'); }}
                            className={`px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${activeTab === 'users'
                                ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Users size={14} /> Users ({stats.users})
                        </button>
                        <button
                            onClick={() => { setActiveTab('add_maid'); }}
                            className={`px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${activeTab === 'add_maid'
                                ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Plus size={14} /> Post Maid
                        </button>
                    </div>

                    {/* Filter Bar */}
                    {activeTab !== 'add' && activeTab !== 'add_maid' && activeTab !== 'whatsapp_leads' && activeTab !== 'users' && activeTab !== 'sold_listings' && (
                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                {activeTab === 'listings' ? 'Listing Verification' : activeTab === 'maids' ? 'Maid Service Approvals' : 'Student Requirements'}
                            </h3>
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100/60">
                                {[
                                    { key: 'pending', label: 'Pending' },
                                    { key: 'approved', label: 'Approved' },
                                    { key: 'rented', label: 'Rented' },
                                    { key: 'all', label: 'All' },
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key)}
                                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === key
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'whatsapp_leads' ? (
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <MessageCircle className="text-emerald-500" size={20} />
                                        Concierge Lead Desk (StaySetu WhatsApp & Visit Leads)
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        All user inquiries captured at +91 7393011350 with complete contact details, visit slots, and landlord info.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const csv = ['User Name,User Phone,User Email,Listing,Owner Name,Owner Phone,Source,Time,Full Message'];
                                        whatsappLeads.forEach(l => {
                                            const sPhone = l.studentPhone || l.phoneNumber || '';
                                            const sName = l.studentName || l.clickerName || 'User';
                                            const sEmail = l.studentEmail || l.clickerEmail || '';
                                            const oName = l.ownerName || 'Owner';
                                            const oPhone = l.ownerPhone || '';
                                            const cleanMsg = (l.message || '').replace(/"/g, '""');
                                            csv.push(`"${sName}","${sPhone}","${sEmail}","${l.listingTitle || ''}","${oName}","${oPhone}","${l.source}","${l.clickedAt || l.$createdAt}","${cleanMsg}"`);
                                        });
                                        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a'); a.href = url; a.download = `staysetu-leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                                    }}
                                    className="btn-secondary flex items-center gap-2 text-xs py-2 px-4 shrink-0"
                                >
                                    <Download size={14} /> Export Leads CSV
                                </button>
                            </div>

                            {loading ? (
                                <div className="py-20 text-center"><Loader2 size={28} className="animate-spin mx-auto text-slate-300" /></div>
                            ) : whatsappLeads.length > 0 ? (
                                <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-emerald-50/70 border-b border-emerald-100">
                                                <th className="px-4 py-3.5 text-[10px] font-bold text-emerald-950 uppercase tracking-wider">#</th>
                                                <th className="px-4 py-3.5 text-[10px] font-bold text-emerald-950 uppercase tracking-wider">User / Buyer Contact</th>
                                                <th className="px-4 py-3.5 text-[10px] font-bold text-emerald-950 uppercase tracking-wider">Property & Owner</th>
                                                <th className="px-4 py-3.5 text-[10px] font-bold text-emerald-950 uppercase tracking-wider">Visit & Timeline Details</th>
                                                <th className="px-4 py-3.5 text-[10px] font-bold text-emerald-950 uppercase tracking-wider text-right">Concierge Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {whatsappLeads.map((lead, i) => {
                                                const rawMsg = lead.message || '';
                                                let sPhone = lead.studentPhone || lead.phoneNumber || '';
                                                let cleanSPhone = (sPhone || '').replace(/\D/g, '');
                                                if (cleanSPhone.length < 10 && rawMsg) {
                                                    const match = rawMsg.match(/(?:📞|WhatsApp|Call|Phone|Ph:?)\s*(?:\+?91)?\s*([6-9]\d{9})/i);
                                                    if (match && match[1]) {
                                                        cleanSPhone = match[1];
                                                        sPhone = match[1];
                                                    }
                                                }

                                                const sName = lead.studentName || lead.clickerName || 'User';
                                                const sEmail = lead.studentEmail || lead.clickerEmail || '';
                                                const oName = lead.ownerName || 'Property Owner';
                                                let oPhone = lead.ownerPhone || '';
                                                let cleanOPhone = (oPhone || '').replace(/\D/g, '');
                                                if (cleanOPhone.length < 10 && rawMsg) {
                                                    const match = rawMsg.match(/Listing Owner:.*?\(Ph:\s*(\d{10})/i);
                                                    if (match && match[1]) {
                                                        cleanOPhone = match[1];
                                                        oPhone = match[1];
                                                    }
                                                }

                                                // Extract quick highlights from message
                                                const slotMatch = rawMsg.match(/(?:Preferred Visit Time|Preferred Visit|Scheduled Visit):\s*([^\n\r]+)/i);
                                                const timelineMatch = rawMsg.match(/(?:Purchase Timeline|Move-in):\s*([^\n\r]+)/i);
                                                const prefMatch = rawMsg.match(/(?:Preference):\s*([^\n\r]+)/i);

                                                const isVisit = (lead.source || '').toLowerCase().includes('visit');
                                                const isExpanded = expandedLeadId === (lead.$id || i);

                                                return (
                                                    <React.Fragment key={lead.$id || i}>
                                                        <tr className={`transition-colors text-sm ${isExpanded ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'}`}>
                                                            <td className="px-4 py-3.5 text-xs text-slate-400 font-mono align-top">
                                                                {i + 1}
                                                            </td>

                                                            {/* User Contact */}
                                                            <td className="px-4 py-3.5 align-top">
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                                                                            {sName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm block truncate">{sName}</span>
                                                                            {sEmail && (
                                                                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                                    <Mail size={9} className="shrink-0" />
                                                                                    <span className="truncate max-w-[140px]">{sEmail}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {cleanSPhone ? (
                                                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                                            <a
                                                                                href={`tel:${cleanSPhone}`}
                                                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-full transition-colors"
                                                                                title="Call User Directly"
                                                                            >
                                                                                <Phone size={10} className="text-emerald-600" />
                                                                                <span>{cleanSPhone}</span>
                                                                            </a>
                                                                            <a
                                                                                href={`https://wa.me/91${cleanSPhone}?text=${encodeURIComponent(`Hi ${sName}, this is StaySetu Concierge team regarding your inquiry for "${lead.listingTitle || 'our property'}". How may I assist you?`)}`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors"
                                                                                title="Direct WhatsApp Chat with User"
                                                                            >
                                                                                <MessageCircle size={10} />
                                                                                <span>WhatsApp</span>
                                                                            </a>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium">No phone provided</span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Property & Landlord */}
                                                            <td className="px-4 py-3.5 align-top">
                                                                <div className="max-w-[240px] space-y-1.5">
                                                                    {lead.listingId ? (
                                                                        <a
                                                                            href={`/property/${lead.listingId}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 line-clamp-1"
                                                                        >
                                                                            <span>{lead.listingTitle || 'StaySetu Property'}</span>
                                                                            <ExternalLink size={10} className="shrink-0" />
                                                                        </a>
                                                                    ) : (
                                                                        <p className="font-bold text-xs text-slate-900 line-clamp-1">{lead.listingTitle || 'StaySetu Property'}</p>
                                                                    )}

                                                                    <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-1">
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Owner / Host</span>
                                                                            <span className="font-semibold text-slate-800 text-[11px] truncate">{oName}</span>
                                                                        </div>
                                                                        {cleanOPhone && (
                                                                            <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-200/50">
                                                                                <a href={`tel:${cleanOPhone}`} className="text-[10px] font-mono text-slate-600 hover:text-slate-900 flex items-center gap-0.5">
                                                                                    <Phone size={9} /> {cleanOPhone}
                                                                                </a>
                                                                                <a
                                                                                    href={`https://wa.me/91${cleanOPhone}`}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                                                                                >
                                                                                    <MessageCircle size={9} /> Chat
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Inquiry & Visit Details */}
                                                            <td className="px-4 py-3.5 align-top">
                                                                <div className="space-y-1 max-w-[240px]">
                                                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                                        <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                                            isVisit 
                                                                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        }`}>
                                                                            {isVisit ? '🗓️ Visit Request' : '💬 WhatsApp Chat'}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                                            {new Date(lead.clickedAt || lead.$createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>

                                                                    {slotMatch && (
                                                                        <div className="text-[11px] font-bold text-slate-800 bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                            <Clock size={11} className="text-amber-600 shrink-0" />
                                                                            <span className="truncate">{slotMatch[1].trim()}</span>
                                                                        </div>
                                                                    )}

                                                                    {timelineMatch && (
                                                                        <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                                                            <span className="font-semibold text-slate-500">Timeline:</span>
                                                                            <span className="font-medium text-slate-800 truncate">{timelineMatch[1].trim()}</span>
                                                                        </div>
                                                                    )}

                                                                    {prefMatch && (
                                                                        <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                                                            <span className="font-semibold text-slate-500">Pref:</span>
                                                                            <span className="font-medium text-slate-800 truncate">{prefMatch[1].trim()}</span>
                                                                        </div>
                                                                    )}

                                                                    {rawMsg && (
                                                                        <button
                                                                            onClick={() => setExpandedLeadId(isExpanded ? null : (lead.$id || i))}
                                                                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 transition-colors"
                                                                        >
                                                                            <FileText size={11} />
                                                                            <span>{isExpanded ? 'Hide Notes' : 'View Message Notes'}</span>
                                                                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="px-4 py-3.5 align-top text-right">
                                                                <div className="flex flex-col items-end gap-1.5">
                                                                    <button
                                                                        onClick={() => forwardLeadToOwner({
                                                                            ownerPhone: cleanOPhone || oPhone,
                                                                            ownerName: oName,
                                                                            studentName: sName,
                                                                            studentPhone: cleanSPhone || sPhone,
                                                                            listingTitle: lead.listingTitle,
                                                                        })}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors w-fit"
                                                                        title="Forward student contact & visit request to Landlord on WhatsApp"
                                                                    >
                                                                        <Share2 size={12} />
                                                                        <span>Forward to Owner</span>
                                                                    </button>

                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => contactStudentForReview({
                                                                                studentPhone: cleanSPhone || sPhone,
                                                                                studentName: sName,
                                                                                listingTitle: lead.listingTitle,
                                                                            })}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                                                                            title="Contact user for review"
                                                                        >
                                                                            <PhoneCall size={11} />
                                                                            <span>Follow-up</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => deleteLead(lead.$id || lead.id)}
                                                                            disabled={actionLoading === (lead.$id || lead.id) + '_lead_del'}
                                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                                                                            title="Delete Lead"
                                                                        >
                                                                            {actionLoading === (lead.$id || lead.id) + '_lead_del' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Expanded Message View */}
                                                        {isExpanded && rawMsg && (
                                                            <tr className="bg-emerald-50/50">
                                                                <td colSpan={5} className="px-6 py-4 border-t border-emerald-100">
                                                                    <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs space-y-2">
                                                                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-900">
                                                                            <span className="flex items-center gap-1.5">
                                                                                <MessageCircle size={14} className="text-emerald-600" />
                                                                                Full Inquiry / Visit Message Sent by User
                                                                            </span>
                                                                            <span className="text-[10px] font-mono text-slate-400">
                                                                                Lead ID: {(lead.$id || lead.id || '').slice(0, 12)}
                                                                            </span>
                                                                        </div>
                                                                        <pre className="text-xs font-sans text-slate-800 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200/70 leading-relaxed">
                                                                            {rawMsg}
                                                                        </pre>
                                                                        <div className="flex items-center justify-end gap-2 pt-1">
                                                                            {cleanSPhone && (
                                                                                <a
                                                                                    href={`https://wa.me/91${cleanSPhone}?text=${encodeURIComponent(rawMsg)}`}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                                >
                                                                                    <MessageCircle size={12} />
                                                                                    <span>Reply on WhatsApp</span>
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                                        <MessageCircle size={24} />
                                    </div>
                                    <p className="text-slate-500 font-bold">No WhatsApp leads yet.</p>
                                    <p className="text-slate-400 text-xs mt-1">When users request a visit or click WhatsApp, their complete details and visit slots appear here.</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'maids' ? (
                        <div className="p-6">
                            {loading ? (
                                <div className="py-20 text-center"><Loader2 size={28} className="animate-spin mx-auto text-slate-300" /></div>
                            ) : maidServices.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-amber-50/50">
                                                <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Service</th>
                                                <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                                                <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                                                <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                                                <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                                                <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {maidServices.map((m) => (
                                                <tr key={m.$id} className="hover:bg-amber-50/30 transition-colors text-sm">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {m.image ? (
                                                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-amber-100">
                                                                    <img src={getImageUrl(m.image)} className="w-full h-full object-cover" alt="" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 border border-amber-100 text-amber-500">
                                                                    <Brush size={14} />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{m.title}</p>
                                                                <p className="text-[10px] text-slate-400 font-semibold truncate">by {m.posterName || 'Unknown'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">{m.serviceType || 'all-in-one'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500"><span className="flex items-center gap-1"><MapPin size={10} />{m.location}</span></td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
                                                                WA: {m.whatsappNumber || '-'}
                                                            </span>
                                                            {m.phoneNumber && (
                                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 w-fit">
                                                                    PH: {m.phoneNumber}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{m.price ? `₹${Number(m.price).toLocaleString()}` : '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={m.status === 'approved' ? 'chip-approved' : 'chip-pending'}>{m.status === 'approved' ? 'Live' : 'Pending'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1.5">
                                                            {m.status !== 'approved' && (
                                                                <button onClick={() => approve(m.$id)} disabled={actionLoading === m.$id + '_approve'}
                                                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1">
                                                                    {actionLoading === m.$id + '_approve' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />} Approve
                                                                </button>
                                                            )}
                                                            <button onClick={() => reject(m.$id)} disabled={actionLoading === m.$id + '_reject'}
                                                                className="bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1">
                                                                {actionLoading === m.$id + '_reject' ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />} Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-300"><Brush size={24} /></div>
                                    <p className="text-slate-400 font-medium">No {filter === 'all' ? '' : filter} maid services found.</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'add' ? (
                        <div className="p-8 max-w-4xl mx-auto">
                            <form onSubmit={submitListing} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Title</label>
                                        <input name="title" required value={formData.title} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none" placeholder="e.g. Modern PG Near Campus" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Monthly Price</label>
                                        <input name="price" type="number" required value={formData.price} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none" placeholder="e.g. 8500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                                        <input name="location" required value={formData.location} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none" placeholder="e.g. Knowledge Park 2" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">WhatsApp Number</label>
                                        <input name="whatsapp" required value={formData.whatsapp} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none" placeholder="+91 XXXX XXXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Property Type</label>
                                        <select name="type" value={formData.type} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none">
                                            <option>PG</option>
                                            <option>Flat</option>
                                            <option>Hostel</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Gender Preference</label>
                                        <select name="gender" value={formData.gender} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none">
                                            <option value="any">Any</option>
                                            <option value="boys">Boys Only</option>
                                            <option value="girls">Girls Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none h-24" placeholder="Describe the property, rules, etc." />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Amenities</label>
                                    <div className="flex flex-wrap gap-2">
                                        {amenityOptions.map(opt => (
                                            <button
                                                key={opt} type="button"
                                                onClick={() => toggleAmenity(opt)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${formData.amenities.includes(opt)
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Photos & Videos (Required)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {uploadedImages.map((url, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 relative group">
                                                {url.includes('is_video=true') ? (
                                                    <video src={url} className="w-full h-full object-cover" muted playsInline loop autoPlay />
                                                ) : (
                                                    <img src={url} className="w-full h-full object-cover" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current.click()}
                                            disabled={uploading}
                                            className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all bg-slate-50/50"
                                        >
                                            {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                                            <span className="text-[10px] font-bold mt-2 uppercase tracking-wider">{uploading ? 'Uploading...' : 'Add Media'}</span>
                                        </button>
                                    </div>
                                    <input type="file" multiple ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*,video/*" />
                                </div>

                                <button
                                    type="submit"
                                    disabled={formLoading || uploadedImages.length === 0}
                                    className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 text-sm"
                                >
                                    {formLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                    {formLoading ? 'Publishing...' : 'Publish Verified Stay'}
                                </button>
                            </form>
                        </div>
                    ) : activeTab === 'add_maid' ? (
                        <div className="p-8 max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Post New Maid Service</h3>
                            <form onSubmit={submitMaidService} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Service Title</label>
                                    <input required value={maidFormData.title} onChange={(e) => setMaidFormData({ ...maidFormData, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none" placeholder="e.g. Experienced Cook Available" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Service Type</label>
                                        <select value={maidFormData.serviceType} onChange={(e) => setMaidFormData({ ...maidFormData, serviceType: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none">
                                            <option value="all-in-one">All-in-One</option>
                                            <option value="cooking">Cooking</option>
                                            <option value="cleaning">Cleaning</option>
                                            <option value="laundry">Laundry</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Monthly Price</label>
                                        <input type="number" required value={maidFormData.price} onChange={(e) => setMaidFormData({ ...maidFormData, price: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none" placeholder="e.g. 3500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                                    <input required value={maidFormData.location} onChange={(e) => setMaidFormData({ ...maidFormData, location: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none" placeholder="e.g. Pari Chowk, Greater Noida" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">WhatsApp Number</label>
                                        <input required value={maidFormData.whatsappNumber} onChange={(e) => setMaidFormData({ ...maidFormData, whatsappNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none" placeholder="+91 XXXX XXXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                                        <input required value={maidFormData.phoneNumber} onChange={(e) => setMaidFormData({ ...maidFormData, phoneNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none" placeholder="+91 XXXX XXXX" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Maid Photo</label>
                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-300 transition-all overflow-hidden bg-slate-50/50"
                                    >
                                        {maidImagePreview ? (
                                            <img src={maidImagePreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Upload size={24} className="text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Click to upload photo</span>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setMaidImageFile(file);
                                            setMaidImagePreview(URL.createObjectURL(file));
                                        }
                                    }} className="hidden" accept="image/*" />
                                </div>
                                <button
                                    type="submit"
                                    disabled={maidFormLoading}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-amber-200 transition-all"
                                >
                                    {maidFormLoading ? <Loader2 size={20} className="animate-spin" /> : <Brush size={20} />}
                                    {maidFormLoading ? 'Publishing...' : 'Publish Maid Service'}
                                </button>
                            </form>
                        </div>
                    ) : activeTab === 'users' ? (
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Registered Users</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-purple-50/50">
                                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Join Date</th>
                                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {usersList.map((u) => (
                                            <tr key={u.$id} className="hover:bg-purple-50/30 transition-colors text-sm">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                                            {u.name?.charAt(0) || u.fullName?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900">{u.name || u.fullName || 'No Name'}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">Click to see more</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${u.role === 'owner' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                                        {u.role || 'Student'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500">
                                                    {new Date(u.$createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[10px] text-slate-300">{u.$id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                            {activeTab === 'listings' || activeTab === 'sold_listings' ? 'Property' : 'Student'}
                                        </th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                            {activeTab === 'listings' || activeTab === 'sold_listings' ? 'Type / Rent' : 'College / Budget'}
                                        </th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        Array(4).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={7} className="px-6 py-5">
                                                    <div className="h-8 bg-slate-50 rounded-xl w-full" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (activeTab === 'listings' || activeTab === 'sold_listings' ? listings : roommates).length > 0 ? (activeTab === 'listings' || activeTab === 'sold_listings' ? listings : roommates).map((item) => (
                                        <tr key={item.$id} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{item.$id.slice(-6)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {activeTab === 'listings' || activeTab === 'sold_listings' ? (
                                                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100/60">
                                                            {parseJsonField(item.images)?.[0]?.includes('is_video=true') ? (
                                                                <video
                                                                    src={parseJsonField(item.images)?.[0]}
                                                                    className="w-full h-full object-cover"
                                                                    muted playsInline loop autoPlay
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={parseJsonField(item.images)?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200&q=80'}
                                                                    className="w-full h-full object-cover"
                                                                    alt=""
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-semibold">
                                                            {(item.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-slate-900 truncate max-w-[180px]">
                                                            {activeTab === 'listings' || activeTab === 'sold_listings' ? item.title : (item.name || 'Student')}
                                                        </h4>
                                                        <span className="text-[10px] font-medium text-slate-400 block italic">
                                                            {activeTab === 'listings' || activeTab === 'sold_listings' ? `Owner: ${item.owner_name || item.ownerName || item.owner?.full_name || 'Direct Owner'}` : `ID: ${item.$id.slice(0, 8)}...`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {(item.whatsappNumber || item.whatsapp || item.owner_phone) ? (
                                                        <a
                                                            href={`https://wa.me/91${String(item.whatsappNumber || item.whatsapp || item.owner_phone).replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full w-fit flex items-center gap-1 transition-colors"
                                                            title="Chat with Owner on WhatsApp"
                                                        >
                                                            <MessageCircle size={10} /> WA: {item.whatsappNumber || item.whatsapp || item.owner_phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full w-fit">
                                                            WA: -
                                                        </span>
                                                    )}
                                                    {(item.phoneNumber || item.phone || item.owner_phone) && (
                                                        <a
                                                            href={`tel:${String(item.phoneNumber || item.phone || item.owner_phone).replace(/\D/g, '')}`}
                                                            className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-full w-fit flex items-center gap-1 transition-colors"
                                                            title="Call Owner Directly"
                                                        >
                                                            <Phone size={9} /> PH: {item.phoneNumber || item.phone || item.owner_phone}
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md text-slate-500 block mb-1 w-fit border border-slate-100/60">
                                                    {activeTab === 'listings' || activeTab === 'sold_listings' ? item.type : (item.college || 'N/A')}
                                                </span>
                                                <span className="text-sm font-bold text-slate-900 flex items-center">
                                                    <IndianRupee size={12} className="mr-0.5" />{Number(item.budget || item.price || 0).toLocaleString()}/mo
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-slate-500 font-normal max-w-[150px] gap-1.5">
                                                    <MapPin size={12} className="text-blue-400 shrink-0" />
                                                    <span className="truncate text-xs">{item.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={item.status === 'approved' ? 'chip-approved' : item.status === 'rented' ? 'bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider' : item.status === 'sold' ? 'bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider' : 'chip-pending'}>
                                                    {item.status === 'approved' ? 'Live' : item.status === 'rented' ? 'Rented' : item.status === 'sold' ? 'Sold Out' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(activeTab === 'listings' || activeTab === 'sold_listings') && (
                                                        <>
                                                            <a
                                                                href={`/property/${item.$id}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-90 border border-slate-200/80"
                                                                title="Preview Property Page"
                                                            >
                                                                <Eye size={14} />
                                                            </a>
                                                            <button
                                                                onClick={() => {
                                                                    localStorage.setItem('staysetu_hero_featured_id', item.$id);
                                                                    setFeaturedHeroId(item.$id);
                                                                    alert(`"${item.title}" is now featured on the Main Page Hero!`);
                                                                }}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 border ${
                                                                    featuredHeroId === item.$id
                                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                                                        : 'bg-amber-50 text-amber-600 border-amber-200/80 hover:bg-amber-100'
                                                                }`}
                                                                title={featuredHeroId === item.$id ? "Currently featured on Main Page Hero" : "Set as Main Page Hero Feature"}
                                                            >
                                                                <Star size={14} className={featuredHeroId === item.$id ? "fill-white" : ""} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingItem(item)}
                                                                className="w-8 h-8 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition-all active:scale-90 border border-amber-100/60"
                                                                title="Edit Photos"
                                                            >
                                                                <ImageIcon size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleRented(item.$id, item.status)}
                                                                disabled={actionLoading === item.$id + '_rented'}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 border ${item.status === 'rented' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-600 border-indigo-100/60'}`}
                                                                title={item.status === 'rented' ? 'Mark as Available' : 'Mark as Rented'}
                                                            >
                                                                {actionLoading === item.$id + '_rented' ? <Loader2 size={14} className="animate-spin" /> : <Home size={14} />}
                                                            </button>
                                                            <button
                                                                onClick={() => toggleSold(item.$id, item.status)}
                                                                disabled={actionLoading === item.$id + '_sold'}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 border ${item.status === 'sold' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-600 border-red-100/60'}`}
                                                                title={item.status === 'sold' ? "Mark as Available" : "Mark as Sold Out"}
                                                            >
                                                                {actionLoading === item.$id + '_sold' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                                            </button>
                                                        </>
                                                    )}
                                                    {item.status !== 'approved' && item.status !== 'rented' && item.status !== 'sold' && (
                                                        <button
                                                            onClick={() => approve(item.$id)}
                                                            disabled={actionLoading === item.$id + '_approve'}
                                                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-90 disabled:opacity-50 shadow-xs"
                                                            title="Approve Listing & Go Live"
                                                        >
                                                            {actionLoading === item.$id + '_approve' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                                            <span>Approve</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => reject(item.$id)}
                                                        disabled={actionLoading === item.$id + '_reject'}
                                                        className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 border border-red-100/60"
                                                    >
                                                        {actionLoading === item.$id + '_reject' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                    {activeTab === 'listings' || activeTab === 'sold_listings' ? <Home size={24} /> : <Users size={24} />}
                                                </div>
                                                <p className="text-slate-400 font-medium">No {activeTab === 'sold_listings' ? 'sold properties' : `${filter} items`} found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Editor Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-scale-in">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Edit Listing Photos</h3>
                                <p className="text-xs text-slate-400 font-medium">{editingItem.title}</p>
                            </div>
                            <button onClick={() => setEditingItem(null)} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {parseJsonField(editingItem.images)?.map((url, i) => (
                                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 relative group">
                                        {url?.includes('is_video=true') ? (
                                            <video src={url} className="w-full h-full object-cover" muted playsInline loop autoPlay />
                                        ) : (
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = parseJsonField(editingItem.images) || [];
                                                const updated = current.filter((_, idx) => idx !== i);
                                                setEditingItem(prev => ({ ...prev, images: JSON.stringify(updated) }));
                                            }}
                                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => editFileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                                >
                                    {uploading ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <Upload size={24} className="group-hover:scale-110 transition-transform" />}
                                    <span className="text-[10px] font-bold mt-2 uppercase tracking-wider">{uploading ? 'Uploading...' : 'Add Photos'}</span>
                                </button>
                            </div>
                            <input type="file" multiple ref={editFileInputRef} onChange={handleEditImageUpload} className="hidden" accept="image/*,video/*" />
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={saveEditedItem}
                                disabled={actionLoading === editingItem.$id + '_save' || uploading}
                                className="flex-1 btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                            >
                                {actionLoading === editingItem.$id + '_save' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {actionLoading === editingItem.$id + '_save' ? 'Saving Changes...' : 'Save Photos'}
                            </button>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
