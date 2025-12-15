import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Package, Clock, CheckCircle, XCircle, QrCode, Download, Edit, TrendingUp, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

export default function AdminMerchantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [merchant, setMerchant] = useState<any>(null);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [merchantRes, exchangesRes] = await Promise.all([
        supabase.from('merchants').select('*').eq('id', id).single(),
        supabase.from('exchanges').select('*').eq('merchant_id', id).order('created_at', { ascending: false })
      ]);

      if (merchantRes.data) {
        // Generate QR code data if not exists
        if (!merchantRes.data.qr_code_data) {
          const qrData = `SWAPP-${merchantRes.data.id.slice(0, 8).toUpperCase()}`;
          await supabase
            .from('merchants')
            .update({ qr_code_data: qrData })
            .eq('id', id);
          merchantRes.data.qr_code_data = qrData;
        }
        setMerchant(merchantRes.data);
      }
      setExchanges(exchangesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const generateNewQRCode = async () => {
    const qrData = `SWAPP-${merchant.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    await supabase
      .from('merchants')
      .update({ qr_code_data: qrData })
      .eq('id', id);
    setMerchant({ ...merchant, qr_code_data: qrData });
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${merchant.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const stats = {
    total: exchanges.length,
    pending: exchanges.filter(e => e.status === 'pending').length,
    validated: exchanges.filter(e => ['validated', 'preparing', 'in_transit', 'completed'].includes(e.status)).length,
    rejected: exchanges.filter(e => e.status === 'rejected').length,
    completed: exchanges.filter(e => e.status === 'completed').length,
    uniqueClients: [...new Set(exchanges.map(e => e.client_phone))].length,
  };

  const validationRate = stats.total > 0
    ? Math.round((stats.validated / stats.total) * 100)
    : 0;

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      validated: 'bg-sky-100 text-sky-700',
      preparing: 'bg-purple-100 text-purple-700',
      in_transit: 'bg-indigo-100 text-indigo-700',
      completed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      returned: 'bg-slate-100 text-slate-700',
    };
    const labels: Record<string, string> = {
      pending: 'En attente',
      validated: 'Validé',
      preparing: 'Préparation',
      in_transit: 'En route',
      completed: 'Complété',
      rejected: 'Rejeté',
      returned: 'Retourné',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {labels[status] || status}
      </span>
    );
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

  if (!merchant) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">E-commerçant non trouvé</p>
          <Link to="/admin/merchants" className="text-purple-600 hover:text-purple-700 mt-2 inline-block">
            Retour à la liste
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/merchants')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{merchant.name}</h1>
            <p className="text-slate-600">{merchant.email}</p>
          </div>
          <Link
            to={`/admin/merchant/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Info & QR Code */}
          <div className="space-y-6">
            {/* Merchant Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Store className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{merchant.name}</h2>
                  <p className="text-slate-500">{merchant.phone || 'Pas de téléphone'}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-900">{merchant.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inscrit le</span>
                  <span className="text-slate-900">
                    {new Date(merchant.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">QR Code</h3>
                <QrCode className="w-5 h-5 text-purple-600" />
              </div>

              <div ref={qrRef} className="flex justify-center mb-4 p-4 bg-white rounded-lg border border-slate-200">
                <QRCodeSVG
                  value={`https://swapp-test-app.netlify.app/client/exchange/new?merchant=${merchant.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-center text-sm text-slate-500 mb-4 font-mono">
                {merchant.qr_code_data}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
                <button
                  onClick={generateNewQRCode}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Regénérer
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Exchanges */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-sky-600" />
                  <span className="text-sm text-slate-600">Total</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-slate-600">En attente</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-slate-600">Validés</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.validated}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-slate-600">Rejetés</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm text-slate-600">Taux de validation</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{validationRate}%</p>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${validationRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-sky-600" />
                    <span className="text-sm text-slate-600">Taux de complétion</span>
                  </div>
                  <p className="text-3xl font-bold text-sky-600">{completionRate}%</p>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-slate-600">Clients uniques</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{stats.uniqueClients}</p>
                </div>
              </div>
            </div>

            {/* Recent Exchanges */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Échanges récents</h3>
              </div>

              {exchanges.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {exchanges.slice(0, 10).map((exchange) => (
                    <div key={exchange.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{exchange.client_name}</p>
                          <p className="text-sm text-slate-500">{exchange.product_name || exchange.reason}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(exchange.status)}
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(exchange.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Aucun échange pour ce commerçant
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
