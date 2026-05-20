import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function normalizeLastSeen(value: string | null) {
  if (!value) return null;

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return null;

  return timestamp.toISOString();
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasMention: false }, { status: 401 });
  }

  const lastSeen = normalizeLastSeen(request.nextUrl.searchParams.get("lastSeen"));
  let query = supabase
    .from("chat_messages")
    .select("id")
    .neq("author_id", user.id)
    .like("body", `%[[person:${user.id}|%`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (lastSeen) {
    query = query.gt("created_at", lastSeen);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ hasMention: false });
  }

  return NextResponse.json({ hasMention: Boolean(data?.length) });
}
