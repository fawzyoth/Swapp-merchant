import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Search, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MerchantLayout from '../../components/MerchantLayout';

export default function MerchantChat() {
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchExchanges();
  }, []);

  useEffect(() => {
    if (selectedExchange) {
      fetchMessages(selectedExchange.id);
    }
  }, [selectedExchange]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/merchant/login');
    }
  };

  const fetchExchanges = async () => {
    try {
      const { data } = await supabase
        .from('exchanges')
        .select('*, messages(count)')
        .order('created_at', { ascending: false });

      if (data) {
        setExchanges(data);
        if (data.length > 0 && !selectedExchange) {
          setSelectedExchange(data[0]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (exchangeId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('exchange_id', exchangeId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedExchange) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          exchange_id: selectedExchange.id,
          sender_type: 'merchant',
          message: newMessage,
        });

      if (!error) {
        setNewMessage('');
        fetchMessages(selectedExchange.id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredExchanges = exchanges.filter(ex =>
    ex.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.exchange_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.client_phone.includes(searchTerm)
  );

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <MerchantLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600">Chargement...</div>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messagerie</h1>
        <p className="text-slate-600 mt-1">Communiquez avec vos clients</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[calc(100vh-200px)] flex overflow-hidden">
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un échange..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredExchanges.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Aucune conversation</p>
              </div>
            ) : (
              filteredExchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  onClick={() => setSelectedExchange(exchange)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${
                    selectedExchange?.id === exchange.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-slate-900">{exchange.client_name}</h3>
                    <span className="text-xs text-slate-500">
                      {formatDate(exchange.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{exchange.exchange_code}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      exchange.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      exchange.status === 'validated' ? 'bg-green-100 text-green-800' :
                      exchange.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {exchange.status}
                    </span>
                    {exchange.messages?.[0]?.count > 0 && (
                      <span className="text-xs text-slate-500">
                        {exchange.messages[0].count} message(s)
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedExchange ? (
            <>
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-bold text-slate-900">{selectedExchange.client_name}</h2>
                <p className="text-sm text-slate-600">{selectedExchange.exchange_code}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">Aucun message</p>
                    <p className="text-sm">Démarrez la conversation avec votre client</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'merchant' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${
                        msg.sender_type === 'merchant'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-900'
                      } rounded-2xl px-4 py-2`}>
                        <p className="text-sm">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          msg.sender_type === 'merchant' ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg">Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MerchantLayout>
  );
}
