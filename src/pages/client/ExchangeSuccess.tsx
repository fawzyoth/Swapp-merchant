import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Copy, Check, UserPlus, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function ExchangeSuccess() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const [copied, setCopied] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('emailRequired'));
      return;
    }

    if (!password) {
      setError(t('passwordRequired'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      // Get client info from localStorage
      const clientPhone = localStorage.getItem('lastClientPhone');

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'client',
            phone: clientPhone,
          },
          emailRedirectTo: undefined,
        },
      });

      if (authError) throw authError;

      // Create client record
      if (authData.user) {
        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            id: authData.user.id,
            email,
            phone: clientPhone,
          });

        if (clientError && !clientError.message.includes('duplicate')) {
          console.error('Client insert error:', clientError);
        }

        // Link exchanges to this client
        if (clientPhone) {
          await supabase
            .from('exchanges')
            .update({ client_id: authData.user.id })
            .eq('client_phone', clientPhone);
        }
      }

      setAccountCreated(true);
    } catch (err: any) {
      console.error('Account creation error:', err);
      setError(err.message || t('registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50" dir={dir}>
      <div className="container mx-auto px-4 py-8">
        {/* Language Switcher */}
        <div className="flex justify-end mb-6">
          <LanguageSwitcher />
        </div>

        <div className="max-w-md mx-auto">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center mb-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {t('requestSubmitted')}
            </h1>
            <p className="text-slate-600 mb-6">
              {t('requestSubmittedDescription')}
            </p>

            {/* Exchange Code */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-600 mb-2">{t('yourExchangeCode')}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-emerald-600">
                  {code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Copier"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">{t('saveThisCode')}</p>
            </div>

            <button
              onClick={() => navigate(`/client/tracking/${code}`)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {t('trackMyExchange')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Account Creation Section */}
          {!accountCreated ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              {!showAccountForm ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-6 h-6 text-sky-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">
                    {t('createAccountTitle')}
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
                    {t('createAccountPrompt')}
                  </p>
                  <button
                    onClick={() => setShowAccountForm(true)}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {t('createAccount')}
                  </button>
                  <button
                    onClick={() => navigate(`/client/tracking/${code}`)}
                    className="w-full mt-3 py-2 text-slate-600 hover:text-slate-900 text-sm transition-colors"
                  >
                    {t('skipForNow')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900 text-center mb-4">
                    {t('createAccountTitle')}
                  </h2>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t('password')} *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t('confirmPassword')} *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      dir="ltr"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? t('loading') : t('createAccount')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAccountForm(false)}
                    className="w-full py-2 text-slate-600 hover:text-slate-900 text-sm transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-emerald-900 mb-2">
                {t('accountCreated')}
              </h2>
              <button
                onClick={() => navigate('/client/exchanges')}
                className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('myExchanges')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
