import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setLocation("/");
          return;
        }

        if (session) {
          // Check if email is from @compawnion.co domain
          const email = session.user.email;
          if (email && !email.endsWith("@compawnion.co")) {
            await supabase.auth.signOut();
            alert("Only @compawnion.co email addresses are allowed");
            setLocation("/");
            return;
          }

          // Redirect to dashboard
          setLocation("/dashboard");
        } else {
          setLocation("/");
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        setLocation("/");
      }
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
