import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Crown, LogOut, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserAvatarMenuProps {
  size?: "sm" | "md";
  className?: string;
}

export function UserAvatarMenu({ size = "md", className }: UserAvatarMenuProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.avatar_url) { setAvatarUrl(null); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url!, 3600);
      if (cancelled) return;
      if (error) { setAvatarUrl(null); return; }
      setAvatarUrl(data?.signedUrl ? `${data.signedUrl}&t=${Date.now()}` : null);
    })();
    return () => { cancelled = true; };
  }, [profile?.avatar_url]);

  const initials = (profile?.name || profile?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const planLabel =
    (profile?.plan ?? "free").charAt(0).toUpperCase() +
    (profile?.plan ?? "free").slice(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "rounded-full ring-offset-background transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:opacity-90",
          className
        )}
        aria-label="Open profile menu"
      >
        <Avatar className={dim}>
          {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.name ?? "User"} />}
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.name ?? "User"} />}
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {profile?.name || "User"}
            </p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {profile?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-1 px-2 py-1.5">
          <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Coins className="h-3.5 w-3.5 text-primary" /> Credits
            </span>
            <span className="font-semibold text-foreground">{profile?.credits ?? 0}</span>
          </div>
          <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-primary" /> Plan
            </span>
            <span className="font-semibold capitalize text-foreground">{planLabel}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
          <SettingsIcon className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/buy-credits")} className="cursor-pointer">
          <Coins className="mr-2 h-4 w-4" />
          Buy Credits
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
