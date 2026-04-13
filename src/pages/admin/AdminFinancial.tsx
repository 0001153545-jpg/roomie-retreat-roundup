import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Receipt, BarChart3, CalendarIcon } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [listingOwners, setListingOwners] = useState<Record<string, string>>({});
  const [listings, setListings] = useState<{ id: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    return reservations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && listingTypeMap[r.room_id] !== typeFilter) return false;
      if (dateFrom && r.check_in < dateFrom) return false;
      if (dateTo && r.check_out > dateTo) return false;
      return true;
    });
  }, [reservations, statusFilter, typeFilter, dateFrom, dateTo, listingTypeMap]);

  // Metrics
  const totalRevenue = useMemo(() => filtered.reduce((s, r) => s + Number(r.total), 0), [filtered]);
  const totalProfit = useMemo(() => filtered.reduce((s, r) => s + Number(r.fee), 0), [filtered]);
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
          <CardContent><p className="text-2xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</p></CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita do Mês</CardTitle>
            <div className="p-2 rounded-lg text-blue-600 bg-blue-100"><CalendarIcon className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">R$ {monthlyRevenue.toFixed(2)}</p></CardContent>
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
          <CardContent><p className="text-2xl font-bold text-amber-600">R$ {avgTicket.toFixed(2)}</p></CardContent>
        </Card>
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
        <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent>
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
              <label className="text-xs text-muted-foreground mb-1 block">Data de</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data até</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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
              <TableHead>Valor</TableHead>
              <TableHead>Comissão</TableHead>
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
                  <TableCell className={r.status === "cancelled" ? "text-red-500 line-through" : "text-green-600 font-semibold"}>
                    R$ {Number(r.total).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-amber-600">R$ {Number(r.fee).toFixed(2)}</TableCell>
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
