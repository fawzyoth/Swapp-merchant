import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Calendar,
  Package,
  CreditCard,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import DeliveryLayout from "../../components/DeliveryLayout";

type CollectionRecord = {
  id: string;
  exchange_id: string;
  amount_collected: number;
  payment_method: string;
  created_at: string;
  exchange?: {
    exchange_code: string;
    client_name: string;
  };
};

type Settlement = {
  id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  exchanges_count: number;
  created_at: string;
};

export default function DeliveryFinancialDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalSettled: 0,
    pendingSettlement: 0,
    collectionsCount: 0,
  });
  const [recentCollections, setRecentCollections] = useState<CollectionRecord[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementProcessing, setSettlementProcessing] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/delivery/login");
        return;
      }

      // Verify delivery person exists
      const { data: deliveryPerson } = await supabase
        .from("delivery_persons")
        .select("id, name, email")
        .eq("email", authUser.email)
        .maybeSingle();

      if (!deliveryPerson) {
        navigate("/delivery/login");
        return;
      }

      setUser(deliveryPerson);
      await fetchFinancialData(deliveryPerson.id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialData = async (deliveryPersonId: string) => {
    try {
      // Fetch collections (from financial_transactions)
      const { data: transactions } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("delivery_person_id", deliveryPersonId)
        .eq("transaction_type", "collection_from_client")
        .eq("status", "completed");

      const totalCollected = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Fetch confirmed settlements
      const { data: confirmedSettlements } = await supabase
        .from("delivery_person_settlements")
        .select("amount")
        .eq("delivery_person_id", deliveryPersonId)
        .eq("status", "confirmed");

      const totalSettled = confirmedSettlements?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

      // Fetch recent collections with exchange details
      const { data: collections } = await supabase
        .from("delivery_verifications")
        .select(`
          id,
          exchange_id,
          amount_collected,
          payment_method,
          created_at,
          exchanges:exchange_id (
            exchange_code,
            client_name
          )
        `)
        .eq("delivery_person_id", deliveryPersonId)
        .eq("payment_collected", true)
        .gt("amount_collected", 0)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch all settlements
      const { data: allSettlements } = await supabase
        .from("delivery_person_settlements")
        .select("*")
        .eq("delivery_person_id", deliveryPersonId)
        .order("created_at", { ascending: false })
        .limit(5);

      setSummary({
        totalCollected,
        totalSettled,
        pendingSettlement: totalCollected - totalSettled,
        collectionsCount: transactions?.length || 0,
      });

      setRecentCollections(collections?.map(c => ({
        ...c,
        exchange: Array.isArray(c.exchanges) ? c.exchanges[0] : c.exchanges
      })) || []);

      setSettlements(allSettlements || []);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    }
  };

  const requestSettlement = async () => {
    if (summary.pendingSettlement <= 0) {
      alert("Aucun montant à régler");
      return;
    }

    setSettlementProcessing(true);
    try {
      const today = new Date();
      const periodStart = new Date(today);
      periodStart.setDate(today.getDate() - 7);

      // Create settlement request
      const { error } = await supabase.from("delivery_person_settlements").insert({
        delivery_person_id: user.id,
        settlement_type: "to_delivery_partner",
        amount: summary.pendingSettlement,
        currency: "TND",
        period_start: periodStart.toISOString().split("T")[0],
        period_end: today.toISOString().split("T")[0],
        exchanges_count: summary.collectionsCount,
        status: "pending",
      });

      if (error) throw error;

      // Refresh data
      await fetchFinancialData(user.id);
      setShowSettlementModal(false);
      alert("Demande de règlement envoyée avec succès");
    } catch (error) {
      console.error("Error requesting settlement:", error);
      alert("Erreur lors de la demande de règlement");
    } finally {
      setSettlementProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="w-4 h-4" />;
      case "card":
        return <CreditCard className="w-4 h-4" />;
      case "mobile_payment":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Banknote className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Espèces";
      case "card":
        return "Carte";
      case "mobile_payment":
        return "Mobile";
      default:
        return "Autre";
    }
  };

  const getSettlementStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            Confirmé
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            En attente
          </span>
        );
      case "disputed":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Mes Finances</h1>
          <p className="text-slate-600">Gérez vos encaissements et règlements</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Encaissé</p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.totalCollected.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">TND</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Réglé</p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.totalSettled.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">TND</p>
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Solde en Attente</p>
                <p className={`text-3xl font-bold ${summary.pendingSettlement > 0 ? "text-amber-600" : "text-slate-900"}`}>
                  {summary.pendingSettlement.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">TND</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Settlement Request Button */}
        {summary.pendingSettlement > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-slate-900">
                    Vous avez {summary.pendingSettlement.toFixed(2)} TND à régler
                  </p>
                  <p className="text-sm text-slate-600">
                    Demandez un règlement pour transférer ce montant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettlementModal(true)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Banknote className="w-5 h-5" />
                Demander un Règlement
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Collections */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Derniers Encaissements
              </h2>
              <span className="text-sm text-slate-500">
                {summary.collectionsCount} total
              </span>
            </div>

            {recentCollections.length === 0 ? (
              <div className="text-center py-8">
                <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucun encaissement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        {getPaymentMethodIcon(collection.payment_method)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {collection.exchange?.exchange_code || "N/A"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {collection.exchange?.client_name || "Client"} • {getPaymentMethodLabel(collection.payment_method)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        +{collection.amount_collected?.toFixed(2)} TND
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(collection.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlement History */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Historique des Règlements
              </h2>
            </div>

            {settlements.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucun règlement</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {settlement.exchanges_count} échanges
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(settlement.period_start).toLocaleDateString("fr-FR")} - {new Date(settlement.period_end).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {settlement.amount.toFixed(2)} TND
                      </p>
                      {getSettlementStatusBadge(settlement.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settlement Modal */}
        {showSettlementModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Banknote className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Demander un Règlement
                    </h3>
                    <p className="text-sm text-slate-600">
                      Confirmez le montant à transférer
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-amber-700 mb-1">Montant à régler</p>
                    <p className="text-3xl font-bold text-amber-800">
                      {summary.pendingSettlement.toFixed(2)} TND
                    </p>
                    <p className="text-sm text-amber-600 mt-2">
                      {summary.collectionsCount} encaissement(s)
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-6">
                  Une fois soumise, cette demande sera vérifiée par l'administration.
                  Le montant sera marqué comme réglé après confirmation.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSettlementModal(false)}
                    disabled={settlementProcessing}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={requestSettlement}
                    disabled={settlementProcessing}
                    className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {settlementProcessing ? (
                      "Traitement..."
                    ) : (
                      <>
                        Confirmer
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
}
