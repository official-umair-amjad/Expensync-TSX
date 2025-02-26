import { supabase } from "../../../../utils/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }) {
  const { expenseId } = params;
  const body = await request.json();

  // Perform update logic using Supabase
  const { data, error } = await supabase
    .from("expenses")
    .update(body)
    .eq("id", expenseId)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
