import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Banknote,
  Filter,
  AlertCircle,
} from "lucide-react";
import { supabase, DeliveryPersonSettlement } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

type SettlementWithDeliveryPerson = DeliveryPersonSettlement & {
  delivery_person?: {
    name: string;
    email: string;
    phone: string;
  };
};

export default function SettlementList() {
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<SettlementWithDeliveryPerson[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementWithDeliveryPerson | null>(null);
  const [confirmationNotes, setConfirmationNotes] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSettlements();
  }, [statusFilter]);

  const fetchSettlements = async () => {
    try {
      let query = supabase
        .from("delivery_person_settlements")
        .select(`
          *,
          delivery_person:delivery_person_id (
            name,
            email,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setSettlements(data?.map(s => ({
        ...s,
        delivery_person: Array.isArray(s.delivery_person) ? s.delivery_person[0] : s.delivery_person
      })) || []);
    } catch (error) {
      console.error("Error fetching settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmSettlement = async () => {
    if (!selectedSettlement) return;
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("delivery_person_settlements")
        .update({
          status: "confirmed",
          confirmed_by: user?.id,
          confirmed_at: new Date().toISOString(),
          confirmation_notes: confirmationNotes || null,
        })
        .eq("id", selectedSettlement.id);

      if (error) throw error;

      // Create settlement transaction
      await supabase.from("financial_transactions").insert({
        settlement_id: selectedSettlement.id,
        delivery_person_id: selectedSettlement.delivery_person_id,
        transaction_type: "settlement_to_partner",
        amount: selectedSettlement.amount,
        currency: "TND",
        direction: "debit",
        status: "completed",
        description: `Règlement confirmé - ${selectedSettlement.exchanges_count} échanges`,
      });

      setShowConfirmModal(false);
      setSelectedSettlement(null);
      setConfirmationNotes("");
      fetchSettlements();
      alert("Règlement confirmé avec succès");
    } catch (error) {
      console.error("Error confirming settlement:", error);
      alert("Erreur lors de la confirmation");
    } finally {
      setProcessing(false);
    }
  };

  const disputeSettlement = async () => {
    if (!selectedSettlement || !disputeReason.trim()) {
      alert("Veuillez fournir une raison");
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("delivery_person_settlements")
        .update({
          status: "disputed",
          confirmation_notes: disputeReason,
        })
        .eq("id", selectedSettlement.id);

      if (error) throw error;

      setShowDisputeModal(false);
      setSelectedSettlement(null);
      setDisputeReason("");
      fetchSettlements();
      alert("Règlement contesté");
    } catch (error) {
      console.error("Error disputing settlement:", error);
      alert("Erreur lors de la contestation");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Confirmé
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case "disputed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Contesté
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const pendingCount = settlements.filter((s) => s.status === "pending").length;

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Règlements</h1>
          <p className="text-slate-600">Gestion des règlements des livreurs</p>
        </div>

        {/* Pending Alert */}
        {pendingCount > 0 && statusFilter !== "pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-amber-800">
                <strong>{pendingCount}</strong> règlement(s) en attente de confirmation
              </p>
              <button
                onClick={() => setStatusFilter("pending")}
                className="ml-auto text-amber-700 hover:text-amber-800 font-medium"
              >
                Voir →
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="disputed">Contesté</option>
            </select>
          </div>
        </div>

        {/* Settlements Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                    Livreur
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                    Période
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    Échanges
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                    Montant
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    Statut
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {settlement.delivery_person?.name || "Livreur"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {settlement.delivery_person?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(settlement.period_start).toLocaleDateString("fr-FR")} -{" "}
                        {new Date(settlement.period_end).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-900">
                        {settlement.exchanges_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-slate-900">
                        {settlement.amount.toFixed(2)} TND
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(settlement.status)}
                    </td>
                    <td className="px-6 py-4">
                      {settlement.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setShowConfirmModal(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setShowDisputeModal(true);
                            }}
                            className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Contester
                          </button>
                        </div>
                      )}
                      {settlement.status === "confirmed" && settlement.confirmed_at && (
                        <p className="text-xs text-slate-500 text-right">
                          Confirmé le{" "}
                          {new Date(settlement.confirmed_at).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {settlements.length === 0 && (
            <div className="text-center py-12">
              <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun règlement trouvé</p>
            </div>
          )}
        </div>

        {/* Confirm Modal */}
        {showConfirmModal && selectedSettlement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Confirmer le Règlement
                    </h3>
                    <p className="text-sm text-slate-600">
                      Valider la réception du montant
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Livreur</span>
                      <span className="font-medium text-slate-900">
                        {selectedSettlement.delivery_person?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Montant</span>
                      <span className="font-semibold text-emerald-600">
                        {selectedSettlement.amount.toFixed(2)} TND
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Échanges</span>
                      <span className="font-medium text-slate-900">
                        {selectedSettlement.exchanges_count}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <input
                    type="text"
                    value={confirmationNotes}
                    onChange={(e) => setConfirmationNotes(e.target.value)}
                    placeholder="Ex: Reçu en espèces..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedSettlement(null);
                      setConfirmationNotes("");
                    }}
                    disabled={processing}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmSettlement}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? "Traitement..." : "Confirmer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && selectedSettlement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Contester le Règlement
                    </h3>
                    <p className="text-sm text-slate-600">
                      Indiquez la raison de la contestation
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Livreur</span>
                      <span className="font-medium text-slate-900">
                        {selectedSettlement.delivery_person?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Montant</span>
                      <span className="font-semibold text-slate-900">
                        {selectedSettlement.amount.toFixed(2)} TND
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Raison de la contestation *
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Expliquez pourquoi ce règlement est contesté..."
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDisputeModal(false);
                      setSelectedSettlement(null);
                      setDisputeReason("");
                    }}
                    disabled={processing}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={disputeSettlement}
                    disabled={processing || !disputeReason.trim()}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? "Traitement..." : "Contester"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
