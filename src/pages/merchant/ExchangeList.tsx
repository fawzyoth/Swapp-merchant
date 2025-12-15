import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { supabase, STATUS_LABELS } from "../../lib/supabase";
import MerchantLayout from "../../components/MerchantLayout";

const PAGE_SIZE = 50;

export default function MerchantExchangeList() {
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [filteredExchanges, setFilteredExchanges] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    filterExchanges();
  }, [exchanges, searchTerm, statusFilter]);

  const checkAuthAndFetch = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/merchant/login");
        return;
      }

      // Get merchant ID
      const { data: merchantData } = await supabase
        .from("merchants")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (merchantData) {
        setMerchantId(merchantData.id);
        await fetchExchanges(merchantData.id);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchanges = async (mId: string) => {
    try {
      // Only fetch exchanges for this merchant, limited to recent ones
      const { data } = await supabase
        .from("exchanges")
        .select(
          "id, exchange_code, client_name, client_phone, reason, status, created_at",
        )
        .eq("merchant_id", mId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      setExchanges(data || []);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
    }
  };

  const filterExchanges = () => {
    let filtered = [...exchanges];

    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.client_phone.includes(searchTerm) ||
          e.exchange_code.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredExchanges(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "validated":
        return "bg-emerald-100 text-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Demandes d'échange
          </h1>
          <p className="text-slate-600">
            Gérez et validez les demandes de vos clients
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="validated">Validé</option>
                <option value="preparing">En préparation</option>
                <option value="in_transit">En route</option>
                <option value="completed">Complété</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>
          </div>
        </div>

        {filteredExchanges.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-slate-600">Aucun échange trouvé</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                    Code
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                    Client
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                    Téléphone
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                    Raison
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                    Statut
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExchanges.map((exchange) => (
                  <tr key={exchange.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {exchange.exchange_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {exchange.client_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {exchange.client_phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {exchange.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(exchange.created_at).toLocaleDateString(
                        "fr-FR",
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getStatusColor(exchange.status)}`}
                      >
                        {STATUS_LABELS[exchange.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/merchant/exchange/${exchange.id}`}
                        className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                      >
                        Voir détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
