import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { rooms, reviews as mockReviews } from "@/data/mockData";
import { Star, MapPin, Users, Heart, Share2, ChevronLeft, Wifi, Wind, Car, Coffee, Waves, PawPrint, Check, CreditCard, Plus, X, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, addDays, addMonths, isBefore, startOfDay } from "date-fns";
import { pt, es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

const amenityIcons: Record<string, React.ElementType> = {
  "Wi-Fi": Wifi, "Ar condicionado": Wind, "Estacionamento": Car,
  "Café da manhã": Coffee, "Piscina": Waves, "Aceita animais": PawPrint,
};

const amenityTranslations: Record<string, Record<string, string>> = {
  "Wi-Fi": { pt: "Wi-Fi", en: "Wi-Fi", es: "Wi-Fi" },
  "Ar condicionado": { pt: "Ar condicionado", en: "Air conditioning", es: "Aire acondicionado" },
  "Estacionamento": { pt: "Estacionamento", en: "Parking", es: "Estacionamiento" },
  "Café da manhã": { pt: "Café da manhã", en: "Breakfast", es: "Desayuno" },
  "Piscina": { pt: "Piscina", en: "Pool", es: "Piscina" },
  "Aceita animais": { pt: "Aceita animais", en: "Pet friendly", es: "Acepta mascotas" },
  "Spa": { pt: "Spa", en: "Spa", es: "Spa" },
  "Academia": { pt: "Academia", en: "Gym", es: "Gimnasio" },
  "Lavanderia": { pt: "Lavanderia", en: "Laundry", es: "Lavandería" },
  "Jacuzzi": { pt: "Jacuzzi", en: "Jacuzzi", es: "Jacuzzi" },
  "Terraço": { pt: "Terraço", en: "Terrace", es: "Terraza" },
  "Concierge 24h": { pt: "Concierge 24h", en: "24h Concierge", es: "Conserje 24h" },
  "Praia privativa": { pt: "Praia privativa", en: "Private beach", es: "Playa privada" },
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

  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState<number[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [comment, setComment] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);
  const [reserving, setReserving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "debit" | "pix">("credit");
  const [cardForm, setCardForm] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 6);
  const dateLocale = language === "pt" ? pt : language === "es" ? es : enUS;

  const totalGuests = adults + children.length;
  const roomTitle = t(`room.name.${id}`) !== `room.name.${id}` ? t(`room.name.${id}`) : room?.title || "";

  const addChild = () => { if (children.length < 5) setChildren([...children, 5]); };
  const removeChild = (i: number) => setChildren(children.filter((_, idx) => idx !== i));
  const updateChildAge = (i: number, age: number) => { const u = [...children]; u[i] = Math.min(17, Math.max(0, age)); setChildren(u); };

  const translateAmenity = (a: string) => amenityTranslations[a]?.[language] || a;

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

  const nights = checkInDate && checkOutDate
    ? Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const subtotal = room.price * nights;
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;

  const hasReviewed = user && dbReviews.some((r) => r.user_id === user.id);
  const hasCompletedStay = user && userReservations.some((r) => r.status === "completed" || (r.status === "confirmed" && new Date(r.check_out) < new Date()));

  const handleReserve = async () => {
    if (!user) { toast.error(t("common.loginToFavorite")); navigate("/login"); return; }
    if (!checkInDate || !checkOutDate) { toast.error(t("room.selectDates")); return; }
    if (checkOutDate <= checkInDate) { toast.error(t("room.checkOutAfter")); return; }
    if (totalGuests > room.guests) { toast.error(t("room.tooManyGuests")); return; }

    if (paymentMethod !== "pix") {
      if (!cardForm.number || !cardForm.name || !cardForm.expiry || !cardForm.cvv) {
        toast.error(t("room.fillCard")); return;
      }
    }

    setReserving(true);
    await new Promise((r) => setTimeout(r, 1500));

    const { error } = await supabase.from("reservations").insert({
      user_id: user.id, room_id: room.id, room_title: room.title,
      check_in: format(checkInDate, "yyyy-MM-dd"), check_out: format(checkOutDate, "yyyy-MM-dd"),
      guests: totalGuests, subtotal, fee, total,
    });
    setReserving(false);

    if (error) {
      if (error.code === "23505") toast.error(t("room.duplicateReservation"));
      else toast.error("Erro: " + error.message);
    } else {
      toast.success(t("room.paymentSuccess"), {
        description: `${roomTitle} — ${nights} ${t("room.nights")} — ${t("room.total")}: ${formatPrice(total)}`,
      });
      navigate("/minhas-reservas");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    if (!user) { toast.error(t("common.loginToFavorite")); navigate("/login"); return; }
    if (hasReviewed) { toast.error(t("room.alreadyReviewed")); return; }
    if (!hasCompletedStay) { toast.error(t("room.mustStayFirst")); return; }

    const { data, error } = await supabase.from("reviews").insert({
      user_id: user.id, room_id: room.id, rating: userRating,
      comment: comment.trim(), user_name: user.user_metadata?.full_name || "User",
    }).select().single();

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) toast.error(t("room.alreadyReviewed"));
      else toast.error("Erro ao enviar avaliação");
    } else {
      setDbReviews((prev) => [data as DbReview, ...prev]);
      setComment("");
      toast.success(t("room.reviewSent"));
    }
  };

  const allReviews = [
    ...dbReviews.map((r) => ({ id: r.id, userName: r.user_name, userAvatar: r.user_name.split(" ").map(w => w[0]).join("").slice(0, 2), rating: r.rating, comment: r.comment, date: r.created_at.slice(0, 10) })),
    ...mockReviewsData.map((r: any) => ({ id: r.id, userName: r.userName, userAvatar: r.userAvatar, rating: r.rating, comment: r.comment, date: r.date })),
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
              return <div key={a} className="flex items-center gap-2 text-sm text-foreground"><Icon className="h-4 w-4 text-primary" />{translateAmenity(a)}</div>;
            })}
          </div>

          <Separator className="mb-6" />
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">{t("room.reviewsTitle")} ({allReviews.length})</h2>

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
          {hasReviewed && <p className="mb-6 text-sm text-muted-foreground italic">{t("room.alreadyReviewed")}</p>}
          {user && !hasCompletedStay && !hasReviewed && <p className="mb-6 text-sm text-muted-foreground italic">{t("room.mustStayFirst")}</p>}

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
              {/* Check-in Calendar */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("room.checkIn")}</label>
                <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkInDate && "text-muted-foreground")}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {checkInDate ? format(checkInDate, "dd/MM/yyyy") : t("room.selectDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={(d) => { setCheckInDate(d); setCheckInOpen(false); if (d && checkOutDate && checkOutDate <= d) setCheckOutDate(undefined); }}
                      disabled={(date) => isBefore(date, today) || date > maxDate}
                      locale={dateLocale}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Check-out Calendar */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("room.checkOut")}</label>
                <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkOutDate && "text-muted-foreground")}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {checkOutDate ? format(checkOutDate, "dd/MM/yyyy") : t("room.selectDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOutDate}
                      onSelect={(d) => { setCheckOutDate(d); setCheckOutOpen(false); }}
                      disabled={(date) => isBefore(date, checkInDate ? addDays(checkInDate, 1) : addDays(today, 1)) || date > maxDate}
                      locale={dateLocale}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Guest selector */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("hero.guests")}</label>
                <Popover open={guestOpen} onOpenChange={setGuestOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Users className="mr-2 h-4 w-4" />
                      {adults} {t("room.adults")} · {children.length} {t("room.children")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    {/* Adults */}
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-foreground">{t("room.adults")}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setAdults(Math.max(1, adults - 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"><span className="text-lg">−</span></button>
                        <span className="w-6 text-center text-sm font-medium text-foreground">{adults}</span>
                        <button onClick={() => { if (adults + children.length < room.guests) setAdults(adults + 1); }} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"><span className="text-lg">+</span></button>
                      </div>
                    </div>
                    <Separator />
                    {/* Children */}
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-foreground">{t("room.children")}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { if (children.length > 0) removeChild(children.length - 1); }} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"><span className="text-lg">−</span></button>
                        <span className="w-6 text-center text-sm font-medium text-foreground">{children.length}</span>
                        <button onClick={() => { if (adults + children.length < room.guests) addChild(); }} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"><span className="text-lg">+</span></button>
                      </div>
                    </div>
                    {children.length > 0 && (
                      <div className="mt-2 space-y-2 border-t border-border pt-3">
                        {children.map((age, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{t("room.childLabel")} {i + 1}</span>
                            <select value={age} onChange={(e) => updateChildAge(i, Number(e.target.value))}
                              className="rounded-lg border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring">
                              {Array.from({ length: 18 }, (_, a) => <option key={a} value={a}>{a} {a === 1 ? t("room.year") : t("room.years")}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {checkInDate && checkOutDate && (
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
                <button onClick={() => setPaymentMethod("credit")}
                  className={`flex-1 rounded-lg border p-2.5 text-xs font-medium transition-all ${paymentMethod === "credit" ? "border-primary bg-primary/5 text-primary" : "border-input text-muted-foreground"}`}>
                  <CreditCard className="mx-auto mb-1 h-4 w-4" />
                  {t("room.creditCard")}
                </button>
                <button onClick={() => setPaymentMethod("debit")}
                  className={`flex-1 rounded-lg border p-2.5 text-xs font-medium transition-all ${paymentMethod === "debit" ? "border-primary bg-primary/5 text-primary" : "border-input text-muted-foreground"}`}>
                  <CreditCard className="mx-auto mb-1 h-4 w-4" />
                  {t("room.debitCard")}
                </button>
                {language === "pt" && (
                  <button onClick={() => setPaymentMethod("pix")}
                    className={`flex-1 rounded-lg border p-2.5 text-xs font-medium transition-all ${paymentMethod === "pix" ? "border-primary bg-primary/5 text-primary" : "border-input text-muted-foreground"}`}>
                    <span className="text-lg">◆</span>
                    {t("room.pix")}
                  </button>
                )}
              </div>
            </div>

            {/* Card form */}
            {(paymentMethod === "credit" || paymentMethod === "debit") && (
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
