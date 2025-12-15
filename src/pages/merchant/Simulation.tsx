import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RefreshCw } from 'lucide-react';
import { supabase, STATUS_LABELS, EXCHANGE_STATUSES } from '../../lib/supabase';

import MerchantLayout from '../../components/MerchantLayout';
export default function MerchantSimulation() {
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const updateExchangeStatus = async () => {
    if (!selectedExchange || !selectedStatus) {
      alert('Veuillez sélectionner un échange et un statut');
      return;
    }

    setUpdating(true);

    try {
      await supabase
        .from('exchanges')
        .update({
          status: selectedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedExchange);

      await supabase.from('status_history').insert({
        exchange_id: selectedExchange,
        status: selectedStatus,
      });

      alert('Statut mis à jour avec succès');
      fetchExchanges();
      setSelectedExchange('');
      setSelectedStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const simulateFullWorkflow = async () => {
    if (!selectedExchange) {
      alert('Veuillez sélectionner un échange');
      return;
    }

    setUpdating(true);

    const statuses = ['validated', 'preparing', 'in_transit', 'completed'];

    try {
      for (const status of statuses) {
        await supabase
          .from('exchanges')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedExchange);

        await supabase.from('status_history').insert({
          exchange_id: selectedExchange,
          status,
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      alert('Workflow complet simulé avec succès');
      fetchExchanges();
      setSelectedExchange('');
    } catch (error) {
      console.error('Error simulating workflow:', error);
      alert('Erreur lors de la simulation');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <MerchantLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Mode Simulation</h1>
          <p className="text-slate-600">Testez les différents statuts d'échanges</p>
        </div>


        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Mettre à jour un statut</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sélectionner un échange
                </label>
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">-- Choisir un échange --</option>
                  {exchanges.map((exchange) => (
                    <option key={exchange.id} value={exchange.id}>
                      {exchange.exchange_code} - {exchange.client_name} ({STATUS_LABELS[exchange.status]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nouveau statut
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">-- Choisir un statut --</option>
                  <option value="pending">En attente</option>
                  <option value="validated">Validé</option>
                  <option value="preparing">Préparation mini-dépôt</option>
                  <option value="in_transit">En route</option>
                  <option value="completed">Échange effectué</option>
                  <option value="returned">Produit retourné</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>

              <button
                onClick={updateExchangeStatus}
                disabled={updating || !selectedExchange || !selectedStatus}
                className="w-full flex items-center justify-center gap-2 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
                {updating ? 'Mise à jour...' : 'Mettre à jour le statut'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Simuler un workflow complet</h3>
            <p className="text-sm text-slate-600 mb-4">
              Cette action simulera automatiquement tous les statuts de l'échange sélectionné:
              Validé → Préparation → En route → Complété
            </p>

            <button
              onClick={simulateFullWorkflow}
              disabled={updating || !selectedExchange}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
            >
              <Play className="w-5 h-5" />
              {updating ? 'Simulation en cours...' : 'Lancer la simulation complète'}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h4 className="font-bold text-amber-900 mb-2">Note importante</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Ce mode est destiné aux tests uniquement</li>
              <li>• Les changements de statut sont irréversibles</li>
              <li>• Utilisez des échanges de test pour vos simulations</li>
              <li>• Les notifications et l'historique seront mis à jour</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">États disponibles</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-900">En attente</p>
                <p className="text-yellow-700 text-xs">Demande soumise</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="font-medium text-emerald-900">Validé</p>
                <p className="text-emerald-700 text-xs">Échange accepté</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-900">Préparation</p>
                <p className="text-blue-700 text-xs">Au mini-dépôt</p>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="font-medium text-indigo-900">En route</p>
                <p className="text-indigo-700 text-xs">Vers le client</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-900">Complété</p>
                <p className="text-green-700 text-xs">Échange finalisé</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-900">Rejeté</p>
                <p className="text-red-700 text-xs">Demande refusée</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
