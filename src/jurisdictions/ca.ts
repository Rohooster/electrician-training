/**
 * California General Electrician (Journeyman) Jurisdiction Configuration
 *
 * This file centralizes all CA-specific constants derived from:
 * - PSI Candidate Information Bulletin (CIB)
 * - California Electrical Code (CEC) 2022 based on NEC 2020
 * - DIR Electrician Certification Unit requirements
 *
 * IMPORTANT: Values mirror real-world CIB rules. Update this file when
 * CIB or code editions change.
 */

export const CA_GENERAL_ELECTRICIAN = {
  slug: 'ca-general-electrician',
  name: 'California General Electrician (Journeyman)',
  state: 'CA',
  certType: 'General Electrician',

  // Code edition used by CA (effective Jan 1, 2023)
  codeEdition: {
    slug: 'cec-2022-nec-2020',
    name: 'CEC 2022 (NEC 2020 base)',
    baseCode: 'NEC',
    baseYear: 2020,
    stateAmendment: 'CEC',
    amendmentYear: 2022,
  },

  // PSI/CIB Exam Rules
  rules: {
    examVendor: 'PSI',
    questionCount: 100,
    timeLimitMinutes: 240, // 4 hours per industry standard
    passThresholdPercent: 70.0,

    // Allowed materials per CIB
    allowedCodeBooks: [
      'NEC 2020 (NFPA 70)',
      'CEC 2022 (California Electrical Code)',
    ],
    allowedCalculator: true,
    calculatorTypes: ['basic', 'scientific'], // No programmable/graphing
    allowTabbing: true, // Tabs/sticky notes allowed
    allowHighlighting: true, // Highlighting allowed
    allowNotes: false, // No handwritten notes in code book

    // Retake & scheduling policies (PSI standard)
    retakeWaitDays: 14,
    rescheduleHoursBefore: 24,
    maxAttemptsPerYear: null, // No hard limit, but 14-day wait between attempts

    // Testing environment
    earlyArrivalMinutes: 30,
    roomScanRequired: false, // PSI test centers; true for online proctoring
  },

  /**
   * Blueprint Weights define content distribution across exam topics.
   * These percentages mirror CA journeyman exam blueprints and NEC chapter emphasis.
   *
   * Total must sum to 1.0
   */
  blueprintWeights: {
    // Article 100: Definitions, General Requirements (Articles 90-110)
    definitions_general: 0.10,

    // Articles 210-230: Branch Circuits, Feeders, Services
    branch_feeder_service: 0.12,

    // Article 310: Conductor sizing, ampacity, temperature ratings
    // Table 310.16 (formerly 310.15(B)(16)) is heavily tested
    conductor_sizing: 0.18,

    // Article 240: Overcurrent Protection Devices (breakers, fuses)
    ocpd: 0.12,

    // Article 250: Grounding and Bonding (critical safety topic)
    grounding_bonding: 0.15,

    // Articles 430, 450: Motors, Transformers (complex calculations)
    motors_transformers: 0.10,

    // Article 314: Outlet, Device, Junction Boxes (box fill calculations)
    boxes_enclosures: 0.08,

    // Chapter 9: Raceway fill (conduit sizing, Table 1, Notes to Tables)
    raceway_fill: 0.08,

    // Special occupancies: Articles 500-590 (hazardous locations, etc.)
    special_occupancies: 0.05,

    // Calculation problems: Dwelling loads (Art. 220), service sizing
    calculations: 0.02,
  },

  /**
   * Topic definitions map blueprint categories to NEC articles.
   * Used for item tagging and analytics.
   */
  topics: {
    definitions_general: {
      label: 'Definitions & General Requirements',
      articles: ['90', '100', '110'],
    },
    branch_feeder_service: {
      label: 'Branch Circuits, Feeders & Services',
      articles: ['210', '215', '220', '225', '230'],
    },
    conductor_sizing: {
      label: 'Conductor Sizing & Ampacity',
      articles: ['310', 'Table 310.16'],
    },
    ocpd: {
      label: 'Overcurrent Protection',
      articles: ['240'],
    },
    grounding_bonding: {
      label: 'Grounding & Bonding',
      articles: ['250'],
    },
    motors_transformers: {
      label: 'Motors & Transformers',
      articles: ['430', '450', '460'],
    },
    boxes_enclosures: {
      label: 'Boxes, Enclosures & Fill',
      articles: ['314'],
    },
    raceway_fill: {
      label: 'Raceway & Conduit Fill',
      articles: ['Chapter 9', 'Table 1', 'Table 4', 'Table 5'],
    },
    special_occupancies: {
      label: 'Special Occupancies & Systems',
      articles: ['500', '511', '517', '547', '590'],
    },
    calculations: {
      label: 'Load & Service Calculations',
      articles: ['220.82', '220.83', 'Annex D'],
    },
  },

  /**
   * CA-specific NEC amendments (CEC differences from base NEC 2020)
   * These are reference numbers only; no copyrighted text.
   */
  cecAmendments: [
    '210.8(A)', // GFCI requirements (CA extends beyond base NEC)
    '210.12(D)', // AFCI requirements
    '250.32', // Separate buildings/structures grounding
    '680.26', // Pool equipment grounding (CA-specific)
    '690.12', // Solar PV rapid shutdown (CA Title 24 integration)
  ],
} as const;

/**
 * Helper to validate blueprint weights sum to 1.0
 */
export function validateBlueprintWeights(weights: typeof CA_GENERAL_ELECTRICIAN.blueprintWeights): boolean {
  const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
  return Math.abs(sum - 1.0) < 0.001; // Allow small floating point error
}

// Validate at import time
if (!validateBlueprintWeights(CA_GENERAL_ELECTRICIAN.blueprintWeights)) {
  throw new Error('CA blueprint weights do not sum to 1.0');
}
