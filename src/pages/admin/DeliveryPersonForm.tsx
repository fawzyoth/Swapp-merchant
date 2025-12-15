import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Truck, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

export default function DeliveryPersonForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing) {
      fetchDeliveryPerson();
    }
  }, [id]);

  const fetchDeliveryPerson = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_persons")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: "",
        });
      }
    } catch (error) {
      console.error("Error fetching delivery person:", error);
      navigate("/admin/delivery-persons");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEditing) {
        // Update existing delivery person
        const { error: updateError } = await supabase
          .from("delivery_persons")
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          })
          .eq("id", id);

        if (updateError) throw updateError;
      } else {
        // Check if email already exists in delivery_persons
        const { data: existingPerson } = await supabase
          .from("delivery_persons")
          .select("id")
          .eq("email", formData.email)
          .maybeSingle();

        if (existingPerson) {
          throw new Error("Un livreur avec cet email existe déjà");
        }

        // Check if email already exists in merchants (prevent role conflict)
        const { data: existingMerchant } = await supabase
          .from("merchants")
          .select("id")
          .eq("email", formData.email)
          .maybeSingle();

        if (existingMerchant) {
          throw new Error(
            "Cet email est déjà utilisé par un compte e-commerçant. Veuillez utiliser un autre email.",
          );
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                name: formData.name,
                phone: formData.phone,
                role: "delivery_person",
              },
            },
          },
        );

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error("Erreur lors de la création du compte");
        }

        // Create delivery person record
        const { error: insertError } = await supabase
          .from("delivery_persons")
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
          });

        if (insertError) throw insertError;
      }

      navigate("/admin/delivery-persons");
    } catch (err: any) {
      console.error("Error saving delivery person:", err);
      setError(err.message || "Erreur lors de l'enregistrement");
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
        <button
          onClick={() => navigate("/admin/delivery-persons")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux livreurs
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEditing ? "Modifier le livreur" : "Ajouter un livreur"}
              </h1>
              <p className="text-slate-600">
                {isEditing
                  ? "Modifiez les informations du livreur"
                  : "Créez un nouveau compte livreur"}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nom du livreur"
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
                placeholder="email@exemple.com"
                disabled={isEditing}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              {isEditing && (
                <p className="text-sm text-slate-500 mt-1">
                  L'email ne peut pas être modifié
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Téléphone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+216 XX XXX XXX"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimum 6 caractères"
                  minLength={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/admin/delivery-persons")}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading
                  ? "Enregistrement..."
                  : isEditing
                    ? "Enregistrer"
                    : "Créer le livreur"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
