import { supabase } from "../../../../../utils/supabaseClient";
import { NextRequest } from "next/server";

interface Params {
  params: {
    groupId: string;
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { groupId } = params;
    const { email }: { email: string } = await req.json();

    if (!groupId || !email) {
      return new Response(
        JSON.stringify({ error: "Group ID and email are required." }),
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
      return new Response(
        JSON.stringify({ error: `${email} is not registered in the system` }),
        { status: 400 }
      );
    }

    // Step 2: Insert the user into memberships
    const { error: membershipError } = await supabase
      .from("memberships")
      .insert([{ group_id: groupId, user_id: user.id, role: "member" }]);

    if (membershipError) {
      return new Response(
        JSON.stringify({ error: membershipError.message }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ message: `${email} invited successfully!` }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Internal Server Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
