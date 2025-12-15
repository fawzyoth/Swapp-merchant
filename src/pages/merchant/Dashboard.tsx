import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Truck,
  MapPin,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import MerchantLayout from "../../components/MerchantLayout";

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0,
    completed: 0,
    validationRate: 0,
  });
  const [reasonsStats, setReasonsStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/merchant/login");
    }
  };

  const fetchStats = async () => {
    try {
      // Get merchant ID first
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: merchantData } = await supabase
        .from("merchants")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (!merchantData) return;

      // Only fetch status and reason - NO video, NO images
      const { data: exchanges } = await supabase
        .from("exchanges")
        .select("status, reason")
        .eq("merchant_id", merchantData.id);

      if (exchanges) {
        const total = exchanges.length;
        const pending = exchanges.filter((e) => e.status === "pending").length;
        const validated = exchanges.filter(
          (e) =>
            e.status === "validated" ||
            e.status === "preparing" ||
            e.status === "in_transit" ||
            e.status === "completed",
        ).length;
        const rejected = exchanges.filter(
          (e) => e.status === "rejected",
        ).length;
        const completed = exchanges.filter(
          (e) => e.status === "completed",
        ).length;
        const validationRate =
          total > 0 ? Math.round((validated / total) * 100) : 0;

        setStats({
          total,
          pending,
          validated,
          rejected,
          completed,
          validationRate,
        });

        const reasonsCount: any = {};
        exchanges.forEach((e) => {
          reasonsCount[e.reason] = (reasonsCount[e.reason] || 0) + 1;
        });
        const reasonsArray = Object.entries(reasonsCount)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5);
        setReasonsStats(reasonsArray);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Vue d'ensemble
          </h2>
          <p className="text-slate-600">
            Statistiques et métriques de vos échanges
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {stats.total}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm">Total des échanges</h3>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {stats.pending}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm">En attente</h3>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {stats.validated}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm">Validés</h3>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {stats.rejected}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm">Rejetés</h3>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Taux de validation
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div
                    className="bg-emerald-600 h-4 rounded-full transition-all"
                    style={{ width: `${stats.validationRate}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {stats.validationRate}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Échanges complétés
            </h3>
            <div className="flex items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <span className="text-3xl font-bold text-slate-900">
                {stats.completed}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Raisons d'échange principales
            </h3>
            {reasonsStats.length > 0 ? (
              <div className="space-y-3">
                {reasonsStats.map((item: any, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700">{item.reason}</span>
                      <span className="font-medium text-slate-900">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-sky-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">
                Aucune donnée disponible
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Accès rapide
            </h3>
            <div className="space-y-3">
              <Link
                to="/merchant/exchanges"
                className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">
                  Gérer les échanges
                </span>
              </Link>
              <Link
                to="/merchant/clients"
                className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">
                  Voir les clients
                </span>
              </Link>
              <Link
                to="/merchant/simulation"
                className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">
                  Mode simulation
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
