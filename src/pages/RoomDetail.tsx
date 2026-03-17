import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { rooms, reviews as mockReviews } from "@/data/mockData";
import { Star, MapPin, Users, Heart, Share2, ChevronLeft, Wifi, Wind, Car, Coffee, Waves, PawPrint, Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const amenityIcons: Record<string, React.ElementType> = {
  "Wi-Fi": Wifi, "Ar condicionado": Wind, "Estacionamento": Car,
  "Café da manhã": Coffee, "Piscina": Waves, "Aceita animais": PawPrint,
};

interface DbReview {
  id: string; user_name: string; room_id: string; rating: number; comment: string; created_at: string; user_id: string;
}

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t, language } = useLanguage();
  const { formatPrice, currency } = useCurrency();
  const room = rooms.find((r) => r.id === id);
  const roomMockReviews = mockReviews.filter((r) => r.roomId === id);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [comment, setComment] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);
  const [reserving, setReserving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");
  const [cardForm, setCardForm] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [userReservations, setUserReservations] = useState<any[]>([]);

  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01` > today ? `${currentYear}-01-01` : today;
  const maxDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const roomTitle = t(`room.name.${id}`) !== `room.name.${id}` ? t(`room.name.${id}`) : room?.title || "";

  useEffect(() => {
    if (!id) return;
    supabase.from("reviews").select("*").eq("room_id", id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setDbReviews(data as DbReview[]); });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("reservations").select("*").eq("user_id", user.id).eq("room_id", id)
      .then(({ data }) => { if (data) setUserReservations(data); });
  }, [user, id]);

  if (!room) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-heading text-2xl font-bold">{t("room.notFound")}</h1>
        <Link to="/buscar"><Button className="mt-4">{t("room.backToSearch")}</Button></Link>
      </div>
    );
  }

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const subtotal = room.price * nights;
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;

  const hasReviewed = user && dbReviews.some((r) => r.user_id === user.id);
  const hasCompletedStay = user && userReservations.some((r) => r.status === "completed" || (r.status === "confirmed" && new Date(r.check_out) < new Date()));

  const handleReserve = async () => {
    if (!user) { toast.error("Faça login para reservar"); navigate("/login"); return; }
    if (!checkIn || !checkOut) { toast.error("Selecione as datas"); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { toast.error("Check-out deve ser após check-in"); return; }

    if (paymentMethod === "card") {
      if (!cardForm.number || !cardForm.name || !cardForm.expiry || !cardForm.cvv) {
        toast.error("Preencha todos os dados do cartão"); return;
      }
    }

    setReserving(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 1500));

    const { error } = await supabase.from("reservations").insert({
      user_id: user.id, room_id: room.id, room_title: room.title,
      check_in: checkIn, check_out: checkOut, guests, subtotal, fee, total,
    });
    setReserving(false);

    if (error) {
      if (error.code === "23505") toast.error("Já existe uma reserva para este quarto nestas datas!");
      else toast.error("Erro ao reservar: " + error.message);
    } else {
      toast.success(t("room.paymentSuccess"), {
        description: `${roomTitle} — ${nights} ${t("room.nights")} — ${t("room.total")}: ${formatPrice(total)}`,
      });
      navigate("/minhas-reservas");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    if (!user) { toast.error("Faça login para avaliar"); navigate("/login"); return; }
    if (hasReviewed) { toast.error(t("room.alreadyReviewed")); return; }
    if (!hasCompletedStay) { toast.error(t("room.mustStayFirst")); return; }

    const { data, error } = await supabase.from("reviews").insert({
      user_id: user.id, room_id: room.id, rating: userRating,
      comment: comment.trim(), user_name: user.user_metadata?.full_name || "Usuário",
    }).select().single();

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) toast.error(t("room.alreadyReviewed"));
      else toast.error("Erro ao enviar avaliação");
    } else {
      setDbReviews((prev) => [data as DbReview, ...prev]);
      setComment("");
      toast.success("Avaliação enviada!");
    }
  };

  const allReviews = [
    ...dbReviews.map((r) => ({ id: r.id, userName: r.user_name, userAvatar: r.user_name.split(" ").map(w => w[0]).join("").slice(0, 2), rating: r.rating, comment: r.comment, date: r.created_at.slice(0, 10) })),
    ...roomMockReviews.map((r) => ({ id: r.id, userName: r.userName, userAvatar: r.userAvatar, rating: r.rating, comment: r.comment, date: r.date })),
  ];

  return (
    <div className="container-page py-6">
      <Link to="/buscar" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> {t("room.backToSearch")}
      </Link>

      <div className="mb-6 grid grid-cols-1 gap-2 lg:grid-cols-3 lg:grid-rows-2">
        <div className="lg:col-span-2 lg:row-span-2">
          <img src={room.images[activeImage]} alt={roomTitle} className="h-64 w-full rounded-xl object-cover sm:h-80 lg:h-full" />
        </div>
        {room.images.slice(1, 3).map((img, i) => (
          <button key={i} onClick={() => setActiveImage(i + 1)} className="hidden overflow-hidden rounded-xl lg:block">
            <img src={img} alt={`${roomTitle} ${i + 2}`} className="h-full w-full object-cover transition-transform hover:scale-105" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary">{room.type}</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {room.city}, {room.state}</span>
          </div>
          <h1 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">{roomTitle}</h1>
          <div className="mb-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-medium"><Star className="h-4 w-4 fill-accent text-accent" /> {room.rating}</span>
            <span className="text-muted-foreground">({room.reviewCount} {t("search.reviews")})</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" /> {t("room.upToGuests", { n: String(room.guests) })}</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{room.hostAvatar}</AvatarFallback></Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{room.host}</p>
              <p className="text-xs text-muted-foreground">{t("room.verifiedHost")}</p>
            </div>
          </div>

          <Separator className="mb-6" />
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("room.description")}</h2>
          <p className="mb-6 leading-relaxed text-muted-foreground">{room.description}</p>

          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("room.amenities")}</h2>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {room.amenities.map((a) => {
              const Icon = amenityIcons[a] || Check;
              return <div key={a} className="flex items-center gap-2 text-sm text-foreground"><Icon className="h-4 w-4 text-primary" />{a}</div>;
            })}
          </div>

          <Separator className="mb-6" />
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">{t("room.reviewsTitle")} ({allReviews.length})</h2>

          {/* Review form */}
          {!hasReviewed && hasCompletedStay && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <label className="mb-2 block text-sm font-medium text-foreground">{t("room.leaveReview")}</label>
              <div className="mb-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setUserRating(star)}>
                    <Star className={`h-5 w-5 ${star <= userRating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("room.reviewPlaceholder")}
                className="mb-3 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" rows={3} />
              <Button onClick={handleComment} disabled={!comment.trim()}>{t("room.submitReview")}</Button>
            </div>
          )}
          {hasReviewed && (
            <p className="mb-6 text-sm text-muted-foreground italic">{t("room.alreadyReviewed")}</p>
          )}
          {user && !hasCompletedStay && !hasReviewed && (
            <p className="mb-6 text-sm text-muted-foreground italic">{t("room.mustStayFirst")}</p>
          )}

          <div className="space-y-4">
            {allReviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-xs text-primary font-medium">{review.userAvatar}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.userName}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Booking sidebar */}
        <div>
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-elevated">
            <div className="mb-4 flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-foreground">{formatPrice(room.price)}</span>
              {room.originalPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(room.originalPrice)}</span>}
              <span className="text-sm text-muted-foreground">{t("room.perNight")}</span>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("room.checkIn")}</label>
                <input type="date" value={checkIn} min={minDate} max={maxDate} onChange={(e) => setCheckIn(e.target.value)}
                  className="styled-date-input w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("room.checkOut")}</label>
                <input type="date" value={checkOut} min={checkIn || minDate} max={maxDate} onChange={(e) => setCheckOut(e.target.value)}
                  className="styled-date-input w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("hero.guests")}</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {Array.from({ length: room.guests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? t("hero.guest") : t("hero.guestsPlural")}</option>
                  ))}
                </select>
              </div>
            </div>

            {checkIn && checkOut && (
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{formatPrice(room.price)} x {nights} {t("room.nights")}</span><span className="text-foreground">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("room.platformFee")}</span><span className="text-foreground">{formatPrice(fee)}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span className="text-foreground">{t("room.total")}</span><span className="text-foreground">{formatPrice(total)}</span></div>
              </div>
            )}

            {/* Payment method */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">{t("room.selectPayment")}</label>
              <div className="flex gap-2">
                <button onClick={() => setPaymentMethod("card")}
                  className={`flex-1 rounded-lg border p-2.5 text-sm font-medium transition-all ${paymentMethod === "card" ? "border-primary bg-primary/5 text-primary" : "border-input text-muted-foreground"}`}>
                  <CreditCard className="mx-auto mb-1 h-4 w-4" />
                  {t("room.creditCard")}
                </button>
                {language === "pt" && (
                  <button onClick={() => setPaymentMethod("pix")}
                    className={`flex-1 rounded-lg border p-2.5 text-sm font-medium transition-all ${paymentMethod === "pix" ? "border-primary bg-primary/5 text-primary" : "border-input text-muted-foreground"}`}>
                    <span className="text-lg">◆</span>
                    {t("room.pix")}
                  </button>
                )}
              </div>
            </div>

            {/* Card form */}
            {paymentMethod === "card" && (
              <div className="mb-4 space-y-2">
                <input type="text" placeholder={t("room.cardNumber")} value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <input type="text" placeholder={t("room.cardName")} value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <div className="flex gap-2">
                  <input type="text" placeholder={t("room.cardExpiry")} value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="flex-1 rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  <input type="text" placeholder={t("room.cardCvv")} value={cardForm.cvv}
                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="w-24 rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            )}

            <Button onClick={handleReserve} className="w-full gap-2 py-5 text-base shadow-hero" disabled={reserving}>
              {reserving ? t("room.paying") : t("room.payAndReserve")}
            </Button>

            <div className="mt-3 flex justify-center gap-3">
              <button onClick={() => room && toggleFavorite(room.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Heart className={`h-3.5 w-3.5 transition-colors ${room && favoriteIds.has(room.id) ? "fill-red-500 text-red-500" : ""}`} /> {t("room.favorite")}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success(t("common.linkCopied")); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Share2 className="h-3.5 w-3.5" /> {t("room.share")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
