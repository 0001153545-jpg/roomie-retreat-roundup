import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CalendarCheck, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const AdminDashboard = () => {
  const { formatPrice } = useCurrency();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOwners: 0,
    totalReservations: 0,
    totalRevenue: 0,
    totalProfit: 0,
    monthlyRevenue: 0,
    avgTicket: 0,
  });
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [profilesRes, reservationsRes] = await Promise.all([
        supabase.from("profiles").select("account_type"),
        supabase.from("reservations").select("total, fee, created_at"),
      ]);

      const profiles = profilesRes.data || [];
      const res = reservationsRes.data || [];

      const totalRevenue = res.reduce((s, r) => s + Number(r.total), 0);
      const totalProfit = res.reduce((s, r) => s + Number(r.fee), 0);
      const now = new Date();
      const monthlyRevenue = res
        .filter((r) => {
          const d = new Date(r.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, r) => s + Number(r.total), 0);

      setReservations(res);
      setMetrics({
        totalUsers: profiles.filter((p) => p.account_type === "guest").length,
        totalOwners: profiles.filter((p) => p.account_type === "owner").length,
        totalReservations: res.length,
        totalRevenue,
        totalProfit,
        monthlyRevenue,
        avgTicket: res.length > 0 ? totalRevenue / res.length : 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const revenueByMonth = useMemo(() => {
    const year = new Date().getFullYear();
    const data = MONTHS.map((m) => ({ month: m, receita: 0 }));
    reservations.forEach((r) => {
      const d = new Date(r.created_at);
      if (d.getFullYear() === year) {
        data[d.getMonth()].receita += Number(r.total);
      }
    });
    return data;
  }, [reservations]);

  const cards = [
    { label: "Usuários", value: metrics.totalUsers, icon: Users, color: "text-blue-600 bg-blue-100", border: "border-l-blue-500" },
    { label: "Anunciantes", value: metrics.totalOwners, icon: Building2, color: "text-emerald-600 bg-emerald-100", border: "border-l-emerald-500" },
    { label: "Reservas", value: metrics.totalReservations, icon: CalendarCheck, color: "text-violet-600 bg-violet-100", border: "border-l-violet-500" },
    { label: "Receita Total", value: formatPrice(metrics.totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-100", border: "border-l-green-500" },
    { label: "Lucro (Comissão)", value: formatPrice(metrics.totalProfit), icon: TrendingUp, color: "text-green-600 bg-green-100", border: "border-l-green-500" },
    { label: "Receita do Mês", value: formatPrice(metrics.monthlyRevenue), icon: CalendarCheck, color: "text-blue-600 bg-blue-100", border: "border-l-blue-500" },
    { label: "Ticket Médio", value: formatPrice(metrics.avgTicket), icon: BarChart3, color: "text-amber-600 bg-amber-100", border: "border-l-amber-500" },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  const chartConfig = {
    receita: { label: "Receita", color: "#10b981" },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className={`shadow-sm border-l-4 ${c.border}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <div className={`p-2 rounded-lg ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground money">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Receita Mensal ({new Date().getFullYear()})</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
