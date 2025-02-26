import { supabase } from "../../../../utils/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    // Extract expenseId from the request URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const expenseId = segments[segments.length - 1]; // Get the last segment

    if (!expenseId) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
