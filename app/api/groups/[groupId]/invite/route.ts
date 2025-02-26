import { supabase } from "../../../../../utils/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Extract groupId from the request URL
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const groupId = segments[segments.length - 1]; // Get the last segment

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required." },
        { status: 400 }
      );
    }

    const { email }: { email: string } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Step 1: Find the user by email from auth.users
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: `${email} is not registered in the system` },
        { status: 400 }
      );
    }

    // Step 2: Insert the user into memberships
    const { error: membershipError } = await supabase
      .from("memberships")
      .insert([{ group_id: groupId, user_id: user.id, role: "member" }]);

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: `${email} invited successfully!` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
