import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CalendarCheck, DollarSign, TrendingUp } from "lucide-react";

const COMMISSION_RATE = 0.20;

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOwners: 0,
    totalReservations: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [profilesRes, reservationsRes] = await Promise.all([
        supabase.from("profiles").select("account_type"),
        supabase.from("reservations").select("total, fee"),
      ]);

      const profiles = profilesRes.data || [];
      const reservations = reservationsRes.data || [];

      const totalRevenue = reservations.reduce((s, r) => s + Number(r.total), 0);
      const totalProfit = reservations.reduce((s, r) => s + Number(r.fee), 0);

      setMetrics({
        totalUsers: profiles.filter((p) => p.account_type === "guest").length,
        totalOwners: profiles.filter((p) => p.account_type === "owner").length,
        totalReservations: reservations.length,
        totalRevenue,
        totalProfit,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: "Usuários", value: metrics.totalUsers, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Anunciantes", value: metrics.totalOwners, icon: Building2, color: "text-emerald-600 bg-emerald-100" },
    { label: "Reservas", value: metrics.totalReservations, icon: CalendarCheck, color: "text-violet-600 bg-violet-100" },
    { label: "Receita Total", value: `R$ ${metrics.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-amber-600 bg-amber-100" },
    { label: "Lucro (Comissão)", value: `R$ ${metrics.totalProfit.toFixed(2)}`, icon: TrendingUp, color: "text-green-600 bg-green-100" },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <div className={`p-2 rounded-lg ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
