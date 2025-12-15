import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, KeyRound, ArrowLeft, Camera, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import DeliveryLayout from "../../components/DeliveryLayout";

export default function BordereauScanner() {
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!useManualEntry) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [useManualEntry]);

  const startCamera = async () => {
    setCameraError("");
    setIsScanning(false);

    try {
      // Clean up any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }

      scannerRef.current = new Html5Qrcode("qr-reader", { verbose: false });

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        () => {}, // Silent error for continuous scanning
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(
        err.message?.includes("Permission")
          ? "Permission caméra refusée. Veuillez autoriser l'accès à la caméra."
          : "Impossible d'accéder à la caméra. Utilisez l'entrée manuelle.",
      );
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (e) {
        // Ignore errors when stopping
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanning immediately to prevent multiple scans
    await stopCamera();
    validateAndNavigate(decodedText);
  };

  const validateAndNavigate = async (scannedData: string) => {
    setLoading(true);
    setError("");

    try {
      // The scanned data could be:
      // 1. A direct exchange code (e.g., EXC-1234567890-ABC)
      // 2. A bordereau code (e.g., BDX-XXXXXX-XXXX)
      // 3. A URL containing the exchange code or bordereau code
      // 4. JSON with exchange_code field

      let code = scannedData;
      let isBordereauCode = false;

      // Check if it's a URL
      if (scannedData.includes("http")) {
        try {
          const url = new URL(scannedData);
          // Check for exchange code in URL path (/verify/EXC-...)
          if (scannedData.includes("/verify/")) {
            const pathParts = url.hash
              ? url.hash.split("/verify/")
              : url.pathname.split("/verify/");
            if (pathParts[1]) {
              code = pathParts[1].split("?")[0].split("/")[0];
            }
          }
          // Check for bordereau code in URL params (?bordereau=BDX-...)
          else if (scannedData.includes("bordereau=")) {
            const bordereauParam = url.hash
              ? new URLSearchParams(url.hash.split("?")[1]).get("bordereau")
              : url.searchParams.get("bordereau");
            if (bordereauParam) {
              code = bordereauParam;
              isBordereauCode = true;
            }
          }
          // Check for exchange_code param
          else if (scannedData.includes("exchange_code=")) {
            const exchangeParam = url.hash
              ? new URLSearchParams(url.hash.split("?")[1]).get("exchange_code")
              : url.searchParams.get("exchange_code");
            if (exchangeParam) {
              code = exchangeParam;
            }
          }
        } catch {
          // Not a valid URL, continue with the raw string
        }
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(scannedData);
        if (parsed.exchange_code) {
          code = parsed.exchange_code;
        } else if (parsed.bordereau_code) {
          code = parsed.bordereau_code;
          isBordereauCode = true;
        }
      } catch {
        // Not JSON, continue with the raw string
      }

      // Clean the code
      code = code.trim().toUpperCase();

      // Detect if it's a bordereau code by prefix
      if (code.startsWith("BDX-")) {
        isBordereauCode = true;
      }

      let exchangeCode = code;

      // If it's a bordereau code, look up the associated exchange
      if (isBordereauCode) {
        const { data: bordereau, error: bordereauError } = await supabase
          .from("merchant_bordereaux")
          .select("exchange_id")
          .eq("bordereau_code", code)
          .maybeSingle();

        if (bordereauError) throw bordereauError;

        if (!bordereau || !bordereau.exchange_id) {
          setError(
            "Ce bordereau n'est pas encore associé à un échange. Le client doit d'abord scanner le QR code pour créer l'échange.",
          );
          return;
        }

        // Get the exchange code from the exchange
        const { data: exchangeData, error: exchangeError } = await supabase
          .from("exchanges")
          .select("exchange_code")
          .eq("id", bordereau.exchange_id)
          .maybeSingle();

        if (exchangeError) throw exchangeError;

        if (!exchangeData) {
          setError("Échange non trouvé pour ce bordereau.");
          return;
        }

        exchangeCode = exchangeData.exchange_code;
      }

      // Validate the exchange exists and is in a verifiable state
      const { data: exchange, error: fetchError } = await supabase
        .from("exchanges")
        .select("*")
        .eq("exchange_code", exchangeCode)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!exchange) {
        setError("Code d'échange non trouvé. Vérifiez le bordereau.");
        return;
      }

      // Check if exchange is in a valid state for verification
      const validStatuses = ["validated", "preparing", "in_transit"];
      if (!validStatuses.includes(exchange.status)) {
        if (exchange.status === "pending") {
          setError("Cet échange n'a pas encore été validé par le commerçant.");
        } else if (
          exchange.status === "delivery_verified" ||
          exchange.status === "completed"
        ) {
          setError("Cet échange a déjà été vérifié.");
        } else if (
          exchange.status === "rejected" ||
          exchange.status === "delivery_rejected"
        ) {
          setError("Cet échange a été refusé.");
        } else {
          setError(
            "Cet échange n'est pas dans un état permettant la vérification.",
          );
        }
        return;
      }

      // Navigate to verification page
      navigate(`/delivery/verify/${exchangeCode}`);
    } catch (err: any) {
      console.error("Error validating exchange code:", err);
      setError("Erreur lors de la validation du code. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      validateAndNavigate(manualCode.trim());
    }
  };

  return (
    <DeliveryLayout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/delivery/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au dashboard
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <ScanLine className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Scanner le Bordereau
          </h1>
          <p className="text-slate-600">
            Scannez le QR code du bordereau pour accéder aux détails de
            l'échange
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
              Vérification en cours...
            </div>
          )}

          {!useManualEntry ? (
            <div>
              {cameraError ? (
                <div className="mb-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-5 h-5" />
                      <span className="font-medium">Erreur caméra</span>
                    </div>
                    <p className="text-sm">{cameraError}</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors mb-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Réessayer
                  </button>
                </div>
              ) : (
                <div className="relative mb-4">
                  <div
                    id="qr-reader"
                    className="rounded-lg overflow-hidden"
                  ></div>
                  {isScanning && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Caméra active - Scannez le QR code
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  stopCamera();
                  setUseManualEntry(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <KeyRound className="w-5 h-5" />
                Entrer le code manuellement
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Code d'échange
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="EXC-XXXXXXXXXX-XXX"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                />
              </div>
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? "Vérification..." : "Rechercher l'échange"}
                </button>
                <button
                  type="button"
                  onClick={() => setUseManualEntry(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Retour au scanner
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              Scannez le QR code imprimé sur le bordereau d'échange pour accéder
              à l'historique du client et vérifier le produit.
            </p>
          </div>
        </div>
      </div>
    </DeliveryLayout>
  );
}
