import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Phone,
  MapPin,
  Package,
  Video,
  Clock,
  TrendingUp,
  Info,
  Home,
  Banknote,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { supabase, STATUS_LABELS } from "../../lib/supabase";
import DeliveryLayout from "../../components/DeliveryLayout";
import { sendStatusChangeSMS } from "../../lib/smsService";

export default function ExchangeVerification() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [exchange, setExchange] = useState<any>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignedBagId, setAssignedBagId] = useState("");
  const [processing, setProcessing] = useState(false);

  // Payment collection state
  const [paymentCollected, setPaymentCollected] = useState(false);
  const [amountCollected, setAmountCollected] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mobile_payment" | "other"
  >("cash");
  const [collectionNotes, setCollectionNotes] = useState("");

  useEffect(() => {
    if (code) {
      fetchExchangeData();
    }
  }, [code]);

  const fetchExchangeData = async () => {
    try {
      // Normalize the code (trim whitespace and ensure uppercase)
      const normalizedCode = code?.trim().toUpperCase();
      console.log("Fetching exchange with code:", normalizedCode);

      const { data: exchangeData, error } = await supabase
        .from("exchanges")
        .select("*")
        .eq("exchange_code", normalizedCode)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Exchange data received:", exchangeData);

      if (exchangeData) {
        setExchange(exchangeData);

        // Fetch merchant info
        if (exchangeData.merchant_id) {
          const { data: merchantData } = await supabase
            .from("merchants")
            .select("*")
            .eq("id", exchangeData.merchant_id)
            .maybeSingle();

          if (merchantData) {
            setMerchant(merchantData);
          }
        }

        // Fetch client history
        const { data: history } = await supabase
          .from("exchanges")
          .select("*")
          .eq("client_phone", exchangeData.client_phone)
          .neq("id", exchangeData.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setClientHistory(history || []);
      }
    } catch (error) {
      console.error("Error fetching exchange:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptExchange = () => {
    setShowAcceptModal(true);
  };

  // Generate automatic bag ID based on exchange code and timestamp
  const generateBagId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const exchangeCode = exchange?.exchange_code || "EXC";
    return `BAG-${exchangeCode}-${timestamp}`;
  };

  const handleRejectExchange = async () => {
    if (!rejectionReason.trim()) {
      alert("Veuillez fournir une raison pour le refus");
      return;
    }

    setProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Update exchange status
      await supabase
        .from("exchanges")
        .update({
          status: "delivery_rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", exchange.id);

      // Create verification record
      await supabase.from("delivery_verifications").insert({
        exchange_id: exchange.id,
        delivery_person_id: user.id,
        status: "rejected",
        rejection_reason: rejectionReason,
      });

      // Add status history
      await supabase.from("status_history").insert({
        exchange_id: exchange.id,
        status: "delivery_rejected",
      });

      // Send SMS notification to client
      await sendStatusChangeSMS(
        exchange.client_phone,
        exchange.client_name,
        exchange.exchange_code,
        "delivery_rejected",
        STATUS_LABELS["delivery_rejected"],
      );

      setShowRejectModal(false);
      navigate("/delivery/dashboard");
    } catch (error) {
      console.error("Error rejecting exchange:", error);
      alert("Erreur lors du refus de l'échange");
    } finally {
      setProcessing(false);
    }
  };

  const confirmExchangeAcceptance = async () => {
    // Validate payment if collected
    const collectedAmount = paymentCollected ? parseFloat(amountCollected) : 0;
    if (paymentCollected && (isNaN(collectedAmount) || collectedAmount <= 0)) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    setProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Auto-generate bag ID
      const autoBagId = generateBagId();

      // Update exchange status (core fields that always exist)
      const { error: updateError } = await supabase
        .from("exchanges")
        .update({
          status: "delivery_verified",
          bag_id: autoBagId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exchange.id);

      if (updateError) {
        console.error("Error updating exchange:", updateError);
        throw new Error("Erreur lors de la mise à jour de l'échange");
      }

      // Try to update financial columns if they exist (optional)
      if (paymentCollected && collectedAmount > 0) {
        await supabase
          .from("exchanges")
          .update({
            amount_collected: collectedAmount,
            collection_date: new Date().toISOString(),
            collected_by: user.id,
            settlement_status: "pending_settlement",
          })
          .eq("id", exchange.id)
          .then(({ error }) => {
            if (error) {
              console.warn("Financial columns not available:", error.message);
            }
          });
      }

      // Try to create verification record (optional - table may not exist)
      await supabase
        .from("delivery_verifications")
        .insert({
          exchange_id: exchange.id,
          delivery_person_id: user.id,
          status: "accepted",
          bag_id: autoBagId,
          payment_collected: paymentCollected,
          amount_collected: collectedAmount,
          payment_method: paymentCollected ? paymentMethod : null,
          collection_notes: collectionNotes || null,
        })
        .then(({ error }) => {
          if (error) {
            console.warn(
              "delivery_verifications table not available:",
              error.message,
            );
          }
        });

      // Try to create financial transaction if payment was collected (optional)
      if (paymentCollected && collectedAmount > 0) {
        await supabase
          .from("financial_transactions")
          .insert({
            exchange_id: exchange.id,
            delivery_person_id: user.id,
            merchant_id: exchange.merchant_id,
            transaction_type: "collection_from_client",
            amount: collectedAmount,
            currency: "TND",
            direction: "credit",
            status: "completed",
            description: `Encaissement client - ${exchange.exchange_code}`,
            created_by: user.id,
          })
          .then(({ error }) => {
            if (error) {
              console.warn(
                "financial_transactions table not available:",
                error.message,
              );
            }
          });
      }

      // Add status history
      await supabase.from("status_history").insert({
        exchange_id: exchange.id,
        status: "delivery_verified",
      });

      // Send SMS notification to client
      await sendStatusChangeSMS(
        exchange.client_phone,
        exchange.client_name,
        exchange.exchange_code,
        "delivery_verified",
        STATUS_LABELS["delivery_verified"],
      );

      setAssignedBagId(autoBagId);
      setShowAcceptModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error accepting exchange:", error);
      alert("Erreur lors de l'acceptation de l'échange");
    } finally {
      setProcessing(false);
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

  if (!exchange) {
    return (
      <DeliveryLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Échange non trouvé
            </h2>
            <p className="text-slate-600 mb-4">
              Le code "{code}" n'existe pas.
            </p>
            <button
              onClick={() => navigate("/delivery/scan")}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Retour au scanner
            </button>
          </div>
        </div>
      </DeliveryLayout>
    );
  }

  const historyStats = {
    total: clientHistory.length,
    validated: clientHistory.filter(
      (h) =>
        h.status === "validated" ||
        h.status === "completed" ||
        h.status === "delivery_verified",
    ).length,
    rejected: clientHistory.filter(
      (h) => h.status === "rejected" || h.status === "delivery_rejected",
    ).length,
  };

  return (
    <DeliveryLayout>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/delivery/scan")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour au scanner</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exchange Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {exchange.exchange_code}
                  </h2>
                  <p className="text-slate-600">
                    Créé le{" "}
                    {new Date(exchange.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    exchange.status === "validated"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : exchange.status === "in_transit"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {STATUS_LABELS[exchange.status]}
                </span>
              </div>

              {/* Client & Product Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-slate-900">Client</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-600">Nom:</span>
                      <p className="font-medium text-slate-900">
                        {exchange.client_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Téléphone:</span>
                      <p className="font-medium text-slate-900">
                        <a
                          href={`tel:${exchange.client_phone}`}
                          className="text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          {exchange.client_phone}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-slate-900">Produit</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-600">Nom:</span>
                      <p className="font-medium text-slate-900">
                        {exchange.product_name || "Non spécifié"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">Raison d'échange:</span>
                      <p className="font-medium text-slate-900">
                        {exchange.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-amber-700" />
                  <h3 className="font-semibold text-slate-900">
                    Adresse de livraison
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Home className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {exchange.client_address || "Non fournie"}
                      </p>
                      <p className="text-slate-700">
                        {exchange.client_city && exchange.client_postal_code
                          ? `${exchange.client_city} ${exchange.client_postal_code}, ${exchange.client_country || "Tunisia"}`
                          : "Informations incomplètes"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference Video */}
              {exchange.video && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold text-slate-900">
                        Vidéo de référence
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(exchange.created_at).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={exchange.video}
                      controls
                      className="w-full max-h-96"
                      poster=""
                    />
                  </div>
                  <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <strong>Important:</strong> Comparez le produit présenté par
                    le client avec cette vidéo de référence avant d'accepter
                    l'échange.
                  </p>
                </div>
              )}

              {/* Photos */}
              {exchange.photos && exchange.photos.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Photos du produit
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {exchange.photos.map((photo: string, index: number) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(photo, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={handleAcceptExchange}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accepter l'échange
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Refuser l'échange
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Client History */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">
                  Historique du client
                </h3>
              </div>

              {clientHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">
                    Premier échange de ce client
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-2xl font-bold text-slate-900">
                        {historyStats.total}
                      </div>
                      <div className="text-xs text-slate-600">Échanges</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-700">
                        {historyStats.validated}
                      </div>
                      <div className="text-xs text-emerald-700">Validés</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="text-2xl font-bold text-red-700">
                        {historyStats.rejected}
                      </div>
                      <div className="text-xs text-red-700">Refusés</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      Derniers échanges
                    </h4>
                    {clientHistory.slice(0, 3).map((h) => (
                      <div
                        key={h.id}
                        className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs text-slate-600">
                            {h.exchange_code}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              h.status === "validated" ||
                              h.status === "completed" ||
                              h.status === "delivery_verified"
                                ? "bg-emerald-100 text-emerald-700"
                                : h.status === "rejected" ||
                                    h.status === "delivery_rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {STATUS_LABELS[h.status]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate">
                          {h.reason}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(h.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {historyStats.total > 0 && (
                    <div
                      className={`rounded-lg p-3 border ${
                        historyStats.validated / historyStats.total >= 0.7
                          ? "bg-emerald-50 border-emerald-200"
                          : historyStats.validated / historyStats.total >= 0.4
                            ? "bg-amber-50 border-amber-200"
                            : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle
                          className={`w-4 h-4 ${
                            historyStats.validated / historyStats.total >= 0.7
                              ? "text-emerald-600"
                              : historyStats.validated / historyStats.total >=
                                  0.4
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        />
                        <span className="text-sm font-medium">
                          Taux de validation:{" "}
                          {Math.round(
                            (historyStats.validated / historyStats.total) * 100,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Refuser l'échange
                </h3>
                <p className="text-slate-600 mb-6">
                  Veuillez expliquer pourquoi vous refusez cet échange
                </p>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Le produit ne correspond pas à la vidéo de référence..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleRejectExchange}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? "Traitement..." : "Confirmer le refus"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accept Exchange Modal */}
        {showAcceptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Confirmer l'acceptation
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Confirmez l'échange et indiquez si un paiement a été
                      encaissé
                    </p>
                  </div>
                </div>

                {/* Exchange Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      Code échange:
                    </span>
                    <span className="font-mono font-medium text-slate-900">
                      {exchange?.exchange_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Client:</span>
                    <span className="font-medium text-slate-900">
                      {exchange?.client_name}
                    </span>
                  </div>
                </div>

                {/* Payment Collection Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Banknote className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        Encaissement
                      </h4>
                      <p className="text-sm text-slate-600">
                        {exchange?.payment_amount > 0
                          ? `Montant attendu: ${exchange.payment_amount.toFixed(2)} TND`
                          : "Indiquez si vous avez encaissé un paiement"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentCollected}
                        onChange={(e) => setPaymentCollected(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-medium text-slate-900">
                        Paiement encaissé
                      </span>
                    </label>
                  </div>

                  {paymentCollected && (
                    <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Montant encaissé (TND)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountCollected}
                          onChange={(e) => setAmountCollected(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Mode de paiement
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cash")}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                              paymentMethod === "cash"
                                ? "border-amber-500 bg-amber-100 text-amber-800"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <Banknote className="w-5 h-5" />
                            Espèces
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("card")}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                              paymentMethod === "card"
                                ? "border-amber-500 bg-amber-100 text-amber-800"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <CreditCard className="w-5 h-5" />
                            Carte
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("mobile_payment")}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                              paymentMethod === "mobile_payment"
                                ? "border-amber-500 bg-amber-100 text-amber-800"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <Smartphone className="w-5 h-5" />
                            Mobile
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("other")}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                              paymentMethod === "other"
                                ? "border-amber-500 bg-amber-100 text-amber-800"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            Autre
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Notes (optionnel)
                        </label>
                        <input
                          type="text"
                          value={collectionNotes}
                          onChange={(e) => setCollectionNotes(e.target.value)}
                          placeholder="Ex: Reçu numéro..."
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAcceptModal(false)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmExchangeAcceptance}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {processing ? "Traitement..." : "Confirmer l'acceptation"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal with Merchant Address */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Échange Accepté
                  </h3>
                  <p className="text-slate-600">
                    Le retour a été assigné au sac de collecte
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-900">
                      Sac assigné
                    </span>
                  </div>
                  <p className="font-mono text-lg text-emerald-800">
                    {assignedBagId}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-900">
                      Adresse de retour E-Commerçant
                    </span>
                  </div>
                  {merchant ? (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-900">
                        {merchant.name}
                      </p>
                      <p className="text-slate-700">
                        {merchant.address || "123 Rue du Commerce"}
                      </p>
                      <p className="text-slate-700">
                        {merchant.city || "Tunis"}{" "}
                        {merchant.postal_code || "1000"}
                      </p>
                      <p className="text-slate-600 flex items-center gap-1 mt-2">
                        <Phone className="w-4 h-4" />
                        {merchant.phone || "+216 XX XXX XXX"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium text-slate-900">
                        SWAPP E-Commerce
                      </p>
                      <p className="text-slate-700">
                        Zone Industrielle, Rue de l'Innovation
                      </p>
                      <p className="text-slate-700">Tunis 1000, Tunisia</p>
                      <p className="text-slate-600 flex items-center gap-1 mt-2">
                        <Phone className="w-4 h-4" />
                        +216 71 234 567
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Instructions:</strong> Déposez le sac{" "}
                    <span className="font-mono">{assignedBagId}</span> à
                    l'adresse indiquée ci-dessus pour retourner l'article au
                    e-commerçant.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/delivery/dashboard")}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Terminer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
}
