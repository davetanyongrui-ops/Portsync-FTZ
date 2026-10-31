/** Static reference data for the agent — no network calls, deterministic. */

/** PPN in the reference register used by this build. */
export const PPN_RATE = 0.11;
/** PPh Pasal 22 impor with an API holder. */
export const PPH22_RATE = 0.025;

export const KPB = {
  region: "Batam Free Trade Zone (KPBPB)",
  kodeKawasan: "ID-BTM-01",
  authority: "BP Batam",
  regulation: "PP 156/2015 jo. PMK 111/PMK.04/2019",
  facilityForm: "PPFTZ-01",
  customsOffice: "BCTMP Batam (KPPBC TMP B Batu Ampar)",
  code: "051700",
} as const;

export const OPERATOR = {
  company: "PT Portsync Logistics Systems",
  nib: "9120011442233",
  api: "031234567890",
  user: "D. Tan",
  role: "Verification Broker (PPKBM Grade 3)",
  branch: "Batam — Batu Ampar",
} as const;

export const CEISA = {
  system: "CEISA 4.0",
  channel: "ftz/v1/declaration (SANDBOX gateway, no live dispatch)",
  env: "SANDBOX",
} as const;
