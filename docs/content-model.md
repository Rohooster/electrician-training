# Content Model

This document describes the content data model, tagging system, and edition overlay strategy for multi-jurisdiction exam prep.

## Core Entities

### Jurisdiction

Represents a certification authority and exam program.

```typescript
{
  slug: string,              // 'ca-general-electrician'
  name: string,              // 'California General Electrician'
  state: string,             // 'CA'
  certType: string,          // 'General Electrician'
  codeEditionId: string,     // Links to CodeEdition
  ruleSetId: string,         // Links to RuleSet
  blueprintWeights: JSON,    // Content distribution
}
```

### CodeEdition

Tracks electrical code versions and amendments.

```typescript
{
  slug: string,              // 'cec-2022-nec-2020'
  name: string,              // 'CEC 2022 (NEC 2020 base)'
  baseCode: string,          // 'NEC'
  baseYear: number,          // 2020
  stateAmendment: string,    // 'CEC'
  amendmentYear: number,     // 2022
  effectiveDate: Date,       // When this edition became active
}
```

### RuleSet

Encapsulates exam rules (CIB requirements).

```typescript
{
  examVendor: string,             // 'PSI', 'Prometric', etc.
  questionCount: number,          // 100
  timeLimitMinutes: number,       // 240
  passThresholdPercent: number,   // 70.0
  allowedCodeBooks: JSON,         // ['NEC 2020', 'CEC 2022']
  allowedCalculator: boolean,     // true
  calculatorTypes: JSON,          // ['basic', 'scientific']
  allowTabbing: boolean,          // true
  allowHighlighting: boolean,     // true
  allowNotes: boolean,            // false
  retakeWaitDays: number,         // 14
  rescheduleHoursBefore: number,  // 24
  maxAttemptsPerYear: number?,    // null = unlimited
  earlyArrivalMinutes: number,    // 30
  roomScanRequired: boolean,      // false
}
```

## Item Model

### Item Structure

```typescript
{
  id: string,
  jurisdictionId: string,
  codeEditionId: string,

  // Content
  stem: string,              // Question text
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  correctAnswer: 'A' | 'B' | 'C' | 'D',
  explanation: string?,      // Rationale

  // Classification
  vendorStyle: string,       // 'PSI' - vendor-specific formatting
  topic: string,             // Blueprint category
  cognitive: CognitiveType,  // 'LOOKUP' | 'CALC' | 'THEORY'
  difficulty: DifficultyLevel, // 'EASY' | 'MEDIUM' | 'HARD'

  // Code References (CRITICAL for edition agility)
  necArticleRefs: JSON,      // ['310.16', 'Table 310.16']
  cecAmendmentRefs: JSON,    // ['210.8(A)'] if CA-specific

  // IRT Parameters
  irtA: number?,             // Discrimination (0.5-2.5)
  irtB: number?,             // Difficulty (-3 to +3)
  irtC: number?,             // Guessing (typically 0.25)

  // Telemetry
  timesUsed: number,         // Usage count
  avgTimeSeconds: number?,   // Avg time to answer
  avgLookupTime: number?,    // Avg time in code panel
}
```

### Cognitive Types

**LOOKUP**: Requires navigating code book to find answer

Example:
```
Q: Per Table 310.16, what is the ampacity of 8 AWG copper THHN at 75°C?
A: 50A
```

**CALC**: Requires calculation based on NEC formulas

Example:
```
Q: A dwelling has 2400 sq ft. Per NEC 220.12, what is the general lighting load?
A: 2400 × 3 VA/sq ft = 7200 VA
```

**THEORY**: Conceptual understanding, no lookup or calc

Example:
```
Q: According to NEC Article 100, a receptacle is defined as:
A: A contact device installed at an outlet for connection of an attachment plug
```

### Difficulty Levels

- **EASY**: Basic recall, common articles, straightforward lookups
- **MEDIUM**: Multi-step lookups, moderate calculations, less common articles
- **HARD**: Complex calculations, obscure articles, multi-article synthesis

### IRT Parameters

Item Response Theory parameters enable adaptive testing and ability estimation.

**irtA (Discrimination)**: How well the item differentiates between high and low ability
- Range: 0.5 - 2.5
- Interpretation: Higher = better discriminator
- Example: A well-written conductor sizing calc (a = 1.8) vs ambiguous definition question (a = 0.7)

**irtB (Difficulty)**: Item difficulty on ability scale
- Range: -3 to +3
- Interpretation: Higher = harder item
- Example: Basic definition (b = -1.0) vs complex motor calc (b = 1.5)

**irtC (Guessing)**: Probability of correct guess
- Typical: 0.25 for 4-option multiple choice
- Can be lower (0.10) for highly technical items where random guessing is unlikely to succeed

## Tagging System

### Topic Tags

Items are tagged with blueprint categories:

| Topic Slug | Label |
|------------|-------|
| definitions_general | Definitions & General Requirements |
| branch_feeder_service | Branch Circuits, Feeders & Services |
| conductor_sizing | Conductor Sizing & Ampacity |
| ocpd | Overcurrent Protection |
| grounding_bonding | Grounding & Bonding |
| motors_transformers | Motors & Transformers |
| boxes_enclosures | Boxes, Enclosures & Fill |
| raceway_fill | Raceway & Conduit Fill |
| special_occupancies | Special Occupancies & Systems |
| calculations | Load & Service Calculations |

### Code Reference Tags

Every item includes `necArticleRefs` array with specific citations:

```json
{
  "necArticleRefs": [
    "310.16",
    "Table 310.16",
    "310.15(C)(1)"
  ]
}
```

CA-specific items also include `cecAmendmentRefs`:

```json
{
  "cecAmendmentRefs": [
    "210.8(A)",  // CA extends GFCI beyond base NEC
    "690.12"     // CA Title 24 solar integration
  ]
}
```

## Edition Overlays

### Overlay Strategy

When a new NEC edition is adopted, use overlays to identify impacted items:

1. **Create Edition**: Add new `CodeEdition` for NEC 2023
2. **Build DiffMap**: Compare article numbering changes
3. **Flag Items**: Identify items with outdated `necArticleRefs`
4. **Admin Review**: Content admins verify and update flagged items
5. **Bulk Retag**: Update article references in batch

### DiffMap Structure

```json
{
  "nec_2020_to_2023": {
    "renamed": {
      "Table 310.15(B)(16)": "Table 310.16",
      "310.15(B)(3)(a)": "310.15(C)(1)"
    },
    "deleted": [
      "240.87"  // Moved to another article
    ],
    "added": [
      "690.12(C)"  // New subsection
    ],
    "amended_content": [
      "250.32"  // Article number same, but requirements changed
    ]
  }
}
```

### Overlay Workflow

**Step 1**: Build diff map (automated or manual)

**Step 2**: Query impacted items
```typescript
const impacted = await prisma.item.findMany({
  where: {
    necArticleRefs: {
      hasSome: diffMap.renamed.keys
    }
  }
});
```

**Step 3**: Flag for review
```typescript
await prisma.item.updateMany({
  where: { id: { in: impactedIds } },
  data: { needsReview: true }
});
```

**Step 4**: Admin review interface shows side-by-side comparison of old/new article text (user provides their own code books)

**Step 5**: Bulk update references
```typescript
admin.bulkRetag({
  itemIds,
  necArticleRefs: updatedRefs
});
```

## Calculation Templates

### Template Structure

```typescript
{
  slug: string,              // 'dwelling-service-standard'
  name: string,              // 'Dwelling Service Calculation (Standard Method)'
  category: string,          // 'dwelling_service_standard'

  // Parameter schema defines variable ranges
  parameterSchema: {
    dwelling_area_sqft: {
      type: 'number',
      min: 1000,
      max: 5000,
      step: 100
    },
    has_ac_hp: {
      type: 'enum',
      options: [true, false]
    }
  },

  // Solution algorithm implemented in calc-engine.ts
  solutionAlgorithm: {},

  // NEC citations for this calc type
  necArticleRefs: ['220.12', '220.52', '220.82', '240.6'],
}
```

### Seeded Generation

Calculations use seedrandom for reproducibility:

```typescript
const result = generateCalculation(template, seed: 12345);
// Same seed always produces same problem & solution
```

This enables:
- **Answer key generation**: Deterministic correct answers
- **Practice repeatability**: Students can retry same problem
- **Instructor review**: Check student work against known solution

## Content Import/Export

### JSON Format

```json
{
  "jurisdiction": "ca-general-electrician",
  "codeEdition": "cec-2022-nec-2020",
  "items": [
    {
      "stem": "Per Table 310.16, what is...",
      "optionA": "40A",
      "optionB": "50A",
      "optionC": "55A",
      "optionD": "65A",
      "correctAnswer": "B",
      "explanation": "Table 310.16 shows 8 AWG copper at 75°C is 50A",
      "vendorStyle": "PSI",
      "topic": "conductor_sizing",
      "cognitive": "LOOKUP",
      "difficulty": "EASY",
      "necArticleRefs": ["Table 310.16"],
      "cecAmendmentRefs": [],
      "irtA": 1.0,
      "irtB": -0.5,
      "irtC": 0.25
    }
  ]
}
```

### CSV Format

Simplified format for bulk entry:

```csv
stem,optionA,optionB,optionC,optionD,correctAnswer,topic,cognitive,difficulty,necArticleRefs
"Per Table 310.16...","40A","50A","55A","65A","B","conductor_sizing","LOOKUP","EASY","Table 310.16"
```

### Import API

```typescript
admin.importItems({
  jurisdictionId,
  codeEditionId,
  items: [...]
});
```

## Analytics Data Model

### AbilitySnapshot

Tracks IRT-lite ability estimate over time:

```typescript
{
  userId: string,
  theta: number,           // Ability estimate (-3 to +3)
  standardError: number,   // Uncertainty
  itemsAnswered: number,   // Sample size
  jurisdictionId: string?,
  createdAt: Date,
}
```

### TopicMastery

Per-topic performance tracking:

```typescript
{
  userId: string,
  topic: string,
  totalAttempts: number,
  correctCount: number,
  avgTimeSeconds: number,
  masteryPercent: number,  // 0-100
  avgLookupTime: number?,
  lookupAccuracy: number?,
  lastPracticed: Date,
}
```

## Best Practices

### Item Creation

1. **Single Correct Answer**: Verify exactly one option is correct
2. **Cite Specifically**: Use precise article numbers (e.g., "310.16" not "Article 310")
3. **No Copyrighted Text**: Paraphrase code requirements, never copy NEC verbatim
4. **Vendor Neutral**: Write items that work across PSI, Prometric, etc.
5. **Testable Knowledge**: Focus on application, not memorization

### Code References

1. **Granular Tags**: Use specific subsections ("240.4(D)(5)" not just "240.4")
2. **Include Tables**: Tag both article and table ("310.16" AND "Table 310.16")
3. **Capture Dependencies**: If calc requires multiple articles, tag all
4. **Update References**: When code changes, update refs even if content is similar

### Edition Transitions

1. **Overlap Period**: Support old and new editions simultaneously
2. **User Choice**: Let users select which edition to study
3. **Flag Differences**: Highlight items that changed between editions
4. **Deprecate Gracefully**: Keep old edition items for 1 year post-transition

## Data Integrity

### Validation Rules

- Blueprint weights must sum to 1.0
- Every item must have at least one `necArticleRefs`
- Correct answer must be one of the four options
- IRT parameters must be in valid ranges
- Time limits must be positive

### Audit Logging

Track changes to critical content:

```typescript
{
  entityType: 'Item',
  entityId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  userId: string,
  changes: JSON,  // Old/new values
  timestamp: Date,
}
```

## Future Enhancements

- **Adaptive CAT**: Full Computer-Adaptive Testing using IRT
- **Multi-Language**: Support Spanish, Mandarin for multilingual jurisdictions
- **Image Support**: Diagrams for wiring configurations
- **Explanation Videos**: Link items to video explanations
- **Peer Review**: Community validation of item quality
