import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Store, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

export default function AdminMerchantForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      fetchMerchant();
    }
  }, [id]);

  const fetchMerchant = async () => {
    try {
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      }
    } catch (err) {
      console.error("Error fetching merchant:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEdit) {
        // Update existing merchant
        const { error } = await supabase
          .from("merchants")
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          })
          .eq("id", id);

        if (error) throw error;

        navigate(`/admin/merchant/${id}`);
      } else {
        // Create new merchant with auth account
        if (!formData.password || formData.password.length < 6) {
          setError("Le mot de passe doit contenir au moins 6 caractères");
          setLoading(false);
          return;
        }

        // Check if email already exists in delivery_persons (prevent role conflict)
        const { data: existingDelivery } = await supabase
          .from("delivery_persons")
          .select("id")
          .eq("email", formData.email)
          .maybeSingle();

        if (existingDelivery) {
          throw new Error(
            "Cet email est déjà utilisé par un compte livreur. Veuillez utiliser un autre email.",
          );
        }

        // First create merchant record (let DB generate ID)
        const { data, error } = await supabase
          .from("merchants")
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          })
          .select()
          .single();

        if (error) throw error;

        // Then create auth user (with email confirmation disabled)
        const { error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: undefined,
            data: {
              merchant_id: data.id,
              name: formData.name,
            },
          },
        });

        if (authError) {
          console.warn("Auth user creation failed:", authError);
          // Continue anyway - merchant is created
        }

        // Generate QR code after creation
        const qrCodeData = `SWAPP-${data.id.slice(0, 8).toUpperCase()}`;
        await supabase
          .from("merchants")
          .update({ qr_code_data: qrCodeData })
          .eq("id", data.id);

        navigate(`/admin/merchant/${data.id}`);
      }
    } catch (err: any) {
      console.error("Error saving merchant:", err);
      if (err.code === "23505") {
        setError("Un e-commerçant avec cet email existe déjà");
      } else if (err.code === "42703") {
        setError(
          "Erreur de base de données: colonne manquante. Veuillez ajouter la colonne qr_code_data.",
        );
      } else if (err.message) {
        setError(`Erreur: ${err.message}`);
      } else {
        setError("Erreur lors de la sauvegarde");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() =>
              navigate(isEdit ? `/admin/merchant/${id}` : "/admin/merchants")
            }
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEdit ? "Modifier l'e-commerçant" : "Nouvel e-commerçant"}
            </h1>
            <p className="text-slate-600">
              {isEdit
                ? "Modifiez les informations du compte"
                : "Créez un nouveau compte e-commerçant"}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <Store className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Informations du compte
                </h2>
                <p className="text-sm text-slate-500">
                  Renseignez les informations de l'e-commerçant
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Ma Boutique"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contact@maboutique.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+216 XX XXX XXX"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  required={!isEdit}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimum 6 caractères"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Ce mot de passe sera utilisé pour la connexion à l'espace
                  e-commerçant
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    isEdit ? `/admin/merchant/${id}` : "/admin/merchants",
                  )
                }
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEdit ? "Enregistrer" : "Créer"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
