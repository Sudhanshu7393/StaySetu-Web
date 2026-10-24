import { INITIAL_LISTINGS, INITIAL_ROOMMATES, INITIAL_MAIDS, INITIAL_REVIEWS, DEMO_USERS } from './mockData';
import { supabase } from './supabase';

// Check if valid Supabase configuration is present
const hasSupabase = Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
);

const STORAGE_KEYS = {
    listings: 'staysetu_listings_v3',
    profiles: 'staysetu_profiles_v3',
    roommate_requests: 'staysetu_roommates_v3',
    roommate_connect_requests: 'staysetu_roommate_connect_v3',
    maid_services: 'staysetu_maids_v3',
    reviews: 'staysetu_reviews_v3',
    messages: 'staysetu_messages_v3',
    whatsapp_leads: 'staysetu_leads_v3',
    visit_requests: 'staysetu_visits_v3',
    favorites: 'staysetu_favorites_v3',
    currentUser: 'staysetu_current_user_v3',
};

// Initialize default data in localStorage if not set - Real & clean data only
export const initLocalStore = () => {
    try {
        // Clean legacy mock data from browser localStorage
        [
            'staysetu_listings_v2', 'staysetu_roommates_v2', 'staysetu_maids_v2', 'staysetu_reviews_v2',
            'staysetu_listings', 'staysetu_roommates', 'staysetu_maids', 'staysetu_reviews'
        ].forEach(k => {
            try { localStorage.removeItem(k); } catch { /* ignore */ }
        });

        if (!localStorage.getItem(STORAGE_KEYS.listings)) {
            localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.roommate_requests)) {
            localStorage.setItem(STORAGE_KEYS.roommate_requests, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.maid_services)) {
            localStorage.setItem(STORAGE_KEYS.maid_services, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.reviews)) {
            localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.messages)) {
            localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.whatsapp_leads)) {
            localStorage.setItem(STORAGE_KEYS.whatsapp_leads, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.visit_requests)) {
            localStorage.setItem(STORAGE_KEYS.visit_requests, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.favorites)) {
            localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([]));
        }
    } catch (e) {
        console.warn('Storage init warning:', e);
    }
};

// Helper to get items
export const getLocalCollection = (collectionId) => {
    initLocalStore();
    const key = STORAGE_KEYS[collectionId] || `staysetu_${collectionId}`;
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : [];
    } catch (e) {
        console.error('Error reading localStorage for:', collectionId, e);
        return [];
    }
};

// Helper to save items
export const setLocalCollection = (collectionId, items) => {
    const key = STORAGE_KEYS[collectionId] || `staysetu_${collectionId}`;
    try {
        localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
        console.error('Error writing to localStorage for:', collectionId, e);
    }
};

// Evaluate Query filters locally
export const filterDocuments = (docs, queries = []) => {
    if (!Array.isArray(queries) || queries.length === 0) return docs;

    let filtered = [...docs];

    for (const q of queries) {
        if (!q || typeof q !== 'object') continue;
        const { method, attribute, values } = q;

        if (method === 'equal') {
            const targetVal = values && values.length === 1 ? values[0] : values;
            filtered = filtered.filter(doc => {
                const docVal = doc[attribute] ?? (attribute === '$createdAt' ? doc.createdAt : undefined);
                if (Array.isArray(targetVal)) {
                    return targetVal.includes(docVal);
                }
                return docVal === targetVal;
            });
        } else if (method === 'orderDesc') {
            filtered.sort((a, b) => {
                const valA = a[attribute] ?? (attribute === '$createdAt' ? a.createdAt : undefined) ?? '';
                const valB = b[attribute] ?? (attribute === '$createdAt' ? b.createdAt : undefined) ?? '';
                return valA > valB ? -1 : valA < valB ? 1 : 0;
            });
        } else if (method === 'orderAsc') {
            filtered.sort((a, b) => {
                const valA = a[attribute] ?? (attribute === '$createdAt' ? a.createdAt : undefined) ?? '';
                const valB = b[attribute] ?? (attribute === '$createdAt' ? b.createdAt : undefined) ?? '';
                return valA > valB ? 1 : valA < valB ? -1 : 0;
            });
        } else if (method === 'limit') {
            const limitCount = values && values[0] ? values[0] : 100;
            filtered = filtered.slice(0, limitCount);
        }
    }

    return filtered;
};

// Resilient Databases Adapter
export const resilientDatabases = {
    async listDocuments(databaseId, collectionId, queries = []) {
        // 1. Try Supabase first if configured
        if (hasSupabase) {
            try {
                const tableName = collectionId;
                let q = supabase.from(tableName).select('*');
                const { data, error } = await q;
                if (!error && data && data.length > 0) {
                    const normalized = data.map(item => ({
                        ...item,
                        $id: item.id?.toString(),
                        $createdAt: item.created_at || item.createdAt,
                    }));
                    return { documents: filterDocuments(normalized, queries), total: normalized.length };
                }
            } catch (err) {
                console.warn('Supabase query failed, trying next adapter:', err);
            }
        }

        // Fallback to rich persistent local store
        const docs = getLocalCollection(collectionId);
        const filtered = filterDocuments(docs, queries);
        return { documents: filtered, total: filtered.length };
    },

    async getDocument(databaseId, collectionId, documentId) {
        if (hasSupabase) {
            try {
                const { data, error } = await supabase.from(collectionId).select('*').eq('id', documentId).single();
                if (!error && data) {
                    return { ...data, $id: data.id?.toString(), $createdAt: data.created_at || data.createdAt };
                }
            } catch (e) {
                console.warn('Supabase getDocument fallback to local:', e);
            }
        }

        const docs = getLocalCollection(collectionId);
        const doc = docs.find(d => (d.$id === documentId || d.id === documentId));
        if (!doc) throw new Error('Document not found: ' + documentId);
        return doc;
    },

    async createDocument(databaseId, collectionId, documentId, data) {
        const id = documentId || 'doc_' + Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();
        const newDoc = {
            ...data,
            $id: id,
            id: id,
            $createdAt: now,
            createdAt: now,
            $updatedAt: now,
            updatedAt: now,
        };

        // Try Supabase in parallel
        if (hasSupabase) {
            try {
                await supabase.from(collectionId).insert([newDoc]);
            } catch (e) {
                console.warn('Supabase insert fallback:', e);
            }
        }

        const docs = getLocalCollection(collectionId);
        docs.unshift(newDoc);
        setLocalCollection(collectionId, docs);
        return newDoc;
    },

    async updateDocument(databaseId, collectionId, documentId, data) {
        const now = new Date().toISOString();
        if (hasSupabase) {
            try {
                await supabase.from(collectionId).update(data).eq('id', documentId);
            } catch (e) {
                console.warn('Supabase update fallback:', e);
            }
        }

        const docs = getLocalCollection(collectionId);
        const index = docs.findIndex(d => (d.$id === documentId || d.id === documentId));
        if (index !== -1) {
            docs[index] = { ...docs[index], ...data, $updatedAt: now, updatedAt: now };
            setLocalCollection(collectionId, docs);
            return docs[index];
        }
        return { ...data, $id: documentId, id: documentId };
    },

    async deleteDocument(databaseId, collectionId, documentId) {
        if (hasSupabase) {
            try {
                await supabase.from(collectionId).delete().eq('id', documentId);
            } catch (e) {
                console.warn('Supabase delete fallback:', e);
            }
        }

        const docs = getLocalCollection(collectionId);
        const filtered = docs.filter(d => (d.$id !== documentId && d.id !== documentId));
        setLocalCollection(collectionId, filtered);
        return { status: 'deleted', id: documentId };
    }
};

// Resilient Auth Account Adapter
export const resilientAccount = {
    async get() {
        const userJson = localStorage.getItem(STORAGE_KEYS.currentUser);
        if (userJson) {
            try {
                return JSON.parse(userJson);
            } catch {
                localStorage.removeItem(STORAGE_KEYS.currentUser);
            }
        }
        throw new Error('Not logged in');
    },

    async create(userId, email, password, name) {
        const user = {
            $id: userId || 'user_' + Math.random().toString(36).substr(2, 9),
            id: userId,
            email,
            name: name || email.split('@')[0],
        };
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
        return user;
    },

    async createEmailPasswordSession(email, _password) {
        let matchedUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!matchedUser) {
            matchedUser = {
                $id: 'user_' + Math.random().toString(36).substr(2, 9),
                id: 'user_' + Math.random().toString(36).substr(2, 9),
                email,
                name: email.split('@')[0],
                role: 'student'
            };
        }
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(matchedUser));
        return { status: 'success', user: matchedUser };
    },

    async createOAuth2Session(_provider, successUrl, _failureUrl) {
        // In local/demo mode, simulate quick Google login
        const googleUser = DEMO_USERS.student;
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(googleUser));
        window.location.href = successUrl || '/dashboard';
    },

    async deleteSession(_sessionId) {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        return { status: 'success' };
    }
};

// Resilient Storage Adapter
export const resilientStorage = {
    async createFile(_bucketId, fileId, file) {
        const id = fileId || 'file_' + Math.random().toString(36).substr(2, 9);
        return {
            $id: id,
            name: file?.name || 'uploaded_image.jpg',
            viewUrl: URL.createObjectURL(file)
        };
    },
    getFileView(_bucketId, _fileId) {
        return `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80`;
    }
};
