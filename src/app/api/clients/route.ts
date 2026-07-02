import { NextResponse } from "next/server";
import { z } from "zod";
import { partySchema } from "@/lib/schema";
import { listClients, saveClient } from "@/lib/storage";

export async function GET() {
  return NextResponse.json(await listClients());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = partySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 422 }
    );
  }

  const created = await saveClient(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
