export interface FtaRecommendation {
  schemeName: string;
  formType: string;
  eligible: boolean;
  legalBasis: string;
  adviceMessage: string;
}

const ASEAN_MEMBERS = ["SG", "MY", "TH", "VN", "PH", "BN", "KH", "LA", "MM", "ID"];

export function getFtaRecommendation(countryOfOrigin: string): FtaRecommendation {
  const origin = (countryOfOrigin || "").trim().toUpperCase();

  if (origin === "JP") {
    return {
      schemeName: "IJEPA / RCEP",
      formType: "Form IJ / RCEP",
      eligible: true,
      legalBasis: "PMK No. 95/PMK.04/2019 jo. PMK No. 102/PMK.010/2022",
      adviceMessage:
        "Detected Japan origin (JP). Use IJEPA (Form IJ) / RCEP preferential tariff route. Do NOT apply ATIGA.",
    };
  }

  if (origin === "CN") {
    return {
      schemeName: "ACFTA (ASEAN-China Free Trade Area)",
      formType: "Form E",
      eligible: true,
      legalBasis: "PMK No. 229/PMK.04/2017 jo. PMK No. 124/PMK.04/2019",
      adviceMessage:
        "Detected goods manufactured in China (CN). ACFTA Form E eliminates import duties on subsequent release to mainland Indonesia. If transshipped via Singapore, verify Non-Manipulation Certificate (NMC/SKB).",
    };
  }

  if (ASEAN_MEMBERS.includes(origin)) {
    return {
      schemeName: "ATIGA (ASEAN Trade in Goods Agreement)",
      formType: "e-Form D via ASW",
      eligible: true,
      legalBasis: "PMK No. 131/PMK.04/2020",
      adviceMessage: `Detected ASEAN origin (${origin}). Electronic Form D issued via ASEAN Single Window eliminates duties on mainland transfer.`,
    };
  }

  return {
    schemeName: "MFN Standard Tariff",
    formType: "None",
    eligible: false,
    legalBasis: "PMK No. 26/PMK.010/2022 (BTKI 2022)",
    adviceMessage: "Standard Most-Favoured-Nation tariff applies. Batam FTZ 0% facility remains active while goods stay within the free zone.",
  };
}