import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { rooms } from "@/data/mockData";

interface Reservation {
  id: string;
  room_id: string;
  room_title: string;
  check_in: string;
  check_out: string;
  guests: number;
  subtotal: number;
  fee: number;
  total: number;
  status: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  confirmed: { label: "Confirmada", variant: "default" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  completed: { label: "Concluída", variant: "secondary" },
};

const MyReservations = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchReservations = async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar reservas");
      } else {
        setReservations(data || []);
      }
      setFetching(false);
    };
    fetchReservations();
  }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao cancelar reserva");
    } else {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
      );
      toast.success("Reserva cancelada com sucesso");
    }
  };

  if (loading || fetching) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">Minhas Reservas</h1>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Você ainda não tem reservas.</p>
          <Link to="/buscar">
            <Button>Buscar Quartos</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const room = rooms.find((r) => r.id === res.room_id);
            const nights = Math.max(1, Math.ceil((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / (1000 * 60 * 60 * 24)));
            const status = statusMap[res.status] || statusMap.confirmed;

            return (
              <div key={res.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                {room && (
                  <img src={room.image} alt={res.room_title} className="h-24 w-full rounded-lg object-cover sm:w-36" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-semibold text-foreground">{res.room_title}</h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  {room && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {room.city}, {room.state}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(res.check_in).toLocaleDateString("pt-BR")} → {new Date(res.check_out).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {res.guests} hóspede(s)
                    </span>
                    <span>{nights} noite(s)</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-heading text-lg font-bold text-foreground">R$ {Number(res.total).toFixed(0)}</span>
                  {res.status === "confirmed" && (
                    <Button variant="outline" size="sm" onClick={() => handleCancel(res.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyReservations;
