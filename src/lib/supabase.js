import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project')
);

// Fallback safe client so the app runs smoothly in preview/local mode even before keys are added
export const supabase = createClient(
    isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
    isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        }
    }
);

// Standard Supabase Table Names & Storage Bucket
export const DATABASE_ID = 'staysetu_db';
export const BUCKET_ID = 'listing-images';

export const TABLES = {
    profiles: 'profiles',
    listings: 'listings',
    favorites: 'favorites',
    roommateRequests: 'roommate_requests',
    roommate_requests: 'roommate_requests',
    roommateConnectRequests: 'roommate_connect_requests',
    roommate_connect_requests: 'roommate_connect_requests',
    maidServices: 'maid_services',
    maid_services: 'maid_services',
    reviews: 'reviews',
    messages: 'messages',
    whatsappLeads: 'whatsapp_leads',
    whatsapp_leads: 'whatsapp_leads',
    visitRequests: 'visit_requests',
    visit_requests: 'visit_requests',
};

export const COLLECTION = TABLES;

// ID Generator Helper
export const ID = {
    unique: () => 'id_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
};

// Query Builders compatible with StaySetu UI
export const Query = {
    equal: (attribute, values) => ({ method: 'equal', attribute, values: Array.isArray(values) ? values : [values] }),
    notEqual: (attribute, values) => ({ method: 'notEqual', attribute, values: Array.isArray(values) ? values : [values] }),
    orderDesc: (attribute) => ({ method: 'orderDesc', attribute }),
    orderAsc: (attribute) => ({ method: 'orderAsc', attribute }),
    limit: (count) => ({ method: 'limit', attribute: '', values: [count] }),
    search: (attribute, value) => ({ method: 'search', attribute, values: [value] }),
};

// Permission and Role helpers for backward-compatibility
export const Permission = {
    read: (role) => ({ type: 'read', role }),
    write: (role) => ({ type: 'write', role }),
    update: (role) => ({ type: 'update', role }),
    delete: (role) => ({ type: 'delete', role }),
};

export const Role = {
    any: () => 'any',
    user: (id) => `user:${id}`,
    guest: () => 'guest',
};

// Helper: Get optimized image URL from Supabase Storage or external link
export const getImageUrl = (pathOrId) => {
    if (!pathOrId) {
        return 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80';
    }
    if (pathOrId.startsWith('http://') || pathOrId.startsWith('https://')) {
        return pathOrId;
    }
    if (isSupabaseConfigured) {
        const { data } = supabase.storage.from(BUCKET_ID).getPublicUrl(pathOrId);
        if (data?.publicUrl) return data.publicUrl;
    }
    return `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80`;
};

// Helper: Parse images or amenities from JSON string or array
export const parseJsonField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field !== 'string') return [];
    try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [field];
    }
};

// Local storage key constants for fast resilient fallback
const STORAGE_PREFIX = 'staysetu_';
const getLocalCollection = (table) => {
    try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}${table}_v3`);
        return val ? JSON.parse(val) : [];
    } catch {
        return [];
    }
};

const setLocalCollection = (table, items) => {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${table}_v3`, JSON.stringify(items));
    } catch (e) {
        console.error('Storage write error:', e);
    }
};

// Evaluate filters on local array when offline or for fast UI
export const filterDocuments = (docs, queries = []) => {
    if (!Array.isArray(queries) || queries.length === 0) return docs;
    let filtered = [...docs];

    for (const q of queries) {
        if (!q || typeof q !== 'object') continue;
        const { method, attribute, values } = q;

        if (method === 'equal') {
            const targetVal = values && values.length === 1 ? values[0] : values;
            filtered = filtered.filter(doc => {
                const docVal = doc[attribute] ?? (attribute === '$createdAt' ? (doc.createdAt || doc.created_at) : undefined);
                if (Array.isArray(targetVal)) return targetVal.includes(docVal);
                return docVal === targetVal;
            });
        } else if (method === 'orderDesc') {
            filtered.sort((a, b) => {
                const valA = a[attribute] ?? (attribute === '$createdAt' ? (a.createdAt || a.created_at) : undefined) ?? '';
                const valB = b[attribute] ?? (attribute === '$createdAt' ? (b.createdAt || b.created_at) : undefined) ?? '';
                return valA > valB ? -1 : valA < valB ? 1 : 0;
            });
        } else if (method === 'orderAsc') {
            filtered.sort((a, b) => {
                const valA = a[attribute] ?? (attribute === '$createdAt' ? (a.createdAt || a.created_at) : undefined) ?? '';
                const valB = b[attribute] ?? (attribute === '$createdAt' ? (b.createdAt || b.created_at) : undefined) ?? '';
                return valA > valB ? 1 : valA < valB ? -1 : 0;
            });
        } else if (method === 'limit') {
            const count = values && values[0] ? values[0] : 100;
            filtered = filtered.slice(0, count);
        }
    }
    return filtered;
};

// Supabase Database Adapter (High Performance)
const COLUMN_QUERY_MAP = {
    userId: 'user_id',
    ownerId: 'owner_id',
    senderId: 'sender_id',
    receiverId: 'receiver_id',
    isRead: 'is_read',
    isVerified: 'is_verified',
    listingId: 'listing_id',
    requesterId: 'requester_id',
    posterId: 'target_id',
    targetId: 'target_id',
    roommatePostId: 'target_id',
    propertyType: 'property_type',
    genderPreference: 'gender_preference',
    isFeatured: 'is_featured',
    serviceType: 'service_type',
    visitDate: 'visit_date',
    visitTime: 'visit_time',
    userPhone: 'user_phone',
    studentPhone: 'phone_number',
    phoneNumber: 'owner_phone',
    whatsappNumber: 'whatsapp_number',
    $createdAt: 'created_at',
};

const ALLOWED_COLUMNS = {
    listings: new Set([
        'id', 'title', 'description', 'price', 'security_deposit', 'brokerage_fee',
        'property_type', 'type', 'purpose', 'city', 'locality', 'location',
        'address', 'latitude', 'longitude', 'gender_preference', 'occupancy',
        'amenities', 'images', 'videos', 'rules', 'owner_id', 'owner_name',
        'owner_phone', 'whatsapp_number', 'is_verified', 'is_featured',
        'status', 'views_count', 'created_at', 'updated_at'
    ]),
    profiles: new Set([
        'id', 'user_id', 'full_name', 'name', 'email', 'role', 'college', 'phone',
        'avatar_url', 'created_at', 'updated_at'
    ]),
    favorites: new Set([
        'id', 'user_id', 'listing_id', 'created_at'
    ]),
    visit_requests: new Set([
        'id', 'listing_id', 'listing_title', 'user_id', 'user_name', 'user_phone',
        'visit_date', 'visit_time', 'notes', 'status', 'created_at'
    ]),
    reviews: new Set([
        'id', 'listing_id', 'user_id', 'user_name', 'user_avatar', 'rating', 'comment', 'created_at'
    ]),
    messages: new Set([
        'id', 'sender_id', 'sender_name', 'receiver_id', 'receiver_name', 'message', 'is_read', 'created_at'
    ]),
    whatsapp_leads: new Set([
        'id', 'phone_number', 'listing_id', 'listing_title', 'owner_name',
        'clicker_user_id', 'clicker_name', 'clicker_email', 'source', 'message',
        'clicked_at', 'created_at'
    ]),
    maid_services: new Set([
        'id', 'name', 'phone', 'location', 'city', 'services', 'service_type',
        'hourly_rate', 'monthly_rate', 'experience', 'rating', 'is_verified',
        'photo_url', 'status', 'created_at'
    ]),
    roommate_requests: new Set([
        'id', 'user_id', 'name', 'college', 'city', 'locality', 'budget', 'gender',
        'move_in_date', 'habits', 'about', 'contact_phone', 'contact_email',
        'status', 'created_at', 'updated_at'
    ]),
    roommate_connect_requests: new Set([
        'id', 'requester_id', 'target_id', 'message', 'status', 'created_at'
    ])
};

function sanitizeRow(table, doc, isUpdate = false) {
    const now = new Date().toISOString();
    let sanitized = {};

    switch (table) {
        case 'listings': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.title !== undefined) sanitized.title = doc.title;
            if (doc.description !== undefined) sanitized.description = doc.description;
            if (doc.price !== undefined) sanitized.price = parseFloat(doc.price) || 0;
            if (doc.security_deposit !== undefined || doc.deposit !== undefined) {
                sanitized.security_deposit = parseFloat(doc.security_deposit || doc.deposit) || 0;
            }
            if (doc.brokerage_fee !== undefined || doc.brokerageFee !== undefined) {
                const bVal = doc.brokerage_fee !== undefined ? doc.brokerage_fee : doc.brokerageFee;
                if (typeof bVal === 'number') {
                    sanitized.brokerage_fee = bVal;
                } else {
                    const numMatch = String(bVal || '').match(/[\d.]+/);
                    sanitized.brokerage_fee = numMatch ? parseFloat(numMatch[0]) : 0;
                }
            }
            if (doc.property_type !== undefined || doc.propertyType !== undefined) {
                sanitized.property_type = doc.property_type || doc.propertyType || doc.type || 'Flat';
            }
            if (doc.type !== undefined) sanitized.type = doc.type;
            if (doc.purpose !== undefined) sanitized.purpose = doc.purpose || 'rent';
            if (doc.location !== undefined || doc.locality !== undefined) {
                const loc = doc.location || doc.locality || '';
                sanitized.location = loc;
                if (!doc.city && loc.includes(',')) sanitized.city = loc.split(',').pop().trim();
                else if (doc.city) sanitized.city = doc.city;
                if (!doc.locality && loc.includes(',')) sanitized.locality = loc.split(',')[0].trim();
                else if (doc.locality) sanitized.locality = doc.locality;
            }
            if (doc.address !== undefined) sanitized.address = doc.address;
            if (doc.latitude !== undefined) sanitized.latitude = parseFloat(doc.latitude) || null;
            if (doc.longitude !== undefined) sanitized.longitude = parseFloat(doc.longitude) || null;
            if (doc.gender_preference !== undefined || doc.genderPreference !== undefined) {
                sanitized.gender_preference = doc.gender_preference || doc.genderPreference || 'any';
            }
            if (doc.occupancy !== undefined) {
                sanitized.occupancy = Array.isArray(doc.occupancy) ? doc.occupancy : [doc.occupancy];
            }
            if (doc.amenities !== undefined) {
                sanitized.amenities = Array.isArray(doc.amenities) ? doc.amenities : [];
            }
            if (doc.images !== undefined) {
                sanitized.images = Array.isArray(doc.images) ? doc.images : [doc.images];
            }
            if (doc.videos !== undefined) sanitized.videos = Array.isArray(doc.videos) ? doc.videos : [];
            if (doc.rules !== undefined) sanitized.rules = typeof doc.rules === 'string' ? doc.rules : JSON.stringify(doc.rules);
            if (doc.owner_id !== undefined || doc.ownerId !== undefined) sanitized.owner_id = doc.owner_id || doc.ownerId || null;
            if (doc.owner_name !== undefined || doc.ownerName !== undefined) sanitized.owner_name = doc.owner_name || doc.ownerName || 'Property Owner';
            if (doc.owner_phone !== undefined || doc.ownerPhone !== undefined || doc.phoneNumber !== undefined || doc.phone_number !== undefined) {
                sanitized.owner_phone = doc.owner_phone || doc.ownerPhone || doc.phoneNumber || doc.phone_number || '';
            }
            if (doc.whatsapp_number !== undefined || doc.whatsappNumber !== undefined) {
                sanitized.whatsapp_number = doc.whatsapp_number || doc.whatsappNumber || '';
            }
            if (doc.is_verified !== undefined || doc.isVerified !== undefined) sanitized.is_verified = Boolean(doc.is_verified || doc.isVerified);
            if (doc.is_featured !== undefined || doc.isFeatured !== undefined || doc.featured !== undefined) sanitized.is_featured = Boolean(doc.is_featured || doc.isFeatured || doc.featured);
            if (doc.status !== undefined) sanitized.status = doc.status || 'approved';
            if (doc.views_count !== undefined || doc.viewsCount !== undefined) sanitized.views_count = parseInt(doc.views_count || doc.viewsCount) || 0;
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            sanitized.updated_at = now;
            break;
        }

        case 'profiles': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.user_id !== undefined || doc.userId !== undefined) sanitized.user_id = doc.user_id || doc.userId;
            if (doc.full_name !== undefined || doc.fullName !== undefined) sanitized.full_name = doc.full_name || doc.fullName;
            if (doc.name !== undefined) sanitized.name = doc.name;
            if (doc.email !== undefined) sanitized.email = doc.email;
            if (doc.role !== undefined) sanitized.role = doc.role;
            if (doc.college !== undefined) sanitized.college = doc.college;
            if (doc.phone !== undefined || doc.phoneNumber !== undefined) sanitized.phone = doc.phone || doc.phoneNumber;
            if (doc.avatar_url !== undefined || doc.avatarUrl !== undefined) sanitized.avatar_url = doc.avatar_url || doc.avatarUrl;
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            sanitized.updated_at = now;
            break;
        }

        case 'favorites': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.user_id !== undefined || doc.userId !== undefined) sanitized.user_id = doc.user_id || doc.userId;
            if (doc.listing_id !== undefined || doc.listingId !== undefined) sanitized.listing_id = doc.listing_id || doc.listingId;
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            break;
        }

        case 'visit_requests': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.listing_id !== undefined || doc.listingId !== undefined) sanitized.listing_id = doc.listing_id || doc.listingId;
            if (doc.listing_title !== undefined || doc.listingTitle !== undefined) sanitized.listing_title = doc.listing_title || doc.listingTitle;
            if (doc.user_id !== undefined || doc.userId !== undefined) sanitized.user_id = doc.user_id || doc.userId;
            if (doc.user_name !== undefined || doc.userName !== undefined || doc.studentName !== undefined) {
                sanitized.user_name = doc.user_name || doc.userName || doc.studentName || 'Student';
            }
            if (doc.user_phone !== undefined || doc.userPhone !== undefined || doc.studentPhone !== undefined) {
                sanitized.user_phone = doc.user_phone || doc.userPhone || doc.studentPhone || '';
            }
            if (doc.visit_date !== undefined || doc.visitDate !== undefined) sanitized.visit_date = doc.visit_date || doc.visitDate;
            if (doc.visit_time !== undefined || doc.visitTime !== undefined || doc.timeSlot !== undefined) {
                sanitized.visit_time = doc.visit_time || doc.visitTime || doc.timeSlot;
            }
            if (doc.notes !== undefined) sanitized.notes = doc.notes || '';
            if (doc.status !== undefined) sanitized.status = doc.status || 'confirmed';
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            break;
        }

        case 'reviews': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.listing_id !== undefined || doc.listingId !== undefined) sanitized.listing_id = doc.listing_id || doc.listingId;
            if (doc.user_id !== undefined || doc.userId !== undefined) sanitized.user_id = doc.user_id || doc.userId;
            if (doc.user_name !== undefined || doc.userName !== undefined) sanitized.user_name = doc.user_name || doc.userName;
            if (doc.user_avatar !== undefined || doc.userAvatar !== undefined) sanitized.user_avatar = doc.user_avatar || doc.userAvatar;
            if (doc.rating !== undefined) sanitized.rating = parseFloat(doc.rating) || 5;
            if (doc.comment !== undefined || doc.review !== undefined) sanitized.comment = doc.comment || doc.review || '';
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            break;
        }

        case 'messages': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.sender_id !== undefined || doc.senderId !== undefined) sanitized.sender_id = doc.sender_id || doc.senderId;
            if (doc.sender_name !== undefined || doc.senderName !== undefined) sanitized.sender_name = doc.sender_name || doc.senderName || 'User';
            if (doc.receiver_id !== undefined || doc.receiverId !== undefined) sanitized.receiver_id = doc.receiver_id || doc.receiverId;
            if (doc.receiver_name !== undefined || doc.receiverName !== undefined) sanitized.receiver_name = doc.receiver_name || doc.receiverName || 'User';
            if (doc.message !== undefined || doc.content !== undefined) sanitized.message = doc.message || doc.content || '';
            if (doc.is_read !== undefined || doc.isRead !== undefined) sanitized.is_read = Boolean(doc.is_read || doc.isRead);
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            break;
        }

        case 'whatsapp_leads': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.phone_number !== undefined || doc.phoneNumber !== undefined || doc.studentPhone !== undefined || doc.ownerPhone !== undefined) {
                sanitized.phone_number = doc.phone_number || doc.phoneNumber || doc.studentPhone || doc.ownerPhone || '';
            }
            if (doc.listing_id !== undefined || doc.listingId !== undefined) sanitized.listing_id = doc.listing_id || doc.listingId || '';
            if (doc.listing_title !== undefined || doc.listingTitle !== undefined) sanitized.listing_title = doc.listing_title || doc.listingTitle || 'StaySetu Property';
            if (doc.owner_name !== undefined || doc.ownerName !== undefined) sanitized.owner_name = doc.owner_name || doc.ownerName || 'Owner';
            if (doc.clicker_user_id !== undefined || doc.clickerUserId !== undefined || doc.userId !== undefined) {
                sanitized.clicker_user_id = doc.clicker_user_id || doc.clickerUserId || doc.userId || null;
            }
            if (doc.clicker_name !== undefined || doc.clickerName !== undefined || doc.studentName !== undefined) {
                sanitized.clicker_name = doc.clicker_name || doc.clickerName || doc.studentName || 'Student';
            }
            if (doc.clicker_email !== undefined || doc.clickerEmail !== undefined || doc.studentEmail !== undefined) {
                sanitized.clicker_email = doc.clicker_email || doc.clickerEmail || doc.studentEmail || '';
            }
            if (doc.source !== undefined) sanitized.source = doc.source;
            if (doc.message !== undefined) sanitized.message = doc.message;
            if (doc.clicked_at !== undefined || doc.clickedAt !== undefined) sanitized.clicked_at = doc.clicked_at || doc.clickedAt || now;
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            break;
        }

        case 'maid_services': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.name !== undefined || doc.title !== undefined) sanitized.name = doc.name || doc.title || 'Verified Caregiver';
            if (doc.phone !== undefined || doc.phoneNumber !== undefined || doc.whatsappNumber !== undefined) {
                sanitized.phone = doc.phone || doc.phoneNumber || doc.whatsappNumber || '';
            }
            if (doc.location !== undefined) sanitized.location = doc.location;
            if (doc.city !== undefined) sanitized.city = doc.city || 'Ghaziabad';
            if (doc.services !== undefined || doc.description !== undefined) {
                sanitized.services = Array.isArray(doc.services) ? doc.services : (doc.description ? [doc.description] : ['All-in-one care']);
            }
            if (doc.service_type !== undefined || doc.serviceType !== undefined) {
                sanitized.service_type = doc.service_type || doc.serviceType || 'all-in-one';
            }
            if (doc.hourly_rate !== undefined || doc.hourlyRate !== undefined) sanitized.hourly_rate = parseFloat(doc.hourly_rate || doc.hourlyRate) || null;
            if (doc.monthly_rate !== undefined || doc.monthlyRate !== undefined || doc.price !== undefined) {
                sanitized.monthly_rate = parseFloat(doc.monthly_rate || doc.monthlyRate || doc.price) || 3500;
            }
            if (doc.experience !== undefined || doc.timing !== undefined) sanitized.experience = doc.experience || doc.timing || 'Experienced';
            if (doc.rating !== undefined) sanitized.rating = parseFloat(doc.rating) || 4.8;
            if (doc.is_verified !== undefined) sanitized.is_verified = Boolean(doc.is_verified);
            if (doc.photo_url !== undefined || doc.photoUrl !== undefined || doc.image !== undefined) {
                sanitized.photo_url = doc.photo_url || doc.photoUrl || doc.image || null;
            }
            if (doc.status !== undefined) sanitized.status = doc.status || 'approved';
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            break;
        }

        case 'roommate_requests': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.user_id !== undefined || doc.userId !== undefined) sanitized.user_id = doc.user_id || doc.userId || null;
            if (doc.name !== undefined) sanitized.name = doc.name || 'Anonymous';
            if (doc.college !== undefined) sanitized.college = doc.college || '';
            if (doc.city !== undefined) sanitized.city = doc.city || 'Ghaziabad';
            if (doc.locality !== undefined || doc.location !== undefined) sanitized.locality = doc.locality || doc.location || 'Crossings Republik';
            if (doc.budget !== undefined) sanitized.budget = Number(doc.budget) || 0;
            if (doc.gender !== undefined || doc.genderPreference !== undefined || doc.gender_preference !== undefined) {
                sanitized.gender = doc.gender || doc.genderPreference || doc.gender_preference || 'any';
            }
            if (doc.move_in_date !== undefined || doc.moveInDate !== undefined) sanitized.move_in_date = doc.move_in_date || doc.moveInDate || null;
            if (doc.habits !== undefined) sanitized.habits = Array.isArray(doc.habits) ? doc.habits : [];
            if (doc.about !== undefined || doc.description !== undefined) sanitized.about = doc.about || doc.description || '';
            if (doc.contact_phone !== undefined || doc.whatsapp !== undefined) sanitized.contact_phone = doc.contact_phone || doc.whatsapp || '';
            if (doc.contact_email !== undefined) sanitized.contact_email = doc.contact_email || '';
            if (doc.status !== undefined) sanitized.status = doc.status || 'active';
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            sanitized.updated_at = now;
            break;
        }

        case 'roommate_connect_requests': {
            if (doc.id) sanitized.id = doc.id;
            if (doc.requester_id !== undefined || doc.requesterId !== undefined) sanitized.requester_id = doc.requester_id || doc.requesterId || null;
            if (doc.target_id !== undefined || doc.targetId !== undefined || doc.posterId !== undefined) {
                sanitized.target_id = doc.target_id || doc.targetId || doc.posterId || null;
            }
            if (doc.message !== undefined || doc.note !== undefined || doc.requesterPhone !== undefined) {
                sanitized.message = typeof doc.message === 'string' ? doc.message : JSON.stringify(doc.message || {
                    requesterName: doc.requesterName,
                    requesterPhone: doc.requesterPhone,
                    postLocation: doc.postLocation,
                    postCollege: doc.postCollege,
                    note: doc.note,
                });
            }
            if (doc.status !== undefined) sanitized.status = doc.status || 'pending';
            if (doc.created_at || doc.createdAt) sanitized.created_at = doc.created_at || doc.createdAt || now;
            break;
        }

        default: {
            sanitized = { ...doc };
            delete sanitized.$id;
            delete sanitized.$createdAt;
            delete sanitized.$updatedAt;
        }
    }

    const allowed = ALLOWED_COLUMNS[table];
    if (allowed) {
        const filtered = {};
        for (const [k, v] of Object.entries(sanitized)) {
            if (allowed.has(k) && v !== undefined) {
                filtered[k] = v;
            }
        }
        return filtered;
    }
    return sanitized;
}

function normalizeDocument(table, item) {
    if (!item) return item;
    let parsedMessage = null;
    if (table === 'roommate_connect_requests' && typeof item.message === 'string' && item.message.startsWith('{')) {
        try { parsedMessage = JSON.parse(item.message); } catch { /* ignore */ }
    }

    return {
        ...item,
        $id: item.id?.toString(),
        $createdAt: item.created_at || item.createdAt,
        $updatedAt: item.updated_at || item.updatedAt,
        amenities: parseJsonField(item.amenities),
        images: parseJsonField(item.images),
        occupancy: parseJsonField(item.occupancy),

        // listings
        ownerId: item.owner_id || item.ownerId,
        owner_id: item.owner_id || item.ownerId,
        genderPreference: item.gender_preference || item.genderPreference,
        gender_preference: item.gender_preference || item.genderPreference,
        phoneNumber: item.owner_phone || item.phoneNumber,
        ownerPhone: item.owner_phone || item.ownerPhone,
        whatsappNumber: item.whatsapp_number || item.whatsappNumber,
        brokerageFee: item.brokerage_fee !== undefined ? item.brokerage_fee : item.brokerageFee,
        propertyType: item.property_type || item.propertyType,
        isVerified: item.is_verified !== undefined ? item.is_verified : item.isVerified,
        isFeatured: item.is_featured !== undefined ? item.is_featured : item.isFeatured,
        viewsCount: item.views_count !== undefined ? item.views_count : item.viewsCount,

        // profiles
        userId: item.user_id || item.userId,
        user_id: item.user_id || item.userId,
        fullName: item.full_name || item.fullName || item.name,
        name: item.name || item.full_name || item.fullName,

        // favorites & reviews
        listingId: item.listing_id || item.listingId,
        listing_id: item.listing_id || item.listingId,
        userName: item.user_name || item.userName,
        userAvatar: item.user_avatar || item.userAvatar,

        // visit_requests
        listingTitle: item.listing_title || item.listingTitle,
        studentName: item.user_name || item.studentName || item.userName,
        studentPhone: item.user_phone || item.studentPhone || item.userPhone,
        visitDate: item.visit_date || item.visitDate,
        visitTime: item.visit_time || item.visitTime,
        timeSlot: item.visit_time || item.timeSlot,

        // messages
        senderId: item.sender_id || item.senderId,
        receiverId: item.receiver_id || item.receiverId,
        content: item.message !== undefined ? item.message : item.content,
        isRead: item.is_read !== undefined ? item.is_read : item.isRead,

        // whatsapp_leads
        studentEmail: item.clicker_email || item.studentEmail,
        clickerName: item.clicker_name || item.clickerName,
        clickerEmail: item.clicker_email || item.clickerEmail,
        clickedAt: item.clicked_at || item.clickedAt,

        // maid_services
        title: item.name || item.title,
        serviceType: item.service_type || item.serviceType,
        price: item.monthly_rate || item.price,
        description: Array.isArray(item.services) ? item.services.join(', ') : (item.services || item.description),

        // roommate_requests
        location: item.location || [item.locality, item.city].filter(Boolean).join(', ') || item.locality,
        locality: item.locality || item.location,
        about: item.about || item.description,
        whatsapp: item.contact_phone || item.whatsapp,
        contact_phone: item.contact_phone || item.whatsapp,
        gender: item.gender || item.genderPreference,
        moveInDate: item.move_in_date || item.moveInDate,
        move_in_date: item.move_in_date || item.moveInDate,

        // roommate_connect_requests
        requesterName: parsedMessage?.requesterName || item.requesterName || 'Student',
        requesterPhone: parsedMessage?.requesterPhone || item.requesterPhone || '',
        postLocation: parsedMessage?.postLocation || item.postLocation || 'NCR',
        postCollege: parsedMessage?.postCollege || item.postCollege || '',
        note: parsedMessage?.note || parsedMessage?.text || item.message,
        posterId: item.target_id || item.posterId,
        requesterId: item.requester_id || item.requesterId,
    };
}

export const databases = {
    async listDocuments(_databaseId, collectionId, queries = []) {
        const table = TABLES[collectionId] || collectionId;

        if (isSupabaseConfigured) {
            try {
                let query = supabase.from(table).select('*');

                for (const q of queries) {
                    if (!q) continue;
                    const colName = COLUMN_QUERY_MAP[q.attribute] || q.attribute;
                    if (q.method === 'equal' && q.attribute) {
                        const val = q.values && q.values.length === 1 ? q.values[0] : q.values;
                        if (Array.isArray(val)) {
                            query = query.in(colName, val);
                        } else {
                            query = query.eq(colName, val);
                        }
                    } else if (q.method === 'orderDesc' && q.attribute) {
                        query = query.order(colName, { ascending: false });
                    } else if (q.method === 'orderAsc' && q.attribute) {
                        query = query.order(colName, { ascending: true });
                    } else if (q.method === 'limit' && q.values?.[0]) {
                        query = query.limit(q.values[0]);
                    }
                }

                const { data, error } = await query;
                if (!error && Array.isArray(data)) {
                    const normalized = data.map(item => normalizeDocument(table, item));
                    return { documents: normalized, total: normalized.length };
                }
            } catch (err) {
                console.warn(`Supabase query failed on ${table}, using local fallback:`, err);
            }
        }

        // Local persistent store fallback
        const localDocs = getLocalCollection(table);
        const filtered = filterDocuments(localDocs, queries);
        return { documents: filtered, total: filtered.length };
    },

    async getDocument(_databaseId, collectionId, documentId) {
        const table = TABLES[collectionId] || collectionId;

        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.from(table).select('*').eq('id', documentId).single();
                if (!error && data) {
                    return normalizeDocument(table, data);
                }
            } catch (err) {
                console.warn(`Supabase getDocument failed on ${table}:`, err);
            }
        }

        const docs = getLocalCollection(table);
        const found = docs.find(d => d.$id === documentId || d.id === documentId);
        if (!found) throw new Error(`Document ${documentId} not found in ${table}`);
        return found;
    },

    async createDocument(_databaseId, collectionId, documentId, data) {
        const table = TABLES[collectionId] || collectionId;
        const id = documentId || ID.unique();
        const now = new Date().toISOString();

        const newDoc = {
            ...data,
            id,
            $id: id,
            createdAt: now,
            created_at: now,
            $createdAt: now,
            updatedAt: now,
            updated_at: now,
        };

        if (isSupabaseConfigured) {
            try {
                const dbRow = sanitizeRow(table, newDoc, false);
                const { error: insErr } = await supabase.from(table).insert([dbRow]);
                if (insErr) {
                    console.warn(`Supabase insert error on ${table}:`, insErr);
                }
            } catch (err) {
                console.warn(`Supabase insert failed on ${table}:`, err);
            }
        }

        const docs = getLocalCollection(table);
        docs.unshift(newDoc);
        setLocalCollection(table, docs);
        return normalizeDocument(table, newDoc);
    },

    async updateDocument(_databaseId, collectionId, documentId, data) {
        const table = TABLES[collectionId] || collectionId;
        const now = new Date().toISOString();

        if (isSupabaseConfigured) {
            try {
                const updatePayload = sanitizeRow(table, data, true);
                if (Object.keys(updatePayload).length > 0) {
                    const { error: updErr } = await supabase.from(table).update(updatePayload).eq('id', documentId);
                    if (updErr) {
                        console.warn(`Supabase update error on ${table}:`, updErr);
                    }
                }
            } catch (err) {
                console.warn(`Supabase update failed on ${table}:`, err);
            }
        }

        const docs = getLocalCollection(table);
        const idx = docs.findIndex(d => d.$id === documentId || d.id === documentId);
        if (idx !== -1) {
            docs[idx] = { ...docs[idx], ...data, updatedAt: now, $updatedAt: now };
            setLocalCollection(table, docs);
            return normalizeDocument(table, docs[idx]);
        }
        return normalizeDocument(table, { ...data, $id: documentId, id: documentId });
    },

    async deleteDocument(_databaseId, collectionId, documentId) {
        const table = TABLES[collectionId] || collectionId;

        if (isSupabaseConfigured) {
            try {
                await supabase.from(table).delete().eq('id', documentId);
            } catch (err) {
                console.warn(`Supabase delete failed on ${table}:`, err);
            }
        }

        const docs = getLocalCollection(table);
        const filtered = docs.filter(d => d.$id !== documentId && d.id !== documentId);
        setLocalCollection(table, filtered);
        return { status: 'deleted', id: documentId };
    }
};

// Supabase Storage Adapter (High Speed CDN)
export const storage = {
    async createFile(bucketId, fileId, file) {
        const bucket = bucketId || BUCKET_ID;
        const extension = file.name ? file.name.split('.').pop() : 'jpg';
        const cleanFileName = `${fileId || ID.unique()}.${extension}`;

        if (isSupabaseConfigured) {
            try {
                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(cleanFileName, file, {
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (!uploadError) {
                    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(cleanFileName);
                    return {
                        $id: cleanFileName,
                        id: cleanFileName,
                        name: file.name,
                        url: publicData.publicUrl,
                    };
                }
            } catch (err) {
                console.warn('Supabase storage upload fallback:', err);
            }
        }

        // Object URL fallback for local offline preview
        const blobUrl = URL.createObjectURL(file);
        return {
            $id: cleanFileName,
            id: cleanFileName,
            name: file.name,
            url: blobUrl,
        };
    },

    getFileView(bucketId, fileId) {
        return getImageUrl(fileId);
    }
};

// Supabase Auth Account Adapter
export const account = {
    async get() {
        if (isSupabaseConfigured) {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (!error && user) {
                return {
                    $id: user.id,
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
                    role: user.user_metadata?.role || 'student',
                };
            }
        }

        // Local persistent user session fallback
        const localUser = localStorage.getItem('staysetu_current_user_v3') || localStorage.getItem('staysetu_current_user_v2');
        if (localUser) {
            try {
                return JSON.parse(localUser);
            } catch {
                localStorage.removeItem('staysetu_current_user_v3');
            }
        }
        throw new Error('User not logged in');
    },

    async create(userId, email, password, name, role = 'student') {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        name,
                        role,
                    }
                }
            });
            if (error) throw error;
            const u = data.user;
            return {
                $id: u?.id || userId,
                id: u?.id || userId,
                email: u?.email || email,
                name,
                role,
            };
        }

        const newUser = {
            $id: userId || ID.unique(),
            id: userId || ID.unique(),
            email,
            name: name || email.split('@')[0],
            role,
        };
        localStorage.setItem('staysetu_current_user_v3', JSON.stringify(newUser));
        return newUser;
    },

    async createEmailPasswordSession(email, password) {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return { status: 'success', user: data.user };
        }

        const user = {
            $id: 'usr_' + Math.random().toString(36).substring(2, 9),
            id: 'usr_' + Math.random().toString(36).substring(2, 9),
            email,
            name: email.split('@')[0],
            role: 'student',
        };
        localStorage.setItem('staysetu_current_user_v3', JSON.stringify(user));
        return { status: 'success', user };
    },

    async createOAuth2Session(provider, successUrl) {
        if (isSupabaseConfigured) {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider || 'google',
                options: {
                    redirectTo: successUrl || window.location.origin + '/dashboard',
                }
            });
            if (error) throw error;
            return;
        }

        // Instant simulated Google login in local/demo mode
        const demoUser = {
            $id: 'google_user_1',
            id: 'google_user_1',
            email: 'student@staysetu.online',
            name: 'Demo Student (Google)',
            role: 'student',
        };
        localStorage.setItem('staysetu_current_user_v3', JSON.stringify(demoUser));
        window.location.href = successUrl || '/dashboard';
    },

    async deleteSession() {
        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        }
        localStorage.removeItem('staysetu_current_user_v3');
        localStorage.removeItem('staysetu_current_user_v2');
        return { status: 'success' };
    },

    async updateVerification(_userId, _secret) {
        return { status: 'success' };
    }
};

export const client = {
    setEndpoint: () => client,
    setProject: () => client,
};
