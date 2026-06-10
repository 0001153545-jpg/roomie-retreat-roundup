import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, Receipt, BarChart3, CalendarIcon, XCircle, Search, FileSpreadsheet, X } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface Reservation {
  id: string;
  user_id: string;
  room_id: string;
  room_title: string;
  total: number;
  fee: number;
  subtotal: number;
  status: string;
  created_at: string;
  check_in: string;
  check_out: string;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const AdminFinancial = () => {
  const { formatPrice } = useCurrency();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [listingOwners, setListingOwners] = useState<Record<string, string>>({});
  const [listings, setListings] = useState<{ id: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [searchScope, setSearchScope] = useState<"all" | "guest" | "owner" | "reservation">("all");

  useEffect(() => {
    const load = async () => {
      const [resRes, profRes, listRes] = await Promise.all([
        supabase.from("reservations").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("listings").select("id, user_id, type"),
      ]);

      setReservations(resRes.data || []);
      setListings(listRes.data || []);

      const pMap: Record<string, string> = {};
      (profRes.data || []).forEach((p) => { pMap[p.user_id] = p.full_name || "—"; });
      setProfiles(pMap);

      const lMap: Record<string, string> = {};
      (listRes.data || []).forEach((l) => { lMap[l.id] = pMap[l.user_id] || "—"; });
      setListingOwners(lMap);

      setLoading(false);
    };
    load();
  }, []);

  // Listing type map
  const listingTypeMap = useMemo(() => {
    const m: Record<string, string> = {};
    listings.forEach((l) => { m[l.id] = l.type; });
    return m;
  }, [listings]);

  // Unique types
  const roomTypes = useMemo(() => {
    const types = new Set(listings.map((l) => l.type));
    return Array.from(types);
  }, [listings]);

  // Filtered reservations
  const filtered = useMemo(() => {
    const fromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : "";
    const toStr = dateTo ? format(dateTo, "yyyy-MM-dd") : "";
    const q = search.trim().toLowerCase();
    return reservations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && listingTypeMap[r.room_id] !== typeFilter) return false;
      if (fromStr && r.check_in < fromStr) return false;
      if (toStr && r.check_out > toStr) return false;
      if (q) {
        const guest = (profiles[r.user_id] || "").toLowerCase();
        const owner = (listingOwners[r.room_id] || "").toLowerCase();
        const room = (r.room_title || "").toLowerCase();
        const resId = r.id.toLowerCase();
        const matchGuest = guest.includes(q);
        const matchOwner = owner.includes(q);
        const matchReservation = resId.includes(q) || room.includes(q);
        if (searchScope === "guest" && !matchGuest) return false;
        if (searchScope === "owner" && !matchOwner) return false;
        if (searchScope === "reservation" && !matchReservation) return false;
        if (searchScope === "all" && !(matchGuest || matchOwner || matchReservation)) return false;
      }
      return true;
    });
  }, [reservations, statusFilter, typeFilter, dateFrom, dateTo, listingTypeMap, search, searchScope, profiles, listingOwners]);

  const exportToExcel = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }
    const rows = filtered.map((r) => ({
      ID: r.id,
      Hóspede: profiles[r.user_id] || "—",
      Anunciante: listingOwners[r.room_id] || "—",
      Quarto: r.room_title,
      "Check-in": new Date(r.check_in).toLocaleDateString("pt-BR"),
      "Check-out": new Date(r.check_out).toLocaleDateString("pt-BR"),
      Valor: Number(r.total),
      Comissão: Number(r.fee),
      Status: r.status === "confirmed" ? "Pago" : r.status === "cancelled" ? "Cancelado" : "Pendente",
      "Data Reserva": new Date(r.created_at).toLocaleDateString("pt-BR"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    const stamp = format(new Date(), "yyyy-MM-dd_HHmm");
    XLSX.writeFile(wb, `financeiro_${stamp}.xlsx`);
    toast.success(`${rows.length} registro(s) exportado(s)`);
  };


  // Metrics
  const totalRevenue = useMemo(() => filtered.reduce((s, r) => s + Number(r.total), 0), [filtered]);
  const totalProfit = useMemo(() => filtered.reduce((s, r) => s + Number(r.fee), 0), [filtered]);
  const cancelledCount = useMemo(() => filtered.filter(r => r.status === "cancelled").length, [filtered]);
  const cancelledRevenue = useMemo(() => filtered.filter(r => r.status === "cancelled").reduce((s, r) => s + Number(r.total), 0), [filtered]);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = useMemo(() =>
    reservations
      .filter((r) => {
        const d = new Date(r.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((s, r) => s + Number(r.total), 0),
    [reservations, currentMonth, currentYear]
  );
  const avgTicket = useMemo(() => filtered.length > 0 ? totalRevenue / filtered.length : 0, [totalRevenue, filtered]);

  // Revenue by month chart data
  const revenueByMonth = useMemo(() => {
    const data = MONTHS.map((m, i) => ({ month: m, receita: 0, lucro: 0 }));
    reservations.forEach((r) => {
      const d = new Date(r.created_at);
      if (d.getFullYear() === currentYear) {
        data[d.getMonth()].receita += Number(r.total);
        data[d.getMonth()].lucro += Number(r.fee);
      }
    });
    return data;
  }, [reservations, currentYear]);

  // Reservations by day of week
  const reservationsByDay = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const data = days.map((d) => ({ day: d, reservas: 0 }));
    reservations.forEach((r) => {
      const d = new Date(r.created_at).getDay();
      data[d].reservas += 1;
    });
    return data;
  }, [reservations]);

  // Occupancy by room type
  const occupancyData = useMemo(() => {
    const typeCount: Record<string, { total: number; booked: number }> = {};
    const today = new Date().toISOString().split("T")[0];
    listings.forEach((l) => {
      if (!typeCount[l.type]) typeCount[l.type] = { total: 0, booked: 0 };
      typeCount[l.type].total += 1;
    });
    reservations.forEach((r) => {
      if (r.status !== "cancelled" && r.check_in <= today && r.check_out >= today) {
        const type = listingTypeMap[r.room_id];
        if (type && typeCount[type]) typeCount[type].booked += 1;
      }
    });
    return Object.entries(typeCount).map(([name, v]) => ({
      name,
      ocupacao: v.total > 0 ? Math.round((v.booked / v.total) * 100) : 0,
    }));
  }, [listings, reservations, listingTypeMap]);

  const PIE_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444", "#3b82f6"];

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendente</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  const chartConfig = {
    receita: { label: "Receita", color: "#10b981" },
    lucro: { label: "Lucro", color: "#6366f1" },
    reservas: { label: "Reservas", color: "#3b82f6" },
    ocupacao: { label: "Ocupação %", color: "#f59e0b" },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Controle Financeiro</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <div className="p-2 rounded-lg text-green-600 bg-green-100"><DollarSign className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600 money">{formatPrice(totalRevenue)}</p></CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita do Mês</CardTitle>
            <div className="p-2 rounded-lg text-blue-600 bg-blue-100"><CalendarIcon className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600 money">{formatPrice(monthlyRevenue)}</p></CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nº de Reservas</CardTitle>
            <div className="p-2 rounded-lg text-violet-600 bg-violet-100"><Receipt className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{filtered.length}</p></CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
            <div className="p-2 rounded-lg text-amber-600 bg-amber-100"><BarChart3 className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600 money">{formatPrice(avgTicket)}</p></CardContent>
        </Card>
        {cancelledCount > 0 && (
          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelamentos</CardTitle>
              <div className="p-2 rounded-lg text-red-600 bg-red-100"><XCircle className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
              <p className="text-xs text-muted-foreground mt-1 money">{formatPrice(cancelledRevenue)} perdidos</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by month */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Receita por Mês</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Reservations by day */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Reservas por Dia da Semana</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <LineChart data={reservationsByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="reservas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Occupancy */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Ocupação por Tipo de Quarto (%)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={occupancyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" domain={[0, 100]} className="text-xs" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="ocupacao" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Filtros e Busca</CardTitle>
          <Button onClick={exportToExcel} size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel ({filtered.length})
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search row */}
          <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome do cliente, anunciante, ID da reserva ou quarto..."
                  className="pl-9 pr-9"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Filtrar por</label>
              <Select value={searchScope} onValueChange={(v) => setSearchScope(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os campos</SelectItem>
                  <SelectItem value="guest">Cliente / Hóspede</SelectItem>
                  <SelectItem value="owner">Proprietário / Anunciante</SelectItem>
                  <SelectItem value="reservation">Reserva (ID/Quarto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmed">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo de Quarto</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {roomTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Check-in a partir de</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd 'de' MMM yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={ptBR}
                    initialFocus
                    className="pointer-events-auto"
                  />
                  {dateFrom && (
                    <div className="p-2 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={() => setDateFrom(undefined)} className="w-full">
                        Limpar
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Check-out até</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd 'de' MMM yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={ptBR}
                    initialFocus
                    className="pointer-events-auto"
                  />
                  {dateTo && (
                    <div className="p-2 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={() => setDateTo(undefined)} className="w-full">
                        Limpar
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Transactions Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Hóspede</TableHead>
              <TableHead>Anunciante</TableHead>
              <TableHead>Quarto</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada</TableCell></TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className={r.status === "cancelled" ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                  <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}...</TableCell>
                  <TableCell>{profiles[r.user_id] || "—"}</TableCell>
                  <TableCell>{listingOwners[r.room_id] || "—"}</TableCell>
                  <TableCell className="font-medium">{r.room_title}</TableCell>
                  <TableCell>{new Date(r.check_in).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{new Date(r.check_out).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className={`money text-right ${r.status === "cancelled" ? "text-red-500 line-through" : "text-green-600 font-semibold"}`}>
                    {formatPrice(Number(r.total))}
                  </TableCell>
                  <TableCell className="text-amber-600 money text-right">{formatPrice(Number(r.fee))}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminFinancial;
