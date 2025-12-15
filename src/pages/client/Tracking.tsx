import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock,
  Package,
  Truck,
  MapPin,
  X,
  AlertCircle,
  MessageSquare,
  Phone,
  Calendar,
  CheckCircle,
  Send,
  Video,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function ClientTracking() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t, lang, dir } = useLanguage();
  const [exchange, setExchange] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [depot, setDepot] = useState<any>(null);
  const [transporter, setTransporter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const STATUS_LABELS: Record<string, { fr: string; ar: string }> = {
    pending: { fr: "En attente", ar: "قيد الانتظار" },
    validated: { fr: "Validé", ar: "تمت الموافقة" },
    preparing: { fr: "En préparation", ar: "قيد التحضير" },
    in_transit: { fr: "En transit", ar: "في الطريق" },
    completed: { fr: "Terminé", ar: "مكتمل" },
    returned: { fr: "Retourné", ar: "مُرجع" },
    rejected: { fr: "Rejeté", ar: "مرفوض" },
  };

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status]?.[lang] || status;
  };

  useEffect(() => {
    fetchExchangeData();
  }, [code]);

  const fetchExchangeData = async () => {
    try {
      const { data: exchangeData } = await supabase
        .from("exchanges")
        .select("*")
        .eq("exchange_code", code)
        .maybeSingle();

      if (exchangeData) {
        setExchange(exchangeData);

        const { data: historyData } = await supabase
          .from("status_history")
          .select("*")
          .eq("exchange_id", exchangeData.id)
          .order("created_at", { ascending: false });

        setHistory(historyData || []);

        // Fetch messages
        const { data: messagesData } = await supabase
          .from("messages")
          .select("*")
          .eq("exchange_id", exchangeData.id)
          .order("created_at", { ascending: true });

        setMessages(messagesData || []);

        if (exchangeData.mini_depot_id) {
          const { data: depotData } = await supabase
            .from("mini_depots")
            .select("*")
            .eq("id", exchangeData.mini_depot_id)
            .maybeSingle();
          setDepot(depotData);
        }

        if (exchangeData.transporter_id) {
          const { data: transporterData } = await supabase
            .from("transporters")
            .select("*")
            .eq("id", exchangeData.transporter_id)
            .maybeSingle();
          setTransporter(transporterData);
        }
      }
    } catch (error) {
      console.error("Error fetching exchange:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !exchange) return;

    setSendingMessage(true);
    try {
      await supabase.from("messages").insert({
        exchange_id: exchange.id,
        sender_type: "client",
        message: newMessage.trim(),
      });

      setNewMessage("");
      // Refresh messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("exchange_id", exchange.id)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getProgressSteps = () => {
    const allSteps = [
      {
        key: "pending",
        label: lang === "ar" ? "تم الإرسال" : "Demande soumise",
        icon: Clock,
      },
      {
        key: "validated",
        label: lang === "ar" ? "تمت الموافقة" : "Validée",
        icon: CheckCircle,
      },
      {
        key: "preparing",
        label: lang === "ar" ? "قيد التحضير" : "En préparation",
        icon: Package,
      },
      {
        key: "in_transit",
        label: lang === "ar" ? "في الطريق" : "En transit",
        icon: Truck,
      },
      {
        key: "completed",
        label: lang === "ar" ? "تم التوصيل" : "Livrée",
        icon: Check,
      },
    ];

    const statusOrder = [
      "pending",
      "validated",
      "preparing",
      "in_transit",
      "completed",
    ];
    const currentIndex = statusOrder.indexOf(exchange?.status);

    return allSteps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentIndex && exchange?.status !== "rejected",
      isCurrent: index === currentIndex && exchange?.status !== "rejected",
      isRejected: exchange?.status === "rejected" && index > 0,
    }));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-amber-50 border-amber-200",
          textColor: "text-amber-700",
          icon: Clock,
          message:
            lang === "ar"
              ? "طلبك قيد المراجعة من قبل التاجر"
              : "Votre demande est en cours d'examen par le marchand",
          action:
            lang === "ar" ? "في انتظار الموافقة" : "En attente de validation",
        };
      case "validated":
        return {
          color: "bg-blue-50 border-blue-200",
          textColor: "text-blue-700",
          icon: CheckCircle,
          message:
            lang === "ar"
              ? "تمت الموافقة على التبديل"
              : "Votre échange a été approuvé",
          action: lang === "ar" ? "قيد التحضير" : "Préparation en cours",
        };
      case "preparing":
        return {
          color: "bg-purple-50 border-purple-200",
          textColor: "text-purple-700",
          icon: Package,
          message:
            lang === "ar"
              ? "منتجك الجديد قيد التحضير"
              : "Votre nouveau produit est en cours de préparation",
          action: lang === "ar" ? "سيتم الشحن قريباً" : "Sera bientôt expédié",
        };
      case "in_transit":
        return {
          color: "bg-indigo-50 border-indigo-200",
          textColor: "text-indigo-700",
          icon: Truck,
          message:
            lang === "ar" ? "طردك في الطريق" : "Votre colis est en route",
          action: lang === "ar" ? "جاري التوصيل" : "Livraison en cours",
        };
      case "completed":
        return {
          color: "bg-emerald-50 border-emerald-200",
          textColor: "text-emerald-700",
          icon: CheckCircle,
          message:
            lang === "ar" ? "تم التبديل بنجاح" : "Votre échange est terminé",
          action: lang === "ar" ? "اكتمل التبديل" : "Échange complété",
        };
      case "rejected":
        return {
          color: "bg-red-50 border-red-200",
          textColor: "text-red-700",
          icon: X,
          message:
            lang === "ar" ? "تم رفض طلبك" : "Votre demande a été refusée",
          action: lang === "ar" ? "تم الرفض" : "Échange refusé",
        };
      default:
        return {
          color: "bg-slate-50 border-slate-200",
          textColor: "text-slate-700",
          icon: AlertCircle,
          message: "",
          action: "",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center"
        dir={dir}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {t("exchangeNotFound")}
          </h2>
          <p className="text-slate-600 mb-6">{t("checkCodeAndRetry")}</p>
          <button
            onClick={() => navigate("/client/scan")}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            {t("scanQRCode")}
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(exchange.status);
  const StatusIcon = statusConfig.icon;
  const progressSteps = getProgressSteps();

  return (
    <div className="min-h-screen bg-slate-50" dir={dir}>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/client/scan")}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 me-2" />
            <span className="font-medium">{t("back")}</span>
          </button>
          <LanguageSwitcher />
        </div>

        <div className="space-y-6">
          <div className={`rounded-2xl border-2 p-6 ${statusConfig.color}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                <StatusIcon className={`w-8 h-8 ${statusConfig.textColor}`} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {statusConfig.action}
                </h1>
                <p className="text-slate-700 text-lg mb-4">
                  {statusConfig.message}
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {lang === "ar" ? "تاريخ الطلب: " : "Demande créée le "}
                    {new Date(exchange.created_at).toLocaleDateString(
                      lang === "ar" ? "ar-TN" : "fr-FR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {exchange.status !== "rejected" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                {lang === "ar"
                  ? "تقدم التبديل"
                  : "Progression de votre échange"}
              </h2>
              <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(progressSteps.filter((s) => s.isCompleted).length / progressSteps.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="relative flex justify-between">
                  {progressSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                            step.isCompleted
                              ? "bg-emerald-500 border-emerald-500"
                              : step.isCurrent
                                ? "bg-white border-emerald-500"
                                : "bg-white border-slate-300"
                          }`}
                        >
                          <StepIcon
                            className={`w-5 h-5 ${
                              step.isCompleted
                                ? "text-white"
                                : step.isCurrent
                                  ? "text-emerald-500"
                                  : "text-slate-400"
                            }`}
                          />
                        </div>
                        <div className="mt-3 text-center">
                          <div
                            className={`text-sm font-medium ${
                              step.isCompleted || step.isCurrent
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            {step.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {exchange.status === "rejected" && exchange.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    {lang === "ar" ? "سبب الرفض" : "Motif du refus"}
                  </h3>
                  <p className="text-red-700">{exchange.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {lang === "ar" ? "تفاصيل الطلب" : "Détails de la demande"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">
                  {t("exchangeCode")}
                </div>
                <div className="font-mono font-semibold text-slate-900 text-lg">
                  {exchange.exchange_code}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">
                  {t("fullName")}
                </div>
                <div className="font-medium text-slate-900">
                  {exchange.client_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">{t("phone")}</div>
                <div className="font-medium text-slate-900" dir="ltr">
                  {exchange.client_phone}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">{t("reason")}</div>
                <div className="font-medium text-slate-900">
                  {exchange.reason}
                </div>
              </div>
            </div>
          </div>

          {(depot || transporter) && (
            <div className="grid md:grid-cols-2 gap-6">
              {depot && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-slate-900">
                      {lang === "ar" ? "نقطة الاستلام" : "Point de retrait"}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-slate-500">
                        {lang === "ar" ? "الاسم" : "Nom"}
                      </div>
                      <div className="font-medium text-slate-900">
                        {depot.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">
                        {t("address")}
                      </div>
                      <div className="font-medium text-slate-900">
                        {depot.address}
                      </div>
                      <div className="text-slate-700">{depot.city}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">{t("phone")}</div>
                      <a
                        href={`tel:${depot.phone}`}
                        className="font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Phone className="w-4 h-4" />
                        {depot.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {transporter && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-slate-900">
                      {lang === "ar" ? "شركة النقل" : "Transporteur"}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-slate-500">
                        {lang === "ar" ? "الشركة" : "Société"}
                      </div>
                      <div className="font-medium text-slate-900">
                        {transporter.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">
                        {lang === "ar" ? "التواصل" : "Contact"}
                      </div>
                      <a
                        href={`tel:${transporter.phone}`}
                        className="font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Phone className="w-4 h-4" />
                        {transporter.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {lang === "ar" ? "السجل" : "Historique"}
              </h2>
              <div className="space-y-4">
                {history.map((item, index) => {
                  const ItemIcon = getStatusConfig(item.status).icon;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`p-2 rounded-lg ${getStatusConfig(item.status).color}`}
                        >
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        {index < history.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 min-h-[24px] my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="font-medium text-slate-900">
                          {getStatusLabel(item.status)}
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(item.created_at).toLocaleDateString(
                            lang === "ar" ? "ar-TN" : "fr-FR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Video Section */}
          {exchange.video && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  {lang === "ar" ? "فيديو المنتج" : "Vidéo du produit"}
                </h2>
              </div>
              <video
                src={exchange.video}
                controls
                className="w-full max-h-64 rounded-xl border border-slate-200 bg-black"
              />
            </div>
          )}

          {/* Messages Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                {lang === "ar" ? "المراسلات" : "Messages"}
              </h2>
            </div>

            {/* Messages List */}
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>
                    {lang === "ar"
                      ? "لا توجد رسائل بعد"
                      : "Aucun message pour le moment"}
                  </p>
                  <p className="text-sm mt-1">
                    {lang === "ar"
                      ? "أرسل رسالة للتاجر لأي استفسار"
                      : "Envoyez un message au marchand pour toute question"}
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl max-w-[85%] ${
                      msg.sender_type === "client"
                        ? "bg-emerald-50 border border-emerald-200 ms-auto"
                        : "bg-slate-100 border border-slate-200 me-auto"
                    }`}
                  >
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      {msg.sender_type === "client"
                        ? lang === "ar"
                          ? "أنت"
                          : "Vous"
                        : lang === "ar"
                          ? "التاجر"
                          : "Marchand"}
                    </p>
                    <p className="text-slate-800">{msg.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(msg.created_at).toLocaleString(
                        lang === "ar" ? "ar-TN" : "fr-FR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        },
                      )}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  lang === "ar" ? "اكتب رسالتك..." : "Votre message..."
                }
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                dir={dir}
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingMessage ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>

          {exchange.photos && exchange.photos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {lang === "ar" ? "صور المنتج" : "Photos du produit"}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {exchange.photos.map((photo: string, index: number) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
