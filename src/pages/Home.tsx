import { Link } from "react-router-dom";
import { Package, Store, Shield, Truck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Plateforme d'Échange
          </h1>
          <p className="text-xl text-slate-600">
            Gérez vos échanges de produits facilement et rapidement
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <Link
            to="/client/scan"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 border-2 border-transparent hover:border-emerald-500"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-xl mb-6 group-hover:bg-emerald-500 transition-colors">
              <Package className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Espace Client
            </h2>
            <p className="text-slate-600 mb-4">
              Scanner votre QR code pour effectuer un échange
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>• Scanner le code QR du colis</li>
              <li>• Soumettre une demande d'échange</li>
              <li>• Suivre votre échange en temps réel</li>
              <li>• Communiquer avec le commerçant</li>
            </ul>
          </Link>

          <Link
            to="/merchant/login"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 border-2 border-transparent hover:border-sky-500"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-sky-100 rounded-xl mb-6 group-hover:bg-sky-500 transition-colors">
              <Store className="w-8 h-8 text-sky-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Espace E-Commerçant
            </h2>
            <p className="text-slate-600 mb-4">
              Gérer et valider les demandes d'échange
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>• Tableau de bord avec statistiques</li>
              <li>• Validation et rejet des échanges</li>
              <li>• Gestion des transporteurs et dépôts</li>
              <li>• Génération de bordereaux</li>
            </ul>
          </Link>

          <Link
            to="/delivery/login"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 border-2 border-transparent hover:border-amber-500"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-xl mb-6 group-hover:bg-amber-500 transition-colors">
              <Truck className="w-8 h-8 text-amber-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Espace Livreur
            </h2>
            <p className="text-slate-600 mb-4">
              Vérifier et valider les échanges à la livraison
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>• Scanner le bordereau</li>
              <li>• Visionner la vidéo de référence</li>
              <li>• Accepter ou refuser l'échange</li>
              <li>• Scanner le sac de collecte</li>
            </ul>
          </Link>

          <Link
            to="/admin/dashboard"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl mb-6 group-hover:bg-purple-500 transition-colors">
              <Shield className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Espace Admin
            </h2>
            <p className="text-slate-600 mb-4">
              Gérer les e-commerçants et leurs statistiques
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>• Liste des e-commerçants</li>
              <li>• Génération de QR codes uniques</li>
              <li>• Statistiques par commerçant</li>
              <li>• Gestion des comptes</li>
            </ul>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            Plateforme MVP - Simplifiez la gestion de vos échanges de produits
          </p>
        </div>
      </div>
    </div>
  );
}
