import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/supabaseClient";

export interface UserWithRole {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
}

export function useUserRole() {
  const { user, session } = useSupabaseAuth();
  const [userWithRole, setUserWithRole] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (!user || !session) {
        setUserWithRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user exists in our database
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("open_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 is "not found" error
          console.error("Error fetching user:", fetchError);
          setLoading(false);
          return;
        }

        if (!existingUser) {
          // Create new user in database
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
              open_id: user.id,
              name: user.user_metadata?.name || user.email?.split("@")[0] || null,
              email: user.email,
              login_method: "magic_link",
              role: "brand_manager", // Default role
              is_active: true,
              last_signed_in: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating user:", insertError);
            setLoading(false);
            return;
          }

          setUserWithRole(newUser as UserWithRole);
        } else {
          // Update last signed in
          const { data: updatedUser } = await supabase
            .from("users")
            .update({ last_signed_in: new Date().toISOString() })
            .eq("open_id", user.id)
            .select()
            .single();

          setUserWithRole((updatedUser || existingUser) as UserWithRole);
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [user, session]);

  return { user: userWithRole, loading };
}
