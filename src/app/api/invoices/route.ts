import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { invoiceInputSchema, type Invoice } from "@/lib/schema";
import { listInvoices, nextInvoiceNumber, saveInvoice } from "@/lib/storage";

export async function GET() {
  const invoices = await listInvoices();
  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = invoiceInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  const invoice: Invoice = {
    ...parsed.data,
    id: randomUUID(),
    number: await nextInvoiceNumber(),
    createdAt: now,
    updatedAt: now,
  };

  const saved = await saveInvoice(invoice);
  return NextResponse.json(saved, { status: 201 });
}
