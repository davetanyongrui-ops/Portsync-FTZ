import type { DemoInvoice, InvoiceLine } from "../types";

/**
 * In-memory store for parsed documents.
 *
 * There are no bundled invoices any more: the only way an invoice exists is that
 * the user dropped a file into the terminal and the parser produced one. Nothing
 * here survives a reload, because nothing is persisted.
 */
const INVOICES = new Map<string, DemoInvoice>();

export function registerInvoice(inv: DemoInvoice) {
  INVOICES.set(inv.id, inv);
}

export function getInvoice(id: string | null): DemoInvoice | null {
  if (!id) return null;
  return INVOICES.get(id) ?? null;
}

export function forgetInvoice(id: string) {
  INVOICES.delete(id);
}

/**
 * Correct a recognised figure in place. OCR mis-reads are real — a lost comma
 * turned $5,100.00 into $510,000.00 in testing — so the user must be able to
 * fix the quantity or unit price the engine priced, and every downstream
 * calculation recomputes from the corrected line.
 */
export function updateLine(
  invoiceId: string,
  lineId: string,
  patch: Partial<Pick<InvoiceLine, "qty" | "unitCifUsd" | "docAmountUsd">>,
) {
  const inv = INVOICES.get(invoiceId);
  if (!inv) return;
  // Replace immutably — consumers memoise on the invoice object's identity, so
  // an in-place mutation would leave every downstream calculation stale.
  const lines = inv.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l));
  INVOICES.set(invoiceId, { ...inv, lines });
}
