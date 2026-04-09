import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Receipt } from "lucide-react";

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
}

const AdminFinancial = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [listingOwners, setListingOwners] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [resRes, profRes, listRes] = await Promise.all([
        supabase.from("reservations").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("listings").select("id, user_id"),
      ]);

      setReservations(resRes.data || []);

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

  const totalRevenue = useMemo(() => reservations.reduce((s, r) => s + Number(r.total), 0), [reservations]);
  const totalProfit = useMemo(() => reservations.reduce((s, r) => s + Number(r.fee), 0), [reservations]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Controle Financeiro</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <div className="p-2 rounded-lg text-amber-600 bg-amber-100"><DollarSign className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro (Comissão)</CardTitle>
            <div className="p-2 rounded-lg text-green-600 bg-green-100"><TrendingUp className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">R$ {totalProfit.toFixed(2)}</p></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transações</CardTitle>
            <div className="p-2 rounded-lg text-violet-600 bg-violet-100"><Receipt className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{reservations.length}</p></CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Hóspede</TableHead>
              <TableHead>Anunciante</TableHead>
              <TableHead>Quarto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada</TableCell></TableRow>
            ) : (
              reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}...</TableCell>
                  <TableCell>{profiles[r.user_id] || "—"}</TableCell>
                  <TableCell>{listingOwners[r.room_id] || "—"}</TableCell>
                  <TableCell className="font-medium">{r.room_title}</TableCell>
                  <TableCell>R$ {Number(r.total).toFixed(2)}</TableCell>
                  <TableCell className="text-amber-600">R$ {Number(r.fee).toFixed(2)}</TableCell>
                  <TableCell className="text-green-600 font-semibold">R$ {Number(r.fee).toFixed(2)}</TableCell>
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
