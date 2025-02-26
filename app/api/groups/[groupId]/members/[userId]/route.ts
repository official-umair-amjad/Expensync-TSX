import { NextRequest, NextResponse } from "next/server";
import {supabase} from ../../../../../utils/supabaseClient

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const userId = searchParams.get("userId");

    if (!groupId || !userId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing groupId or userId" }),
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("memberships")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return new NextResponse(
      JSON.stringify({ message: "User removed" }),
      { status: 200 }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 }
    );
  }
}
