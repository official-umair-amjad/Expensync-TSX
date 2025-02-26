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

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { expenseId } = params;
    const body: ExpenseData = await req.json();
    const { user_id, description, amount, category, date } = body;

    const { error } = await supabase
      .from("expenses")
      .update({ description, amount, category, date })
      .eq("id", expenseId)
      .eq("user_id", user_id); // Only allow the creator to edit

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Expense updated" }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { expenseId } = params;
    const { user_id }: { user_id: string } = await req.json();

    console.log(expenseId);

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("user_id", user_id); // Only allow the creator to delete

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Expense deleted" }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
