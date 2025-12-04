import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Check, X, Trash2 } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [flags, setFlags] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("claims");

  useEffect(() => {
    checkAdminAccess();
  }, [navigate]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/admin-login");
      return;
    }

    try {
      const { data: adminData, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error || !adminData) {
        toast.error("Unauthorized: Admin access required");
        navigate("/items");
        return;
      }

      if (!adminData.is_active) {
        toast.error("Your admin account has been deactivated");
        await supabase.auth.signOut();
        navigate("/admin-login");
        return;
      }

      setUser(session.user);
      setIsAdmin(true);
      fetchAdminData();
    } catch (error) {
      toast.error("Error checking admin status");
      navigate("/items");
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data: claimsData } = await supabase
        .from("items")
        .select("*")
        .eq("claim_status", "pending")
        .order("created_at", { ascending: false });

      setPendingClaims(claimsData || []);

      const { data: flagsData } = await supabase
        .from("flags")
        .select("*, items(title, id), users(email, full_name)")
        .order("created_at", { ascending: false });

      setFlags(flagsData || []);

      const { data: usersData } = await supabase
        .from("reported_users")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setReportedUsers(usersData || []);
    } catch (error) {
      toast.error("Failed to fetch admin data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClaim = async (itemId, claimedBy) => {
    try {
      const { error } = await supabase
        .from("items")
        .update({
          is_claimed: true,
          claim_status: "approved",
          claimed_by: claimedBy,
          claim_date: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Claim approved");
      fetchAdminData();
    } catch (error) {
      toast.error("Failed to approve claim");
      console.error(error);
    }
  };

  const handleDenyClaim = async (itemId) => {
    try {
      const { error } = await supabase
        .from("items")
        .update({
          claim_status: "rejected",
          claimed_by: null,
        })
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Claim denied");
      fetchAdminData();
    } catch (error) {
      toast.error("Failed to deny claim");
      console.error(error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Item deleted");
      fetchAdminData();
    } catch (error) {
      toast.error("Failed to delete item");
      console.error(error);
    }
  };

  const handleRestrictUser = async (userId, reason) => {
    try {
      const { error } = await supabase
        .from("restricted_users")
        .insert({
          user_id: userId,
          reason,
          restricted_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;
      toast.success("User restricted for 7 days");
      await handleReportResolved(userId, "restricted");
    } catch (error) {
      toast.error("Failed to restrict user");
      console.error(error);
    }
  };

  const handleReportResolved = async (reportedUserId, status) => {
    try {
      const { error } = await supabase
        .from("reported_users")
        .update({
          status,
          resolved_at: new Date().toISOString(),
        })
        .eq("reported_user_id", reportedUserId);

      if (error) throw error;
      fetchAdminData();
    } catch (error) {
      toast.error("Failed to update report");
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="claims">
              Pending Claims ({pendingClaims.length})
            </TabsTrigger>
            <TabsTrigger value="flags">
              Flagged Items ({flags.length})
            </TabsTrigger>
            <TabsTrigger value="reported">
              Reported Users ({reportedUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Item Claims</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingClaims.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No pending claims
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingClaims.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Claimed by: {item.claimed_by}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApproveClaim(item.id, item.claimed_by)
                              }
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDenyClaim(item.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Deny
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flags" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Items</CardTitle>
              </CardHeader>
              <CardContent>
                {flags.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No flagged items
                  </p>
                ) : (
                  <div className="space-y-4">
                    {flags.map((flag) => (
                      <Card key={flag.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {flag.items?.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Reported by: {flag.users?.full_name || flag.users?.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Reason: {flag.reason}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(flag.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteItem(flag.item_id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Item
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reported" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Reported Users</CardTitle>
              </CardHeader>
              <CardContent>
                {reportedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No reported users
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reportedUsers.map((report) => (
                      <Card key={report.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">
                              User ID: {report.reported_user_id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Reason: {report.reason}
                            </p>
                            <Badge className="mt-2">
                              {report.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(report.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-col">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleRestrictUser(
                                  report.reported_user_id,
                                  report.reason
                                )
                              }
                            >
                              Restrict (7d)
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;