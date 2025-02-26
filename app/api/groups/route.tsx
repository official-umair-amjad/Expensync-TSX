import { supabase } from "../../../utils/supabaseClient";
import { NextResponse } from "next/server";

interface GroupRequestBody {
  name: string;
  admin_id: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: GroupRequestBody = await request.json();
    const { name, admin_id } = body;
    
    const { data, error } = await supabase.from("groups").insert([{ name, admin_id }]);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
