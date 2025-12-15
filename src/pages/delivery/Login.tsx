import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function DeliveryLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sign out any existing session when login page loads
  useEffect(() => {
    const signOutExisting = async () => {
      await supabase.auth.signOut();
    };
    signOutExisting();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting login with:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      console.log("Login response:", { data, error });

      if (error) throw error;

      if (data.user) {
        // Check if this email belongs to a merchant (forbidden)
        const { data: merchant } = await supabase
          .from("merchants")
          .select("id")
          .eq("email", data.user.email)
          .maybeSingle();

        if (merchant) {
          await supabase.auth.signOut();
          throw new Error(
            "Ce compte est un compte e-commerçant. Veuillez utiliser le portail e-commerçant.",
          );
        }

        // Verify the user is a delivery person by email
        const { data: deliveryPerson, error: dpError } = await supabase
          .from("delivery_persons")
          .select("*")
          .eq("email", data.user.email)
          .maybeSingle();

        if (dpError || !deliveryPerson) {
          await supabase.auth.signOut();
          throw new Error(
            "Compte livreur non trouvé. Veuillez utiliser le bon portail de connexion.",
          );
        }

        navigate("/delivery/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Erreur de connexion. Vérifiez vos identifiants.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("demo@livreur.com");
    setPassword("demo123456");
    setLoading(true);
    setError("");

    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: "demo@livreur.com",
        password: "demo123456",
      });

      if (error && error.message.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: "demo@livreur.com",
            password: "demo123456",
            options: {
              data: {
                name: "Livreur Demo",
                phone: "+216 70 000 001",
              },
            },
          });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from("delivery_persons").insert({
            id: signUpData.user.id,
            email: "demo@livreur.com",
            name: "Livreur Demo",
            phone: "+216 70 000 001",
          });

          navigate("/delivery/dashboard");
          return;
        }
      } else if (error) {
        throw error;
      }

      if (data?.user) {
        // Check if this email belongs to a merchant (forbidden)
        const { data: merchant } = await supabase
          .from("merchants")
          .select("id")
          .eq("email", data.user.email)
          .maybeSingle();

        if (merchant) {
          await supabase.auth.signOut();
          throw new Error("Ce compte est un compte e-commerçant.");
        }

        // Verify the user is a delivery person
        const { data: deliveryPerson } = await supabase
          .from("delivery_persons")
          .select("id")
          .eq("email", data.user.email)
          .maybeSingle();

        if (!deliveryPerson) {
          await supabase.auth.signOut();
          throw new Error("Compte livreur non trouvé.");
        }

        navigate("/delivery/dashboard");
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Erreur de connexion. Veuillez créer le compte via Supabase Dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </button>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <Truck className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Connexion Livreur
            </h1>
            <p className="text-slate-600">
              Accédez à votre espace de vérification
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">ou</span>
                </div>
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Connexion Demo
              </button>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800 font-medium mb-2">
                Compte de démonstration:
              </p>
              <p className="text-xs text-amber-700">
                Email: demo@livreur.com
                <br />
                Mot de passe: demo123456
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
