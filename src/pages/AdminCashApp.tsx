import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useNavigate } from "react-router-dom";
import { NavigationHeader } from "@/components/NavigationHeader";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Shield, Loader2 } from "lucide-react";

type CashAppOrder = {
  id: string;
  full_name: string;
  email: string;
  plan: string;
  amount: number;
  screenshot_url: string;
  status: string;
  created_at: string;
  user_id: string | null;
};

export default function AdminCashApp() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<CashAppOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user || !isAdmin()) {
        navigate("/");
        return;
      }
      fetchOrders();
    }
  }, [user, authLoading, rolesLoading]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("cashapp_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } else {
      setOrders((data as CashAppOrder[]) || []);
    }
    setLoadingOrders(false);
  };

  const handleViewProof = async (screenshotUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("cashapp-proofs")
        .createSignedUrl(screenshotUrl, 60);

      if (error) throw error;
      setProofUrl(data.signedUrl);
      setProofDialogOpen(true);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load proof image", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: "approved" | "rejected") => {
    setActionLoading(orderId);
    try {
      const { error } = await supabase
        .from("cashapp_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // If approved and user_id exists, update their profile plan
      if (newStatus === "approved") {
        const order = orders.find((o) => o.id === orderId);
        if (order?.user_id) {
          const planLabel =
            order.plan === "full-repair"
              ? "Full Credit Repair"
              : order.plan === "chexsystems"
              ? "ChexSystems Removal"
              : "Tradelines";

          await supabase
            .from("profiles")
            .update({
              membership_plan: planLabel,
              payment_status: "active",
              membership_type: "cashapp",
            })
            .eq("user_id", order.user_id);
        }
      }

      toast({ title: `Order ${newStatus}`, description: `Order has been ${newStatus}.` });
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Unauthorized</h1>
          <p className="text-slate-300 mb-8">You do not have permission to view this page.</p>
          <Button onClick={() => navigate("/")} className="bg-cyan-500 hover:bg-cyan-600 text-white">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/40">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/40">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-white">Cash App Orders</h1>
        </div>

        <Card className="bg-slate-800/60 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSignIcon /> Payment Submissions ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Plan</TableHead>
                      <TableHead className="text-slate-300">Amount</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-slate-300 text-xs">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-white font-medium">{order.full_name}</TableCell>
                        <TableCell className="text-slate-300 text-sm">{order.email}</TableCell>
                        <TableCell className="text-slate-300 text-sm capitalize">{order.plan}</TableCell>
                        <TableCell className="text-green-400 font-semibold">${order.amount}</TableCell>
                        <TableCell>{statusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewProof(order.screenshot_url)}
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(order.id, "approved")}
                                  disabled={actionLoading === order.id}
                                  className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUpdateStatus(order.id, "rejected")}
                                  disabled={actionLoading === order.id}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Proof Image Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Payment Proof</DialogTitle>
          </DialogHeader>
          {proofUrl && (
            <img src={proofUrl} alt="Payment proof" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DollarSignIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
