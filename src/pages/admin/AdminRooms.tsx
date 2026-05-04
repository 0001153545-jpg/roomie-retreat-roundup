import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Listing {
  id: string;
  title: string;
  city: string;
  state: string;
  price: number;
  user_id: string;
  created_at: string;
  discount_percent: number | null;
}

interface Reservation {
  room_id: string;
  check_in: string;
  check_out: string;
}

const AdminRooms = () => {
  const { formatPrice } = useCurrency();
  const [listings, setListings] = useState<Listing[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "booked">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [listRes, resRes, profRes] = await Promise.all([
        supabase.from("listings").select("*").order("created_at", { ascending: false }),
        supabase.from("reservations").select("room_id, check_in, check_out"),
        supabase.from("profiles").select("user_id, full_name"),
      ]);
      setListings(listRes.data || []);
      setReservations(resRes.data || []);
      const map: Record<string, string> = {};
      (profRes.data || []).forEach((p) => { map[p.user_id] = p.full_name || "—"; });
      setProfiles(map);
      setLoading(false);
    };
    load();
  }, []);

  const bookedIds = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    return new Set(reservations.filter((r) => r.check_in <= now && r.check_out >= now).map((r) => r.room_id));
  }, [reservations]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
      const isBooked = bookedIds.has(l.id);
      const matchStatus = filterStatus === "all" || (filterStatus === "booked" ? isBooked : !isBooked);
      return matchSearch && matchStatus;
    });
  }, [listings, search, filterStatus, bookedIds]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Gestão de Quartos</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["all", "available", "booked"] as const).map((s) => (
            <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)}>
              {s === "all" ? "Todos" : s === "available" ? "Disponíveis" : "Alugados"}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quarto</TableHead>
              <TableHead>Anunciante</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum quarto encontrado</TableCell></TableRow>
            ) : (
              filtered.map((l) => {
                const isBooked = bookedIds.has(l.id);
                return (
                  <TableRow key={l.id} className={isBooked ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                    <TableCell className="font-medium">{l.title}</TableCell>
                    <TableCell>{profiles[l.user_id] || "—"}</TableCell>
                    <TableCell>{l.city}, {l.state}</TableCell>
                    <TableCell className="money text-right">{formatPrice(Number(l.price))}</TableCell>
                    <TableCell>
                      <Badge variant={isBooked ? "destructive" : "default"} className={!isBooked ? "bg-green-600 hover:bg-green-700" : ""}>
                        {isBooked ? "Alugado" : "Disponível"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(l.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} quarto(s)</p>
    </div>
  );
};

export default AdminRooms;
