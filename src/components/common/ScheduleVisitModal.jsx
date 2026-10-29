import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, MessageCircle, Sparkles, CheckCircle2, User, Phone, GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { trackWhatsAppClick, openStaySetuDeskWhatsApp } from '../../lib/whatsappTracker';

const VISIT_SLOTS = [
    'Today (5:00 PM - 7:00 PM)',
    'Tomorrow (11:00 AM - 1:00 PM)',
    'Tomorrow (4:00 PM - 6:00 PM)',
    'This Weekend (Anytime)',
];

const ROOM_PREFERENCES = [
    'Single Private Room',
    'Double Sharing',
    'Triple Sharing',
    'Full Flat / 1BHK',
];

const MOVE_IN_TIMELINES = [
    'Immediate (Within 3 Days)',
    'This Month End',
    'Next Month 1st',
];

const ScheduleVisitModal = ({ isOpen, onClose, property, initialMode = 'visit' }) => {
    const { user, profile } = useAuth();
    
    const [name, setName] = useState(profile?.fullName || profile?.name || user?.name || '');
    const [phone, setPhone] = useState(profile?.phone || profile?.whatsapp || user?.phone || '');
    const [college, setCollege] = useState(profile?.college || '');
    const [selectedSlot, setSelectedSlot] = useState(VISIT_SLOTS[0]);
    const [roomType, setRoomType] = useState(ROOM_PREFERENCES[0]);
    const [moveIn, setMoveIn] = useState(MOVE_IN_TIMELINES[0]);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !property) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanPhone = phone.trim().replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            alert('Please enter a valid 10-digit WhatsApp / Phone number so we can coordinate your visit.');
            return;
        }

        setSubmitting(true);

        const studentName = name.trim() || profile?.fullName || user?.name || 'A Student';
        const studentCollege = college.trim() ? ` (${college.trim()})` : '';

        const ownerName = property.owner?.name || (String(property.listedBy || 'owner').toLowerCase() === 'owner' ? 'Property Owner' : 'Broker');
        const ownerNumber = property.whatsappNumber || property.phoneNumber || property.phone_number || property.owner_phone || '';

        const messageText = 
`Hi StaySetu Team, I want to ${initialMode === 'chat' ? 'inquire about' : 'schedule a visit for'} this stay! 🏠

🏡 Property: "${property.title}"
📍 Location: ${property.location || 'StaySetu Listing'}
💰 Rent: ₹${property.price ? Number(property.price).toLocaleString() : 'N/A'}/month

👤 Student Name: ${studentName}${studentCollege}
📞 WhatsApp / Call: +91 ${cleanPhone}
🛏️ Preference: ${roomType}
🗓️ Move-in: ${moveIn}
⏰ Preferred Visit: ${selectedSlot}

Listing Owner: ${ownerName} (Ph: ${ownerNumber || 'Listed on Platform'})
Please coordinate my visit and connect me!`;

        // 1. Save lead to StaySetu database with student phone and owner details
        await trackWhatsAppClick({
            studentPhone: cleanPhone,
            studentName,
            studentEmail: user?.email || '',
            listingId: property.$id || property.id || '',
            listingTitle: property.title || '',
            listingLocation: property.location || '',
            ownerName,
            ownerPhone: ownerNumber,
            source: initialMode === 'chat' ? 'whatsapp_inquiry' : 'schedule_visit_modal',
            message: messageText,
            status: 'new'
        });

        setSubmitting(false);

        // 2. Open WhatsApp directly to StaySetu Official Desk (+91 7393011350)
        openStaySetuDeskWhatsApp(messageText);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-900 overflow-hidden max-h-[90vh] overflow-y-auto">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200/80 mb-2">
                        <Sparkles size={12} className="text-emerald-600" /> StaySetu Verified Desk • 100% Free
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
                        {initialMode === 'chat' ? 'Connect with StaySetu Desk' : 'Schedule a Free Visit'}
                    </h3>
                    <p className="text-zinc-500 text-xs sm:text-sm font-normal mt-1">
                        Inquiring about <span className="text-zinc-900 font-semibold">{property.title}</span>. Our desk directly arranges your physical visit with the landlord with 100% transparent terms.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">
                                Your Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Rohan Sharma"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-400 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">
                                WhatsApp / Phone <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">+91</span>
                                <input
                                    type="tel"
                                    required
                                    maxLength={10}
                                    placeholder="98765 43210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-3 py-2.5 text-xs text-zinc-900 font-bold tracking-wider placeholder:text-zinc-400 focus:outline-none focus:border-rose-400 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* University / College */}
                    <div>
                        <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Your University / College (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. ABES, AKGEC, IMS, Galgotias, DU"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-400 transition-colors"
                        />
                    </div>

                    {/* Preferred Visit Time Slot */}
                    <div>
                        <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Preferred Visit Time
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {VISIT_SLOTS.map((slot) => (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`px-3 py-2 rounded-xl text-[11px] font-bold text-left transition-all border ${
                                        selectedSlot === slot
                                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                                    }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Room Type Preference */}
                    <div>
                        <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Room Type Needed
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {ROOM_PREFERENCES.map((room) => (
                                <button
                                    key={room}
                                    type="button"
                                    onClick={() => setRoomType(room)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border ${
                                        roomType === room
                                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                                    }`}
                                >
                                    {room}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Move-in Timeline */}
                    <div>
                        <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Target Move-in
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {MOVE_IN_TIMELINES.map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => setMoveIn(time)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border ${
                                        moveIn === time
                                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                                    }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] text-xs uppercase tracking-wider"
                        >
                            <MessageCircle size={18} fill="currentColor" />
                            <span>{submitting ? 'Connecting...' : 'Connect with StaySetu Desk on WhatsApp'}</span>
                        </button>
                        <div className="text-[10px] text-zinc-400 text-center mt-2 flex items-center justify-center gap-1.5">
                            <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                            <span>StaySetu Desk (+91 7393011350) coordinates your visit directly with 100% verified terms.</span>
                        </div>
                    </div>

                </form>

            </div>
        </div>
    );
};

export default ScheduleVisitModal;
