import { supabase } from "../../../../../utils/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Extract groupId from request URL
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const groupId = segments[segments.length - 2]; 

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const { data: members, error } = await supabase
      .from("memberships")
      .select("user_id, role")
      .eq("group_id", groupId);

    if (error) throw error;

    return NextResponse.json({ members }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
