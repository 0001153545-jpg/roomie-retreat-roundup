import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

interface Listing {
  id: string; title: string; city: string; state: string; type: string; price: number; guests: number; image_url: string; created_at: string;
}

const MyRooms = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) navigate("/login"); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setListings((data || []) as Listing[]); setFetching(false); });
  }, [user]);

  if (loading || fetching) return <div className="container-page flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">{t("reservations.loading")}</p></div>;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">{t("advertise.myRooms")}</h1>
      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("advertise.noRooms")}</p>
          <Link to="/anunciar"><Button>{t("advertise.startNow")}</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              {l.image_url && <img src={l.image_url} alt={l.title} className="h-20 w-32 rounded-lg object-cover" />}
              <div className="flex-1">
                <h3 className="font-heading text-base font-semibold text-foreground">{l.title}</h3>
                <p className="text-sm text-muted-foreground">{l.city}, {l.state} · {l.type}</p>
                <p className="text-sm font-medium text-foreground">{formatPrice(l.price)} {t("room.perNight")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRooms;
