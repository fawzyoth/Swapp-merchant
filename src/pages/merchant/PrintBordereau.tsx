import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  FileText,
  CheckCircle,
  Clock,
  Package,
  AlertCircle,
  Search,
  Filter,
  Eye,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase, MerchantBordereau, Merchant } from "../../lib/supabase";
import MerchantLayout from "../../components/MerchantLayout";

const generateBordereauCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BDX-${timestamp}-${random}`;
};

export default function PrintBordereau() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [bordereaux, setBordereaux] = useState<MerchantBordereau[]>([]);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [merchantId, setMerchantId] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [previewBordereau, setPreviewBordereau] =
    useState<MerchantBordereau | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/merchant/login");
        return;
      }

      const { data: merchantData } = await supabase
        .from("merchants")
        .select("*")
        .eq("email", session.user.email)
        .maybeSingle();

      if (merchantData) {
        setMerchant(merchantData);
        setMerchantId(merchantData.id);
        await fetchBordereaux(merchantData.id);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchBordereaux = async (mId: string) => {
    const { data } = await supabase
      .from("merchant_bordereaux")
      .select("*")
      .eq("merchant_id", mId)
      .order("created_at", { ascending: false });

    setBordereaux(data || []);
  };

  const generateAndPrint = async () => {
    if (!merchant?.id) {
      setError("Erreur: Marchand non trouve. Veuillez vous reconnecter.");
      return;
    }

    if (quantity < 1 || quantity > 100) {
      setError("La quantite doit etre entre 1 et 100");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const newBordereaux: Partial<MerchantBordereau>[] = [];
      for (let i = 0; i < quantity; i++) {
        newBordereaux.push({
          merchant_id: merchant.id,
          bordereau_code: generateBordereauCode(),
          status: "available",
          printed_at: new Date().toISOString(),
        });
      }

      const { data: inserted, error: insertError } = await supabase
        .from("merchant_bordereaux")
        .insert(newBordereaux)
        .select();

      if (insertError) throw insertError;

      // Refresh list
      await fetchBordereaux(merchant.id);

      // Print the generated bordereaux
      if (inserted) {
        printBordereaux(inserted);
      }
    } catch (err: any) {
      console.error("Error generating bordereaux:", err);
      setError(
        `Erreur: ${err?.message || err?.details || JSON.stringify(err)}`,
      );
    } finally {
      setGenerating(false);
    }
  };

  const printBordereaux = (items: MerchantBordereau[]) => {
    const printWindow = window.open("", "", "height=900,width=800");
    if (!printWindow) return;

    const bordereauHtml = items
      .map((item) => {
        const qrUrl = `https://fawzyoth.github.io/Swapp-app/#/client/exchange/new?bordereau=${item.bordereau_code}`;

        return `
        <div class="bordereau">
          <div class="header">
            ${merchant?.logo_base64 ? `<img src="${merchant.logo_base64}" alt="Logo" class="logo" />` : '<div class="logo-placeholder">LOGO</div>'}
            <div class="title-section">
              <h1>SWAPP - Bordereau d'Echange</h1>
              <p class="business-name">${merchant?.business_name || merchant?.name || "E-Commercant"}</p>
            </div>
          </div>

          <div class="codes-section">
            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}" alt="QR Code" />
              <p class="readable-code">${item.bordereau_code}</p>
              <p class="code-label">Scanner pour initier l'echange</p>
            </div>

            <div class="barcode-box">
              <img src="https://barcodeapi.org/api/128/${item.bordereau_code}" alt="Barcode" class="barcode-img" />
              <p class="barcode-text">${item.bordereau_code}</p>
              <p class="code-label">Code Livreur</p>
            </div>
          </div>

          <div class="contact-section">
            <p><strong>Contact:</strong> ${merchant?.phone || ""}</p>
            <p><strong>Adresse:</strong> ${merchant?.business_address || ""} ${merchant?.business_city || ""} ${merchant?.business_postal_code || ""}</p>
          </div>

          <div class="instructions-fr">
            <h3>Instructions</h3>
            <ol>
              <li>Scannez le QR code pour demarrer l'echange</li>
              <li>Suivez les etapes sur votre telephone</li>
              <li>Preparez le produit a retourner</li>
              <li>Le livreur scannera le code-barres lors de la collecte</li>
            </ol>
          </div>

          <div class="instructions-ar">
            <h3>التعليمات</h3>
            <ol>
              <li>امسح رمز QR لبدء عملية التبديل</li>
              <li>اتبع الخطوات على هاتفك</li>
              <li>جهّز المنتج للإرجاع</li>
              <li>سيقوم المندوب بمسح الباركود عند الاستلام</li>
            </ol>
          </div>

          <div class="footer">
            <p>SWAPP - Plateforme d'echange de produits | ${item.bordereau_code}</p>
          </div>
        </div>
      `;
      })
      .join('<div class="page-break"></div>');

    printWindow.document.write(`
      <html>
      <head>
        <title>Bordereaux - ${items.length} exemplaires</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; }

          .bordereau {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 2px solid #0369a1;
            border-radius: 10px;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 20px;
            border-bottom: 2px solid #0369a1;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }

          .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }

          .logo-placeholder {
            width: 80px;
            height: 80px;
            background: #f0f9ff;
            border: 2px dashed #0369a1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #0369a1;
            border-radius: 8px;
          }

          .title-section h1 {
            font-size: 18px;
            color: #0369a1;
          }

          .business-name {
            font-size: 14px;
            color: #64748b;
            margin-top: 5px;
          }

          .codes-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }

          .qr-box, .barcode-box {
            text-align: center;
            padding: 15px;
            border-radius: 10px;
          }

          .qr-box {
            background: #dbeafe;
            border: 2px solid #3b82f6;
          }

          .qr-box img {
            width: 150px;
            height: 150px;
          }

          .readable-code {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 8px;
            color: #1d4ed8;
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
          }

          .barcode-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
          }

          .barcode-img {
            width: 180px;
            height: 70px;
            object-fit: contain;
            background: white;
            padding: 8px;
            border-radius: 6px;
          }

          .barcode-text {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-top: 10px;
          }

          .code-label {
            font-size: 11px;
            color: #64748b;
            margin-top: 8px;
          }

          .contact-section {
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 12px;
          }

          .contact-section p {
            margin: 4px 0;
          }

          .instructions-fr {
            background: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
          }

          .instructions-fr h3 {
            font-size: 12px;
            color: #047857;
            margin-bottom: 8px;
          }

          .instructions-fr ol {
            margin-left: 18px;
            font-size: 11px;
            color: #065f46;
          }

          .instructions-fr ol li {
            margin: 4px 0;
          }

          .instructions-ar {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
            direction: rtl;
            text-align: right;
          }

          .instructions-ar h3 {
            font-size: 14px;
            color: #b45309;
            margin-bottom: 8px;
          }

          .instructions-ar ol {
            margin-right: 18px;
            font-size: 12px;
            color: #92400e;
          }

          .instructions-ar ol li {
            margin: 6px 0;
          }

          .footer {
            text-align: center;
            font-size: 10px;
            color: #64748b;
            padding-top: 10px;
            border-top: 1px dashed #cbd5e1;
          }

          .page-break {
            page-break-after: always;
          }

          @media print {
            body { padding: 0; }
            .bordereau { border: 1px solid #ccc; margin: 10px auto; }
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${bordereauHtml}
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredBordereaux = bordereaux.filter((b) => {
    const matchesFilter = filter === "all" || b.status === filter;
    const matchesSearch = b.bordereau_code
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: bordereaux.length,
    available: bordereaux.filter((b) => b.status === "available").length,
    assigned: bordereaux.filter((b) => b.status === "assigned").length,
    used: bordereaux.filter((b) => b.status === "used").length,
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Printer className="w-8 h-8 text-sky-600" />
            Imprimer des Bordereaux
          </h1>
          <p className="text-slate-600 mt-2">
            Generez et imprimez des bordereaux pre-configures avec QR code et
            code-barres uniques
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </p>
                <p className="text-sm text-slate-600">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.available}
                </p>
                <p className="text-sm text-slate-600">Disponibles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.assigned}
                </p>
                <p className="text-sm text-slate-600">Assignes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Package className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-600">{stats.used}</p>
                <p className="text-sm text-slate-600">Utilises</p>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Generer de nouveaux bordereaux
          </h2>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantite
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <button
              onClick={generateAndPrint}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generation...
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  Generer et Imprimer
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-slate-500 mt-3">
            Chaque bordereau aura un QR code et un code-barres uniques lies
            ensemble
          </p>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Historique des bordereaux
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="all">Tous</option>
                  <option value="available">Disponibles</option>
                  <option value="assigned">Assignes</option>
                  <option value="used">Utilises</option>
                </select>
              </div>
            </div>
          </div>

          {filteredBordereaux.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun bordereau trouve</p>
              <p className="text-sm text-slate-500 mt-1">
                Generez vos premiers bordereaux pour commencer
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Code
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Date creation
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBordereaux.slice(0, 50).map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <code className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                          {b.bordereau_code}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            b.status === "available"
                              ? "bg-emerald-100 text-emerald-700"
                              : b.status === "assigned"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {b.status === "available"
                            ? "Disponible"
                            : b.status === "assigned"
                              ? "Assigne"
                              : "Utilise"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(b.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setPreviewBordereau(b)}
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Voir les details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredBordereaux.length > 50 && (
                <p className="text-center text-sm text-slate-500 py-4">
                  Affichage des 50 premiers sur {filteredBordereaux.length}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewBordereau && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  Détails du Bordereau
                </h3>
                <button
                  onClick={() => setPreviewBordereau(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Code Display */}
                <div className="text-center mb-6">
                  <p className="text-sm text-slate-600 mb-2">
                    Code du bordereau
                  </p>
                  <code className="text-2xl font-mono font-bold bg-slate-100 px-4 py-2 rounded-lg">
                    {previewBordereau.bordereau_code}
                  </code>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                    <QRCodeSVG
                      value={`https://fawzyoth.github.io/Swapp-app/#/client/exchange/new?bordereau=${previewBordereau.bordereau_code}`}
                      size={180}
                      level="M"
                    />
                    <p className="text-sm text-blue-700 mt-3 font-medium">
                      Scanner pour initier l'échange
                    </p>
                    <p className="text-xs text-slate-500 mt-1 break-all">
                      {previewBordereau.bordereau_code}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-sm text-slate-600">Statut:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      previewBordereau.status === "available"
                        ? "bg-emerald-100 text-emerald-700"
                        : previewBordereau.status === "assigned"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {previewBordereau.status === "available"
                      ? "Disponible"
                      : previewBordereau.status === "assigned"
                        ? "Assigné"
                        : "Utilisé"}
                  </span>
                </div>

                {/* Dates */}
                <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Créé le:</span>
                    <span className="font-medium">
                      {new Date(previewBordereau.created_at).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  {previewBordereau.printed_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Imprimé le:</span>
                      <span className="font-medium">
                        {new Date(
                          previewBordereau.printed_at,
                        ).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {previewBordereau.assigned_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Assigné le:</span>
                      <span className="font-medium">
                        {new Date(
                          previewBordereau.assigned_at,
                        ).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Print Single Button */}
                <button
                  onClick={() => {
                    printBordereaux([previewBordereau]);
                    setPreviewBordereau(null);
                  }}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Imprimer ce bordereau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
