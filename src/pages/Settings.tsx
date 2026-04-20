import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, CreditCard, Crown, Loader2, Upload, LogOut } from "lucide-react";
import { toast } from "sonner";

type Tx = {
  id: string;
  amount: number;
  kind: string;
  created_at: string;
  notes: string | null;
  balance_after: number;
};

const kindLabel: Record<string, string> = {
  signup_bonus: "Signup Bonus",
  subscription_grant: "Subscription Grant",
  pack_purchase: "Credit Pack Purchase",
  message_deduct: "Message Used",
  admin_adjust: "Admin Adjustment",
  refund: "Refund",
};

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  // Sign avatar URL (cache-bust on change)
  useEffect(() => {
    if (!profile?.avatar_url) { setAvatarSignedUrl(null); return; }
    (async () => {
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url!, 3600);
      if (error) { console.error("Signed URL error:", error); setAvatarSignedUrl(null); return; }
      setAvatarSignedUrl(data?.signedUrl ? `${data.signedUrl}&t=${Date.now()}` : null);
    })();
  }, [profile?.avatar_url]);

  // Load transactions
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingTx(true);
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("id,amount,kind,created_at,notes,balance_after")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) { toast.error(error.message); setLoadingTx(false); return; }
      setTransactions((data as Tx[]) ?? []);
      setLoadingTx(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() || null })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Profile updated");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max file size: 2MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }

    setUploadingAvatar(true);
    try {
      const ext = (file.name.split(".").pop() || file.type.split("/")[1] || "png").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (upErr) throw upErr;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (updErr) throw updErr;

      await refreshProfile();
      toast.success("Avatar updated");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err?.message || "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = (profile?.name || profile?.email || "U").slice(0, 2).toUpperCase();
  const planLabel = (profile?.plan ?? "free").charAt(0).toUpperCase() + (profile?.plan ?? "free").slice(1);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Settings</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="h-9">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Profile */}
        <Card className="mb-6 border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="h-5 w-5" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarSignedUrl && <AvatarImage src={avatarSignedUrl} alt={profile?.name ?? "Avatar"} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}>
                  {uploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Change Avatar
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">JPG/PNG, max 2MB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="mb-6 border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5" /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div>
                <p className="font-semibold">{planLabel} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.plan === "free"
                    ? "20 signup credits • 3 projects • 1 active assistant"
                    : profile?.plan_renews_at
                      ? `Renews ${new Date(profile.plan_renews_at).toLocaleDateString()}`
                      : "Active subscription"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/buy-credits")}>
                {profile?.plan === "free" ? "Upgrade" : "Manage"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit History */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" /> Credit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/10 p-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="font-semibold">Current Balance: {profile?.credits ?? 0} Credits</span>
            </div>
            {loadingTx ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="-mx-2 overflow-x-auto sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="max-w-[180px] font-medium">
                          <div className="truncate">{kindLabel[h.kind] ?? h.kind}</div>
                          {h.notes && <span className="block truncate text-xs text-muted-foreground">{h.notes}</span>}
                          <span className="block text-xs text-muted-foreground sm:hidden">
                            {new Date(h.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${h.amount > 0 ? "text-primary" : "text-destructive"}`}>
                          {h.amount > 0 ? `+${h.amount}` : h.amount}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {new Date(h.created_at).toLocaleDateString()}
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
    </AppShell>
  );
}
