import { NextResponse } from "next/server";
import { z } from "zod";
import { partySchema } from "@/lib/schema";
import { deleteClient, getClient, saveClient } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const existing = await getClient(id);
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

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

  const saved = await saveClient({ ...parsed.data, id });
  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const existing = await getClient(id);
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  await deleteClient(id);
  return new NextResponse(null, { status: 204 });
}
