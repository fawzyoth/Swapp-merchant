import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase, STATUS_LABELS } from '../../lib/supabase';

export default function ClientExchangeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exchange, setExchange] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExchangeDetails();
  }, [id]);

  const fetchExchangeDetails = async () => {
    try {
      const { data: exchangeData } = await supabase
        .from('exchanges')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (exchangeData) {
        setExchange(exchangeData);

        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('exchange_id', id)
          .order('created_at', { ascending: true });

        setMessages(messagesData || []);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await supabase.from('messages').insert({
        exchange_id: id,
        sender_type: 'client',
        message: newMessage,
      });

      setNewMessage('');
      fetchExchangeDetails();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Échange non trouvé</h2>
          <button
            onClick={() => navigate('/client/exchanges')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retour aux échanges
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/client/exchanges')}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux échanges
        </button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Détails de l'échange
            </h1>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Code:</span>
                <p className="font-medium text-slate-900">{exchange.exchange_code}</p>
              </div>
              <div>
                <span className="text-slate-600">Statut:</span>
                <p className="font-medium text-slate-900">{STATUS_LABELS[exchange.status]}</p>
              </div>
              <div>
                <span className="text-slate-600">Client:</span>
                <p className="font-medium text-slate-900">{exchange.client_name}</p>
              </div>
              <div>
                <span className="text-slate-600">Raison:</span>
                <p className="font-medium text-slate-900">{exchange.reason}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Messages</h2>
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Aucun message</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.sender_type === 'client'
                        ? 'bg-emerald-50 ml-auto max-w-md'
                        : 'bg-slate-100 mr-auto max-w-md'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      {msg.sender_type === 'client' ? 'Vous' : 'Commerçant'}
                    </p>
                    <p className="text-slate-700">{msg.message}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(msg.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Votre message..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
