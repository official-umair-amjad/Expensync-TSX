import { supabase } from "../../../../utils/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

interface ExpenseData {
  user_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  try {
    const { expenseId } = params;
    const body: Partial<ExpenseData> = await request.json();

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
  } catch (error: unknown) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
