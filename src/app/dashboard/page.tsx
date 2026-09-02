import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "admin") {
    redirect("/admin/dashboard");
  }
  if (profile.role === "teacher") {
    redirect("/teacher/dashboard");
  }
  if (profile.role === "parent") {
    redirect("/parent/dashboard");
  }

  redirect("/login");
}
