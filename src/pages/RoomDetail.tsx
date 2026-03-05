import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { rooms, reviews } from "@/data/mockData";
import { Star, MapPin, Users, Heart, Share2, ChevronLeft, Wifi, Wind, Car, Coffee, Waves, PawPrint, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const amenityIcons: Record<string, React.ElementType> = {
  "Wi-Fi": Wifi,
  "Ar condicionado": Wind,
  "Estacionamento": Car,
  "Café da manhã": Coffee,
  "Piscina": Waves,
  "Aceita animais": PawPrint,
};

const RoomDetail = () => {
  const { id } = useParams();
  const room = rooms.find((r) => r.id === id);
  const roomReviews = reviews.filter((r) => r.roomId === id);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [comment, setComment] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [localReviews, setLocalReviews] = useState(roomReviews);

  if (!room) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-heading text-2xl font-bold">Quarto não encontrado</h1>
        <Link to="/buscar">
          <Button className="mt-4">Voltar à busca</Button>
        </Link>
      </div>
    );
  }

  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
  const subtotal = room.price * nights;
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;

  const handleReserve = () => {
    if (!checkIn || !checkOut) {
      toast.error("Selecione as datas de check-in e check-out");
      return;
    }
    toast.success("Reserva realizada com sucesso! 🎉", {
      description: `${room.title} — ${nights} noite(s) — Total: R$ ${total}`,
    });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    const newReview = {
      id: String(Date.now()),
      userName: "Você",
      userAvatar: "VC",
      roomId: room.id,
      roomTitle: room.title,
      rating: userRating,
      comment: comment.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    setLocalReviews((prev) => [newReview, ...prev]);
    setComment("");
    toast.success("Avaliação enviada!");
  };

  return (
    <div className="container-page py-6">
      <Link to="/buscar" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Voltar à busca
      </Link>

      {/* Image gallery */}
      <div className="mb-6 grid grid-cols-1 gap-2 lg:grid-cols-3 lg:grid-rows-2">
        <div className="lg:col-span-2 lg:row-span-2">
          <img
            src={room.images[activeImage]}
            alt={room.title}
            className="h-64 w-full rounded-xl object-cover sm:h-80 lg:h-full"
          />
        </div>
        {room.images.slice(1, 3).map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveImage(i + 1)}
            className="hidden overflow-hidden rounded-xl lg:block"
          >
            <img
              src={img}
              alt={`${room.title} foto ${i + 2}`}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left content */}
        <div className="lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary">{room.type}</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {room.city}, {room.state}
            </span>
          </div>
          <h1 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {room.title}
          </h1>
          <div className="mb-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-medium">
              <Star className="h-4 w-4 fill-accent text-accent" /> {room.rating}
            </span>
            <span className="text-muted-foreground">({room.reviewCount} avaliações)</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" /> até {room.guests} hóspedes
            </span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                {room.hostAvatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{room.host}</p>
              <p className="text-xs text-muted-foreground">Anfitrião verificado</p>
            </div>
          </div>

          <Separator className="mb-6" />

          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Descrição</h2>
          <p className="mb-6 leading-relaxed text-muted-foreground">{room.description}</p>

          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Comodidades</h2>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {room.amenities.map((a) => {
              const Icon = amenityIcons[a] || Check;
              return (
                <div key={a} className="flex items-center gap-2 text-sm text-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {a}
                </div>
              );
            })}
          </div>

          <Separator className="mb-6" />

          {/* Reviews */}
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
            Avaliações ({localReviews.length})
          </h2>

          {/* New comment form */}
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <label className="mb-2 block text-sm font-medium text-foreground">Deixe sua avaliação</label>
            <div className="mb-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setUserRating(star)}>
                  <Star className={`h-5 w-5 ${star <= userRating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência..."
              className="mb-3 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
            <Button onClick={handleComment} disabled={!comment.trim()}>
              Enviar avaliação
            </Button>
          </div>

          <div className="space-y-4">
            {localReviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary font-medium">
                      {review.userAvatar}
                    </AvatarFallback>
                  </Avatar>
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
              <span className="font-heading text-2xl font-bold text-foreground">R$ {room.price}</span>
              {room.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">R$ {room.originalPrice}</span>
              )}
              <span className="text-sm text-muted-foreground">/ noite</span>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Hóspedes</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {Array.from({ length: room.guests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "hóspede" : "hóspedes"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {checkIn && checkOut && (
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">R$ {room.price} x {nights} noite(s)</span>
                  <span className="text-foreground">R$ {subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa da plataforma</span>
                  <span className="text-foreground">R$ {fee}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">R$ {total}</span>
                </div>
              </div>
            )}

            <Button onClick={handleReserve} className="w-full gap-2 py-5 text-base shadow-hero">
              Reservar agora
            </Button>

            <div className="mt-3 flex justify-center gap-3">
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Heart className="h-3.5 w-3.5" /> Favoritar
              </button>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Share2 className="h-3.5 w-3.5" /> Compartilhar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
