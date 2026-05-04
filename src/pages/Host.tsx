import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, BadgeCheck, Building2, MessageCircle, Clock } from "lucide-react";
import { mapListingToRoom, enrichRoomsWithReviews } from "@/lib/listings";
import type { Room } from "@/data/mockData";

interface HostProfile { user_id: string; full_name: string | null; avatar_url: string | null; account_type: string; }

const Host = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      const { data: profRows } = await supabase.rpc("get_public_profile", { target_user_id: id });
      const prof = profRows && profRows.length > 0 ? profRows[0] : null;
      setProfile(prof);

      const { data: listingsData } = await supabase.from("listings").select("*").eq("user_id", id).order("created_at", { ascending: false });
      const mappedRooms = await enrichRoomsWithReviews((listingsData || []).map(mapListingToRoom));
      setRooms(mappedRooms);

      // Aggregate reviews for this host's rooms
      if (mappedRooms.length > 0) {
        const roomIds = mappedRooms.map(r => r.id);
        const { data: revs } = await supabase.from("reviews").select("rating").in("room_id", roomIds);
        if (revs && revs.length > 0) {
          const sum = revs.reduce((acc, r: any) => acc + (r.rating || 0), 0);
          setStats({ avgRating: Number((sum / revs.length).toFixed(1)), totalReviews: revs.length });
        }
      }

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="container-page py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("host.notFound")}</h1>
        <Link to="/buscar"><Button className="mt-4">{t("room.backToSearch")}</Button></Link>
      </div>
    );
  }

  const initials = (profile.full_name || "Host").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="container-page py-8">
      {/* Host header card */}
      <Card className="mb-8 overflow-hidden border-border">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10" />
        <CardContent className="-mt-12 pb-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end">
            <Avatar className="h-24 w-24 border-4 border-card shadow-elevated">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name || "Host"} />}
              <AvatarFallback className="bg-primary/10 text-primary font-heading text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{profile.full_name || t("host.anonymous")}</h1>
                <Badge className="gap-1 bg-primary/10 text-primary border-0 hover:bg-primary/15">
                  <BadgeCheck className="h-3.5 w-3.5" /> {t("room.verifiedHost")}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-medium text-foreground">{stats.avgRating || "—"}</span>
                  <span>({stats.totalReviews} {t("search.reviews")})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium text-foreground">{rooms.length}</span>
                  <span>{t("host.roomsListed")}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{t("host.responseTime")}: <span className="font-medium text-foreground">~1h</span></span>
                </span>
              </div>
            </div>

            <Button variant="outline" className="gap-2" asChild>
              <Link to="/contato">
                <MessageCircle className="h-4 w-4" /> {t("host.contact")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rooms grid */}
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">{t("host.publishedRooms")}</h2>
        <span className="text-sm text-muted-foreground">{rooms.length} {rooms.length === 1 ? t("host.roomSingular") : t("host.roomPlural")}</span>
      </div>

      {rooms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">{t("host.noRooms")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link key={room.id} to={`/quarto/${room.id}`} className="group">
              <Card className="overflow-hidden transition-all hover:shadow-elevated">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img src={room.image} alt={room.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {room.originalPrice && (
                    <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground border-0">
                      {Math.round((1 - room.price / room.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{room.title}</h3>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {room.rating}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {room.city}{room.state ? `, ${room.state}` : ""}
                  </p>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-heading text-lg font-bold text-foreground">{formatPrice(room.price)}</span>
                    <span className="text-xs text-muted-foreground">{t("room.perNight")}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Host;
