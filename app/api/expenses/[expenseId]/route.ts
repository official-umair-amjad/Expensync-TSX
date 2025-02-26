import { supabase } from "../../../../utils/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    // Extract expenseId from the request URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const expenseId = segments[segments.length - 1]; 
    console.log(expenseId)
    
    if (!expenseId) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }
    
    const body = await request.json();
    console.log(body)
    
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

export async function DELETE(request: NextRequest) {
  try {
    // Extract expenseId from the request URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const expenseId = segments[segments.length - 1];
    console.log(expenseId)

    if (!expenseId) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    // Perform delete logic using Supabase
    const { data, error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Expense deleted successfully", data }, { status: 200 });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
