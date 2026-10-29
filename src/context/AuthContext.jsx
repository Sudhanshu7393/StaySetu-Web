import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, account, databases, DATABASE_ID, COLLECTION, ID, Query } from '../lib/supabase';
import { DEMO_USERS } from '../lib/mockData';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = React.useCallback(async (authUser) => {
        if (!authUser) return;
        try {
            // Check if profile exists
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION.profiles,
                [Query.equal('userId', authUser.$id || authUser.id)]
            );

            if (res.documents.length > 0) {
                const data = res.documents[0];
                data.name = data.fullName || data.full_name || data.name || 'User';
                data.id = data.$id || data.id;
                setProfile(data);
            } else {
                // Check if demo user
                const demoMatch = Object.values(DEMO_USERS).find(d => d.email.toLowerCase() === authUser.email?.toLowerCase());
                const role = demoMatch ? demoMatch.role : (authUser.role || 'student');
                const fullName = demoMatch ? demoMatch.fullName : (authUser.name || authUser.fullName || 'User');

                const newProfile = await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION.profiles,
                    authUser.$id || authUser.id || ID.unique(),
                    {
                        userId: authUser.$id || authUser.id,
                        fullName,
                        name: fullName,
                        email: authUser.email,
                        role,
                        college: demoMatch?.college || '',
                        phone: demoMatch?.phone || '',
                        createdAt: new Date().toISOString(),
                    }
                );
                newProfile.id = newProfile.$id || newProfile.id;
                newProfile.name = fullName;
                setProfile(newProfile);
            }
        } catch (err) {
            console.error('Profile fetch fallback:', err);
            setProfile({
                id: authUser.$id || authUser.id,
                fullName: authUser.name || 'User',
                name: authUser.name || 'User',
                role: authUser.role || 'student'
            });
        }
    }, []);

    const checkUser = React.useCallback(async () => {
        try {
            const authUser = await account.get();
            setUser(authUser);
            await fetchProfile(authUser);
        } catch {
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [fetchProfile]);

    useEffect(() => {
        // Initial check
        checkUser();

        // Realtime Supabase Auth state listener
        if (isSupabaseConfigured) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (session?.user) {
                    const u = session.user;
                    const authUser = {
                        $id: u.id,
                        id: u.id,
                        email: u.email,
                        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0],
                        role: u.user_metadata?.role || 'student',
                    };
                    setUser(authUser);
                    await fetchProfile(authUser);
                    setLoading(false);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
            });

            return () => {
                subscription?.unsubscribe();
            };
        }
    }, [checkUser, fetchProfile]);

    const signInWithDemo = async (role = 'student') => {
        setLoading(true);
        const demoUser = DEMO_USERS[role] || DEMO_USERS.student;
        localStorage.setItem('staysetu_current_user_v3', JSON.stringify(demoUser));
        setUser(demoUser);
        setProfile(demoUser);
        setLoading(false);
        return demoUser;
    };

    const signInWithEmail = async (email, password) => {
        setLoading(true);
        try {
            await account.createEmailPasswordSession(email, password);
            const authUser = await account.get();
            setUser(authUser);
            await fetchProfile(authUser);
            return authUser;
        } finally {
            setLoading(false);
        }
    };

    const signUpWithEmail = async (email, password, fullName, role = 'student') => {
        setLoading(true);
        try {
            const res = await account.create(null, email, password, fullName, role);
            const uid = res.$id || res.id;
            const userObj = {
                $id: uid,
                id: uid,
                email,
                name: fullName,
                fullName,
                role
            };
            localStorage.setItem('staysetu_current_user_v3', JSON.stringify(userObj));
            setUser(userObj);

            // Create profile in DB
            const newProfile = await databases.createDocument(
                DATABASE_ID,
                COLLECTION.profiles,
                uid,
                {
                    userId: uid,
                    fullName,
                    name: fullName,
                    email,
                    role,
                    createdAt: new Date().toISOString(),
                }
            );
            setProfile(newProfile);
            return userObj;
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async (role = 'student') => {
        if (isSupabaseConfigured) {
            try {
                await account.createOAuth2Session('google', window.location.origin + '/dashboard');
                return;
            } catch (err) {
                console.warn('Google OAuth redirected or failed:', err);
            }
        }
        return signInWithDemo(role);
    };

    const signOut = async () => {
        try {
            await account.deleteSession();
        } catch (err) {
            console.error('Sign out error:', err);
        }
        localStorage.removeItem('staysetu_current_user_v3');
        localStorage.removeItem('staysetu_current_user_v2');
        setUser(null);
        setProfile(null);
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user);
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            signOut,
            signInWithGoogle,
            signInWithDemo,
            signInWithEmail,
            signUpWithEmail,
            refreshProfile,
            checkUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
