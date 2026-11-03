/**
 * Legal documents for the Legal Centre (#/legal).
 *
 * Content is structured data rendered by LegalPage. All four documents are
 * written to be read together: the disclaimer limits what the output means,
 * the terms bind the visitor to that limit, the privacy statement covers the
 * data story, and acceptable use defines misuse.
 */

export type LegalDoc = "disclaimer" | "tos" | "privacy" | "acceptable-use";

export const LEGAL_UPDATED = "3 November 2026";

export const LEGAL_META: { id: LegalDoc; label: string; short: string; title: string }[] = [
  { id: "disclaimer", label: "Disclaimer", short: "What this tool is not", title: "Disclaimer — read this first" },
  { id: "tos", label: "Terms of service", short: "The agreement", title: "Terms of service" },
  { id: "privacy", label: "Privacy & trade data", short: "Your documents", title: "Privacy & trade data" },
  { id: "acceptable-use", label: "Acceptable use", short: "What you may not do", title: "Acceptable use policy" },
];

export interface LegalSection {
  n: string;
  title: string;
  /** Rendered as paragraphs when string[]. */
  paras: string[];
  bullets?: string[];
  tone?: "warn" | "ok";
}

export const DISCLAIMER: LegalSection[] = [
  {
    n: "0",
    title: "The short version",
    paras: [
      "PortSync is an independent, unaffiliated software tool. It is NOT an official government service, it does not represent and does not work with any government agency, and nothing it produces is official.",
      "The results are produced by artificial intelligence and automated estimation. AI makes mistakes — it can misread your document, pick the wrong tariff heading, or produce a figure that is simply wrong. Every number you see is a starting point for a human to verify, never an answer to file.",
      "There is no guarantee of any kind. By using this service you accept the full terms below, including that you — and you alone — are responsible for anything you file, and that you indemnify the operator against any loss arising from your use of this tool.",
    ],
    tone: "warn",
  },
  {
    n: "1",
    title: "Not official, not affiliated, not endorsed",
    paras: [
      "PortSync is not provided, operated, endorsed, approved, certified or affiliated — formally or informally — with any of the following, or with any other government or quasi-government body, in Indonesia or anywhere else:",
    ],
    bullets: [
      "Direktorat Jenderal Bea dan Cukai (DJBC / Indonesian Customs) and the Ministry of Finance of the Republic of Indonesia.",
      "BP Batam (Badan Pengusahaan Batam) and any of its directorates, including customs clearance and excise.",
      "The Indonesia National Single Window (INSW) and the CEISA 4.0 platform.",
      "Any KPPBC / KPU Bea dan Cukai office, port authority, terminal operator, or licensed customs broker (PPJK).",
      "The World Bank, WITS, TRAINS, or any publisher of the tariff and trade data referenced by this tool.",
      "Any logistics company, forwarder, shipping line, or e-commerce platform.",
    ],
  },
  {
    n: "2",
    title: "The information is produced by AI and automation",
    paras: [
      "Every result — tariff headings, duty and tax figures, compliance flags, summaries and explanations — is generated automatically by software that applies artificial-intelligence and rule-based techniques to the document you provide.",
      "Artificial intelligence is powerful and unreliable at the same time. Known failure modes of this class of system include: misreading characters, digits and separators in scanned or photographed documents; selecting a plausible but wrong tariff heading; omitting items that are present on the page; and stating figures with confidence that they do not deserve.",
      "We actively engineer against these failure modes and flag suspicious figures, but no detection method is complete. An unflagged result is not a verified result — it is merely one that the machine could not detect a problem in.",
    ],
  },
  {
    n: "3",
    title: "No guarantee of any kind",
    paras: [
      "The service is provided \u201cas is\u201d and \u201cas available\u201d, with all faults, and without any representation or warranty of any kind, express or implied, to the maximum extent permitted by applicable law — including but not limited to warranties of accuracy, correctness, completeness, reliability, currency, merchantability, fitness for a particular purpose, and non-infringement.",
      "Without limiting the generality of the foregoing, we do NOT guarantee that:",
    ],
    bullets: [
      "any tariff heading, duty rate, tax figure, or total produced by the tool is correct;",
      "the tariff register is complete, current, or matches the rates an officer would apply on the day;",
      "the exchange rate used matches the kurs pabean applicable to your transaction;",
      "any compliance flag catches every restriction relevant to your goods (or avoids flagging goods that are unrestricted);",
      "the service will be available, uninterrupted, or error-free;",
      "any output will be accepted by customs, a broker, a bank, or any third party.",
    ],
  },
  {
    n: "4",
    title: "This is not professional advice",
    paras: [
      "Nothing in this service constitutes customs, legal, tax, accounting or professional advice, and no licensed-broker (PPJK), consultant or agency relationship is created by using it. The tool is a decision-support aid for people who are preparing — not filing — a pre-declaration estimate.",
      "Any declaration submitted to CEISA 4.0 or any customs system must be prepared, verified, signed and submitted under the licence and responsibility of an authorised person: a licensed PPJK, or the importer of record holding a valid NIB and API. That person — not PortSync, and not the operator — owns the declaration and everything in it.",
    ],
  },
  {
    n: "5",
    title: "You must verify before you rely on anything",
    paras: [
      "Before any figure or heading from this tool is used for any decision, submission, costing, quotation or filing, you must independently verify it against the official sources: the BTKI 2022 tariff book, the applicable PMK rate tables, the kurs pabean published by DJBC, and — for anything material — a licensed customs broker or the relevant customs office.",
      "If you skip this verification, you are acting against the explicit instructions of this disclaimer and entirely at your own risk.",
    ],
  },
  {
    n: "6",
    title: "Assumption of risk and indemnity",
    paras: [
      "You use the service voluntarily and at your own sole risk. You accept full responsibility for every choice you make based on, in reliance on, or informed by any output of the service.",
      "To the maximum extent permitted by applicable law, you agree to indemnify, defend and hold harmless the operator, its owners, directors, employees, contractors and agents from and against any and all claims, demands, actions, investigations, assessments, penalties, fines, duties, taxes, surcharges, losses, damages, liabilities, costs and expenses (including reasonable legal fees) — including those brought by customs authorities, tax authorities, business partners or third parties — arising out of or relating to:",
    ],
    bullets: [
      "your access to or use of the service, or inability to use it;",
      "your reliance on any output, figure, classification, or summary produced by the service;",
      "any declaration, document, filing or submission you (or anyone acting for you) make that is based in whole or in part on the service's output;",
      "any error, omission, inaccuracy or delay in the service, whether or not caused by our negligence and whether or not flagged;",
      "your breach of these terms, the acceptable use policy, or applicable law.",
    ],
  },
  {
    n: "7",
    title: "Limitation of liability",
    paras: [
      "To the maximum extent permitted by applicable law, the operator shall not be liable for any indirect, incidental, special, consequential, exemplary or punitive damages, or for any loss of profit, revenue, business, goodwill, data, goods, time, or for demurrage, detention, storage, penalties, reassessments (SPTNP), audits, or clearance delays — however caused and on any theory of liability — arising from or related to the service.",
      "Where liability cannot be excluded, the operator's total aggregate liability for all claims of every kind is limited to the amount you paid for the service in the twelve months before the claim arose — which, for the free tier, is zero.",
      "Some jurisdictions do not allow certain exclusions or limitations; in that case they apply only to the minimum extent required by law, and every other exclusion in this document remains in full force.",
    ],
  },
  {
    n: "8",
    title: "Known limitations of this build",
    paras: [
      "In the interest of honesty, these are real limitations of the current build, not hypotheticals:",
    ],
    bullets: [
      "The tariff register covers a subset of BTKI 2022 (about 171 subheadings with sourced MFN rates). Goods outside it are marked \u201cneeds an HS code\u201d rather than guessed.",
      "Tariff rates are a 2022 WITS/TRAINS snapshot of Indonesian MFN rates, not a live feed from DJBC. Rates may have changed.",
      "OCR on photographed or skewed paper is inherently imperfect. Figures the tool cannot internally reconcile are flagged — check every amber flag against the original document.",
      "The facility arithmetic models PPFTZ-01 / PP 10/2012 simplifications. A customs officer may determine eligibility differently.",
      "The tool does not transmit anything to CEISA and produces sandbox-shaped payloads only.",
    ],
  },
  {
    n: "9",
    title: "Errors and corrections",
    paras: [
      "If you believe any output is wrong, stop using it, verify independently, and (optionally) tell us via the contact page so the register or rules can be improved. Reporting an error does not make the operator responsible for it, before or after the report.",
    ],
  },
  {
    n: "10",
    title: "Use wisely",
    paras: [
      "This tool is best understood as a fast, well-read colleague who drafts the first pass and never signs anything. Let it do the drudgery; keep the judgement and the signature human.",
      "If you are not prepared to verify its output, do not use it for anything that matters.",
    ],
    tone: "ok",
  },
];

export const TOS: LegalSection[] = [
  {
    n: "1",
    title: "Acceptance of these terms",
    paras: [
      "By accessing or using PortSync in any way — browsing, uploading a document, or using any output — you agree to these Terms of Service, the Disclaimer (which forms an integral part of these terms), the Privacy & Trade Data statement, and the Acceptable Use Policy, all as published on this site and updated from time to time.",
      "If you do not agree with any part of them, you must stop using the service immediately. Continued use after an update is published constitutes acceptance of the update.",
    ],
  },
  {
    n: "2",
    title: "Who provides the service",
    paras: [
      "The service is operated by PT Portsync Logistics Systems (\u201cthe operator\u201d, \u201cwe\u201d), an independent private company. We are not a government body, we are not licensed to act as a customs broker on your behalf through this tool, and we do not submit declarations on anyone's behalf.",
    ],
  },
  {
    n: "3",
    title: "What the service is — and is not",
    paras: [
      "PortSync is a browser-based decision-support tool that reads a commercial invoice you provide, classifies its line items against a reference tariff register, and estimates duty and tax outcomes under several scenarios. It is preparation and estimation software only.",
      "The service does not file, sign, transmit or lodge anything with any customs system, and its exports are drafts for human use.",
    ],
  },
  {
    n: "4",
    title: "No warranties",
    paras: [
      "The service is provided \u201cas is\u201d and \u201cas available\u201d. To the maximum extent permitted by law, all warranties, conditions and terms — express, implied or statutory — are disclaimed, including any of merchantability, fitness for a particular purpose, accuracy, availability, or non-infringement. This clause incorporates the Disclaimer by reference.",
    ],
  },
  {
    n: "5",
    title: "Limitation of liability",
    paras: [
      "To the maximum extent permitted by law, the operator's aggregate liability arising out of or in connection with the service is limited to the amount you paid us in the preceding twelve months (zero for free use), and the operator is never liable for indirect or consequential loss of any kind, including penalties, reassessments, demurrage, lost profit or lost goods.",
    ],
  },
  {
    n: "6",
    title: "Indemnity",
    paras: [
      "You agree to indemnify, defend and hold harmless the operator and its officers, employees and agents against all claims, liabilities, damages, penalties, costs and expenses (including reasonable legal fees) arising from your use of or reliance on the service, any filing based on its output, your documents, or your breach of these terms or applicable law.",
    ],
  },
  {
    n: "7",
    title: "Your documents and conduct",
    paras: [
      "You confirm that you have the right to upload every document you provide, that it describes a genuine transaction, and that your use complies with the Acceptable Use Policy. We may suspend or terminate access for any conduct we reasonably consider abusive, unlawful, or harmful to the service or other users, without notice or liability.",
    ],
  },
  {
    n: "8",
    title: "Availability and changes",
    paras: [
      "We may modify, suspend or discontinue any part of the service at any time, including this free build. Nothing on this site is an offer of continued availability, support, or feature parity. Official changes to customs systems and regulations may break functionality without notice.",
    ],
  },
  {
    n: "9",
    title: "Intellectual property",
    paras: [
      "The software, interface, rules and heuristics are the property of the operator. The BTKI nomenclature, laws and regulations referenced remain the property of the Republic of Indonesia and are used as public reference material.",
    ],
  },
  {
    n: "10",
    title: "Governing law and disputes",
    paras: [
      "These terms are governed by the laws of the Republic of Indonesia, without regard to conflict-of-law rules. Any dispute is subject to the exclusive jurisdiction of the competent courts of Indonesia; the parties consent to that jurisdiction. If any provision is held unenforceable, the remainder continues in force.",
    ],
  },
  {
    n: "11",
    title: "Entire agreement",
    paras: [
      "These terms, the Disclaimer, the Privacy & Trade Data statement and the Acceptable Use Policy constitute the entire agreement between you and the operator regarding the service, and supersede any prior understanding.",
    ],
  },
];

export const PRIVACY: LegalSection[] = [
  {
    n: "0",
    title: "The one-paragraph version",
    paras: [
      "Your documents are processed inside your browser and are never uploaded to us or anyone else. We do not see your invoices. We do not train AI models on them. The only things stored are a theme preference and — if you create one — a local sign-in record, all on your own device.",
    ],
    tone: "ok",
  },
  {
    n: "1",
    title: "Local-first processing",
    paras: [
      "PDF text extraction, OCR, classification and duty arithmetic run entirely in your browser tab. In this build there is no upload endpoint: the document never leaves your machine, and downloaded payloads are generated locally.",
      "The consequence cuts both ways: because we never receive your documents, we cannot back them up, recover them, or be responsible for them. If you close the tab, the session is gone.",
    ],
  },
  {
    n: "2",
    title: "What is stored on your device",
    paras: [
      "Your theme choice, your acceptance of the legal terms, and an optional local session record (display name and role you typed in). All of it lives in your browser's local storage; clearing site data removes everything. Nothing about your documents or results is persisted anywhere else.",
    ],
  },
  {
    n: "3",
    title: "No model training, ever",
    paras: [
      "Invoice text, pricing, supplier names and product descriptions are never used to train any machine-learning model, ours or anyone else's. Classification is performed against a static statutory register with deterministic rules — not by sending your text to an external AI service.",
    ],
  },
  {
    n: "4",
    title: "Data protection law",
    paras: [
      "Handling of any personal data follows Indonesia's Personal Data Protection Law, UU No. 27 of 2022. Because processing is local, we are generally not a controller of your document contents; where any personal data does reach us (for example through a support request you choose to send), we use it only to answer you and delete it on request.",
    ],
  },
  {
    n: "5",
    title: "Your rights",
    paras: [
      "Under UU No. 27/2022 you may access, correct or erase personal data. In this build the practical action is yours to take directly: sign out or clear site data. For anything that reached us by contact channels, write to us and we will act within a reasonable time.",
    ],
  },
  {
    n: "6",
    title: "Third parties",
    paras: [
      "The site is served through standard web hosting infrastructure. We do not embed advertising, third-party analytics on document content, or social trackers. If that ever changes, this document will be updated and re-dated before the change goes live.",
    ],
  },
];

export const ACCEPTABLE_USE: LegalSection[] = [
  {
    n: "1",
    title: "Lawful use only",
    paras: [
      "You may use the service only for lawful pre-declaration preparation on documents you are entitled to process. You must not use it, or its output, to:",
    ],
    bullets: [
      "prepare, support or conceal a false, under-valued, mis-originated or misclassified declaration, or any customs fraud;",
      "evade duty, tax, excise, anti-dumping measures, export controls or sanctions;",
      "process goods, documents or data whose handling is unlawful for you;",
      "circumvent or test the tool as a step towards any of the above.",
    ],
  },
  {
    n: "2",
    title: "Technical restrictions",
    paras: [
      "You must not scrape, frame, resell, white-label or commercially redistribute the service; probe or attack its availability; reverse-engineer it to build a competing classifier; or misrepresent its output as official, certified or broker-verified.",
    ],
  },
  {
    n: "3",
    title: "Consequences",
    paras: [
      "We may restrict access for violations without notice. Nothing here limits any other right or remedy available to the operator, or any liability you bear under law — including, where misuse crosses into fraud, the criminal provisions of Indonesian customs law.",
    ],
  },
  {
    n: "4",
    title: "Reporting misuse",
    paras: [
      "If you become aware of the service being used unlawfully, report it via the contact page. Reports made in good faith are always welcome.",
    ],
  },
];
