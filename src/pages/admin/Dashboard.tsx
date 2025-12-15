import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Store,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

export default function AdminDashboard() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [merchantsRes, exchangesRes] = await Promise.all([
        // Only select fields needed for display - NO logo_base64
        supabase.from("merchants").select("id, name, email"),
        // Only select fields needed for stats - NO video, NO images
        supabase.from("exchanges").select("merchant_id, status"),
      ]);

      setMerchants(merchantsRes.data || []);
      setExchanges(exchangesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalMerchants: merchants.length,
    totalExchanges: exchanges.length,
    pendingExchanges: exchanges.filter((e) => e.status === "pending").length,
    completedExchanges: exchanges.filter((e) => e.status === "completed")
      .length,
    validatedExchanges: exchanges.filter((e) =>
      ["validated", "preparing", "in_transit", "completed"].includes(e.status),
    ).length,
    rejectedExchanges: exchanges.filter((e) => e.status === "rejected").length,
  };

  const validationRate =
    stats.totalExchanges > 0
      ? Math.round((stats.validatedExchanges / stats.totalExchanges) * 100)
      : 0;

  // Get top merchants by exchange count
  const merchantStats = merchants
    .map((merchant) => {
      const merchantExchanges = exchanges.filter(
        (e) => e.merchant_id === merchant.id,
      );
      return {
        ...merchant,
        exchangeCount: merchantExchanges.length,
        validatedCount: merchantExchanges.filter((e) =>
          ["validated", "preparing", "in_transit", "completed"].includes(
            e.status,
          ),
        ).length,
      };
    })
    .sort((a, b) => b.exchangeCount - a.exchangeCount);

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
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Dashboard Administration
          </h1>
          <p className="text-slate-600">Vue d'ensemble de la plateforme</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">E-Commerçants</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.totalMerchants}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Échanges</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.totalExchanges}
                </p>
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">En attente</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.pendingExchanges}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Taux de validation
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {validationRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Statut des échanges
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-600">Validés</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {stats.validatedExchanges}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-slate-600">Rejetés</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {stats.rejectedExchanges}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-600">Complétés</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {stats.completedExchanges}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Top E-Commerçants
              </h3>
              <Link
                to="/admin/merchants"
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Voir tous
              </Link>
            </div>
            <div className="space-y-3">
              {merchantStats.slice(0, 5).map((merchant, index) => (
                <Link
                  key={merchant.id}
                  to={`/admin/merchant/${merchant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Store className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {merchant.name}
                      </p>
                      <p className="text-xs text-slate-500">{merchant.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {merchant.exchangeCount}
                    </p>
                    <p className="text-xs text-slate-500">échanges</p>
                  </div>
                </Link>
              ))}
              {merchantStats.length === 0 && (
                <p className="text-slate-500 text-center py-4">
                  Aucun e-commerçant
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Actions rapides
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/admin/merchant/new"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ajouter un e-commerçant
            </Link>
            <Link
              to="/admin/merchants"
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Gérer les e-commerçants
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
