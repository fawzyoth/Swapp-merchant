import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Package
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DeliveryLayout from '../../components/DeliveryLayout';

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayVerifications: 0,
    pendingVerifications: 0,
    acceptedExchanges: 0,
    rejectedExchanges: 0,
  });
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch verifications by this delivery person
      const { data: verifications } = await supabase
        .from('delivery_verifications')
        .select('*, exchanges(*)')
        .eq('delivery_person_id', user.id)
        .order('created_at', { ascending: false });

      if (verifications) {
        const todayVerifications = verifications.filter(v =>
          new Date(v.created_at) >= today
        ).length;

        const acceptedExchanges = verifications.filter(v => v.status === 'accepted').length;
        const rejectedExchanges = verifications.filter(v => v.status === 'rejected').length;

        setStats({
          todayVerifications,
          pendingVerifications: 0, // This would come from exchanges in_transit status
          acceptedExchanges,
          rejectedExchanges,
        });

        setRecentVerifications(verifications.slice(0, 5));
      }

      // Count pending verifications (exchanges in transit)
      const { count: pendingCount } = await supabase
        .from('exchanges')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_transit');

      setStats(prev => ({
        ...prev,
        pendingVerifications: pendingCount || 0,
      }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DeliveryLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </DeliveryLayout>
    );
  }

  return (
    <DeliveryLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Livreur</h1>
          <p className="text-slate-600">Bienvenue dans votre espace de vérification des échanges</p>
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/delivery/scan')}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-amber-200"
          >
            <ScanLine className="w-6 h-6" />
            <span className="text-lg">Scanner un bordereau</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Aujourd'hui</p>
                <p className="text-2xl font-bold text-slate-900">{stats.todayVerifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">En attente</p>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingVerifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Acceptés</p>
                <p className="text-2xl font-bold text-slate-900">{stats.acceptedExchanges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Refusés</p>
                <p className="text-2xl font-bold text-slate-900">{stats.rejectedExchanges}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acceptance Rate */}
        {(stats.acceptedExchanges + stats.rejectedExchanges) > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-900">Taux d'acceptation</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(stats.acceptedExchanges / (stats.acceptedExchanges + stats.rejectedExchanges)) * 100}%`
                  }}
                />
              </div>
              <span className="text-lg font-bold text-slate-900">
                {Math.round((stats.acceptedExchanges / (stats.acceptedExchanges + stats.rejectedExchanges)) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Recent Verifications */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Vérifications récentes</h2>
            <button
              onClick={() => navigate('/delivery/verifications')}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              Voir tout
            </button>
          </div>

          {recentVerifications.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucune vérification effectuée</p>
              <p className="text-sm text-slate-500 mt-1">
                Scannez un bordereau pour commencer
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {verification.exchanges?.exchange_code || 'N/A'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {verification.exchanges?.client_name || 'Client inconnu'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(verification.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {verification.status === 'accepted' ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Accepté
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Refusé
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DeliveryLayout>
  );
}
