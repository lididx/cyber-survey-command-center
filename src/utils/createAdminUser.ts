import { supabase } from "@/integrations/supabase/client";

export const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "cita_administrator@system.local")
      .single();

    if (existingProfile) {
      console.log("Admin user already exists");
      return { success: true, message: "Admin user already exists" };
    }

    // Create admin user through auth
    const { data, error } = await supabase.auth.signUp({
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

    if (error) throw error;

    // Update the profile to admin role
    if (data.user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", data.user.id);

      if (updateError) throw updateError;
    }

    return { success: true, message: "Admin user created successfully" };
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return { success: false, message: error.message };
  }
};