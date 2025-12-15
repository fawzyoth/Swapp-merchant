import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  FileText,
  ArrowRight,
  Package,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

type DeliveryPersonBalance = {
  id: string;
  name: string;
  email: string;
  total_collected: number;
  total_settled: number;
  pending_settlement: number;
  collections_count: number;
};

type RecentTransaction = {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  delivery_person_name?: string;
};

export default function AdminFinancialDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCollectedFromClients: 0,
    totalMerchantCharges: 0,
    totalSettledByDelivery: 0,
    totalPendingSettlement: 0,
    pendingSettlementsCount: 0,
    currentWeekExchanges: 0,
    currentWeekCollections: 0,
  });
  const [deliveryBalances, setDeliveryBalances] = useState<DeliveryPersonBalance[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      // Fetch all delivery persons
      const { data: deliveryPersons } = await supabase
        .from("delivery_persons")
        .select("id, name, email");

      // Fetch all financial transactions
      const { data: allTransactions } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch all settlements
      const { data: allSettlements } = await supabase
        .from("delivery_person_settlements")
        .select("*");

      // Calculate totals
      const clientCollections = allTransactions?.filter(
        (t) => t.transaction_type === "collection_from_client" && t.status === "completed"
      ) || [];
      const totalCollected = clientCollections.reduce((sum, t) => sum + (t.amount || 0), 0);

      const merchantCharges = allTransactions?.filter(
        (t) => t.transaction_type === "merchant_charge" && t.status === "completed"
      ) || [];
      const totalMerchantCharges = merchantCharges.reduce((sum, t) => sum + (t.amount || 0), 0);

      const confirmedSettlements = allSettlements?.filter((s) => s.status === "confirmed") || [];
      const totalSettled = confirmedSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);

      const pendingSettlements = allSettlements?.filter((s) => s.status === "pending") || [];

      // Calculate current week stats
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const thisWeekCollections = clientCollections.filter(
        (t) => new Date(t.created_at) >= weekStart
      );

      // Calculate balances per delivery person
      const balances: DeliveryPersonBalance[] = (deliveryPersons || []).map((dp) => {
        const dpCollections = clientCollections.filter((t) => t.delivery_person_id === dp.id);
        const dpSettlements = confirmedSettlements.filter((s) => s.delivery_person_id === dp.id);

        const collected = dpCollections.reduce((sum, t) => sum + (t.amount || 0), 0);
        const settled = dpSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);

        return {
          id: dp.id,
          name: dp.name,
          email: dp.email,
          total_collected: collected,
          total_settled: settled,
          pending_settlement: collected - settled,
          collections_count: dpCollections.length,
        };
      });

      // Filter to only show delivery persons with activity
      const activeBalances = balances.filter((b) => b.total_collected > 0 || b.pending_settlement > 0);

      // Get recent transactions with delivery person names
      const recentTxns: RecentTransaction[] = (allTransactions || []).slice(0, 10).map((t) => {
        const dp = deliveryPersons?.find((d) => d.id === t.delivery_person_id);
        return {
          id: t.id,
          transaction_type: t.transaction_type,
          amount: t.amount,
          status: t.status,
          description: t.description || "",
          created_at: t.created_at,
          delivery_person_name: dp?.name,
        };
      });

      setSummary({
        totalCollectedFromClients: totalCollected,
        totalMerchantCharges,
        totalSettledByDelivery: totalSettled,
        totalPendingSettlement: totalCollected - totalSettled,
        pendingSettlementsCount: pendingSettlements.length,
        currentWeekExchanges: thisWeekCollections.length,
        currentWeekCollections: thisWeekCollections.reduce((sum, t) => sum + (t.amount || 0), 0),
      });

      setDeliveryBalances(activeBalances);
      setRecentTransactions(recentTxns);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      collection_from_client: "Encaissement client",
      settlement_to_partner: "Règlement partenaire",
      settlement_to_admin: "Règlement admin",
      merchant_charge: "Facturation marchand",
      refund_to_client: "Remboursement client",
      fee_deduction: "Déduction frais",
      invoice_generated: "Facture générée",
      invoice_paid: "Facture payée",
      adjustment: "Ajustement",
    };
    return labels[type] || type;
  };

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case "collection_from_client":
        return "bg-emerald-100 text-emerald-700";
      case "settlement_to_partner":
      case "settlement_to_admin":
        return "bg-sky-100 text-sky-700";
      case "merchant_charge":
        return "bg-purple-100 text-purple-700";
      case "refund_to_client":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Financier</h1>
            <p className="text-slate-600">Vue consolidée des finances de la plateforme</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link
              to="/admin/settlements"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Clock className="w-5 h-5" />
              Règlements
              {summary.pendingSettlementsCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {summary.pendingSettlementsCount}
                </span>
              )}
            </Link>
            <Link
              to="/admin/invoices"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Factures
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Encaissé</p>
                <p className="text-2xl font-bold text-slate-900">
                  {summary.totalCollectedFromClients.toFixed(2)}
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
                <p className="text-2xl font-bold text-slate-900">
                  {summary.totalSettledByDelivery.toFixed(2)}
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
                <p className="text-sm text-slate-600 mb-1">En Attente</p>
                <p className={`text-2xl font-bold ${summary.totalPendingSettlement > 0 ? "text-amber-600" : "text-slate-900"}`}>
                  {summary.totalPendingSettlement.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">TND</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Cette Semaine</p>
                <p className="text-2xl font-bold text-slate-900">
                  {summary.currentWeekCollections.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">{summary.currentWeekExchanges} échanges</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Settlements Alert */}
        {summary.pendingSettlementsCount > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {summary.pendingSettlementsCount} règlement(s) en attente de confirmation
                  </p>
                  <p className="text-sm text-slate-600">
                    Montant total: {summary.totalPendingSettlement.toFixed(2)} TND
                  </p>
                </div>
              </div>
              <Link
                to="/admin/settlements"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                Voir les règlements
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Delivery Person Balances */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Soldes par Livreur
              </h2>
              <Users className="w-5 h-5 text-slate-400" />
            </div>

            {deliveryBalances.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucune activité financière</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryBalances.map((dp) => (
                  <div
                    key={dp.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{dp.name}</p>
                      <p className="text-sm text-slate-500">
                        {dp.collections_count} encaissement(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${dp.pending_settlement > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {dp.pending_settlement.toFixed(2)} TND
                      </p>
                      <p className="text-xs text-slate-500">en attente</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Transactions Récentes
              </h2>
              <Banknote className="w-5 h-5 text-slate-400" />
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucune transaction</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionBadgeColor(txn.transaction_type)}`}>
                        {getTransactionTypeLabel(txn.transaction_type)}
                      </span>
                      <div>
                        <p className="text-sm text-slate-600 truncate max-w-[150px]">
                          {txn.description || txn.delivery_person_name || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {txn.amount.toFixed(2)} TND
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(txn.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
