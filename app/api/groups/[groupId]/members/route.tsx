import { supabase } from "../../../../../utils/supabaseClient";
import { NextRequest } from "next/server";

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { groupId } = params;

    if (!groupId) {
      return new Response(JSON.stringify({ error: "Group ID is required" }), {
        status: 400,
      });
    }

    const { data: members, error } = await supabase
      .from("memberships")
      .select("user_id, role")
      .eq("group_id", groupId);

    if (error) throw error;

    return new Response(JSON.stringify({ members }), { status: 200 });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500 }
    );
  }
}
