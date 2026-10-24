import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import OwnerDashboard from './OwnerDashboard';

// Superadmin whitelist
const ADMIN_EMAILS = ['sudhansu@gmail.com', 'yutkarsh669@gmail.com', 'staysetu26@gmail.com'];

const Dashboard = () => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-plum-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-normal text-sm">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const role = profile?.role || user?.user_metadata?.role || 'student';
    const isAdmin = role === 'admin' || ADMIN_EMAILS.includes(user?.email);

    // Admin → go straight to admin panel
    if (isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    // Owner or Broker → management dashboard
    if (role === 'owner' || role === 'broker') {
        return <OwnerDashboard />;
    }

    // Default: student dashboard
    return <StudentDashboard />;
};

export default Dashboard;
