import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Loader2, Package, ArrowLeft, Phone, Mail, MessageCircle, Flag, Check, Edit } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [flagReason, setFlagReason] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ssdLocation, setSsdLocation] = useState("");
  const [ssdContact, setSsdContact] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    fetchItem();
  }, [id]);

  useEffect(() => {
    if (user && item) {
      checkIfUserReported();
    }
  }, [user, item]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*, categories(name, icon)")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching item:", error);
        toast.error("Failed to load item");
      } else {
        setItem(data);
        if (data) {
          setSsdLocation(data.ssd_location || "");
          setSsdContact(data.ssd_contact || "");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserReported = async () => {
    try {
      const { data } = await supabase
        .from("flags")
        .select("id")
        .eq("item_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      setHasReported(!!data);
    } catch (error) {
      console.error("Error checking report status:", error);
    }
  };

  const handleFlag = async () => {
    if (!user) {
      toast.error("Please sign in to report an item");
      return;
    }

    if (!flagReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    if (hasReported) {
      toast.error("You have already reported this item");
      return;
    }

    try {
      const { error } = await supabase.from("flags").insert({
        item_id: id,
        user_id: user.id,
        reporter_name: user.user_metadata?.full_name || user.email,
        reason: flagReason.trim(),
      });

      if (error) throw error;

      toast.success("Item reported successfully. Admins will review it.");
      setFlagReason("");
      setReportDialogOpen(false);
      setHasReported(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to report item");
    }
  };

  const handleClaim = async () => {
    if (!user) {
      toast.error("Please sign in to claim this item");
      return;
    }

    if (item.is_claimed) {
      toast.error("This item has already been claimed");
      return;
    }

    if (item.claim_status === "pending") {
      toast.error("This item already has a pending claim request");
      return;
    }

    setClaiming(true);
    try {
      const { data: currentItem } = await supabase
        .from("items")
        .select("claim_status, is_claimed")
        .eq("id", id)
        .single();

      if (currentItem?.is_claimed) {
        toast.error("This item has already been claimed");
        setClaiming(false);
        return;
      }

      if (currentItem?.claim_status === "pending") {
        toast.error("This item already has a pending claim request");
        setClaiming(false);
        return;
      }

      const { error } = await supabase
        .from("items")
        .update({
          claim_status: "pending",
          claimed_by: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Claim request submitted! Admin will review it soon.");
      fetchItem();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to request claim");
    } finally {
      setClaiming(false);
    }
  };

  const handleUpdateSSD = async () => {
    if (!user || user.id !== item?.user_id) {
      toast.error("You don't have permission to edit this");
      return;
    }

    if (!ssdLocation.trim() && !ssdContact.trim()) {
      toast.error("Please provide at least one field");
      return;
    }

    setEditing(true);
    try {
      const { error } = await supabase
        .from("items")
        .update({
          ssd_location: ssdLocation.trim(),
          ssd_contact: ssdContact.trim(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("SSD information updated successfully");
      fetchItem();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to update SSD info");
    } finally {
      setEditing(false);
    }
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

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Item Not Found</h1>
          <p className="text-muted-foreground mb-6">The item you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/items")}>Browse Items</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/items")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Items
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            {item.images && item.images.length > 0 ? (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground" />
              </div>
            )}

            {item.images && item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.slice(1).map((image, index) => (
                  <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`${item.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-4xl font-bold">{item.title}</h1>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={item.status === "lost" ? "destructive" : "default"}>
                    {item.status === "lost" ? "Lost" : "Found"}
                  </Badge>
                  {item.claim_status === "pending" && (
                    <Badge variant="secondary">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Claim Pending
                    </Badge>
                  )}
                  {item.is_claimed && (
                    <Badge variant="secondary">
                      <Check className="h-3 w-3 mr-1" />
                      Claimed
                    </Badge>
                  )}
                  {item.with_ssd && (
                    <Badge variant="outline">With SSD</Badge>
                  )}
                </div>
              </div>

              {item.categories && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{item.categories.icon}</span>
                  <span className="text-lg text-muted-foreground">{item.categories.name}</span>
                </div>
              )}

              <p className="text-lg text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date {item.status === "lost" ? "Lost" : "Found"}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(item.date_lost_found), "PPP")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SSD Information */}
            {item.with_ssd && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      SSD Information
                    </h3>
                    {user?.id === item.user_id && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update SSD Information</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>SSD Location</Label>
                              <Input
                                value={ssdLocation}
                                onChange={(e) => setSsdLocation(e.target.value)}
                                placeholder="e.g., Main Office, Room 101"
                              />
                            </div>
                            <div>
                              <Label>SSD Contact</Label>
                              <Input
                                value={ssdContact}
                                onChange={(e) => setSsdContact(e.target.value)}
                                placeholder="e.g., contact@ssd.com or +1234567890"
                              />
                            </div>
                            <Button onClick={handleUpdateSSD} disabled={editing} className="w-full">
                              {editing ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update"
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  {ssdLocation && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Location:</strong> {ssdLocation}
                    </p>
                  )}
                  {ssdContact && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Contact:</strong> {ssdContact}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {user ? (
              <>
                {item.contact_info && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Contact Information
                      </h3>
                      <p className="text-muted-foreground">{item.contact_info}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {user.id !== item.user_id && (
                    <>
                      <Button
                        onClick={() => navigate(`/chat/${item.id}`)}
                        className="flex-1"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat with Poster
                      </Button>

                      {!item.is_claimed && item.status === "lost" && (
                        <Button
                          onClick={handleClaim}
                          disabled={claiming || item.claim_status === "pending"}
                          variant={item.claim_status === "pending" ? "outline" : "secondary"}
                        >
                          {claiming ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Requesting...
                            </>
                          ) : item.claim_status === "pending" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Request Pending
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Request Claim
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}

                  {/* Report Button */}
                  <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" title="Report this item">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Report Item</DialogTitle>
                      </DialogHeader>
                      {hasReported ? (
                        <div className="py-4 text-center">
                          <Check className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p className="text-muted-foreground">
                            You have already reported this item. Admins will review it shortly.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reason">Reason for reporting</Label>
                            <Textarea
                              id="reason"
                              value={flagReason}
                              onChange={(e) => setFlagReason(e.target.value)}
                              placeholder="Please describe why you're reporting this item..."
                              rows={4}
                            />
                          </div>
                          <Button 
                            onClick={handleFlag} 
                            className="w-full"
                            disabled={!flagReason.trim()}
                          >
                            <Flag className="h-4 w-4 mr-2" />
                            Submit Report
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Sign in to view contact information and chat
                  </p>
                  <Button onClick={() => navigate("/auth?mode=signup")}>
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            )}

            {item.is_claimed && (
              <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                ✓ This item has been claimed and will be removed after 5 days.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;