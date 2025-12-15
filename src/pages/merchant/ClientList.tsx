import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Search,
  Filter,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Package,
  TrendingDown,
  Award,
  Clock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import MerchantLayout from "../../components/MerchantLayout";

export default function MerchantClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"exchanges" | "rate" | "recent">(
    "exchanges",
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  useEffect(() => {
    checkAuth();
    fetchClients();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/merchant/login");
    }
  };

  const fetchClients = async () => {
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

      // Only fetch needed fields - NO video, NO images
      const { data: exchanges } = await supabase
        .from("exchanges")
        .select("id, client_name, client_phone, status, created_at")
        .eq("merchant_id", merchantData.id)
        .order("created_at", { ascending: false });

      if (exchanges) {
        const clientsMap = new Map();

        exchanges.forEach((exchange) => {
          const key = exchange.client_phone;
          if (!clientsMap.has(key)) {
            clientsMap.set(key, {
              name: exchange.client_name,
              phone: exchange.client_phone,
              email: `${exchange.client_name.toLowerCase().replace(/\s/g, "")}@example.com`,
              exchanges: [],
              firstExchange: exchange.created_at,
              lastExchange: exchange.created_at,
            });
          }
          const client = clientsMap.get(key);
          client.exchanges.push(exchange);

          if (new Date(exchange.created_at) < new Date(client.firstExchange)) {
            client.firstExchange = exchange.created_at;
          }
          if (new Date(exchange.created_at) > new Date(client.lastExchange)) {
            client.lastExchange = exchange.created_at;
          }
        });

        const clientsArray = Array.from(clientsMap.values()).map((client) => {
          const validated = client.exchanges.filter(
            (e: any) => e.status === "validated" || e.status === "completed",
          ).length;
          const pending = client.exchanges.filter(
            (e: any) => e.status === "pending",
          ).length;
          const rejected = client.exchanges.filter(
            (e: any) => e.status === "rejected",
          ).length;
          const total = client.exchanges.length;
          const acceptanceRate =
            total > 0 ? Math.round((validated / total) * 100) : 0;

          const daysSinceLastExchange = Math.floor(
            (Date.now() - new Date(client.lastExchange).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const isActive = daysSinceLastExchange <= 30;

          return {
            ...client,
            totalExchanges: total,
            acceptanceRate,
            validated,
            pending,
            rejected,
            daysSinceLastExchange,
            isActive,
          };
        });

        setClients(clientsArray);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedClients = clients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === "all"
          ? true
          : filterStatus === "active"
            ? client.isActive
            : !client.isActive;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "exchanges":
          return b.totalExchanges - a.totalExchanges;
        case "rate":
          return b.acceptanceRate - a.acceptanceRate;
        case "recent":
          return (
            new Date(b.lastExchange).getTime() -
            new Date(a.lastExchange).getTime()
          );
        default:
          return 0;
      }
    });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.isActive).length,
    avgRate:
      clients.length > 0
        ? Math.round(
            clients.reduce((sum, c) => sum + c.acceptanceRate, 0) /
              clients.length,
          )
        : 0,
    recurring: clients.filter((c) => c.totalExchanges > 1).length,
    totalExchanges: clients.reduce((sum, c) => sum + c.totalExchanges, 0),
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestion des Clients
          </h1>
          <p className="text-slate-600">
            Vue d'ensemble de vos clients et de leur activité
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </div>
                <div className="text-xs text-slate-600">Clients uniques</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.active}
                </div>
                <div className="text-xs text-slate-600">Clients actifs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.avgRate}%
                </div>
                <div className="text-xs text-slate-600">Taux d'acceptation</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.totalExchanges}
                </div>
                <div className="text-xs text-slate-600">Échanges totaux</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Statut:</span>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="all">Tous ({stats.total})</option>
                <option value="active">Actifs ({stats.active})</option>
                <option value="inactive">
                  Inactifs ({stats.total - stats.active})
                </option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="exchanges">Plus d'échanges</option>
                <option value="rate">Meilleur taux</option>
                <option value="recent">Plus récents</option>
              </select>
            </div>
          </div>
        </div>

        {filteredAndSortedClients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Aucun client trouvé
            </h3>
            <p className="text-slate-600">
              {searchTerm
                ? "Essayez de modifier votre recherche"
                : "Les clients apparaîtront ici après leur premier échange"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedClients.map((client, index) => (
              <Link
                key={index}
                to={`/merchant/client/${encodeURIComponent(client.phone)}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-sky-200 transition-all p-5 group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-sky-700">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 text-lg truncate">
                            {client.name}
                          </h3>
                          {client.isActive && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                              Actif
                            </span>
                          )}
                          {client.totalExchanges > 5 && (
                            <Award className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{client.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pl-15">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          Échanges
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-sky-600" />
                          <span className="font-semibold text-slate-900">
                            {client.totalExchanges}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          Taux acceptation
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-1.5 max-w-[60px]">
                            <div
                              className={`h-1.5 rounded-full ${
                                client.acceptanceRate >= 80
                                  ? "bg-emerald-500"
                                  : client.acceptanceRate >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${client.acceptanceRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {client.acceptanceRate}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          Statuts
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {client.pending > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                              {client.pending} en attente
                            </span>
                          )}
                          {client.validated > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                              {client.validated} validés
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          Dernière activité
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-700">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {client.daysSinceLastExchange === 0
                              ? "Aujourd'hui"
                              : client.daysSinceLastExchange === 1
                                ? "Hier"
                                : `Il y a ${client.daysSinceLastExchange}j`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
