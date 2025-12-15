import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  TestTube,
  MessageSquare,
  LogOut,
  Store,
  Menu,
  X,
  Printer,
  Palette,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const menuItems = [
  { path: "/merchant/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/merchant/exchanges", icon: Package, label: "Échanges" },
  { path: "/merchant/clients", icon: Users, label: "Clients" },
  {
    path: "/merchant/print-bordereau",
    icon: Printer,
    label: "Imprimer Bordereaux",
  },
  { path: "/merchant/branding", icon: Palette, label: "Ma Marque" },
  { path: "/merchant/chat", icon: MessageSquare, label: "Messagerie" },
  { path: "/merchant/simulation", icon: TestTube, label: "Simulation" },
];

export default function MerchantSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/merchant/login");
  };

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">E-Commerçant</h2>
                <p className="text-xs text-slate-500">Espace Pro</p>
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
                          ? "bg-sky-50 text-sky-600"
                          : "text-slate-600 hover:bg-slate-50"
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
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
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
