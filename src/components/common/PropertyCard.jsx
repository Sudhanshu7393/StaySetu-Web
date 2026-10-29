import React, { useState } from 'react';
import { MapPin, IndianRupee, Star, Heart, CheckCircle2, ChevronLeft, ChevronRight, GraduationCap, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseJsonField } from '../../lib/supabase';
import ScheduleVisitModal from './ScheduleVisitModal';
import { formatPropertyPrice, getPropertyTypeLabel } from '../../lib/formatters';

const FALLBACKS = [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
];

const PropertyCard = ({ property }) => {
    const isSale = property?.purpose === 'sell' || property?.purpose === 'sale' || Number(property?.price) >= 500000;
    const isRented = property?.status === 'rented';
    const isSold = property?.status === 'sold';
    const isUnavailable = isRented || isSold;
    const [activeImage, setActiveImage] = useState(0);
    const [imgError, setImgError] = useState(false);
    const [liked, setLiked] = useState(false);
    const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

    const images = parseJsonField(property?.images) || [];
    const fallback = FALLBACKS[((property?.$id || property?.id || '').charCodeAt(0) || 0) % FALLBACKS.length];

    const getImgSrc = (index) => {
        const src = images[index];
        return (!src || (index === activeImage && imgError)) ? fallback : src;
    };

    const nextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const prevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const amenities = parseJsonField(property?.amenities) || ['WiFi', 'AC', 'Food'];
    const depositAmount = property?.deposit || (property?.price ? Math.round(Number(property.price) * 0.8) : 5000);
    const ratingValue = property?.rating || null;

    return (
        <>
            <div className="group relative flex flex-col sm:flex-row bg-white rounded-3xl border border-zinc-200/80 hover:border-rose-300 hover:shadow-xl transition-all duration-300 p-3 sm:p-3.5 gap-3.5 sm:gap-4 text-zinc-900 shadow-sm overflow-hidden">
                
                {/* Left: Image Container with Heart overlay */}
                <div className="relative w-full sm:w-44 md:w-48 lg:w-52 aspect-[16/10] sm:aspect-square shrink-0 rounded-2xl overflow-hidden bg-zinc-100">
                    <img
                        src={getImgSrc(activeImage)}
                        alt={property?.title || 'Property'}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isUnavailable ? 'grayscale-[0.8] opacity-50' : ''}`}
                        onError={() => setImgError(true)}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Unavailable Status Overlay */}
                    {isUnavailable && (
                        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-[2px] flex items-center justify-center p-3">
                            <div className="bg-white px-4 py-1.5 rounded-xl shadow-md">
                                <span className="text-[11px] font-black text-zinc-950 uppercase tracking-widest">
                                    {isSold ? 'Sold Out' : 'Rented Out'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Image Nav Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </>
                    )}

                    {/* Top Left Room Type / Tag */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                        {isSale && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                                For Sale
                            </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-zinc-900 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                            {getPropertyTypeLabel(property?.type)}
                        </span>
                        {!isSale && (property?.genderPreference || property?.gender) && (
                            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-zinc-100 text-[10px] font-medium border border-white/20 capitalize">
                                {property?.genderPreference || property?.gender}
                            </span>
                        )}
                    </div>

                    {/* Top Right Heart Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLiked(!liked);
                        }}
                        className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-sm ${
                            liked
                                ? 'bg-rose-500 text-white'
                                : 'bg-white/90 text-zinc-700 hover:text-rose-500 hover:bg-white'
                        }`}
                        title="Save to favorites"
                    >
                        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                    </button>

                    {/* Bottom Left Distance / College Tag */}
                    {(property?.college_distance || property?.nearbyCollege) && (
                        <div className="absolute bottom-2 left-2 z-20 bg-black/70 backdrop-blur-md text-zinc-100 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10">
                            <GraduationCap size={11} className="text-rose-300" />
                            <span className="truncate max-w-[120px]">{property?.college_distance || property?.nearbyCollege}</span>
                        </div>
                    )}
                </div>

                {/* Right: Info Content */}
                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                    
                    <div>
                        {/* Title & Rating Row */}
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                            <Link
                                to={`/property/${property?.$id || property?.id || '123'}`}
                                className="text-base sm:text-lg font-extrabold text-zinc-900 hover:text-rose-600 transition-colors line-clamp-1"
                            >
                                {property?.title || 'Comfortable Stay'}
                            </Link>

                            {/* Rating badge (matching screenshot ⭐ New or ⭐ 4.8) */}
                            <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-extrabold">
                                <Star size={11} className="text-amber-500 fill-amber-500" />
                                <span>{ratingValue ? `${ratingValue}` : 'New'}</span>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center text-zinc-500 text-xs font-medium mb-3">
                            <MapPin size={13} className="text-rose-500 mr-1.5 shrink-0" />
                            <span className="truncate">{property?.location || 'Gomti Nagar, Lucknow'}</span>
                        </div>

                        {/* Feature Tag Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-4">
                            {isSale ? (
                                <>
                                    {property?.area && (
                                        <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                                            📐 {property.area}
                                        </span>
                                    )}
                                    {property?.bedrooms && (
                                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700">
                                            {property.bedrooms} BHK
                                        </span>
                                    )}
                                    {property?.possession && (
                                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700">
                                            {property.possession}
                                        </span>
                                    )}
                                    {property?.ownership && (
                                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700">
                                            {property.ownership}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    {property?.type && (
                                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700">
                                            {property.type === 'Flat' ? '2 BHK' : property.type}
                                        </span>
                                    )}
                                    {amenities.slice(0, 3).map((amenity, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700"
                                        >
                                            {amenity === 'WiFi' ? 'Wi-Fi' : amenity}
                                        </span>
                                    ))}
                                    {property?.attachedBathroom !== false && (
                                        <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700">
                                            Attached Bathroom
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Pricing & CTA Row */}
                    <div className="flex flex-wrap sm:flex-nowrap items-end sm:items-center justify-between pt-3 border-t border-zinc-100 gap-2 mt-auto">
                        <div className="min-w-0 pr-1">
                            {isSale ? (
                                <div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-base sm:text-lg font-black text-zinc-950">
                                            {formatPropertyPrice(property?.price, 'sell')}
                                        </span>
                                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                            Total
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                                        <span>{property?.area ? `${property.area} • ` : ''}{property?.possession || 'Ready'}</span>
                                        <span className="text-zinc-300">•</span>
                                        {String(property?.listedBy || property?.listed_by || '').toLowerCase() === 'broker' ? (
                                            <span className="text-zinc-700 font-semibold bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                                                🤝 Broker
                                            </span>
                                        ) : (
                                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100">
                                                🏠 Direct Owner
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-base sm:text-lg font-extrabold text-zinc-950">
                                            ₹{property?.price ? Number(property.price).toLocaleString() : '8,500'}
                                        </span>
                                        <span className="text-[11px] text-zinc-400 font-medium">/mo</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                                        <span>Dep: ₹{depositAmount.toLocaleString()}</span>
                                        <span className="text-zinc-300">•</span>
                                        {String(property?.listedBy || property?.listed_by || '').toLowerCase() === 'broker' ? (
                                            <span className="text-zinc-700 font-semibold bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                                                🤝 Broker
                                            </span>
                                        ) : (
                                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100">
                                                🏠 Direct Owner
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => setIsVisitModalOpen(true)}
                                disabled={isUnavailable}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full border border-rose-200 text-rose-600 bg-rose-50/70 hover:bg-rose-100 transition-all shrink-0"
                            >
                                <Clock size={11} /> Visit
                            </button>
                            <Link
                                to={`/property/${property?.$id || property?.id || '123'}`}
                                className="inline-flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-sm shadow-rose-500/25 hover:shadow-md transition-all shrink-0 whitespace-nowrap"
                            >
                                <span>Details</span>
                                <ArrowRight size={12} />
                            </Link>
                        </div>
                    </div>

                </div>
            </div>

            {/* Schedule Visit Modal */}
            <ScheduleVisitModal
                isOpen={isVisitModalOpen}
                onClose={() => setIsVisitModalOpen(false)}
                property={property}
            />
        </>
    );
};

export default PropertyCard;
