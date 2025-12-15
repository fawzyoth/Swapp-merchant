import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  Filter,
} from "lucide-react";
import { supabase, WeeklyInvoice } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

export default function InvoiceList() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<WeeklyInvoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(getISOWeek(new Date()));

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      let query = supabase
        .from("weekly_invoices")
        .select("*")
        .order("year", { ascending: false })
        .order("week_number", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    setGenerating(true);
    try {
      // Check if invoice already exists for this week
      const { data: existing } = await supabase
        .from("weekly_invoices")
        .select("id")
        .eq("year", selectedYear)
        .eq("week_number", selectedWeek)
        .maybeSingle();

      if (existing) {
        alert("Une facture existe déjà pour cette semaine");
        return;
      }

      // Calculate week dates
      const periodStart = getWeekStart(selectedYear, selectedWeek);
      const periodEnd = getWeekEnd(selectedYear, selectedWeek);

      // Fetch exchanges with collections in this period
      const { data: verifications } = await supabase
        .from("delivery_verifications")
        .select(`
          id,
          amount_collected,
          delivery_person_id,
          created_at,
          exchanges:exchange_id (
            id,
            exchange_code,
            merchant_id
          )
        `)
        .eq("payment_collected", true)
        .gt("amount_collected", 0)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());

      const totalCollected = verifications?.reduce(
        (sum, v) => sum + (v.amount_collected || 0),
        0
      ) || 0;

      // Calculate fees (10% example)
      const totalFees = totalCollected * 0.1;
      const totalCommissions = totalCollected * 0.05;
      const netPayable = totalCollected - totalFees - totalCommissions;

      // Generate invoice number
      const invoiceNumber = `INV-${selectedYear}-W${selectedWeek.toString().padStart(2, "0")}-001`;

      // Create invoice
      const { data: newInvoice, error } = await supabase
        .from("weekly_invoices")
        .insert({
          invoice_number: invoiceNumber,
          week_number: selectedWeek,
          year: selectedYear,
          period_start: periodStart.toISOString().split("T")[0],
          period_end: periodEnd.toISOString().split("T")[0],
          total_exchanges_handled: verifications?.length || 0,
          total_amount_collected: totalCollected,
          total_fees: totalFees,
          total_commissions: totalCommissions,
          net_payable: netPayable,
          status: "generated",
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create financial transaction for invoice
      await supabase.from("financial_transactions").insert({
        invoice_id: newInvoice.id,
        transaction_type: "invoice_generated",
        amount: netPayable,
        currency: "TND",
        direction: "debit",
        status: "completed",
        description: `Facture ${invoiceNumber} générée`,
      });

      setShowGenerateModal(false);
      fetchInvoices();
      alert("Facture générée avec succès");
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Erreur lors de la génération de la facture");
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Payée
          </span>
        );
      case "generated":
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            {status === "sent" ? "Envoyée" : "Générée"}
          </span>
        );
      case "disputed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Contestée
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
            Brouillon
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
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

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Factures</h1>
            <p className="text-slate-600">Gestion des factures hebdomadaires</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Générer une Facture
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="generated">Générée</option>
              <option value="sent">Envoyée</option>
              <option value="paid">Payée</option>
              <option value="disputed">Contestée</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                    Facture
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                    Période
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    Échanges
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                    Montant
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    Statut
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-sm text-slate-500">
                            Semaine {invoice.week_number}, {invoice.year}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(invoice.period_start).toLocaleDateString("fr-FR")} -{" "}
                        {new Date(invoice.period_end).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-900">
                        {invoice.total_exchanges_handled}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-slate-900">
                        {invoice.net_payable.toFixed(2)} TND
                      </p>
                      <p className="text-xs text-slate-500">
                        Collecté: {invoice.total_amount_collected.toFixed(2)} TND
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/invoices/${invoice.id}`}
                          className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Télécharger PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucune facture trouvée</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-purple-600 hover:text-purple-700"
              >
                <Plus className="w-5 h-5" />
                Générer une facture
              </button>
            </div>
          )}
        </div>

        {/* Generate Invoice Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Générer une Facture
                    </h3>
                    <p className="text-sm text-slate-600">
                      Sélectionnez la semaine à facturer
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Année
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {[2024, 2025, 2026].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Semaine
                    </label>
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                        <option key={week} value={week}>
                          Semaine {week}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-600">
                    La facture inclura tous les encaissements effectués durant la semaine{" "}
                    {selectedWeek} de {selectedYear}.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    disabled={generating}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={generateInvoice}
                    disabled={generating}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {generating ? "Génération..." : "Générer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Helper functions
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekStart(year: number, week: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const weekStart = simple;
  if (dow <= 4) {
    weekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    weekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return weekStart;
}

function getWeekEnd(year: number, week: number): Date {
  const start = getWeekStart(year, week);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
