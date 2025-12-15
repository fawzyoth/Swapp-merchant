import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle,
  XCircle,
  Package,
  Filter,
  Clock
} from 'lucide-react';
import { supabase, STATUS_LABELS } from '../../lib/supabase';
import DeliveryLayout from '../../components/DeliveryLayout';

export default function VerificationList() {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    fetchVerifications();
  }, []);

  useEffect(() => {
    filterVerifications();
  }, [searchTerm, statusFilter, verifications]);

  const fetchVerifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('delivery_verifications')
        .select('*, exchanges(*)')
        .eq('delivery_person_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVerifications = () => {
    let filtered = [...verifications];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.exchanges?.exchange_code?.toLowerCase().includes(term) ||
        v.exchanges?.client_name?.toLowerCase().includes(term) ||
        v.exchanges?.client_phone?.includes(term) ||
        v.bag_id?.toLowerCase().includes(term)
      );
    }

    setFilteredVerifications(filtered);
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

  const stats = {
    total: verifications.length,
    accepted: verifications.filter(v => v.status === 'accepted').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
  };

  return (
    <DeliveryLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mes Vérifications</h1>
          <p className="text-slate-600">Historique de toutes vos vérifications d'échanges</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Acceptés</p>
                <p className="text-xl font-bold text-emerald-700">{stats.accepted}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Refusés</p>
                <p className="text-xl font-bold text-red-700">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par code, client ou sac..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="accepted">Acceptés</option>
                <option value="rejected">Refusés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Verifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredVerifications.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune vérification trouvée</h3>
              <p className="text-slate-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Vous n\'avez pas encore effectué de vérification'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-medium text-slate-900">
                          {verification.exchanges?.exchange_code || 'N/A'}
                        </span>
                        {verification.status === 'accepted' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Accepté
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Refusé
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>
                          <strong>Client:</strong> {verification.exchanges?.client_name || 'Inconnu'}
                        </span>
                        <span>
                          <strong>Tél:</strong> {verification.exchanges?.client_phone || 'N/A'}
                        </span>
                        {verification.bag_id && (
                          <span>
                            <strong>Sac:</strong> {verification.bag_id}
                          </span>
                        )}
                      </div>
                      {verification.rejection_reason && (
                        <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded inline-block">
                          Raison: {verification.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(verification.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
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
