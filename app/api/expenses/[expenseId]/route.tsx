import { supabase } from "../../../../utils/supabaseClient";
import { NextRequest } from "next/server";

interface Params {
  params: {
    expenseId: string;
  };
}

interface ExpenseData {
  user_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { expenseId: string } }
) {
  try {
    const { expenseId } = params;
    const body = await request.json();

    // Perform update logic (example using Supabase)
    const { data, error } = await supabase
      .from("expenses")
      .update(body)
      .eq("id", expenseId)
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
  }
}
