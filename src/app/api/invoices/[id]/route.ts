import { NextResponse } from "next/server";
import { z } from "zod";
import { invoiceSchema } from "@/lib/schema";
import { deleteInvoice, getInvoice, saveInvoice } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const existing = await getInvoice(id);
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // The id, number, and createdAt are immutable; keep the server's copy.
  const merged = {
    ...(body as object),
    id: existing.id,
    number: existing.number,
    createdAt: existing.createdAt,
  };
  const parsed = invoiceSchema.safeParse(merged);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 422 }
    );
  }

  const saved = await saveInvoice(parsed.data);
  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const existing = await getInvoice(id);
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  await deleteInvoice(id);
  return new NextResponse(null, { status: 204 });
}
