import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Truck,
  Phone,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase, DeliveryPerson } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

export default function DeliveryPersonList() {
  const navigate = useNavigate();
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<DeliveryPerson | null>(null);
  const [stats, setStats] = useState<Record<string, { accepted: number; rejected: number }>>({});

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  useEffect(() => {
    filterDeliveryPersons();
  }, [searchTerm, deliveryPersons]);

  const fetchDeliveryPersons = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_persons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveryPersons(data || []);

      // Fetch verification stats for each delivery person
      if (data && data.length > 0) {
        const statsMap: Record<string, { accepted: number; rejected: number }> = {};

        for (const person of data) {
          const { data: verifications } = await supabase
            .from('delivery_verifications')
            .select('status')
            .eq('delivery_person_id', person.id);

          if (verifications) {
            statsMap[person.id] = {
              accepted: verifications.filter(v => v.status === 'accepted').length,
              rejected: verifications.filter(v => v.status === 'rejected').length,
            };
          } else {
            statsMap[person.id] = { accepted: 0, rejected: 0 };
          }
        }

        setStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching delivery persons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDeliveryPersons = () => {
    if (!searchTerm) {
      setFilteredPersons(deliveryPersons);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = deliveryPersons.filter(person =>
      person.name.toLowerCase().includes(term) ||
      person.email.toLowerCase().includes(term) ||
      person.phone.includes(term)
    );
    setFilteredPersons(filtered);
  };

  const handleDelete = async () => {
    if (!personToDelete) return;

    try {
      // Delete verifications first
      await supabase
        .from('delivery_verifications')
        .delete()
        .eq('delivery_person_id', personToDelete.id);

      // Delete from delivery_persons table
      const { error } = await supabase
        .from('delivery_persons')
        .delete()
        .eq('id', personToDelete.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setPersonToDelete(null);
      fetchDeliveryPersons();
    } catch (error) {
      console.error('Error deleting delivery person:', error);
      alert('Erreur lors de la suppression du livreur');
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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Livreurs</h1>
            <p className="text-slate-600">Gérez les comptes des livreurs</p>
          </div>
          <button
            onClick={() => navigate('/admin/delivery-person/new')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un livreur
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Delivery Persons Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredPersons.length === 0 ? (
            <div className="text-center py-16">
              <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun livreur trouvé</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par ajouter un livreur'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/admin/delivery-person/new')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Ajouter un livreur
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Livreur</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Contact</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Vérifications</th>
                  <th className="text-right py-4 px-6 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPersons.map((person) => {
                  const personStats = stats[person.id] || { accepted: 0, rejected: 0 };
                  const total = personStats.accepted + personStats.rejected;

                  return (
                    <tr key={person.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Truck className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{person.name}</p>
                            <p className="text-sm text-slate-500">
                              Inscrit le {new Date(person.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4" />
                            {person.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4" />
                            {person.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="font-medium text-slate-900">{total}</span>
                            <span className="text-slate-500">total</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            {personStats.accepted}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-red-600">
                            <XCircle className="w-4 h-4" />
                            {personStats.rejected}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/delivery-person/${person.id}`)}
                            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/delivery-person/${person.id}/edit`)}
                            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setPersonToDelete(person);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Delete Modal */}
        {showDeleteModal && personToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Confirmer la suppression</h3>
              <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer le livreur <strong>{personToDelete.name}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPersonToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
