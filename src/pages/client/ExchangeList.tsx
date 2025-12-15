import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, AlertCircle, ChevronRight, Filter } from 'lucide-react';
import { supabase, STATUS_LABELS } from '../../lib/supabase';
import ClientLayout from '../../components/ClientLayout';

export default function ClientExchangeList() {
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      const { data } = await supabase
        .from('exchanges')
        .select('*')
        .order('created_at', { ascending: false });

      setExchanges(data || []);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          label: 'En attente de validation',
          description: 'Le marchand examine votre demande'
        };
      case 'validated':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: CheckCircle,
          label: 'Validé',
          description: 'Votre échange est approuvé'
        };
      case 'preparing':
        return {
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Package,
          label: 'En préparation',
          description: 'Le nouveau produit est en cours de préparation'
        };
      case 'in_transit':
        return {
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: Truck,
          label: 'En transit',
          description: 'Le colis est en route'
        };
      case 'completed':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle,
          label: 'Terminé',
          description: 'Échange complété avec succès'
        };
      case 'rejected':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          label: 'Refusé',
          description: 'Le marchand a refusé la demande'
        };
      default:
        return {
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: AlertCircle,
          label: status,
          description: ''
        };
    }
  };

  const filteredExchanges = exchanges.filter(ex => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['completed', 'rejected'].includes(ex.status);
    if (filter === 'completed') return ex.status === 'completed';
    return true;
  });

  const stats = {
    total: exchanges.length,
    active: exchanges.filter(e => !['completed', 'rejected'].includes(e.status)).length,
    completed: exchanges.filter(e => e.status === 'completed').length,
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Mes Échanges
          </h1>
          <p className="text-slate-600">
            Suivez vos demandes d'échange en temps réel
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">En cours</div>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">Terminés</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filtrer:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tous ({stats.total})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'active'
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                En cours ({stats.active})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'completed'
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Terminés ({stats.completed})
              </button>
            </div>
          </div>
        </div>

        {exchanges.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun échange</h3>
            <p className="text-slate-600 mb-6">Vous n'avez pas encore créé de demande d'échange</p>
            <Link
              to="/client/scan"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Package className="w-5 h-5 mr-2" />
              Créer un échange
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExchanges.map((exchange) => {
              const statusConfig = getStatusConfig(exchange.status);
              const StatusIcon = statusConfig.icon;
              const daysAgo = Math.floor((Date.now() - new Date(exchange.created_at).getTime()) / (1000 * 60 * 60 * 24));

              return (
                <Link
                  key={exchange.id}
                  to={`/client/tracking/${exchange.exchange_code}`}
                  className="block bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-200 transition-all p-5 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg border ${statusConfig.color}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 text-lg">
                              {exchange.exchange_code}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{statusConfig.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pl-14">
                        <div>
                          <div className="text-xs text-slate-500 mb-0.5">Motif</div>
                          <div className="text-sm font-medium text-slate-900 truncate">{exchange.reason}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-0.5">Date</div>
                          <div className="text-sm font-medium text-slate-900">
                            {daysAgo === 0 ? "Aujourd'hui" :
                             daysAgo === 1 ? 'Hier' :
                             `Il y a ${daysAgo} jours`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0 mt-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
