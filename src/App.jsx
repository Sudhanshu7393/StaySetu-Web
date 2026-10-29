import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';

// Superadmin whitelist — works even if DB role update is pending
const ADMIN_EMAILS = ['staysetu26@gmail.com', 'yutkarsh669@gmail.com'];

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyEmail from './pages/auth/VerifyEmail';
import Listings from './pages/Listings';
import PropertyDetails from './pages/PropertyDetails';
import Messages from './pages/Messages';
import Roommates from './pages/Roommates';
import Maids from './pages/Maids';
import Dashboard from './pages/dashboard/Dashboard';
import OwnerDashboard from './pages/dashboard/OwnerDashboard';
import AddListing from './pages/dashboard/AddListing';
import EditListing from './pages/dashboard/EditListing';
import AdminPanel from './pages/admin/AdminPanel';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import SecurityStandards from './pages/legal/SecurityStandards';
import ScrollToTop from './components/common/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-plum-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-900 font-black uppercase tracking-widest text-sm animate-pulse">StaySetu is Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin-only Route wrapper
const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-plum-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-900 font-black uppercase tracking-widest text-sm animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user?.email?.toLowerCase());
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

// Helper component to manage layout and provide routing context
const AppContent = () => {
  const { loading } = useAuth();
  const location = useLocation();
  const hideOn = ['/login', '/signup', '/verify-email'];
  const shouldHide = hideOn.includes(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-plum-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-900 font-black uppercase tracking-widest text-sm animate-pulse">StaySetu is Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!shouldHide && <Navbar />}
      <main className={`flex-grow ${!shouldHide ? 'pb-24 md:pb-0' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/roommates" element={<Roommates />} />
          <Route path="/maids" element={<Maids />} />
          <Route path="/messages" element={
            <ProtectedRoute><Messages /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/owner-dashboard" element={
            <ProtectedRoute><OwnerDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/add-listing" element={
            <ProtectedRoute><AddListing /></ProtectedRoute>
          } />
          <Route path="/dashboard/edit-listing/:id" element={
            <ProtectedRoute><EditListing /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminPanel /></AdminRoute>
          } />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/security" element={<SecurityStandards />} />
        </Routes>
      </main>
      {!shouldHide && <MobileBottomNav />}
      {!shouldHide && <Footer />}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
