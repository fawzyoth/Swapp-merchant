import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanLine, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function ClientScanner() {
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, dir, lang } = useLanguage();

  useEffect(() => {
    if (!useManualEntry) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(onScanSuccess, onScanError);

      return () => {
        scanner.clear();
      };
    }
  }, [useManualEntry]);

  const onScanSuccess = (decodedText: string) => {
    validateAndNavigate(decodedText);
  };

  const onScanError = () => {
  };

  const validateAndNavigate = async (scannedData: string) => {
    setLoading(true);
    setError('');

    try {
      // Check if it's a direct URL
      if (scannedData.includes('/client/exchange/new?merchant=')) {
        const url = new URL(scannedData);
        const merchantId = url.searchParams.get('merchant');
        if (merchantId) {
          navigate(`/client/exchange/new?merchant=${merchantId}`);
          return;
        }
      }

      // Try to parse as JSON (new format with merchant info)
      let merchantId: string | null = null;
      let qrCode: string | null = null;

      try {
        const parsed = JSON.parse(scannedData);
        merchantId = parsed.merchant_id;
        qrCode = parsed.code;
      } catch {
        // If not JSON, treat as QR code string (e.g., SWAPP-XXXXXXXX)
        qrCode = scannedData;
      }

      // Look up merchant by QR code or ID
      let query = supabase.from('merchants').select('*');

      if (merchantId) {
        query = query.eq('id', merchantId);
      } else if (qrCode) {
        query = query.eq('qr_code_data', qrCode);
      }

      const { data: merchant, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;

      if (merchant) {
        // Navigate to exchange form with merchant ID
        navigate(`/client/exchange/new?merchant=${merchant.id}`);
      } else {
        setError(t('invalidQRCode'));
      }
    } catch (err) {
      console.error('Error validating QR code:', err);
      setError(t('invalidQRCode'));
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50" dir={dir}>
      <div className="container mx-auto px-4 py-8">
        {/* Language Switcher */}
        <div className="flex justify-end mb-6">
          <LanguageSwitcher />
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <ScanLine className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {t('scanQRCode')}
            </h1>
            <p className="text-slate-600">
              {t('scanDescription')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {loading && (
              <div className="mb-4 p-4 bg-sky-50 border border-sky-200 rounded-lg text-sky-700 flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600"></div>
                {t('loading')}
              </div>
            )}

            {!useManualEntry ? (
              <div>
                <div id="qr-reader" className="mb-4"></div>
                <button
                  onClick={() => setUseManualEntry(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <KeyRound className="w-5 h-5" />
                  {lang === 'ar' ? 'إدخال الرمز يدوياً' : 'Entrer le code manuellement'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {lang === 'ar' ? 'رمز التاجر' : 'Code du commerçant'}
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="SWAPP-XXXXXXXX"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? t('loading') : (lang === 'ar' ? 'التحقق من الرمز' : 'Valider le code')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseManualEntry(false)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    {lang === 'ar' ? 'العودة للماسح' : 'Retour au scanner'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-800">
                {lang === 'ar'
                  ? 'امسح رمز QR المقدم من التاجر لتقديم طلب تبديل المنتج.'
                  : 'Scannez le QR code fourni par votre commerçant pour soumettre une demande d\'échange de produit.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
