import { Suspense, lazy, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
  </div>
);

// Merchant pages
const MerchantLogin = lazy(() => import('./pages/merchant/Login'));
const MerchantDashboard = lazy(() => import('./pages/merchant/Dashboard'));
const MerchantExchangeList = lazy(() => import('./pages/merchant/ExchangeList'));
const MerchantExchangeDetail = lazy(() => import('./pages/merchant/ExchangeDetail'));
const MerchantClientList = lazy(() => import('./pages/merchant/ClientList'));
const MerchantClientDetail = lazy(() => import('./pages/merchant/ClientDetail'));
const MerchantChat = lazy(() => import('./pages/merchant/Chat'));
const MerchantSimulation = lazy(() => import('./pages/merchant/Simulation'));
const MerchantPrintBordereau = lazy(() => import('./pages/merchant/PrintBordereau'));
const MerchantBrandingSettings = lazy(() => import('./pages/merchant/BrandingSettings'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(undefined);

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted && user === undefined) setUser(null);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUser(session?.user ?? null);
    }).catch(() => { if (mounted) setUser(null); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => { mounted = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  if (user === undefined) return <LoadingSpinner />;
  if (user === null) return <Navigate to="/login" />;
  return <>{children}</>;
}

function App() {
  return (
    <Router basename="/Swapp-merchant">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<MerchantLogin />} />
          <Route path="/dashboard" element={<ProtectedRoute><MerchantDashboard /></ProtectedRoute>} />
          <Route path="/exchanges" element={<ProtectedRoute><MerchantExchangeList /></ProtectedRoute>} />
          <Route path="/exchange/:id" element={<ProtectedRoute><MerchantExchangeDetail /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><MerchantClientList /></ProtectedRoute>} />
          <Route path="/client/:phone" element={<ProtectedRoute><MerchantClientDetail /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><MerchantChat /></ProtectedRoute>} />
          <Route path="/simulation" element={<ProtectedRoute><MerchantSimulation /></ProtectedRoute>} />
          <Route path="/print-bordereau" element={<ProtectedRoute><MerchantPrintBordereau /></ProtectedRoute>} />
          <Route path="/branding" element={<ProtectedRoute><MerchantBrandingSettings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
