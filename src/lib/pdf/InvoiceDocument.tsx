import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Invoice, Party } from "@/lib/schema";
import { computeTotals, formatMoney, lineTotalCents } from "@/lib/money";

/**
 * The invoice as a react-pdf document. This same component is rendered to a
 * buffer on the server (download route) and can drive a client-side preview.
 * react-pdf uses its own primitives + StyleSheet — no HTML/Tailwind here.
 */

const TERMS_LABEL: Record<Invoice["terms"], string> = {
  due_on_receipt: "Due on receipt",
  net_7: "Net 7",
  net_15: "Net 15",
  net_30: "Net 30",
  net_60: "Net 60",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: "#111827",
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    lineHeight: 1,
    marginBottom: 6,
  },
  muted: { color: "#6b7280" },
  bold: { fontFamily: "Helvetica-Bold" },
  businessName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  metaRight: { textAlign: "right" },
  partiesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  partyCol: { width: "48%" },
  sectionLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#6b7280",
    marginBottom: 4,
  },
  table: { marginTop: 8 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
  },
  cDesc: { width: "52%" },
  cQty: { width: "12%", textAlign: "right" },
  cPrice: { width: "18%", textAlign: "right" },
  cTotal: { width: "18%", textAlign: "right" },
  totals: { marginTop: 14, alignSelf: "flex-end", width: "45%" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#111827",
    marginTop: 4,
    paddingTop: 6,
  },
  grandText: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 28, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
});

function addressLines(p: Party): string[] {
  return [
    p.addressLine1,
    p.addressLine2,
    [p.city, p.region, p.postalCode].filter(Boolean).join(", "),
    p.country,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const { from, to, currency } = invoice;
  const totals = computeTotals({
    items: invoice.items,
    discountPercent: invoice.discountPercent,
    taxPercent: invoice.taxPercent,
  });
  const money = (cents: number) => formatMoney(cents, currency);

  return (
    <Document title={`Invoice ${invoice.number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{from.name || "Your business"}</Text>
            {addressLines(from).map((line, i) => (
              <Text key={i} style={styles.muted}>{line}</Text>
            ))}
            {from.email ? <Text style={styles.muted}>{from.email}</Text> : null}
            {from.taxId ? <Text style={styles.muted}>VAT Reg No: {from.taxId}</Text> : null}
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.bold}>{invoice.number}</Text>
            <Text style={styles.muted}>Issued: {invoice.issueDate}</Text>
            <Text style={styles.muted}>Due: {invoice.dueDate}</Text>
            <Text style={styles.muted}>{TERMS_LABEL[invoice.terms]}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          <View style={styles.partyCol}>
            <Text style={styles.sectionLabel}>Bill to</Text>
            <Text style={styles.bold}>{to.name}</Text>
            {addressLines(to).map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
            {to.email ? <Text style={styles.muted}>{to.email}</Text> : null}
            {to.taxId ? <Text style={styles.muted}>VAT Reg No: {to.taxId}</Text> : null}
          </View>
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.cDesc, styles.bold]}>Description</Text>
            <Text style={[styles.cQty, styles.bold]}>Qty</Text>
            <Text style={[styles.cPrice, styles.bold]}>Unit price</Text>
            <Text style={[styles.cTotal, styles.bold]}>Amount</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.cDesc}>{item.description}</Text>
              <Text style={styles.cQty}>{item.quantity}</Text>
              <Text style={styles.cPrice}>{money(item.unitPriceCents)}</Text>
              <Text style={styles.cTotal}>{money(lineTotalCents(item))}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{money(totals.subtotalCents)}</Text>
          </View>
          {totals.discountCents > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Discount ({invoice.discountPercent}%)</Text>
              <Text>- {money(totals.discountCents)}</Text>
            </View>
          ) : null}
          {totals.taxCents > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>VAT ({invoice.taxPercent}%)</Text>
              <Text>{money(totals.taxCents)}</Text>
            </View>
          ) : null}
          <View style={styles.grandRow}>
            <Text style={styles.grandText}>Total</Text>
            <Text style={styles.grandText}>{money(totals.totalCents)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notes}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
