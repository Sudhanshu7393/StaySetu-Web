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
export const databases = {
    async listDocuments(_databaseId, collectionId, queries = []) {
        const table = TABLES[collectionId] || collectionId;

        if (isSupabaseConfigured) {
            try {
                let query = supabase.from(table).select('*');

                for (const q of queries) {
                    if (!q) continue;
                    if (q.method === 'equal' && q.attribute) {
                        const val = q.values && q.values.length === 1 ? q.values[0] : q.values;
                        if (Array.isArray(val)) {
                            query = query.in(q.attribute, val);
                        } else {
                            query = query.eq(q.attribute, val);
                        }
                    } else if (q.method === 'orderDesc' && q.attribute) {
                        const col = q.attribute === '$createdAt' ? 'created_at' : q.attribute;
                        query = query.order(col, { ascending: false });
                    } else if (q.method === 'orderAsc' && q.attribute) {
                        const col = q.attribute === '$createdAt' ? 'created_at' : q.attribute;
                        query = query.order(col, { ascending: true });
                    } else if (q.method === 'limit' && q.values?.[0]) {
                        query = query.limit(q.values[0]);
                    }
                }

                const { data, error } = await query;
                if (!error && Array.isArray(data)) {
                    const normalized = data.map(item => ({
                        ...item,
                        $id: item.id?.toString(),
                        $createdAt: item.created_at || item.createdAt,
                        amenities: parseJsonField(item.amenities),
                        images: parseJsonField(item.images),
                    }));
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
                    return {
                        ...data,
                        $id: data.id?.toString(),
                        $createdAt: data.created_at || data.createdAt,
                        amenities: parseJsonField(data.amenities),
                        images: parseJsonField(data.images),
                    };
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
                // Prepare DB row for Supabase table
                const dbRow = { ...newDoc };
                delete dbRow.$id;
                delete dbRow.$createdAt;
                delete dbRow.$updatedAt;
                await supabase.from(table).insert([dbRow]);
            } catch (err) {
                console.warn(`Supabase insert failed on ${table}:`, err);
            }
        }

        const docs = getLocalCollection(table);
        docs.unshift(newDoc);
        setLocalCollection(table, docs);
        return newDoc;
    },

    async updateDocument(_databaseId, collectionId, documentId, data) {
        const table = TABLES[collectionId] || collectionId;
        const now = new Date().toISOString();

        if (isSupabaseConfigured) {
            try {
                const updatePayload = { ...data, updated_at: now };
                delete updatePayload.$id;
                delete updatePayload.$createdAt;
                await supabase.from(table).update(updatePayload).eq('id', documentId);
            } catch (err) {
                console.warn(`Supabase update failed on ${table}:`, err);
            }
        }

        const docs = getLocalCollection(table);
        const idx = docs.findIndex(d => d.$id === documentId || d.id === documentId);
        if (idx !== -1) {
            docs[idx] = { ...docs[idx], ...data, updatedAt: now, $updatedAt: now };
            setLocalCollection(table, docs);
            return docs[idx];
        }
        return { ...data, $id: documentId, id: documentId };
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
