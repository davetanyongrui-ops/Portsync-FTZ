import type { Regime } from "../lib/engine";

/**
 * Where the goods are being cleared to.
 *
 * This is the single input that decides whether duty is levied at all, and it is
 * the question a Batam broker actually asks first. Three treatments exist:
 *
 *   suspended — entered into the KPBPB (Batam FTZ). Bea Masuk, PPN, PPnBM and
 *               PPh 22 are not collected while the goods stay in the enclave
 *               (PP 10/2012 jo. PMK 47/PMK.04/2012). Excise goods are the
 *               exception: cukai is still due.
 *   onward    — left the enclave for the customs area (TLDDP) under PPFTZ-03.
 *               Full duty and tax fall due, but a valid Form E / Form D can still
 *               reduce the Bea Masuk component.
 *   direct    — imported straight into the customs area, e.g. Belawan for Medan.
 *               Ordinary PIB, no zone facility, preferential rate still available.
 */

export type Treatment = "suspended" | "onward" | "direct";

export interface Destination {
  id: string;
  /** Port or airport name. */
  port: string;
  city: string;
  /** Region: KPBPB (free zone) or TLDDP (customs area). */
  region: "KPBPB" | "TLDDP";
  treatment: Treatment;
  regime: Regime;
  office: string;
  /** Four-digit Kantor Pabean reference code used in the CEISA header. */
  officeCode: string;
  /** One line the operator can act on. */
  summary: string;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "btm-batuampar",
    port: "Batu Ampar",
    city: "Batam",
    region: "KPBPB",
    treatment: "suspended",
    regime: "PPFTZ-01",
    office: "KPPBC TMP B Batu Ampar",
    officeCode: "051700",
    summary:
      "Entered into the free zone. Duty, PPN, PPnBM and PPh 22 are suspended while the goods remain in the KPBPB.",
  },
  {
    id: "btm-sekupang",
    port: "Sekupang",
    city: "Batam",
    region: "KPBPB",
    treatment: "suspended",
    regime: "PPFTZ-01",
    office: "KPPBC TMP C Sekupang",
    officeCode: "051800",
    summary:
      "Entered into the free zone at Sekupang. Same suspension as Batu Ampar; pick the office that handles your manifest.",
  },
  {
    id: "btm-kabil",
    port: "Kabil / Tanjung Uncang",
    city: "Batam",
    region: "KPBPB",
    treatment: "suspended",
    regime: "PPFTZ-01",
    office: "KPPBC TMP B Tanjung Uncang",
    officeCode: "051900",
    summary:
      "Entered into the free zone. Common for heavy machinery and project cargo.",
  },
  {
    id: "btm-onward",
    port: "Batam FTZ → mainland",
    city: "Batam",
    region: "TLDDP",
    treatment: "onward",
    regime: "PPFTZ-03",
    office: "KPPBC TMP B Batu Ampar",
    officeCode: "051700",
    summary:
      "Released from the enclave to the customs area under PPFTZ-03. Duty and PPN fall due on the released quantity.",
  },
  {
    id: "mdn-belawan",
    port: "Belawan",
    city: "Medan",
    region: "TLDDP",
    treatment: "direct",
    regime: "PIB",
    office: "KPPBC TMP B Belawan",
    officeCode: "040300",
    summary:
      "Imported straight into the customs area. Ordinary PIB — no zone facility, but a valid Form E still cuts the Bea Masuk.",
  },
  {
    id: "mdn-kualatanjung",
    port: "Kuala Tanjung",
    city: "Medan",
    region: "TLDDP",
    treatment: "direct",
    regime: "PIB",
    office: "KPPBC TMP C Kuala Tanjung",
    officeCode: "040500",
    summary: "Direct import into the customs area via the Kuala Tanjung industrial port.",
  },
  {
    id: "jkt-priok",
    port: "Tanjung Priok",
    city: "Jakarta",
    region: "TLDDP",
    treatment: "direct",
    regime: "PIB",
    office: "KPPBC TMP A Tanjung Priok",
    officeCode: "040100",
    summary: "Direct import into the customs area. No zone facility applies.",
  },
  {
    id: "sby-perak",
    port: "Tanjung Perak",
    city: "Surabaya",
    region: "TLDDP",
    treatment: "direct",
    regime: "PIB",
    office: "KPPBC TMP A Tanjung Perak",
    officeCode: "070200",
    summary: "Direct import into the customs area. No zone facility applies.",
  },
  {
    id: "mks-makassar",
    port: "Makassar",
    city: "Makassar",
    region: "TLDDP",
    treatment: "direct",
    regime: "PIB",
    office: "KPPBC TMP A Makassar",
    officeCode: "080400",
    summary: "Direct import into the customs area. No zone facility applies.",
  },
];

export const DEFAULT_DESTINATION = DESTINATIONS[0]!;

export function getDestination(id: string): Destination {
  return DESTINATIONS.find((d) => d.id === id) ?? DEFAULT_DESTINATION;
}

/** True when the free-zone facility is what is holding the duty back. */
export function isSuspended(d: Destination): boolean {
  return d.treatment === "suspended";
}
