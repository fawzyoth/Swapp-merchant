import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MerchantSidebar from "./MerchantSidebar";
import { supabase } from "../lib/supabase";

interface MerchantLayoutProps {
  children: ReactNode;
}

export default function MerchantLayout({ children }: MerchantLayoutProps) {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMerchantAuth();
  }, []);

  const checkMerchantAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/merchant/login");
        return;
      }

      // Check if this is a delivery person (forbidden)
      const { data: deliveryPerson } = await supabase
        .from("delivery_persons")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (deliveryPerson) {
        // This is a delivery person, not allowed here
        await supabase.auth.signOut();
        navigate("/merchant/login");
        return;
      }

      // Verify user is a merchant by checking email
      const { data: merchant, error } = await supabase
        .from("merchants")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (error || !merchant) {
        // Not a merchant - redirect to login
        navigate("/merchant/login");
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/merchant/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MerchantSidebar />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
