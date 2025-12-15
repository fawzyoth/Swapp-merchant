import { Link, useLocation } from 'react-router-dom';
import {
  ScanLine,
  List,
  Home,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/client/scan', icon: ScanLine, label: 'Scanner QR Code' },
  { path: '/client/exchanges', icon: List, label: 'Mes Échanges' },
  { path: '/client/chat', icon: MessageSquare, label: 'Messagerie' },
];

export default function ClientSidebar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ScanLine className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Client</h2>
                <p className="text-xs text-slate-500">Espace Échange</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-200">
            <div className="px-4 py-3 bg-emerald-50 rounded-lg">
              <p className="text-xs text-emerald-700">
                Besoin d'aide? Contactez votre commerçant via la messagerie dans le suivi de votre échange.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
