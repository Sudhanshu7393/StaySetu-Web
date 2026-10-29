import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTION, Query, getImageUrl } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { trackWhatsAppClick, openWhatsApp } from '../lib/whatsappTracker';
import {
    MapPin, IndianRupee, Phone, Clock, CheckCircle2,
    Search, Filter, MessageCircle, Sparkles, UserCheck,
    Loader2, Brush, Mail, Star, ShieldCheck
} from 'lucide-react';

const serviceTypeLabels = {
    'cooking': '🍳 Cooking & Food',
    'cleaning': '🧹 Daily Cleaning',
    'laundry': '👕 Laundry & Ironing',
    'all-in-one': '⭐ All-in-One Care',
    'babysitting': '👶 Caretaker',
};

const Maids = () => {
    const { user, profile } = useAuth();
    const [maids, setMaids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const fetchMaids = async () => {
        setLoading(true);
        try {
            const queries = [
                Query.equal('status', 'approved'),
                Query.orderDesc('$createdAt'),
                Query.limit(100),
            ];
            const res = await databases.listDocuments(DATABASE_ID, COLLECTION.maidServices, queries);
            setMaids(res.documents);
        } catch (err) {
            console.error('Error fetching maids:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        document.title = 'Verified Housekeeping & Cooks Near Campus | StaySetu';
        fetchMaids();
    }, []);

    const filteredMaids = maids.filter(m => {
        const matchesSearch = !searchTerm ||
            m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || m.serviceType === filterType;
        return matchesSearch && matchesType;
    });

    const handleContactClick = (maid) => {
        const messageText = `Hi, I found your service "${maid.title}" on StaySetu. I am interested for my flat/PG!`;
        const message = encodeURIComponent(messageText);

        trackWhatsAppClick({
            phoneNumber: maid.whatsappNumber || maid.phoneNumber,
            listingId: maid.$id || maid.id,
            listingTitle: maid.title,
            ownerName: maid.posterName || '',
            clickerUserId: user?.$id || '',
            clickerName: profile?.fullName || user?.name || '',
            clickerEmail: user?.email || '',
            source: 'maid_services',
            message: messageText,
        });

        openWhatsApp(maid.whatsappNumber || maid.phoneNumber, message);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFB] text-zinc-900 pt-20 sm:pt-24 pb-28 sm:pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-extrabold uppercase tracking-wider border border-amber-200/80 mb-3 shadow-xs">
                        <Sparkles size={12} className="text-amber-600" />
                        Verified Domestic Help
                    </span>
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight mb-3">
                        Find Verified Maids & Cooks
                    </h1>
                    <p className="text-zinc-500 text-xs sm:text-base font-normal leading-relaxed">
                        Trusted, verified cooks, daily cleaning staff, and laundry helpers across societies in Crossings Republik, Ghaziabad, Noida & Delhi NCR.
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8 sm:mb-10 max-w-4xl mx-auto">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search by area or society (e.g. Crossings Republik, ABES, Gaur City, Noida)..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none text-sm font-medium text-zinc-900 placeholder:text-zinc-400 shadow-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
                        {[
                            { key: 'all', label: 'All Services' },
                            { key: 'cooking', label: '🍳 Cooks' },
                            { key: 'cleaning', label: '🧹 Cleaners' },
                            { key: 'laundry', label: '👕 Laundry' },
                            { key: 'all-in-one', label: '⭐ All-in-One' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilterType(f.key)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                                    filterType === f.key
                                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 size={32} className="animate-spin text-amber-500 mx-auto mb-4" />
                        <p className="text-zinc-500 text-sm font-medium">Finding verified helpers nearby...</p>
                    </div>
                ) : filteredMaids.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMaids.map((maid) => (
                            <div 
                                key={maid.$id || maid.id} 
                                className="group bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-md hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between text-zinc-900"
                            >
                                {/* Photo / Header Area */}
                                <div className="h-48 overflow-hidden relative bg-zinc-100">
                                    <img
                                        src={maid.imageUrl || (maid.image ? getImageUrl(maid.image) : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80")}
                                        alt={maid.title}
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                                    {/* Top Verified Badge */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-zinc-950 text-[10px] font-extrabold shadow-sm uppercase tracking-wider">
                                            <ShieldCheck size={12} className="text-amber-500" />
                                            {serviceTypeLabels[maid.serviceType] || 'Domestic Help'}
                                        </span>
                                    </div>

                                    {/* Star Rating Badge */}
                                    <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold flex items-center gap-1 border border-white/10">
                                        <Star size={12} className="text-amber-400 fill-amber-400" />
                                        <span>{maid.rating || '4.9'}</span>
                                        <span className="text-zinc-300 text-[10px]">({maid.reviewsCount || '24'})</span>
                                    </div>

                                    {/* Bottom Title on Image */}
                                    <div className="absolute bottom-3 left-3 right-3 z-10">
                                        <h3 className="text-lg font-extrabold text-white truncate drop-shadow-sm">
                                            {maid.title}
                                        </h3>
                                        <div className="flex items-center text-zinc-200 text-xs mt-0.5">
                                            <MapPin size={12} className="mr-1 text-amber-400 shrink-0" />
                                            <span className="truncate">{maid.location || 'Greater Noida'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    {maid.description && (
                                        <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed line-clamp-2 font-normal">
                                            {maid.description}
                                        </p>
                                    )}

                                    <div className="space-y-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-200/60 text-xs">
                                        {maid.timing && (
                                            <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                                <Clock size={13} className="text-zinc-400 shrink-0" />
                                                <span>{maid.timing}</span>
                                            </div>
                                        )}
                                        {maid.price && (
                                            <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 font-bold text-zinc-900">
                                                <span className="text-zinc-500 font-normal">Starting Rate:</span>
                                                <span className="text-zinc-950 font-black text-sm">₹{Number(maid.price).toLocaleString()} /mo</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                                        {maid.phoneNumber && (
                                            <a
                                                href={`tel:${maid.phoneNumber}`}
                                                className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 flex items-center justify-center rounded-xl transition-all shrink-0 border border-zinc-200/80"
                                                title="Call Direct"
                                            >
                                                <Phone size={15} />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleContactClick(maid)}
                                            className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-zinc-950 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm"
                                        >
                                            <MessageCircle size={15} fill="currentColor" /> Chat on WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-200 bg-white max-w-md mx-auto my-6 p-8">
                        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-100">
                            <Brush size={26} />
                        </div>
                        <h3 className="text-lg font-extrabold text-zinc-900 mb-1">No verified services listed yet</h3>
                        <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
                            Cook and cleaning services will appear here as local providers register in your area.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Maids;
