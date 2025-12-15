import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Store,
  Package,
  QrCode,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

export default function AdminMerchantList() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [merchantsRes, exchangesRes] = await Promise.all([
        // Only select fields needed for display - NO logo_base64
        supabase
          .from("merchants")
          .select("id, name, email, phone, qr_code_data, created_at")
          .order("created_at", { ascending: false }),
        // Only select fields needed for stats - NO video, NO images
        supabase.from("exchanges").select("merchant_id, status"),
      ]);

      setMerchants(merchantsRes.data || []);
      setExchanges(exchangesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (merchantId: string) => {
    try {
      await supabase.from("merchants").delete().eq("id", merchantId);
      setMerchants(merchants.filter((m) => m.id !== merchantId));
      setDeleteModal(null);
    } catch (error) {
      console.error("Error deleting merchant:", error);
    }
  };

  const getMerchantStats = (merchantId: string) => {
    const merchantExchanges = exchanges.filter(
      (e) => e.merchant_id === merchantId,
    );
    return {
      total: merchantExchanges.length,
      pending: merchantExchanges.filter((e) => e.status === "pending").length,
      validated: merchantExchanges.filter((e) =>
        ["validated", "preparing", "in_transit", "completed"].includes(
          e.status,
        ),
      ).length,
      rejected: merchantExchanges.filter((e) => e.status === "rejected").length,
    };
  };

  const filteredMerchants = merchants.filter(
    (merchant) =>
      merchant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              E-Commerçants
            </h1>
            <p className="text-slate-600">Gérez les comptes e-commerçants</p>
          </div>
          <Link
            to="/admin/merchant/new"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un e-commerçant
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Merchants List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                    E-Commerçant
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">
                    Contact
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    Échanges
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-900">
                    QR Code
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMerchants.map((merchant) => {
                  const stats = getMerchantStats(merchant.id);
                  return (
                    <tr
                      key={merchant.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Store className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {merchant.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              Inscrit le{" "}
                              {new Date(merchant.created_at).toLocaleDateString(
                                "fr-FR",
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900">{merchant.email}</p>
                        <p className="text-sm text-slate-500">
                          {merchant.phone || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {stats.total}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          <span className="text-emerald-600">
                            {stats.validated} validés
                          </span>
                          {stats.rejected > 0 && (
                            <span className="text-red-600 ml-2">
                              {stats.rejected} rejetés
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {merchant.qr_code_data ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                            <QrCode className="w-3 h-3" />
                            Généré
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                            <QrCode className="w-3 h-3" />
                            Non généré
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/merchant/${merchant.id}`}
                            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <Link
                            to={`/admin/merchant/${merchant.id}/edit`}
                            className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal(merchant.id)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMerchants.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun e-commerçant trouvé</p>
              <Link
                to="/admin/merchant/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-purple-600 hover:text-purple-700"
              >
                <Plus className="w-5 h-5" />
                Ajouter un e-commerçant
              </Link>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer cet e-commerçant ? Cette
                action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteModal)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
