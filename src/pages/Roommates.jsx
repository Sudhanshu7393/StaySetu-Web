import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTION, Query, ID } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { normalizeWhatsAppNumber } from '../lib/whatsappTracker';
import {
    Users, Search, MessageCircle, MapPin, IndianRupee, Calendar,
    User, GraduationCap, CheckCircle2, ArrowRight, X, Phone, Plus
} from 'lucide-react';

const Roommates = () => {
    const { user, profile } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGender, setFilterGender] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        location: '',
        budget: '',
        college: '',
        whatsapp: '',
        gender_preference: 'any',
        move_in_date: '',
        description: ''
    });
    const [sentRequests, setSentRequests] = useState([]);

    const fetchSentRequests = React.useCallback(async () => {
        if (!user) return;
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION.roommateConnectRequests,
                [Query.equal('requesterId', user.$id || user.id)]
            );
            setSentRequests(res.documents.map(d => d.target_id || d.roommatePostId));
        } catch (err) {
            console.error('Fetch sent requests error:', err);
        }
    }, [user]);

    const fetchRequests = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION.roommateRequests,
                [
                    Query.orderDesc('$createdAt'),
                    Query.limit(100),
                ]
            );
            // Display all approved and active posts
            const valid = (res.documents || []).filter(d => d.status !== 'rejected');
            setRequests(valid);
        } catch (err) {
            console.error('Fetch error:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        document.title = 'Find College Roommates & Flatmates | StaySetu';
        fetchRequests();
        if (user) fetchSentRequests();
    }, [user, fetchRequests, fetchSentRequests]);

    const handleSendRequest = async (post) => {
        if (!user) return alert('Please login to send a connect request');
        const postId = post.$id || post.id;
        if (sentRequests.includes(postId)) return;

        // Ensure we have the poster's user ID
        const posterId = post.user_id || post.userId || post.ownerId || post.id;
        if (!posterId) return alert('Cannot send request to this post.');

        if (posterId === (user.$id || user.id)) {
            return alert('This is your own requirement post!');
        }

        setSubmitting(true);
        try {
            const requesterName = profile?.fullName || profile?.name || user.name || user.email || 'StaySetu Student';
            const requesterPhone = form.whatsapp || profile?.phone || profile?.whatsapp || user.phone || '';
            const postLoc = post.locality || post.location || post.city || 'Crossings Republik';
            const postCol = post.college || '';

            await databases.createDocument(
                DATABASE_ID,
                COLLECTION.roommateConnectRequests,
                ID.unique(),
                {
                    requester_id: user.$id || user.id,
                    target_id: posterId,
                    requesterId: user.$id || user.id,
                    posterId: posterId,
                    requesterName,
                    requesterPhone,
                    postLocation: postLoc,
                    postCollege: postCol,
                    status: 'pending',
                    message: JSON.stringify({
                        requesterName,
                        requesterPhone,
                        postLocation: postLoc,
                        postCollege: postCol,
                        note: `Hi! I saw your roommate requirement on StaySetu and want to connect with you.`
                    }),
                    createdAt: new Date().toISOString()
                }
            );
            setSentRequests(prev => [...prev, postId, posterId]);
            alert('Interest request sent! The user will be notified in their dashboard.');
        } catch (err) {
            console.error('Send request error:', err);
            alert('Failed to send request: ' + (err.message || 'Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert('Please login to post your roommate requirement');

        setSubmitting(true);
        setSuccess(false);
        try {
            const newDoc = await databases.createDocument(
                DATABASE_ID,
                COLLECTION.roommateRequests,
                ID.unique(),
                {
                    user_id: user.$id || user.id,
                    userId: user.$id || user.id,
                    name: profile?.fullName || profile?.name || user.name || (user.email ? user.email.split('@')[0] : 'Student'),
                    locality: form.location,
                    location: form.location,
                    city: form.location.includes(',') ? form.location.split(',')[1].trim() : 'Ghaziabad',
                    college: form.college,
                    budget: parseFloat(form.budget) || 0,
                    contact_phone: form.whatsapp,
                    whatsapp: form.whatsapp,
                    gender: form.gender_preference || 'any',
                    genderPreference: form.gender_preference || 'any',
                    about: form.description,
                    description: form.description,
                    move_in_date: form.move_in_date || null,
                    moveInDate: form.move_in_date || null,
                    habits: [],
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            );
            
            // Add immediately to local state so user sees it right away
            if (newDoc) {
                setRequests(prev => [newDoc, ...prev]);
            }
            
            setSuccess(true);
            setForm({ location: '', budget: '', college: '', whatsapp: '', gender_preference: 'any', move_in_date: '', description: '' });
            setTimeout(() => {
                setSuccess(false);
                setShowForm(false);
            }, 2500);
            fetchRequests();
        } catch (err) {
            console.error('Submit error:', err);
            alert('Error: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = requests.filter(r => {
        const text = `${r.location || ''} ${r.locality || ''} ${r.city || ''} ${r.college || ''} ${r.description || ''} ${r.about || ''} ${r.name || ''}`.toLowerCase();
        const matchSearch = !searchQuery || text.includes(searchQuery.toLowerCase().trim());
        const gen = (r.gender || r.genderPreference || 'any').toLowerCase();
        const targetGender = filterGender.toLowerCase();
        const matchGender = targetGender === 'all' || 
            (targetGender === 'male' && (gen === 'boys' || gen === 'male')) ||
            (targetGender === 'female' && (gen === 'girls' || gen === 'female')) ||
            gen === 'any';

        return matchSearch && matchGender;
    });

    return (
        <div className="min-h-screen bg-[#FAFAFB] text-zinc-900 pt-20 sm:pt-24 pb-28 sm:pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-extrabold uppercase tracking-wider border border-amber-200/80 mb-3 shadow-xs">
                            <Users size={12} className="text-amber-600" />
                            Student Community
                        </span>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">
                            Find Roommates
                        </h1>
                        <p className="text-zinc-500 font-normal mt-2 max-w-md text-xs sm:text-sm">
                            Connect with verified students looking for compatible roommates near your college.
                        </p>
                    </div>
                    {user && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3 px-6 rounded-full flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02] w-full sm:w-auto"
                        >
                            <Plus size={16} />
                            Post Requirement
                        </button>
                    )}
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-8 mb-8 sm:mb-10 shadow-xl animate-slide-up text-zinc-900">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-extrabold text-zinc-900">Post Your Requirement</h2>
                            <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {success && (
                            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-fade-in text-emerald-800">
                                <CheckCircle2 size={18} className="text-emerald-600" />
                                <p className="font-medium text-sm">Submitted! Your post is pending verification.</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Preferred Location</label>
                                <input type="text" required className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white" placeholder="e.g. Crossings Republik, Ghaziabad, Noida" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Budget (₹/month)</label>
                                <input type="number" required className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white" placeholder="5000" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">College/University</label>
                                <input type="text" required className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white" placeholder="e.g. ABES EC, IMS Ghaziabad, AKGEC" value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
                                <input type="tel" required className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white" placeholder="91XXXXXXXXXX" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Gender Preference</label>
                                <select className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-amber-400 focus:bg-white cursor-pointer" value={form.gender_preference} onChange={e => setForm({ ...form, gender_preference: e.target.value })}>
                                    <option value="any">Any</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Move-in Date</label>
                                <input type="date" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-amber-400 focus:bg-white cursor-pointer" value={form.move_in_date} onChange={e => setForm({ ...form, move_in_date: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea rows={3} required className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-amber-400 focus:bg-white resize-none" placeholder="Tell a bit about yourself and what you're looking for..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" disabled={submitting} className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3.5 px-8 rounded-full flex items-center gap-2 text-xs uppercase tracking-wider transition-all shadow-sm">
                                    {submitting ? <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" /> : <><ArrowRight size={15} /> Submit</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search by location, college across India (e.g. Crossings Republik, ABES)..."
                            className="w-full bg-white border border-zinc-200/90 rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap shrink-0">
                        {['all', 'male', 'female'].map(g => (
                            <button
                                key={g}
                                onClick={() => setFilterGender(g)}
                                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${filterGender === g
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                    : 'bg-white text-zinc-600 border-zinc-200/80 hover:text-zinc-900 hover:bg-zinc-50'
                                    }`}
                            >
                                {g === 'all' ? 'All' : g === 'male' ? 'Male' : 'Female'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-3xl animate-pulse h-64 border border-zinc-200/80 shadow-sm" />
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(req => (
                            <div key={req.$id} className="bg-white border border-zinc-200/90 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-rose-300 transition-all text-zinc-900">
                                <div>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center font-black text-sm shadow-sm">
                                                {(req.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-zinc-900 text-sm">{req.name}</h3>
                                                {req.college && (
                                                    <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                                                        <GraduationCap size={12} className="text-rose-600" /> {req.college}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                                            <CheckCircle2 size={10} /> Verified
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2">
                                        {req.description || req.about || "Looking for a flatmate / roommate near campus with clean habits."}
                                    </p>

                                    {/* Info pills */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {(req.location || req.locality || req.city) && (
                                            <span className="flex items-center gap-1.5 text-[11px] font-medium bg-zinc-50 text-zinc-700 border border-zinc-200/80 px-2.5 py-1 rounded-lg">
                                                <MapPin size={10} className="text-rose-500" /> {req.location || req.locality || req.city}
                                            </span>
                                        )}
                                        {req.budget && (
                                            <span className="flex items-center gap-1 text-[11px] font-medium bg-zinc-50 text-zinc-700 border border-zinc-200/80 px-2.5 py-1 rounded-lg">
                                                <IndianRupee size={10} className="text-rose-500" /> {Number(req.budget).toLocaleString()}/mo
                                            </span>
                                        )}
                                        {(req.genderPreference || req.gender) && (req.genderPreference || req.gender) !== 'any' && (
                                            <span className="flex items-center gap-1 text-[11px] font-medium bg-zinc-50 text-zinc-700 border border-zinc-200/80 px-2.5 py-1 rounded-lg capitalize">
                                                <User size={10} className="text-rose-500" /> {req.genderPreference || req.gender}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2 pt-3 border-t border-zinc-100 mt-auto">
                                    {(req.whatsapp || req.contact_phone) && (
                                        <a
                                            href={`https://wa.me/${normalizeWhatsAppNumber(req.whatsapp || req.contact_phone)}?text=${encodeURIComponent(`Hi ${req.name}, I saw your roommate requirement on StaySetu for ${req.college || req.location || req.locality || 'our area'}. Let's connect!`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs bg-[#25D366] text-white hover:bg-[#20ba59] shadow-sm transition-all"
                                        >
                                            <Phone size={14} /> Chat on WhatsApp
                                        </a>
                                    )}
                                    {(req.user_id || req.userId) !== (user?.$id || user?.id) ? (
                                        <button
                                            onClick={() => handleSendRequest(req)}
                                            disabled={sentRequests.includes(req.$id || req.id) || submitting}
                                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition-all ${sentRequests.includes(req.$id || req.id)
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200/80 cursor-pointer'
                                                }`}
                                        >
                                            {sentRequests.includes(req.$id || req.id) ? (
                                                <>
                                                    <CheckCircle2 size={14} /> Request Sent
                                                </>
                                            ) : (
                                                <>
                                                    <MessageCircle size={14} /> Connect Directly
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full text-center py-2 bg-zinc-50 text-zinc-500 rounded-xl font-bold text-xs border border-zinc-200/80">
                                            Your Requirement Post
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-zinc-300 shadow-sm max-w-md mx-auto my-6">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                            <Users size={30} />
                        </div>
                        <h3 className="text-xl font-extrabold text-zinc-900 mb-2">No roommate requests yet</h3>
                        <p className="text-zinc-500 font-normal mb-6 text-xs sm:text-sm leading-relaxed">
                            Looking for a flatmate or room to share? Post your requirement to connect with fellow students directly.
                        </p>
                        {user ? (
                            <button onClick={() => setShowForm(true)} className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition-all shadow-sm">
                                + Post Requirement
                            </button>
                        ) : (
                            <a href="/login" className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition-all shadow-sm">
                                Log In to Post Requirement
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Roommates;
