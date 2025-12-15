import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeliverySidebar from "./DeliverySidebar";
import { supabase } from "../lib/supabase";

interface DeliveryLayoutProps {
  children: ReactNode;
}

export default function DeliveryLayout({ children }: DeliveryLayoutProps) {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDeliveryAuth();
  }, []);

  const checkDeliveryAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/delivery/login");
        return;
      }

      // Check if this is a merchant (forbidden)
      const { data: merchant } = await supabase
        .from("merchants")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (merchant) {
        // This is a merchant, not allowed here
        await supabase.auth.signOut();
        navigate("/delivery/login");
        return;
      }

      // Verify user is a delivery person by checking email
      const { data: deliveryPerson, error } = await supabase
        .from("delivery_persons")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (error || !deliveryPerson) {
        // Not a delivery person - redirect to login
        navigate("/delivery/login");
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/delivery/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DeliverySidebar />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
