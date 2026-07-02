import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoice } from "@/lib/storage";
import { InvoiceDocument } from "@/lib/pdf/InvoiceDocument";

type Params = { params: Promise<{ id: string }> };

// react-pdf relies on Node APIs; ensure this route runs on the Node runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const buffer = await renderToBuffer(<InvoiceDocument invoice={invoice} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
