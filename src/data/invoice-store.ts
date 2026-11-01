import type { DemoInvoice } from "../types";

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
