import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Palette,
  Upload,
  Save,
  Building2,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import MerchantLayout from "../../components/MerchantLayout";

export default function BrandingSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [merchantId, setMerchantId] = useState<string>("");

  const [formData, setFormData] = useState({
    logo_base64: "",
    business_name: "",
    phone: "",
    business_address: "",
    business_city: "",
    business_postal_code: "",
  });

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

      const { data: merchant } = await supabase
        .from("merchants")
        .select("*")
        .eq("email", session.user.email)
        .maybeSingle();

      if (merchant) {
        setMerchantId(merchant.id);
        setFormData({
          logo_base64: merchant.logo_base64 || "",
          business_name: merchant.business_name || merchant.name || "",
          phone: merchant.phone || "",
          business_address: merchant.business_address || "",
          business_city: merchant.business_city || "",
          business_postal_code: merchant.business_postal_code || "",
        });
      }
    } catch (err) {
      console.error("Error fetching merchant data:", err);
      setError("Erreur lors du chargement des donnees");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      setError("L'image ne doit pas depasser 500 Ko");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        logo_base64: reader.result as string,
      }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo_base64: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("merchants")
        .update({
          logo_base64: formData.logo_base64 || null,
          business_name: formData.business_name || null,
          phone: formData.phone,
          business_address: formData.business_address || null,
          business_city: formData.business_city || null,
          business_postal_code: formData.business_postal_code || null,
        })
        .eq("id", merchantId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving branding:", err);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
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

  return (
    <MerchantLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Palette className="w-8 h-8 text-sky-600" />
            Parametres de Marque
          </h1>
          <p className="text-slate-600 mt-2">
            Personnalisez votre logo et vos informations de contact pour les
            bordereaux
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-800">
              Modifications enregistrees avec succes
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Logo Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-600" />
              Logo de l'entreprise
            </h2>

            <div className="flex items-start gap-6">
              <div className="w-32 h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                {formData.logo_base64 ? (
                  <img
                    src={formData.logo_base64}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-400" />
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Telecharger une image
                </label>

                {formData.logo_base64 && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="ml-3 inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}

                <p className="text-sm text-slate-500 mt-3">
                  Format recommande: PNG ou JPG, max 500 Ko
                </p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              Informations de l'entreprise
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom commercial
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      business_name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telephone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="+216 XX XXX XXX"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-600" />
              Adresse
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.business_address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      business_address: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Rue, numero, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.business_city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        business_city: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Tunis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.business_postal_code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        business_postal_code: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MerchantLayout>
  );
}
