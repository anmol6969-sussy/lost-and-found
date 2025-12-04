import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchIcon, PlusCircle, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const checkAdmin = () => {
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
    };
    checkAdmin();
    window.addEventListener("admin-login", checkAdmin);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("admin-login", checkAdmin);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground rounded-lg p-2">
              <SearchIcon className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-foreground">FindIt</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/items" className="text-foreground hover:text-primary transition-colors">
              Browse Items
            </Link>
            <Link to="/items?status=lost" className="text-foreground hover:text-primary transition-colors">
              Lost Items
            </Link>
            <Link to="/items?status=found" className="text-foreground hover:text-primary transition-colors">
              Found Items
            </Link>
            {isAdmin && (
              <Link to="/admin" className="text-foreground hover:text-primary transition-colors font-semibold">
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button onClick={() => navigate("/report")} className="hidden md:flex">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Report Item
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/my-items")}>
                      My Items
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/auth?mode=signup")} className="hidden md:flex">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
