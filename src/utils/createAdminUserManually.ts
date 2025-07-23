import { supabase } from "@/integrations/supabase/client";

export const createAdminUserManually = async () => {
  try {
    // Step 1: Sign up the admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: "cita_administrator@system.local",
      password: "QDytLmxb81sDQUJvA2ye",
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: "Cita",
          last_name: "Administrator",
          gender: "male"
        }
      }
    });

    if (signUpError) {
      console.error("SignUp error:", signUpError);
      // If user already exists, try to update the profile
      if (signUpError.message.includes("already registered")) {
        // Try to find and update existing profile
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", "cita_administrator@system.local");
        
        if (profiles && profiles.length > 0) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("email", "cita_administrator@system.local");
          
          if (updateError) throw updateError;
          return { success: true, message: "Admin user role updated successfully" };
        }
      }
      throw signUpError;
    }

    // Step 2: Update the profile to admin role if user was created
    if (signUpData.user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", signUpData.user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }
    }

    return { success: true, message: "Admin user created successfully" };
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return { success: false, message: error.message };
  }
};