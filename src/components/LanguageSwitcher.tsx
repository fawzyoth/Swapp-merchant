import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-500" />
      <button
        onClick={() => setLang('fr')}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          lang === 'fr'
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLang('ar')}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          lang === 'ar'
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        عربي
      </button>
    </div>
  );
}
