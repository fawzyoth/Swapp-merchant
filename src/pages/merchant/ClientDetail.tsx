import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Package,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Award,
  Eye,
  Star,
} from "lucide-react";
import { supabase, STATUS_LABELS } from "../../lib/supabase";
import MerchantLayout from "../../components/MerchantLayout";

export default function MerchantClientDetail() {
  const { phone } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "exchanges" | "messages"
  >("overview");

  useEffect(() => {
    checkAuth();
    if (phone) {
      fetchClientData(decodeURIComponent(phone));
    }
  }, [phone]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/merchant/login");
    }
  };

  const fetchClientData = async (clientPhone: string) => {
    try {
      // Only fetch needed fields - NO video, NO images
      const { data: exchangesData } = await supabase
        .from("exchanges")
        .select(
          "id, exchange_code, client_name, client_phone, reason, status, created_at",
        )
        .eq("client_phone", clientPhone)
        .order("created_at", { ascending: false });

      if (exchangesData && exchangesData.length > 0) {
        setExchanges(exchangesData);

        const validated = exchangesData.filter(
          (e) => e.status === "validated" || e.status === "completed",
        ).length;
        const pending = exchangesData.filter(
          (e) => e.status === "pending",
        ).length;
        const rejected = exchangesData.filter(
          (e) => e.status === "rejected",
        ).length;
        const total = exchangesData.length;
        const acceptanceRate =
          total > 0 ? Math.round((validated / total) * 100) : 0;

        const firstExchange = exchangesData[exchangesData.length - 1];
        const lastExchange = exchangesData[0];
        const daysSinceFirst = Math.floor(
          (Date.now() - new Date(firstExchange.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const daysSinceLast = Math.floor(
          (Date.now() - new Date(lastExchange.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const reasonsMap = new Map();
        exchangesData.forEach((ex) => {
          reasonsMap.set(ex.reason, (reasonsMap.get(ex.reason) || 0) + 1);
        });
        const topReasons = Array.from(reasonsMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        setClient({
          name: firstExchange.client_name,
          phone: clientPhone,
          email: `${firstExchange.client_name.toLowerCase().replace(/\s/g, "")}@example.com`,
          firstExchange: firstExchange.created_at,
          lastExchange: lastExchange.created_at,
          daysSinceFirst,
          daysSinceLast,
          totalExchanges: total,
          validated,
          pending,
          rejected,
          acceptanceRate,
          isActive: daysSinceLast <= 30,
          topReasons,
        });

        const exchangeIds = exchangesData.map((e) => e.id);
        const { data: messagesData } = await supabase
          .from("messages")
          .select("*")
          .in("exchange_id", exchangeIds)
          .order("created_at", { ascending: false });

        setMessages(messagesData || []);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "validated":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "validated":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
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

  if (!client) {
    return (
      <MerchantLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Client non trouvé
            </h2>
            <button
              onClick={() => navigate("/merchant/clients")}
              className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              Retour aux clients
            </button>
          </div>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/merchant/clients")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour aux clients</span>
        </button>

        <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-3xl font-bold text-white">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-slate-900">
                  {client.name}
                </h1>
                {client.isActive && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200">
                    Client actif
                  </span>
                )}
                {client.totalExchanges > 5 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full border border-amber-200">
                    <Award className="w-4 h-4" />
                    <span>Client fidèle</span>
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-sky-600" />
                  <a
                    href={`tel:${client.phone}`}
                    className="hover:text-sky-600"
                  >
                    {client.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-sky-600" />
                  <a
                    href={`mailto:${client.email}`}
                    className="hover:text-sky-600"
                  >
                    {client.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>
                    Client depuis{" "}
                    {new Date(client.firstExchange).toLocaleDateString(
                      "fr-FR",
                      { month: "long", year: "numeric" },
                    )}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/merchant/chat"
              className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Envoyer un message
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Package className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {client.totalExchanges}
                </div>
                <div className="text-xs text-slate-600">Échanges totaux</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {client.acceptanceRate}%
                </div>
                <div className="text-xs text-slate-600">Taux acceptation</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {client.validated}
                </div>
                <div className="text-xs text-slate-600">Validés</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {client.pending}
                </div>
                <div className="text-xs text-slate-600">En attente</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <div className="flex gap-1 p-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "overview"
                    ? "bg-sky-100 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Vue d'ensemble</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("exchanges")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "exchanges"
                    ? "bg-sky-100 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>Historique ({exchanges.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "messages"
                    ? "bg-sky-100 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages ({messages.length})</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Statistiques comportementales
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900">
                          Répartition des statuts
                        </h4>
                        <BarChart3 className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">Validés</span>
                            <span className="font-semibold text-emerald-600">
                              {client.validated} (
                              {Math.round(
                                (client.validated / client.totalExchanges) *
                                  100,
                              )}
                              %)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${(client.validated / client.totalExchanges) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">En attente</span>
                            <span className="font-semibold text-amber-600">
                              {client.pending} (
                              {Math.round(
                                (client.pending / client.totalExchanges) * 100,
                              )}
                              %)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{
                                width: `${(client.pending / client.totalExchanges) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">Refusés</span>
                            <span className="font-semibold text-red-600">
                              {client.rejected} (
                              {Math.round(
                                (client.rejected / client.totalExchanges) * 100,
                              )}
                              %)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{
                                width: `${(client.rejected / client.totalExchanges) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900">
                          Motifs d'échange principaux
                        </h4>
                        <Star className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="space-y-3">
                        {client.topReasons.map(
                          (
                            [reason, count]: [string, number],
                            index: number,
                          ) => (
                            <div key={index}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-slate-700 truncate">
                                  {reason}
                                </span>
                                <span className="font-semibold text-slate-900">
                                  {count}x
                                </span>
                              </div>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-sky-500 rounded-full"
                                  style={{
                                    width: `${(count / client.totalExchanges) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Informations temporelles
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">
                        Premier échange
                      </div>
                      <div className="font-semibold text-slate-900">
                        {new Date(client.firstExchange).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Il y a {client.daysSinceFirst} jours
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">
                        Dernier échange
                      </div>
                      <div className="font-semibold text-slate-900">
                        {new Date(client.lastExchange).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {client.daysSinceLast === 0
                          ? "Aujourd'hui"
                          : client.daysSinceLast === 1
                            ? "Hier"
                            : `Il y a ${client.daysSinceLast} jours`}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">
                        Fréquence moyenne
                      </div>
                      <div className="font-semibold text-slate-900">
                        {client.totalExchanges > 1
                          ? `${Math.round(client.daysSinceFirst / (client.totalExchanges - 1))} jours`
                          : "N/A"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Entre les échanges
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "exchanges" && (
              <div className="space-y-3">
                {exchanges.map((exchange) => (
                  <Link
                    key={exchange.id}
                    to={`/merchant/exchange/${exchange.id}`}
                    className="block bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors border border-slate-200 group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`p-2 rounded-lg border ${getStatusColor(exchange.status)}`}
                        >
                          {getStatusIcon(exchange.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">
                              {exchange.exchange_code}
                            </h4>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(exchange.status)}`}
                            >
                              {STATUS_LABELS[exchange.status]}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="truncate">{exchange.reason}</span>
                            <span>•</span>
                            <span>
                              {new Date(exchange.created_at).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Eye className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Aucun message
                    </h3>
                    <p className="text-slate-600">
                      Aucune conversation avec ce client pour le moment
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            message.sender_type === "merchant"
                              ? "bg-sky-100"
                              : "bg-emerald-100"
                          }`}
                        >
                          {message.sender_type === "merchant" ? (
                            <User className="w-4 h-4 text-sky-600" />
                          ) : (
                            <User className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900">
                              {message.sender_type === "merchant"
                                ? "Vous"
                                : client.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(message.created_at).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-slate-700">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
