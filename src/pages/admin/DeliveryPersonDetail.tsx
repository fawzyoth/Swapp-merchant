import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Edit,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Package,
  Clock
} from 'lucide-react';
import { supabase, DeliveryPerson, STATUS_LABELS } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

export default function DeliveryPersonDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDeliveryPersonData();
    }
  }, [id]);

  const fetchDeliveryPersonData = async () => {
    try {
      // Fetch delivery person
      const { data: personData, error: personError } = await supabase
        .from('delivery_persons')
        .select('*')
        .eq('id', id)
        .single();

      if (personError) throw personError;
      setDeliveryPerson(personData);

      // Fetch verifications
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('delivery_verifications')
        .select('*, exchanges(*)')
        .eq('delivery_person_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (verificationsError) throw verificationsError;
      setVerifications(verificationsData || []);

    } catch (error) {
      console.error('Error fetching delivery person:', error);
      navigate('/admin/delivery-persons');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!deliveryPerson) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Livreur non trouvé</h2>
          <button
            onClick={() => navigate('/admin/delivery-persons')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retour aux livreurs
          </button>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    total: verifications.length,
    accepted: verifications.filter(v => v.status === 'accepted').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
  };

  const acceptanceRate = stats.total > 0
    ? Math.round((stats.accepted / stats.total) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/admin/delivery-persons')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux livreurs
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-8 h-8 text-amber-600" />
                </div>
                <button
                  onClick={() => navigate(`/admin/delivery-person/${id}/edit`)}
                  className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-4">{deliveryPerson.name}</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-5 h-5" />
                  <span>{deliveryPerson.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-5 h-5" />
                  <span>{deliveryPerson.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-5 h-5" />
                  <span>Inscrit le {new Date(deliveryPerson.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Statistiques</h3>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                  <div className="text-xs text-slate-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{stats.accepted}</div>
                  <div className="text-xs text-slate-600">Acceptés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-xs text-slate-600">Refusés</div>
                </div>
              </div>

              {stats.total > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Taux d'acceptation</span>
                    <span className="text-sm font-bold text-slate-900">{acceptanceRate}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${acceptanceRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Verifications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-900">Dernières vérifications</h3>
              </div>

              {verifications.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Aucune vérification effectuée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map((verification) => (
                    <div
                      key={verification.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
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
                          {verification.bag_id && (
                            <span>
                              <strong>Sac:</strong> {verification.bag_id}
                            </span>
                          )}
                        </div>
                        {verification.rejection_reason && (
                          <p className="mt-2 text-sm text-red-600">
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
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
