import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, IndianRupee, Wifi, Wind, Coffee, Car, Home,
    ChevronLeft, ChevronRight, Phone,
    CheckCircle2, AlertCircle, Share2, Heart, MessageCircle, MessageSquare, Users as UsersIcon, Pencil,
    Trash2, Send, GraduationCap, Calendar, Clock, Video, Calculator, Sparkles, X,
    ShieldCheck, Star
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTION, Query, ID, parseJsonField } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PropertyMap from '../components/common/PropertyMap';
import ScheduleVisitModal from '../components/common/ScheduleVisitModal';
import { trackWhatsAppClick, openWhatsApp } from '../lib/whatsappTracker';
import { formatPropertyPrice, getPropertyTypeLabel } from '../lib/formatters';

const PropertyDetails = () => {
    const { id } = useParams();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [liked, setLiked] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const isSale = property?.purpose === 'sell' || property?.purpose === 'sale' || Number(property?.price) >= 500000;
    const isRented = property?.status === 'rented';
    const isSold = property?.status === 'sold';
    const isUnavailable = isRented || isSold;

    // Visit Scheduling state
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitSuccess, setVisitSuccess] = useState(false);
    const [visitSubmitting, setVisitSubmitting] = useState(false);
    const [visitForm, setVisitForm] = useState({
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        timeSlot: '11:00 AM - 01:00 PM',
        visitType: 'in-person', // 'in-person' | 'video'
        name: '',
        phone: '',
        notes: ''
    });

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewError, setReviewError] = useState(null);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    // Minimum swipe distance in pixels
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && property?.images) {
            setActiveImage((prev) => (prev < property.images.length - 1 ? prev + 1 : 0));
        }
        if (isRightSwipe && property?.images) {
            setActiveImage((prev) => (prev > 0 ? prev - 1 : property.images.length - 1));
        }
    };

    useEffect(() => {
        const fetchProperty = async () => {
            setLoading(true);
            try {
                if (!id) throw new Error('No property ID provided');

                const data = await databases.getDocument(DATABASE_ID, COLLECTION.listings, id);

                if (data) {
                    if (data.ownerId) {
                        try {
                            const ownerRes = await databases.listDocuments(
                                DATABASE_ID,
                                COLLECTION.profiles,
                                [Query.equal('userId', data.ownerId)]
                            );

                            data.owner = ownerRes.documents.length > 0
                                ? {
                                    ...ownerRes.documents[0],
                                    id: ownerRes.documents[0].userId,
                                    name: ownerRes.documents[0].fullName || ownerRes.documents[0].name || 'Owner'
                                }
                                : { name: 'Owner' };
                        } catch (ownerErr) {
                            console.error('Owner fetch error:', ownerErr);
                            data.owner = { name: 'Owner' };
                        }
                    } else {
                        data.owner = { name: 'Owner' };
                    }

                    // Parse JSON fields safely
                    data.images = parseJsonField(data.images) || [];
                    data.amenities = parseJsonField(data.amenities) || [];
                    data.occupancy = parseJsonField(data.occupancy);
                    if (!Array.isArray(data.occupancy) || data.occupancy.length === 0) {
                        data.occupancy = ['single'];
                    }

                    setProperty(data);
                    if (data.title) {
                        document.title = `${data.title} in ${data.location || 'StaySetu'} | StaySetu`;
                    }
                } else {
                    setError('Property not found');
                }
            } catch (err) {
                console.error('Property details error:', err);
                setError(err.message || 'Failed to load property');
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [id]);

    // Fetch reviews
    const fetchReviews = React.useCallback(async () => {
        if (!id) return;
        setReviewsLoading(true);
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION.reviews,
                [Query.equal('listingId', id), Query.orderDesc('$createdAt'), Query.limit(50)]
            );
            setReviews(res.documents);
            if (user) {
                setHasReviewed(res.documents.some(r => r.userId === user.$id));
            }
        } catch (err) {
            console.error('Reviews fetch error:', err);
        } finally {
            setReviewsLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) { setReviewError('Please log in to write a review.'); return; }
        if (!reviewForm.comment.trim()) { setReviewError('Please write your review.'); return; }
        setSubmittingReview(true);
        setReviewError(null);
        try {
            await databases.createDocument(DATABASE_ID, COLLECTION.reviews, ID.unique(), {
                listingId: id,
                userId: user.$id,
                userName: profile?.fullName || profile?.name || user?.name || 'Anonymous',
                rating: reviewForm.rating,
                comment: reviewForm.comment.trim(),
                createdAt: new Date().toISOString(),
            });
            setReviewForm({ rating: 5, comment: '' });
            setReviewSuccess(true);
            setTimeout(() => setReviewSuccess(false), 3000);
            fetchReviews();
        } catch (err) {
            setReviewError('Failed to submit review. Please try again.');
            console.error(err);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION.reviews, reviewId);
            fetchReviews();
        } catch (err) {
            console.error('Delete review error:', err);
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
        : null;

    const isAdmin = profile?.role === 'admin' || (user?.email && ['staysetu26@gmail.com', 'yutkarsh669@gmail.com'].includes(user.email.toLowerCase()));

    const handleShare = async () => {
        const shareData = {
            title: property?.title || 'StaySetu Property',
            text: `Check out this stay on StaySetu: ${property?.title}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Property link copied to clipboard!');
            }
        } catch (err) {
            console.error('Sharing error:', err);
        }
    };

    const initiateWhatsApp = () => {
        if (isUnavailable) return;
        if (!user) {
            navigate('/login', { state: { from: `/property/${id}` } });
            return;
        }

        if (!property) return;

        const phoneNumber = property.whatsappNumber || property.phoneNumber || property.whatsapp_number || property.phone_number;
        const messageText = `Hi, I found your listing "${property.title}" on StaySetu. Is it available?`;
        const message = encodeURIComponent(messageText);

        trackWhatsAppClick({
            phoneNumber,
            listingId: property.$id || id,
            listingTitle: property.title || 'Property',
            ownerName: property.owner?.name || '',
            clickerUserId: user?.$id || '',
            clickerName: profile?.fullName || user?.name || '',
            clickerEmail: user?.email || '',
            source: 'property_details',
            message: messageText,
        });

        openWhatsApp(phoneNumber, message);
    };

    const handleScheduleVisit = async (e) => {
        if (e) e.preventDefault();
        if (!user) {
            navigate('/login', { state: { from: `/property/${id}` } });
            return;
        }
        setVisitSubmitting(true);
        try {
            const visitRecord = {
                listingId: property.$id || id,
                listingTitle: property.title || 'Property',
                userId: user.$id || user.id,
                studentName: visitForm.name || profile?.fullName || user.name || 'Student',
                studentPhone: visitForm.phone || profile?.phone || '',
                visitDate: visitForm.date,
                timeSlot: visitForm.timeSlot,
                visitType: visitForm.visitType,
                notes: visitForm.notes,
                status: 'confirmed',
                ownerName: property.owner?.name || 'Owner',
                ownerPhone: property.whatsappNumber || property.phoneNumber || property.phone_number || ''
            };

            await databases.createDocument(DATABASE_ID, 'visit_requests', ID.unique(), visitRecord);
            setVisitSuccess(true);
        } catch (err) {
            console.error('Schedule visit error:', err);
            setVisitSuccess(true);
        } finally {
            setVisitSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading StaySetu...</p>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen pt-32 text-center bg-white px-4">
                <div className="card-elevated max-w-md mx-auto p-12 rounded-[2rem]">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="text-red-500" size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Listing Problem</h2>
                    <p className="text-slate-400 text-sm mb-6">{error || 'This listing may have been removed or is no longer available.'}</p>
                    <button onClick={() => navigate('/listings')} className="btn-primary text-sm">Back to Listings</button>
                </div>
            </div>
        );
    }

    const amenityIcons = {
        'WiFi': Wifi,
        'AC': Wind,
        'Food': Coffee,
        'Parking': Car,
    };

    return (
        <div className="min-h-screen bg-[#FAFAFB] pt-20 pb-24 text-zinc-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Breadcrumbs matching screenshot 3 */}
                <div className="flex items-center justify-between mb-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-400 overflow-x-auto">
                        <button onClick={() => navigate('/')} className="hover:text-rose-600 transition-colors">Home</button>
                        <span>&gt;</span>
                        <button onClick={() => navigate('/listings')} className="hover:text-rose-600 transition-colors">Lucknow rooms</button>
                        <span>&gt;</span>
                        <span className="text-zinc-700 font-semibold truncate max-w-[200px]">{property.location || 'Property Details'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setLiked(!liked)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${liked
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'bg-white text-zinc-500 border-zinc-200 hover:text-rose-500 shadow-xs'
                                }`}
                        >
                            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            onClick={handleShare}
                            className="w-9 h-9 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 shadow-xs transition-all"
                            title="Share property"
                        >
                            <Share2 size={15} />
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => navigate(`/dashboard/edit-listing/${id}`)}
                                className="w-9 h-9 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-all shadow-xs"
                                title="Edit Listing (Admin Only)"
                            >
                                <Pencil size={15} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div
                            className="relative rounded-3xl overflow-hidden bg-zinc-100 group shadow-sm border border-zinc-200/80"
                            style={{ height: '460px' }}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {/* Top Left Available / Sale Badge */}
                            <div className="absolute top-4 left-4 z-30">
                                <span className={`px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-extrabold flex items-center gap-1.5 shadow-sm ${
                                    isSale ? 'text-rose-600' : 'text-emerald-700'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${isSale ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                    {isUnavailable ? (isSold ? 'Sold Out' : 'Rented Out') : (isSale ? 'For Sale • Available' : 'Available')}
                                </span>
                            </div>

                            {property.images?.[activeImage]?.includes('is_video=true') ? (
                                <video
                                    src={property.images[activeImage]}
                                    className="relative w-full h-full object-contain z-10"
                                    autoPlay
                                    controls
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={property.images?.[activeImage] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80'}
                                    alt={property.title || 'Property'}
                                    className="relative w-full h-full object-cover z-10"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80';
                                    }}
                                />
                            )}

                            {isUnavailable && (
                                <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                                    <div className="bg-white/90 backdrop-blur-md border-3 border-slate-900 px-10 py-5 rounded-[2rem] transform -rotate-6 shadow-2xl">
                                        <span className="text-3xl font-black text-slate-900 uppercase tracking-[0.2em]">{isSold ? 'Sold Out' : 'Rented Out'}</span>
                                    </div>
                                </div>
                            )}

                            {Array.isArray(property.images) && property.images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImage((prev) => (prev > 0 ? prev - 1 : property.images.length - 1))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-zinc-900 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-white z-30"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setActiveImage((prev) => (prev < property.images.length - 1 ? prev + 1 : 0))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-zinc-900 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-white z-30"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </>
                            )}

                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full z-30">
                                {activeImage + 1} / {property.images?.length || 1}
                            </div>
                        </div>

                        {/* Thumbnail Strip matching screenshot 3 */}
                        {Array.isArray(property.images) && property.images.length > 1 && (
                            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                                {property.images.slice(0, 6).map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                                            activeImage === i ? 'border-rose-500 shadow-md scale-102' : 'border-zinc-200/80 opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                                {property.images.length > 6 && (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 text-xs font-black text-zinc-600">
                                        +{property.images.length - 6} More
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Property Info Card */}
                        <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 md:p-8 shadow-sm">
                            
                            {/* Title & Rating */}
                            <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 mb-2">
                                {property.title || 'Property Details'}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mb-6">
                                {reviews.length > 0 ? (
                                    <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                                        <Star size={14} className="fill-amber-400 text-amber-400" />
                                        <span>{avgRating}</span>
                                        <span className="text-zinc-400 text-xs font-normal">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-extrabold border border-rose-100">
                                        <span>✨ New Listing</span>
                                    </div>
                                )}
                                <span>•</span>
                                <div className="flex items-center text-zinc-600 gap-1">
                                    <MapPin size={14} className="text-rose-500 shrink-0" />
                                    <span>{property.location || 'Location not specified'}</span>
                                </div>
                            </div>

                            {/* 2x2 Specs Grid matching screenshot 3 */}
                            {isSale ? (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <Home size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Property Type</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-zinc-900">{getPropertyTypeLabel(property.type)}</div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Super Built-up Area</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-zinc-900">{property.area || '1,580 sq.ft'}</div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ownership Title</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-zinc-900">{property.ownership || 'Freehold Title'}</div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Possession Status</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-zinc-900">{property.possession || 'Ready to Move'}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <Home size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Room Type</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-zinc-900">{property.type || '2 BHK'}</div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <Coffee size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Furnishing</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-zinc-900">{property.furnishing || 'Furnished'}</div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <UsersIcon size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Occupancy</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-zinc-900">
                                                {property.occupancy ? (Array.isArray(property.occupancy) ? (typeof property.occupancy[0] === 'object' ? property.occupancy[0].type : property.occupancy[0]) : property.occupancy) : '1 / Double'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Preferred Tenants</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-zinc-900 capitalize">{property.genderPreference || 'Anyone'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Price Card matching screenshot 3 */}
                            {isSale ? (
                                <div className="p-4 bg-rose-50/70 border border-rose-200/70 rounded-2xl flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs font-black text-xl">
                                            ₹
                                        </div>
                                        <div>
                                            <div className="text-xl sm:text-2xl font-black text-zinc-900 flex items-center gap-2">
                                                {formatPropertyPrice(property.price, 'sell')}
                                                <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                                                    Total Price
                                                </span>
                                            </div>
                                            <div className="text-xs text-zinc-500 mt-0.5">
                                                {property.area ? `Area: ${property.area} • ` : ''}{property.possession || 'Ready to Move'}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-white text-rose-600 border border-rose-200 shadow-2xs">
                                        Direct Seller
                                    </span>
                                </div>
                            ) : (
                                <div className="p-4 bg-rose-50/70 border border-rose-200/70 rounded-2xl flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                                            <IndianRupee size={20} />
                                        </div>
                                        <div>
                                            <div className="text-lg sm:text-xl font-extrabold text-zinc-900">
                                                ₹{property.price?.toLocaleString()} <span className="text-xs font-normal text-zinc-500">/ month</span>
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                Deposit: ₹{(property.deposit || (property.price ? Math.round(Number(property.price) * 0.8) : 5000)).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-white text-rose-600 border border-rose-200 shadow-2xs">
                                        Direct Connect
                                    </span>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">About</h3>
                                <p className="text-slate-600 text-sm leading-relaxed font-normal">
                                    {property.description || "No description provided for this property. Contact the owner for more details."}
                                </p>
                            </div>

                            <div className="mb-10">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Amenities</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {(property.amenities || []).map((amenity) => {
                                        const Icon = amenityIcons[amenity] || Home;
                                        return (
                                            <div key={amenity} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-blue-600 border border-slate-200"
                                                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                                    <Icon size={16} />
                                                </div>
                                                <span className="font-medium text-slate-700 text-sm">{amenity}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mb-10">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Available Room Types</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {(property.occupancy || []).map((occ, idx) => {
                                        const isObj = typeof occ === 'object' && occ !== null;
                                        const type = isObj ? occ.type : occ;
                                        const price = isObj ? occ.price : null;

                                        return (
                                            <div key={idx} className="flex flex-col gap-1 p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
                                                        <UsersIcon size={16} />
                                                    </div>
                                                    <span className="font-bold text-emerald-700 text-xs uppercase tracking-tight">
                                                        {type === 'single' ? 'Single' : type === 'double' ? 'Double Sharing' : type === 'triple' ? 'Triple Sharing' : (type.replace('-', ' ') + ' Sharing')}
                                                    </span>
                                                </div>
                                                {price && price > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-emerald-100/50 flex items-center justify-between">
                                                        <span className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-wider">Rent</span>
                                                        <span className="font-black text-emerald-700 text-sm">₹{price.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Location</h3>
                                {property.latitude && property.longitude ? (
                                    <PropertyMap
                                        position={{ lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) }}
                                    />
                                ) : (
                                    <div className="p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                        <MapPin className="text-slate-300 mx-auto mb-3" size={32} />
                                        <p className="text-slate-500 text-sm font-medium">Exact map coordinates not provided by owner</p>
                                        <p className="text-slate-400 text-xs mt-1">Address: {property.location}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===== REVIEWS SECTION (full width below) ===== */}
                    <div className="lg:col-span-3 mt-2">
                        <div className="card-elevated p-6 md:p-8">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Property Feedback
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1">
                                        {reviews.length > 0 ? `${reviews.length} feedback message${reviews.length !== 1 ? 's' : ''}` : 'No feedback yet — be the first to share your experience!'}
                                    </p>
                                </div>
                            </div>

                            {/* Write Review Form */}
                            {user && !hasReviewed && (
                                <form onSubmit={handleSubmitReview} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-8">
                                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">Share Your Feedback</h4>

                                    {/* Star Rating Picker */}
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <span className="text-xs font-semibold text-slate-600 mr-2">Your Rating:</span>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                className="p-1 focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    size={18}
                                                    className={
                                                        star <= (hoverRating || reviewForm.rating)
                                                            ? "text-amber-400 fill-amber-400"
                                                            : "text-slate-300"
                                                    }
                                                />
                                            </button>
                                        ))}
                                        <span className="text-xs font-bold text-slate-700 ml-1.5">
                                            {hoverRating || reviewForm.rating} / 5
                                        </span>
                                    </div>

                                    <textarea
                                        rows={3}
                                        placeholder="Share your experience about this property..."
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 resize-none focus:outline-none focus:border-blue-400 transition-colors mb-3"
                                        value={reviewForm.comment}
                                        onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                        maxLength={500}
                                    />

                                    {reviewError && (
                                        <div className="flex items-center gap-2 text-red-500 text-xs font-semibold mb-3">
                                            <AlertCircle size={12} /> {reviewError}
                                        </div>
                                    )}
                                    {reviewSuccess && (
                                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold mb-3">
                                            <CheckCircle2 size={12} /> Review submitted! Thank you.
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400">{reviewForm.comment.length}/500</span>
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                                        >
                                            {submittingReview ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Send size={13} />
                                            )}
                                            Submit Feedback
                                        </button>
                                    </div>
                                </form>
                            )}

                            {!user && (
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 text-center">
                                    <p className="text-sm font-semibold text-blue-700 mb-2">Sign in to write a review</p>
                                    <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">
                                        Sign In
                                    </button>
                                </div>
                            )}

                            {hasReviewed && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-8 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <p className="text-sm font-semibold text-emerald-700">You've already reviewed this property.</p>
                                </div>
                            )}

                            {/* Reviews List */}
                            {reviewsLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-10">
                                    <MessageSquare size={36} className="text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium text-sm">No feedback yet for this listing.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reviews.map((review) => (
                                        <div key={review.$id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                                                        {(review.userName || 'A').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{review.userName || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            {new Date(review.createdAt || review.$createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed font-normal">{review.comment}</p>
                                            {/* Delete — own review or admin */}
                                            {(user && (review.userId === user.$id || isAdmin)) && (
                                                <button
                                                    onClick={() => handleDeleteReview(review.$id)}
                                                    className="absolute top-3 right-3 w-7 h-7 bg-red-50 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                                                    title="Delete review"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card-elevated p-6 sticky top-24">
                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Starting from</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-slate-900 flex items-center">
                                        <IndianRupee size={22} className="mr-1" />
                                        {property.price?.toLocaleString() || 'N/A'}
                                    </span>
                                    <span className="text-slate-500 font-normal text-sm">/ month</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 mb-6">
                                <button
                                    onClick={() => setIsWhatsAppModalOpen(true)}
                                    disabled={isUnavailable}
                                    className="w-full py-3.5 justify-center text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-500/25 hover:scale-[1.01]"
                                >
                                    <Calendar size={16} />
                                    Schedule a Free Visit
                                </button>

                                <button
                                    onClick={initiateWhatsApp}
                                    disabled={isUnavailable}
                                    className={`w-full py-3.5 justify-center text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-2 transition-all ${
                                        isUnavailable 
                                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none' 
                                            : 'bg-[#25D366] text-white hover:bg-[#128C7E] shadow-md shadow-emerald-200/50'
                                    }`}
                                >
                                    {isUnavailable ? <Home size={16} /> : <Phone size={16} />}
                                    {isSold ? 'Sold Out' : isRented ? 'Already Rented Out' : 'Connect via WhatsApp'}
                                </button>
                            </div>
                            <p className="text-center text-[11px] text-zinc-500 font-medium mb-3">⚡ {String(property.listedBy || 'owner').toLowerCase() === 'owner' ? 'Owner' : 'Broker'} typically replies within 5 mins</p>
                            
                            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-full border border-emerald-200/80 mb-6">
                                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                                <span>100% Free • ₹0 Brokerage • Direct Connect</span>
                            </div>

                            {/* Transparent Pricing Breakdown with Broker Fee Disclosed */}
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 mb-6">
                                <div className="flex items-center gap-2 mb-3 text-zinc-900 font-extrabold text-xs uppercase tracking-wider">
                                    <Calculator size={14} className="text-rose-500" /> Transparent Pricing Breakdown
                                </div>
                                <div className="space-y-2.5 text-xs">
                                    <div className="flex justify-between text-zinc-600">
                                        <span>{isSale ? 'Total Sale Price:' : '1st Month Rent:'}</span>
                                        <span className="font-extrabold text-zinc-900">
                                            {isSale ? formatPropertyPrice(property.price, 'sell') : `₹${property.price?.toLocaleString()}`}
                                        </span>
                                    </div>
                                    {!isSale && (
                                        <div className="flex justify-between text-zinc-600">
                                            <span>Security Deposit (Refundable):</span>
                                            <span className="font-extrabold text-zinc-900">
                                                ₹{(property.deposit ? parseInt(property.deposit) : property.price)?.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-zinc-600">
                                        <span>Brokerage / Commission:</span>
                                        <span className={`font-black px-2 py-0.5 rounded text-[11px] ${
                                            String(property.listedBy || property.listed_by || 'owner').toLowerCase() === 'broker'
                                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        }`}>
                                            {String(property.listedBy || property.listed_by || 'owner').toLowerCase() === 'broker'
                                                ? (property.brokerageFee || property.brokerage_fee || (isSale ? '1% - 2%' : '15 Days Rent'))
                                                : '₹0 (Direct Owner)'}
                                        </span>
                                    </div>
                                    {!isSale && (
                                        <div className="pt-2.5 border-t border-zinc-200 flex justify-between font-black text-zinc-900 text-sm">
                                            <span>Estimated Move-in:</span>
                                            <span className="text-rose-600">
                                                ₹{((property.price || 0) + (property.deposit ? parseInt(property.deposit) : (property.price || 0)))?.toLocaleString()}
                                                {String(property.listedBy || property.listed_by || 'owner').toLowerCase() === 'broker' ? ' + Brokerage' : ''}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-zinc-400 mt-1 italic leading-tight">
                                        * All pricing & brokerage fees are explicitly stated upfront. No hidden surprises.
                                    </p>
                                </div>
                            </div>

                            <div className="h-px bg-zinc-100 mb-6" />

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-rose-500/20">
                                    {(property.owner?.name || 'O').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-900 text-sm">
                                        {property.owner?.name || (String(property.listedBy || 'owner').toLowerCase() === 'owner' ? 'Property Owner' : 'Verified Broker')}
                                    </h4>
                                    <p className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                                        <CheckCircle2 size={11} /> Verified {String(property.listedBy || 'owner').toLowerCase() === 'owner' ? 'Owner' : 'Broker'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 mb-6">
                                <p className="text-sm text-slate-600 leading-relaxed italic font-normal">
                                    "Hi, I'm {property.owner?.name || (String(property.listedBy || 'owner').toLowerCase() === 'owner' ? 'the owner' : 'the broker')}. Feel free to reach out — I'll help you find the perfect stay!"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    String(property.listedBy || 'owner').toLowerCase() !== 'owner' ? 'Broker Managed' : 'Direct from Owner',
                                    'Safe & Verified',
                                    'Direct Contact',
                                    'Easy Move-in'
                                ].map((t) => (
                                    <div key={t} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                                        <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />{t}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule a Visit Modal */}
            {showVisitModal && (
                <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 md:p-8 shadow-2xl relative animate-scale-in">
                        <button
                            onClick={() => setShowVisitModal(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                        >
                            <X size={16} />
                        </button>

                        {!visitSuccess ? (
                            <form onSubmit={handleScheduleVisit} className="space-y-4">
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                                        <Calendar size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">Schedule Free Visit</h3>
                                    <p className="text-xs text-slate-500">Pick a convenient time to tour {property.title}</p>
                                </div>

                                {/* Visit Type */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Visit Mode</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setVisitForm(prev => ({ ...prev, visitType: 'in-person' }))}
                                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                visitForm.visitType === 'in-person'
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                            <Home size={15} /> Physical Visit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVisitForm(prev => ({ ...prev, visitType: 'video' }))}
                                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                visitForm.visitType === 'video'
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                            <Video size={15} /> Video Tour (WhatsApp)
                                        </button>
                                    </div>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Preferred Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={visitForm.date}
                                        onChange={e => setVisitForm(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-plum-500 font-medium"
                                    />
                                </div>

                                {/* Time Slot */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Time Slot</label>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        {['10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '05:00 PM - 07:00 PM'].map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setVisitForm(prev => ({ ...prev, timeSlot: slot }))}
                                                className={`p-2 rounded-xl border text-center transition-all ${
                                                    visitForm.timeSlot === slot
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                                                        : 'bg-white border-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your WhatsApp Number</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="e.g. 9876543210"
                                        value={visitForm.phone}
                                        onChange={e => setVisitForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-plum-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={visitSubmitting}
                                    className="w-full btn-primary py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg mt-4 flex items-center justify-center gap-2"
                                >
                                    {visitSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} /> Confirm Visit Appointment
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Visit Scheduled!</h3>
                                <p className="text-slate-500 text-xs mb-6">
                                    Your {visitForm.visitType === 'video' ? 'Video Tour' : 'Physical Visit'} is booked for <strong className="text-slate-800">{visitForm.date}</strong> during <strong className="text-slate-800">{visitForm.timeSlot}</strong>.
                                </p>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1 mb-6">
                                    <p className="text-slate-400 font-bold uppercase tracking-wider">Property</p>
                                    <p className="font-bold text-slate-800">{property.title}</p>
                                    <p className="text-slate-500">{property.location}</p>
                                </div>

                                <button
                                    onClick={() => setShowVisitModal(false)}
                                    className="w-full btn-primary py-3 rounded-xl text-xs font-black uppercase tracking-widest"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Bottom Floating CTA Bar matching screenshot 3 */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md p-3 px-4 border-t border-zinc-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center gap-3">
                <button
                    onClick={initiateWhatsApp}
                    disabled={isUnavailable}
                    className="flex-1 py-3 px-4 rounded-full font-extrabold text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 flex items-center justify-center gap-2 transition-all"
                >
                    <MessageCircle size={15} className="text-zinc-700" />
                    <span>Contact</span>
                </button>
                <button
                    onClick={() => setIsWhatsAppModalOpen(true)}
                    disabled={isUnavailable}
                    className="flex-1 py-3 px-4 rounded-full font-extrabold text-xs bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 transition-all"
                >
                    <Calendar size={15} />
                    <span>Schedule Visit</span>
                </button>
            </div>

            {/* WhatsApp Schedule Visit Modal */}
            <ScheduleVisitModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                property={property}
            />
        </div>
    );
};

export default PropertyDetails;
