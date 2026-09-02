import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the caller and verify admin privileges (RLS-aware client)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("id, school_id, role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.school_id) {
      return NextResponse.json(
        { error: "Only school admins can create teachers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      employee_id,
      joining_date,
      qualification,
      specialization,
    } = body;

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email and password are required." },
        { status: 400 }
      );
    }

    const fullName = `${first_name} ${last_name}`.trim();
    const schoolId = callerProfile.school_id;

    // Create the Auth user with the service-role admin client (server-only)
    const admin = createAdminClient();
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "teacher",
        school_id: schoolId,
      },
    });

    if (createError || !newUser.user) {
      if (createError?.message?.toLowerCase().includes("already")) {
        return NextResponse.json(
          { error: "A user with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: createError?.message || "Failed to create teacher account." },
        { status: 400 }
      );
    }

    const userId = newUser.user.id;

    // Create the profile record (upsert guards against a duplicate if a trigger already created it)
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        school_id: schoolId,
        full_name: fullName,
        email,
        phone: phone || null,
        role: "teacher",
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || "Failed to create teacher profile." },
        { status: 400 }
      );
    }

    // Create the teacher details record
    const { error: detailsError } = await admin.from("teacher_details").upsert(
      {
        profile_id: userId,
        employee_id: employee_id || null,
        joining_date: joining_date || null,
        qualification: qualification || null,
        specialization: specialization || null,
      },
      { onConflict: "profile_id" }
    );

    if (detailsError) {
      return NextResponse.json(
        { error: detailsError.message || "Failed to create teacher details." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id: userId });
  } catch (error) {
    console.error("Create teacher error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the teacher." },
      { status: 500 }
    );
  }
}
