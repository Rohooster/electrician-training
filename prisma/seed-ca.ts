/**
 * California Jurisdiction Seed Script
 *
 * Seeds database with CA General Electrician jurisdiction, rules, and sample items.
 * Run with: pnpm seed:ca
 */

import { PrismaClient, CognitiveType, DifficultyLevel } from '@prisma/client';
import { CA_GENERAL_ELECTRICIAN } from '../src/jurisdictions/ca';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding California General Electrician jurisdiction...\n');

  // 1. Create Code Edition
  console.log('📖 Creating code edition...');
  const codeEdition = await prisma.codeEdition.upsert({
    where: { slug: CA_GENERAL_ELECTRICIAN.codeEdition.slug },
    update: {},
    create: {
      slug: CA_GENERAL_ELECTRICIAN.codeEdition.slug,
      name: CA_GENERAL_ELECTRICIAN.codeEdition.name,
      baseCode: CA_GENERAL_ELECTRICIAN.codeEdition.baseCode,
      baseYear: CA_GENERAL_ELECTRICIAN.codeEdition.baseYear,
      stateAmendment: CA_GENERAL_ELECTRICIAN.codeEdition.stateAmendment,
      amendmentYear: CA_GENERAL_ELECTRICIAN.codeEdition.amendmentYear,
      effectiveDate: new Date('2023-01-01'),
    },
  });
  console.log(`✅ Code edition: ${codeEdition.name}\n`);

  // 2. Create RuleSet
  console.log('📋 Creating rule set...');
  const ruleSet = await prisma.ruleSet.create({
    data: {
      examVendor: CA_GENERAL_ELECTRICIAN.rules.examVendor,
      questionCount: CA_GENERAL_ELECTRICIAN.rules.questionCount,
      timeLimitMinutes: CA_GENERAL_ELECTRICIAN.rules.timeLimitMinutes,
      passThresholdPercent: CA_GENERAL_ELECTRICIAN.rules.passThresholdPercent,
      allowedCodeBooks: CA_GENERAL_ELECTRICIAN.rules.allowedCodeBooks,
      allowedCalculator: CA_GENERAL_ELECTRICIAN.rules.allowedCalculator,
      calculatorTypes: CA_GENERAL_ELECTRICIAN.rules.calculatorTypes,
      allowTabbing: CA_GENERAL_ELECTRICIAN.rules.allowTabbing,
      allowHighlighting: CA_GENERAL_ELECTRICIAN.rules.allowHighlighting,
      allowNotes: CA_GENERAL_ELECTRICIAN.rules.allowNotes,
      retakeWaitDays: CA_GENERAL_ELECTRICIAN.rules.retakeWaitDays,
      rescheduleHoursBefore: CA_GENERAL_ELECTRICIAN.rules.rescheduleHoursBefore,
      earlyArrivalMinutes: CA_GENERAL_ELECTRICIAN.rules.earlyArrivalMinutes,
      roomScanRequired: CA_GENERAL_ELECTRICIAN.rules.roomScanRequired,
    },
  });
  console.log(`✅ Rule set: ${ruleSet.examVendor} (${ruleSet.questionCount} questions, ${ruleSet.timeLimitMinutes} min)\n`);

  // 3. Create Jurisdiction
  console.log('🗺️  Creating jurisdiction...');
  const jurisdiction = await prisma.jurisdiction.upsert({
    where: { slug: CA_GENERAL_ELECTRICIAN.slug },
    update: {},
    create: {
      slug: CA_GENERAL_ELECTRICIAN.slug,
      name: CA_GENERAL_ELECTRICIAN.name,
      state: CA_GENERAL_ELECTRICIAN.state,
      certType: CA_GENERAL_ELECTRICIAN.certType,
      codeEditionId: codeEdition.id,
      ruleSetId: ruleSet.id,
      blueprintWeights: CA_GENERAL_ELECTRICIAN.blueprintWeights,
    },
  });
  console.log(`✅ Jurisdiction: ${jurisdiction.name}\n`);

  // 4. Seed Concepts with Prerequisites (CRITICAL for adaptive learning)
  console.log('🧠 Creating concept graph with prerequisites...');
  const concepts = await seedConcepts(prisma, jurisdiction.id);
  console.log(`✅ Created ${concepts.size} concepts with prerequisite relationships\n`);

  // 5. Seed Sample Items (150+ items across all topics)
  console.log('📝 Seeding exam items and linking to concepts...');

  const items = generateSampleItems(jurisdiction.id, codeEdition.id);

  let conceptItemLinks = 0;
  for (const itemData of items) {
    const createdItem = await prisma.item.create({ data: itemData });

    // Link item to relevant concepts based on topic
    const relatedConcepts = getConceptsForTopic(itemData.topic, concepts);
    for (const concept of relatedConcepts) {
      await prisma.conceptItem.create({
        data: {
          conceptId: concept.id,
          itemId: createdItem.id,
          relevanceScore: 0.8, // Default relevance weight
        },
      });
      conceptItemLinks++;
    }
  }

  console.log(`✅ Created ${items.length} exam items`);
  console.log(`✅ Created ${conceptItemLinks} concept-item links\n`);

  // 5. Seed Calculation Templates
  console.log('🧮 Creating calculation templates...');

  const calcTemplates = [
    {
      slug: 'dwelling-service-standard',
      name: 'Dwelling Service Calculation (Standard Method)',
      category: 'dwelling_service_standard',
      parameterSchema: {
        dwelling_area_sqft: { type: 'number', min: 1000, max: 5000, step: 100 },
        has_ac_hp: { type: 'enum', options: [true, false] },
        ac_hp_kva: { type: 'number', min: 2, max: 5, step: 0.5 },
      },
      solutionAlgorithm: {}, // Implemented in calc-engine.ts
      necArticleRefs: ['220.12', '220.52', '220.42', '220.82', '240.6'],
      jurisdictionId: jurisdiction.id,
    },
    {
      slug: 'conductor-ampacity-derate',
      name: 'Conductor Ampacity with Derating',
      category: 'conductor_ampacity',
      parameterSchema: {
        base_ampacity: { type: 'number', min: 20, max: 100, step: 5 },
        ambient_temp_c: { type: 'number', min: 30, max: 50, step: 5 },
        conductors_in_raceway: { type: 'number', min: 3, max: 12, step: 1 },
      },
      solutionAlgorithm: {},
      necArticleRefs: ['Table 310.16', 'Table 310.15(C)(1)'],
      jurisdictionId: jurisdiction.id,
    },
    {
      slug: 'grounding-electrode-conductor',
      name: 'Grounding Electrode Conductor Sizing',
      category: 'grounding_electrode_conductor',
      parameterSchema: {
        service_conductor_size: { type: 'enum', options: ['2 AWG', '1/0 AWG', '3/0 AWG', '250 kcmil'] },
      },
      solutionAlgorithm: {},
      necArticleRefs: ['250.66', 'Table 250.66'],
      jurisdictionId: jurisdiction.id,
    },
  ];

  for (const template of calcTemplates) {
    await prisma.calcTemplate.create({ data: template });
  }

  console.log(`✅ Created ${calcTemplates.length} calculation templates\n`);

  console.log('✨ Seeding complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Jurisdiction: ${jurisdiction.name}`);
  console.log(`   - Code Edition: ${codeEdition.name}`);
  console.log(`   - Exam Items: ${items.length}`);
  console.log(`   - Calc Templates: ${calcTemplates.length}`);
  console.log(`   - Questions per exam: ${ruleSet.questionCount}`);
  console.log(`   - Time limit: ${ruleSet.timeLimitMinutes} minutes`);
  console.log(`   - Pass threshold: ${ruleSet.passThresholdPercent}%\n`);
}

/**
 * Seed Concepts with Prerequisite Graph
 * Creates foundational knowledge graph for adaptive learning paths
 */
async function seedConcepts(prisma: PrismaClient, jurisdictionId: string) {
  const conceptMap = new Map<string, any>();

  // Define concepts with their properties
  const conceptDefs = [
    // FOUNDATIONAL (Level 1 - No prerequisites)
    { slug: 'electrical-safety', name: 'Electrical Safety Fundamentals', description: 'Understand electrical safety practices, hazard identification, and protective equipment requirements per NEC and NFPA 70E', category: 'definitions_general', difficultyLevel: 'EASY', necRefs: ['110.16', 'NFPA 70E'] },
    { slug: 'basic-definitions', name: 'NEC Basic Definitions', description: 'Master fundamental electrical terminology defined in NEC Article 100', category: 'definitions_general', difficultyLevel: 'EASY', necRefs: ['100'] },
    { slug: 'voltage-current-resistance', name: 'Voltage, Current, and Resistance Basics', description: 'Understand the fundamental relationship between voltage, current, and resistance in electrical circuits', category: 'definitions_general', difficultyLevel: 'EASY', necRefs: [] },

    // FOUNDATIONAL CALCULATIONS (Level 2)
    { slug: 'ohms-law', name: "Ohm's Law (V=IR)", description: "Apply Ohm's Law to calculate voltage, current, or resistance in electrical circuits", category: 'calculations', difficultyLevel: 'MEDIUM', necRefs: [], prereqs: ['voltage-current-resistance'] },
    { slug: 'power-calculations', name: 'Power Calculations (P=VI, P=I²R)', description: 'Calculate electrical power using voltage, current, and resistance relationships', category: 'calculations', difficultyLevel: 'MEDIUM', necRefs: [], prereqs: ['ohms-law'] },
    { slug: 'series-parallel-circuits', name: 'Series and Parallel Circuits', description: 'Analyze and calculate total resistance, voltage, and current in series and parallel circuits', category: 'calculations', difficultyLevel: 'MEDIUM', necRefs: [], prereqs: ['ohms-law'] },

    // CONDUCTORS & AMPACITY (Level 2-3)
    { slug: 'conductor-types', name: 'Conductor Types and Insulation', description: 'Identify conductor materials, insulation types, and their applications per NEC 310', category: 'conductor_sizing', difficultyLevel: 'MEDIUM', necRefs: ['310.104'], prereqs: ['basic-definitions'] },
    { slug: 'ampacity-basics', name: 'Ampacity and Temperature Ratings', description: 'Understand ampacity, temperature ratings, and derating factors for conductors', category: 'conductor_sizing', difficultyLevel: 'MEDIUM', necRefs: ['310.14', '310.15'], prereqs: ['conductor-types'] },
    { slug: 'conductor-sizing', name: 'Conductor Sizing (Table 310.16)', description: 'Size conductors using NEC Table 310.16 based on load and conditions', category: 'conductor_sizing', difficultyLevel: 'HARD', necRefs: ['310.16', '240.4'], prereqs: ['ampacity-basics', 'power-calculations'] },
    { slug: 'voltage-drop', name: 'Voltage Drop Calculations', description: 'Calculate voltage drop and select conductors to meet NEC voltage drop recommendations', category: 'conductor_sizing', difficultyLevel: 'HARD', necRefs: ['210.19', '215.2'], prereqs: ['conductor-sizing', 'series-parallel-circuits'] },

    // OVERCURRENT PROTECTION (Level 2-3)
    { slug: 'ocpd-types', name: 'OCPD Types (Breakers, Fuses)', description: 'Identify and compare overcurrent protection device types and applications', category: 'ocpd', difficultyLevel: 'EASY', necRefs: ['240.6'], prereqs: ['basic-definitions'] },
    { slug: 'ocpd-sizing', name: 'OCPD Sizing and Selection', description: 'Size and select overcurrent protection devices per NEC requirements', category: 'ocpd', difficultyLevel: 'MEDIUM', necRefs: ['240.4', '240.6'], prereqs: ['ocpd-types', 'ampacity-basics'] },
    { slug: 'ocpd-protection-rules', name: 'Conductor Protection Rules', description: 'Apply NEC rules for conductor overcurrent protection, including tap rules', category: 'ocpd', difficultyLevel: 'HARD', necRefs: ['240.4', '240.21'], prereqs: ['ocpd-sizing', 'conductor-sizing'] },

    // GROUNDING & BONDING (Level 2-3)
    { slug: 'grounding-concepts', name: 'Grounding vs Bonding Concepts', description: 'Understand the difference between grounding and bonding and their safety purposes', category: 'grounding_bonding', difficultyLevel: 'MEDIUM', necRefs: ['250.4'], prereqs: ['basic-definitions', 'electrical-safety'] },
    { slug: 'grounding-electrode', name: 'Grounding Electrode System', description: 'Install and connect grounding electrode systems per NEC 250', category: 'grounding_bonding', difficultyLevel: 'MEDIUM', necRefs: ['250.50', '250.52'], prereqs: ['grounding-concepts'] },
    { slug: 'grounding-conductor-sizing', name: 'Grounding Conductor Sizing', description: 'Size grounding and bonding conductors using NEC Tables 250.66 and 250.122', category: 'grounding_bonding', difficultyLevel: 'HARD', necRefs: ['250.66', '250.122'], prereqs: ['grounding-electrode', 'conductor-sizing'] },
    { slug: 'equipment-bonding', name: 'Equipment Grounding and Bonding', description: 'Install equipment grounding conductors and bonding jumpers correctly', category: 'grounding_bonding', difficultyLevel: 'HARD', necRefs: ['250.119', '250.148'], prereqs: ['grounding-concepts'] },

    // BRANCH CIRCUITS & FEEDERS (Level 3)
    { slug: 'branch-circuit-basics', name: 'Branch Circuit Requirements', description: 'Understand branch circuit types, ratings, and installation requirements', category: 'branch_feeder_service', difficultyLevel: 'MEDIUM', necRefs: ['210.11', '210.12'], prereqs: ['basic-definitions'] },
    { slug: 'receptacle-requirements', name: 'Receptacle Placement and GFCI/AFCI', description: 'Apply receptacle spacing rules and GFCI/AFCI protection requirements', category: 'branch_feeder_service', difficultyLevel: 'MEDIUM', necRefs: ['210.8', '210.52'], prereqs: ['branch-circuit-basics'] },
    { slug: 'feeder-calculations', name: 'Feeder Load Calculations', description: 'Calculate feeder loads and size feeder conductors and OCPDs', category: 'branch_feeder_service', difficultyLevel: 'HARD', necRefs: ['215.2', '220.40'], prereqs: ['branch-circuit-basics', 'conductor-sizing'] },
    { slug: 'service-requirements', name: 'Service Entrance Requirements', description: 'Install service entrance conductors and equipment per NEC 230', category: 'branch_feeder_service', difficultyLevel: 'HARD', necRefs: ['230.42', '230.79'], prereqs: ['feeder-calculations'] },

    // LOAD CALCULATIONS (Level 3-4)
    { slug: 'general-lighting-loads', name: 'General Lighting Load Calculations', description: 'Calculate general lighting loads using NEC 220.12 and apply demand factors', category: 'calculations', difficultyLevel: 'MEDIUM', necRefs: ['220.12'], prereqs: ['branch-circuit-basics'] },
    { slug: 'appliance-loads', name: 'Appliance and Equipment Loads', description: 'Calculate appliance and equipment loads with appropriate demand factors', category: 'calculations', difficultyLevel: 'MEDIUM', necRefs: ['220.14', '220.53'], prereqs: ['general-lighting-loads'] },
    { slug: 'dwelling-service-calc', name: 'Dwelling Service Load Calculation', description: 'Perform complete dwelling unit service load calculations using standard or optional methods', category: 'calculations', difficultyLevel: 'HARD', necRefs: ['220.82', '220.83'], prereqs: ['appliance-loads', 'feeder-calculations'] },
    { slug: 'commercial-load-calc', name: 'Commercial Load Calculations', description: 'Calculate service and feeder loads for commercial occupancies', category: 'calculations', difficultyLevel: 'HARD', necRefs: ['220.40', '220.61'], prereqs: ['dwelling-service-calc'] },

    // BOXES & ENCLOSURES (Level 2-3)
    { slug: 'box-types', name: 'Outlet and Junction Box Types', description: 'Identify outlet box and junction box types and their proper applications', category: 'boxes_enclosures', difficultyLevel: 'EASY', necRefs: ['314.15'], prereqs: ['basic-definitions'] },
    { slug: 'box-fill-calculations', name: 'Box Fill Calculations', description: 'Calculate box fill per NEC 314.16 to determine minimum box size', category: 'boxes_enclosures', difficultyLevel: 'HARD', necRefs: ['314.16'], prereqs: ['box-types', 'conductor-types'] },

    // RACEWAYS (Level 2-3)
    { slug: 'raceway-types', name: 'Raceway Types and Installation', description: 'Identify raceway types and apply installation requirements per NEC 300', category: 'raceway_fill', difficultyLevel: 'MEDIUM', necRefs: ['300.4', '300.5'], prereqs: ['basic-definitions'] },
    { slug: 'raceway-fill', name: 'Conduit Fill Calculations', description: 'Calculate conduit fill using NEC Chapter 9 tables to size raceways', category: 'raceway_fill', difficultyLevel: 'HARD', necRefs: ['Chapter 9, Table 1'], prereqs: ['raceway-types', 'conductor-types'] },

    // MOTORS (Level 3-4)
    { slug: 'motor-fundamentals', name: 'Motor Types and Characteristics', description: 'Understand motor types, nameplates, and operating characteristics', category: 'motors_transformers', difficultyLevel: 'MEDIUM', necRefs: ['430.6'], prereqs: ['basic-definitions', 'power-calculations'] },
    { slug: 'motor-branch-circuits', name: 'Motor Branch Circuit Sizing', description: 'Size motor branch circuit conductors and short-circuit protection per NEC 430', category: 'motors_transformers', difficultyLevel: 'HARD', necRefs: ['430.22', '430.52'], prereqs: ['motor-fundamentals', 'conductor-sizing', 'ocpd-sizing'] },
    { slug: 'motor-overload-protection', name: 'Motor Overload Protection', description: 'Select and size motor overload protection devices correctly', category: 'motors_transformers', difficultyLevel: 'HARD', necRefs: ['430.32'], prereqs: ['motor-branch-circuits'] },

    // TRANSFORMERS (Level 3-4)
    { slug: 'transformer-basics', name: 'Transformer Principles', description: 'Understand transformer operation, types, and voltage/current relationships', category: 'motors_transformers', difficultyLevel: 'MEDIUM', necRefs: ['450.3'], prereqs: ['voltage-current-resistance', 'power-calculations'] },
    { slug: 'transformer-protection', name: 'Transformer Overcurrent Protection', description: 'Size primary and secondary overcurrent protection for transformers per NEC 450', category: 'motors_transformers', difficultyLevel: 'HARD', necRefs: ['450.3'], prereqs: ['transformer-basics', 'ocpd-sizing'] },

    // SPECIAL OCCUPANCIES (Level 4)
    { slug: 'hazardous-locations', name: 'Hazardous Locations Classification', description: 'Classify hazardous locations and apply appropriate wiring methods per NEC 500', category: 'special_occupancies', difficultyLevel: 'HARD', necRefs: ['500.5', '500.6'], prereqs: ['basic-definitions'] },
    { slug: 'healthcare-facilities', name: 'Healthcare Facility Requirements', description: 'Apply special requirements for healthcare facilities per NEC Article 517', category: 'special_occupancies', difficultyLevel: 'HARD', necRefs: ['517'], prereqs: ['grounding-concepts', 'branch-circuit-basics'] },
  ];

  // Create all concepts
  for (const def of conceptDefs) {
    const concept = await prisma.concept.create({
      data: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category,
        difficultyLevel: def.difficultyLevel,
        bloomLevel: def.bloomLevel,
        necArticleRefs: def.necRefs,
        jurisdictionId,
      },
    });
    conceptMap.set(def.slug, { ...concept, prereqSlugs: def.prereqs || [] });
  }

  // Create prerequisite relationships
  let prereqCount = 0;
  for (const [slug, concept] of conceptMap.entries()) {
    if (concept.prereqSlugs && concept.prereqSlugs.length > 0) {
      for (const prereqSlug of concept.prereqSlugs) {
        const prereqConcept = conceptMap.get(prereqSlug);
        if (prereqConcept) {
          await prisma.conceptPrerequisite.create({
            data: {
              conceptId: concept.id,
              prerequisiteId: prereqConcept.id,
              strength: 1.0, // Required prerequisite
            },
          });
          prereqCount++;
        }
      }
    }
  }

  console.log(`   - Created ${prereqCount} prerequisite relationships`);
  return conceptMap;
}

/**
 * Map exam item topics to relevant concepts
 */
function getConceptsForTopic(topic: string, conceptMap: Map<string, any>): any[] {
  const topicConceptMap: Record<string, string[]> = {
    'definitions_general': ['basic-definitions', 'electrical-safety'],
    'conductor_sizing': ['conductor-types', 'ampacity-basics', 'conductor-sizing', 'voltage-drop'],
    'ocpd': ['ocpd-types', 'ocpd-sizing', 'ocpd-protection-rules'],
    'grounding_bonding': ['grounding-concepts', 'grounding-electrode', 'grounding-conductor-sizing', 'equipment-bonding'],
    'branch_feeder_service': ['branch-circuit-basics', 'receptacle-requirements', 'feeder-calculations', 'service-requirements'],
    'calculations': ['ohms-law', 'power-calculations', 'general-lighting-loads', 'appliance-loads', 'dwelling-service-calc', 'commercial-load-calc'],
    'boxes_enclosures': ['box-types', 'box-fill-calculations'],
    'raceway_fill': ['raceway-types', 'raceway-fill'],
    'motors_transformers': ['motor-fundamentals', 'motor-branch-circuits', 'motor-overload-protection', 'transformer-basics', 'transformer-protection'],
    'special_occupancies': ['hazardous-locations', 'healthcare-facilities'],
  };

  const conceptSlugs = topicConceptMap[topic] || [];
  const concepts: any[] = [];

  for (const slug of conceptSlugs) {
    const concept = conceptMap.get(slug);
    if (concept) {
      concepts.push(concept);
    }
  }

  return concepts;
}

/**
 * Generate 150+ sample exam items across all topics
 */
function generateSampleItems(jurisdictionId: string, codeEditionId: string) {
  const items: any[] = [];

  // Helper to create items
  const createItem = (
    topic: string,
    stem: string,
    options: [string, string, string, string],
    correctIdx: number,
    necRefs: string[],
    cognitive: CognitiveType,
    difficulty: DifficultyLevel,
    irtB?: number
  ) => ({
    jurisdictionId,
    codeEditionId,
    stem,
    optionA: options[0],
    optionB: options[1],
    optionC: options[2],
    optionD: options[3],
    correctAnswer: ['A', 'B', 'C', 'D'][correctIdx],
    vendorStyle: 'PSI',
    topic,
    cognitive,
    difficulty,
    necArticleRefs: necRefs,
    cecAmendmentRefs: [],
    irtA: 1.0,
    irtB: irtB || 0,
    irtC: 0.25,
  });

  // DEFINITIONS & GENERAL (15 items)
  items.push(
    createItem(
      'definitions_general',
      'According to NEC Article 100, a receptacle is defined as:',
      [
        'A contact device installed at an outlet for connection of an attachment plug',
        'An outlet box designed for mounting devices',
        'A point on the wiring system where current is taken to supply utilization equipment',
        'A point on the wiring system where a connection is made',
      ],
      0,
      ['100'],
      'THEORY',
      'EASY',
      -1.0
    )
  );

  items.push(
    createItem(
      'definitions_general',
      'Per NEC 110.14(C), the temperature rating of a conductor is determined by the ____ temperature rating of any connected termination, conductor, or device.',
      ['highest', 'lowest', 'average', 'median'],
      1,
      ['110.14(C)'],
      'THEORY',
      'MEDIUM',
      0.0
    )
  );

  // Add more definition items (13 more)
  for (let i = 0; i < 13; i++) {
    items.push(
      createItem(
        'definitions_general',
        `Definition question ${i + 3}: What is the definition of "accessible" as it relates to equipment?`,
        ['Admitting close approach', 'Capable of being removed', 'Capable of being reached quickly', 'Not permanently enclosed'],
        0,
        ['100'],
        'LOOKUP',
        'EASY',
        -0.5
      )
    );
  }

  // BRANCH CIRCUITS, FEEDERS & SERVICES (18 items)
  items.push(
    createItem(
      'branch_feeder_service',
      'Per NEC 210.19(A)(1), branch-circuit conductors shall have an ampacity not less than the ____ load to be served.',
      ['maximum', 'continuous', 'noncontinuous', 'calculated'],
      0,
      ['210.19(A)(1)'],
      'LOOKUP',
      'MEDIUM',
      0.0
    )
  );

  items.push(
    createItem(
      'branch_feeder_service',
      'NEC 210.8(A) requires GFCI protection for receptacles in which dwelling unit location?',
      ['Bedrooms', 'Living rooms', 'Bathrooms', 'Hallways'],
      2,
      ['210.8(A)'],
      'LOOKUP',
      'EASY',
      -0.5
    )
  );

  // Add more branch/feeder items (16 more)
  for (let i = 0; i < 16; i++) {
    items.push(
      createItem(
        'branch_feeder_service',
        `Branch circuit question ${i + 3}: What is the minimum size branch circuit for general lighting in a dwelling?`,
        ['15A', '20A', '30A', '40A'],
        0,
        ['210.11'],
        'LOOKUP',
        'EASY',
        -0.3
      )
    );
  }

  // CONDUCTOR SIZING (27 items)
  items.push(
    createItem(
      'conductor_sizing',
      'Using Table 310.16, what is the ampacity of 8 AWG copper THHN at 75°C?',
      ['40A', '50A', '55A', '65A'],
      1,
      ['Table 310.16'],
      'LOOKUP',
      'EASY',
      -0.5
    )
  );

  items.push(
    createItem(
      'conductor_sizing',
      'Per Table 310.16, what is the ampacity of 4 AWG copper THW at 75°C?',
      ['55A', '65A', '75A', '85A'],
      3,
      ['Table 310.16'],
      'LOOKUP',
      'MEDIUM',
      0.0
    )
  );

  // Add more conductor sizing items (25 more)
  for (let i = 0; i < 25; i++) {
    items.push(
      createItem(
        'conductor_sizing',
        `Conductor sizing question ${i + 3}: What size copper THHN conductor at 75°C is required for a 60A circuit?`,
        ['10 AWG', '8 AWG', '6 AWG', '4 AWG'],
        2,
        ['Table 310.16'],
        'LOOKUP',
        'MEDIUM',
        0.2
      )
    );
  }

  // OCPD (18 items)
  items.push(
    createItem(
      'ocpd',
      'Per NEC 240.4(D)(5), 12 AWG copper conductors shall be protected at not more than:',
      ['15A', '20A', '25A', '30A'],
      1,
      ['240.4(D)'],
      'LOOKUP',
      'EASY',
      -0.3
    )
  );

  items.push(
    createItem(
      'ocpd',
      'What are the standard ampere ratings per NEC 240.6(A)?',
      ['15, 20, 25, 30, 35, 40...', '10, 15, 20, 25, 30, 35...', '20, 25, 30, 40, 50, 60...', '15, 20, 30, 40, 50, 60...'],
      0,
      ['240.6(A)'],
      'LOOKUP',
      'MEDIUM',
      0.0
    )
  );

  // Add more OCPD items (16 more)
  for (let i = 0; i < 16; i++) {
    items.push(
      createItem(
        'ocpd',
        `OCPD question ${i + 3}: Overcurrent protection for conductors shall not exceed the conductor ampacity after applying adjustment and correction factors per:`,
        ['240.4', '240.6', '310.15', '110.14'],
        0,
        ['240.4'],
        'LOOKUP',
        'MEDIUM',
        0.1
      )
    );
  }

  // GROUNDING & BONDING (22 items)
  items.push(
    createItem(
      'grounding_bonding',
      'Using Table 250.66, what is the minimum size grounding electrode conductor for a service with 3/0 AWG service conductors?',
      ['6 AWG', '4 AWG', '2 AWG', '1/0 AWG'],
      1,
      ['Table 250.66'],
      'LOOKUP',
      'MEDIUM',
      0.3
    )
  );

  items.push(
    createItem(
      'grounding_bonding',
      'Per NEC 250.122, what is the minimum size copper equipment grounding conductor for a 60A circuit?',
      ['14 AWG', '12 AWG', '10 AWG', '8 AWG'],
      2,
      ['Table 250.122'],
      'LOOKUP',
      'EASY',
      -0.2
    )
  );

  // Add more grounding items (20 more)
  for (let i = 0; i < 20; i++) {
    items.push(
      createItem(
        'grounding_bonding',
        `Grounding question ${i + 3}: All grounded electrical systems shall be bonded per NEC:`,
        ['250.4', '250.24', '250.30', '250.50'],
        1,
        ['250.24'],
        'LOOKUP',
        'MEDIUM',
        0.2
      )
    );
  }

  // MOTORS & TRANSFORMERS (15 items)
  items.push(
    createItem(
      'motors_transformers',
      'Per Table 430.52, the maximum rating of an inverse time circuit breaker for motor branch-circuit short-circuit protection is ____ of the full-load current.',
      ['150%', '175%', '225%', '250%'],
      3,
      ['Table 430.52'],
      'LOOKUP',
      'HARD',
      1.0
    )
  );

  // Add more motor items (14 more)
  for (let i = 0; i < 14; i++) {
    items.push(
      createItem(
        'motors_transformers',
        `Motor question ${i + 2}: Motor overload protection is covered in NEC Article:`,
        ['430.31', '430.32', '430.52', '430.62'],
        1,
        ['430.32'],
        'LOOKUP',
        'MEDIUM',
        0.4
      )
    );
  }

  // BOX FILL (12 items)
  items.push(
    createItem(
      'boxes_enclosures',
      'Per Table 314.16(B), what is the free space volume for each 14 AWG conductor in a box?',
      ['1.5 cubic inches', '2.0 cubic inches', '2.25 cubic inches', '2.5 cubic inches'],
      1,
      ['Table 314.16(B)'],
      'LOOKUP',
      'MEDIUM',
      0.2
    )
  );

  // Add more box fill items (11 more)
  for (let i = 0; i < 11; i++) {
    items.push(
      createItem(
        'boxes_enclosures',
        `Box fill question ${i + 2}: Each device strap counts as how many conductors for box fill calculation?`,
        ['1', '2', '3', '4'],
        1,
        ['314.16(B)(4)'],
        'LOOKUP',
        'MEDIUM',
        0.3
      )
    );
  }

  // RACEWAY FILL (12 items)
  items.push(
    createItem(
      'raceway_fill',
      'Per Chapter 9 Table 1, the maximum fill for conduits with 3 or more conductors is:',
      ['31%', '40%', '53%', '60%'],
      1,
      ['Chapter 9, Table 1'],
      'LOOKUP',
      'MEDIUM',
      0.3
    )
  );

  // Add more raceway items (11 more)
  for (let i = 0; i < 11; i++) {
    items.push(
      createItem(
        'raceway_fill',
        `Raceway fill question ${i + 2}: Where are conduit and tubing dimensions found?`,
        ['Chapter 9, Table 1', 'Chapter 9, Table 4', 'Article 300', 'Article 310'],
        1,
        ['Chapter 9, Table 4'],
        'LOOKUP',
        'EASY',
        0.0
      )
    );
  }

  // SPECIAL OCCUPANCIES (7 items)
  items.push(
    createItem(
      'special_occupancies',
      'NEC Article 517 covers electrical installations in:',
      ['Agricultural buildings', 'Health care facilities', 'Hazardous locations', 'Commercial garages'],
      1,
      ['517'],
      'THEORY',
      'EASY',
      -0.5
    )
  );

  // Add more special occupancy items (6 more)
  for (let i = 0; i < 6; i++) {
    items.push(
      createItem(
        'special_occupancies',
        `Special occupancy question ${i + 2}: Class I Division 1 hazardous locations are covered in NEC:`,
        ['500.5', '501.10', '511.3', '517.2'],
        0,
        ['500.5'],
        'LOOKUP',
        'HARD',
        0.8
      )
    );
  }

  // CALCULATIONS (18 items)
  items.push(
    createItem(
      'calculations',
      'Per NEC 220.12, the general lighting load for dwelling units is calculated at:',
      ['2 VA per sq ft', '3 VA per sq ft', '4 VA per sq ft', '5 VA per sq ft'],
      1,
      ['220.12'],
      'CALC',
      'EASY',
      -0.3
    )
  );

  items.push(
    createItem(
      'calculations',
      'A dwelling has 2400 sq ft. Using NEC 220.12, what is the general lighting load?',
      ['4800 VA', '6000 VA', '7200 VA', '9600 VA'],
      2,
      ['220.12'],
      'CALC',
      'MEDIUM',
      0.2
    )
  );

  // Add more calculation items (16 more)
  for (let i = 0; i < 16; i++) {
    items.push(
      createItem(
        'calculations',
        `Calculation question ${i + 3}: A 3000 sq ft dwelling requires how many 20A small appliance circuits minimum?`,
        ['1', '2', '3', '4'],
        1,
        ['220.52(A)'],
        'CALC',
        'MEDIUM',
        0.1
      )
    );
  }

  return items;
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
