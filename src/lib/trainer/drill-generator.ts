/**
 * Drill Generator
 *
 * Generates NEC Navigator drills for code lookup practice.
 * Selects articles and creates prompts that require navigation.
 */

import { PrismaClient, DrillType } from '@prisma/client';

interface GenerateDrillOptions {
  jurisdictionId: string;
  drillType: DrillType;
  preferredTopics?: string[]; // Focus on specific weak topics
}

interface DrillData {
  prompt: string;
  targetArticle: string;
  targetTable?: string;
  targetSection?: string;
}

/**
 * Common article/table combinations for drills
 */
const DRILL_TEMPLATES = {
  // Conductor sizing drills
  CONDUCTOR_SIZING: [
    {
      article: '310.16',
      table: 'Table 310.16',
      prompts: [
        'Find the ampacity of 8 AWG copper THHN conductor at 75°C',
        'Locate the table for conductor ampacity ratings based on temperature',
        'What is the maximum ampacity for 4 AWG aluminum THW conductor?',
      ],
    },
    {
      article: '310.12',
      prompts: [
        'Find the minimum size equipment grounding conductor for a 100A circuit',
        'Locate requirements for conductor identification',
      ],
    },
  ],

  // Grounding & Bonding drills
  GROUNDING: [
    {
      article: '250.66',
      table: 'Table 250.66',
      prompts: [
        'Find the minimum size grounding electrode conductor for a 200A service',
        'Locate the table for grounding electrode conductor sizing',
      ],
    },
    {
      article: '250.122',
      table: 'Table 250.122',
      prompts: [
        'Find the minimum size equipment grounding conductor for a 60A feeder',
        'Locate the table for equipment grounding conductor sizing',
      ],
    },
  ],

  // OCPD drills
  OCPD: [
    {
      article: '240.4',
      prompts: [
        'Find the general requirements for overcurrent protection',
        'Locate small conductor overcurrent protection rules',
      ],
    },
    {
      article: '240.6',
      prompts: [
        'Find the standard ampere ratings for fuses and circuit breakers',
        'What are the standard OCPD ratings available?',
      ],
    },
  ],

  // Box fill drills
  BOX_FILL: [
    {
      article: '314.16',
      table: 'Table 314.16(A)',
      prompts: [
        'Find the box fill requirements for conductor count',
        'Locate the table for maximum number of conductors in outlet boxes',
        'Calculate box fill volume for a 4x4 square box',
      ],
    },
  ],

  // Conduit fill drills
  CONDUIT_FILL: [
    {
      article: 'Chapter 9',
      table: 'Table 1',
      prompts: [
        'Find the maximum percent fill for conduits',
        'Locate Table 1 in Chapter 9 for conduit fill requirements',
      ],
    },
    {
      article: 'Chapter 9',
      table: 'Table 4',
      prompts: [
        'Find the dimensions and percent area of EMT conduit',
        'Locate conduit and tubing fill tables',
      ],
    },
  ],

  // Motor drills
  MOTORS: [
    {
      article: '430.52',
      table: 'Table 430.52',
      prompts: [
        'Find the maximum rating for motor branch-circuit short-circuit protection',
        'Locate motor branch-circuit protective device sizing table',
      ],
    },
    {
      article: '430.250',
      table: 'Table 430.250',
      prompts: [
        'Find the full-load current for a 10 HP 3-phase 460V motor',
        'Locate full-load current tables for motors',
      ],
    },
  ],
};

/**
 * Generate a drill based on drill type and preferred topics
 */
export async function generateDrill(
  prisma: PrismaClient,
  options: GenerateDrillOptions
): Promise<DrillData> {
  const { drillType, preferredTopics } = options;

  // Select template category based on preferred topics
  let templateCategory: keyof typeof DRILL_TEMPLATES = 'CONDUCTOR_SIZING';

  if (preferredTopics && preferredTopics.length > 0) {
    const topic = preferredTopics[0];
    if (topic.includes('grounding')) templateCategory = 'GROUNDING';
    else if (topic.includes('ocpd')) templateCategory = 'OCPD';
    else if (topic.includes('boxes')) templateCategory = 'BOX_FILL';
    else if (topic.includes('raceway')) templateCategory = 'CONDUIT_FILL';
    else if (topic.includes('motors')) templateCategory = 'MOTORS';
  }

  // Get random template from category
  const templates = DRILL_TEMPLATES[templateCategory];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const prompt = template.prompts[Math.floor(Math.random() * template.prompts.length)];

  return {
    prompt,
    targetArticle: template.article,
    targetTable: template.table,
    targetSection: undefined,
  };
}
