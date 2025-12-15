import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Package,
  Banknote,
  CheckCircle,
  Clock,
  Download,
  Send,
  Printer,
} from "lucide-react";
import { supabase, WeeklyInvoice } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<WeeklyInvoice | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_invoices")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async () => {
    if (!invoice) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("weekly_invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paid_amount: invoice.net_payable,
        })
        .eq("id", id);

      if (error) throw error;

      // Create payment transaction
      await supabase.from("financial_transactions").insert({
        invoice_id: invoice.id,
        transaction_type: "invoice_paid",
        amount: invoice.net_payable,
        currency: "TND",
        direction: "credit",
        status: "completed",
        description: `Paiement facture ${invoice.invoice_number}`,
      });

      fetchInvoice();
      alert("Facture marquée comme payée");
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setProcessing(false);
    }
  };

  const printInvoice = () => {
    if (!invoice) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
          .invoice-info { text-align: right; }
          .invoice-number { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
          .period { color: #666; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 14px; font-weight: bold; color: #666; margin-bottom: 10px; text-transform: uppercase; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .summary-item { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .summary-label { font-size: 12px; color: #666; margin-bottom: 4px; }
          .summary-value { font-size: 24px; font-weight: bold; }
          .totals { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .total-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
          .total-row.net { background: #7c3aed; color: white; margin: 10px -20px -20px; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-paid { background: #d1fae5; color: #059669; }
          .status-generated { background: #e0e7ff; color: #4f46e5; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SWAPP</div>
            <p>Plateforme d'échange e-commerce</p>
          </div>
          <div class="invoice-info">
            <div class="invoice-number">${invoice.invoice_number}</div>
            <div class="period">
              Semaine ${invoice.week_number}, ${invoice.year}<br>
              ${new Date(invoice.period_start).toLocaleDateString("fr-FR")} - ${new Date(invoice.period_end).toLocaleDateString("fr-FR")}
            </div>
            <span class="status-badge ${invoice.status === "paid" ? "status-paid" : "status-generated"}">
              ${invoice.status === "paid" ? "PAYÉE" : "GÉNÉRÉE"}
            </span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Résumé de la période</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Échanges traités</div>
              <div class="summary-value">${invoice.total_exchanges_handled}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Montant encaissé</div>
              <div class="summary-value">${invoice.total_amount_collected.toFixed(2)} TND</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Détail financier</div>
          <div class="totals">
            <div class="total-row">
              <span>Total encaissé clients</span>
              <span>${invoice.total_amount_collected.toFixed(2)} TND</span>
            </div>
            <div class="total-row">
              <span>Frais de service (10%)</span>
              <span>-${invoice.total_fees.toFixed(2)} TND</span>
            </div>
            <div class="total-row">
              <span>Commission SWAPP (5%)</span>
              <span>-${invoice.total_commissions.toFixed(2)} TND</span>
            </div>
            <div class="total-row net">
              <span>Net à payer</span>
              <span>${invoice.net_payable.toFixed(2)} TND</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Cette facture a été générée automatiquement par SWAPP.</p>
          <p>Date de génération: ${invoice.generated_at ? new Date(invoice.generated_at).toLocaleDateString("fr-FR") : new Date(invoice.created_at).toLocaleDateString("fr-FR")}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Payée
          </span>
        );
      case "generated":
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            {status === "sent" ? "Envoyée" : "Générée"}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
            {status}
          </span>
        );
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

  if (!invoice) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Facture non trouvée</p>
          <button
            onClick={() => navigate("/admin/invoices")}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            Retour aux factures
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/admin/invoices")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour aux factures</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {invoice.invoice_number}
                </h1>
                <p className="text-slate-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Semaine {invoice.week_number}, {invoice.year}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>

        {/* Period & Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Période</span>
            </div>
            <p className="font-semibold text-slate-900">
              {new Date(invoice.period_start).toLocaleDateString("fr-FR")}
            </p>
            <p className="text-slate-600">au</p>
            <p className="font-semibold text-slate-900">
              {new Date(invoice.period_end).toLocaleDateString("fr-FR")}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Package className="w-5 h-5" />
              <span className="text-sm font-medium">Échanges Traités</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {invoice.total_exchanges_handled}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Banknote className="w-5 h-5" />
              <span className="text-sm font-medium">Montant Encaissé</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {invoice.total_amount_collected.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500">TND</p>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Détail Financier
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600">Total encaissé clients</span>
              <span className="font-semibold text-slate-900">
                {invoice.total_amount_collected.toFixed(2)} TND
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600">Frais de service (10%)</span>
              <span className="font-semibold text-red-600">
                -{invoice.total_fees.toFixed(2)} TND
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600">Commission SWAPP (5%)</span>
              <span className="font-semibold text-red-600">
                -{invoice.total_commissions.toFixed(2)} TND
              </span>
            </div>

            <div className="flex items-center justify-between py-4 bg-purple-50 rounded-lg px-4 -mx-4">
              <span className="font-semibold text-purple-900">Net à payer</span>
              <span className="text-2xl font-bold text-purple-700">
                {invoice.net_payable.toFixed(2)} TND
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={printInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>

            <button
              onClick={printInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Télécharger PDF
            </button>

            {invoice.status !== "paid" && (
              <>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-sky-300 text-sky-700 rounded-lg hover:bg-sky-50 transition-colors">
                  <Send className="w-5 h-5" />
                  Envoyer au partenaire
                </button>

                <button
                  onClick={markAsPaid}
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  {processing ? "Traitement..." : "Marquer comme payée"}
                </button>
              </>
            )}
          </div>

          {invoice.paid_at && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">
                <strong>Payée le:</strong>{" "}
                {new Date(invoice.paid_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {invoice.paid_amount && (
                <p className="text-sm text-emerald-700">
                  <strong>Montant reçu:</strong> {invoice.paid_amount.toFixed(2)} TND
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
