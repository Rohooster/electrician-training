# California General Electrician Configuration

This document explains how the California General Electrician (Journeyman) jurisdiction is configured and how it maps to PSI's Candidate Information Bulletin (CIB) requirements.

## Jurisdiction Overview

- **Slug**: `ca-general-electrician`
- **State**: California
- **Certification Type**: General Electrician (Journeyman)
- **Governing Body**: California Department of Industrial Relations (DIR) - Electrician Certification Unit (ECU)
- **Exam Vendor**: PSI Services LLC

## Code Edition

### CEC 2022 (NEC 2020 Base)

California adopted the 2020 National Electrical Code (NEC) with state amendments as the California Electrical Code (CEC), Title 24 Part 3, effective January 1, 2023.

**Configuration** (`src/jurisdictions/ca.ts`):
```typescript
codeEdition: {
  slug: 'cec-2022-nec-2020',
  name: 'CEC 2022 (NEC 2020 base)',
  baseCode: 'NEC',
  baseYear: 2020,
  stateAmendment: 'CEC',
  amendmentYear: 2022,
}
```

### Key CA Amendments

California makes specific amendments to the base NEC. Notable examples (article numbers only, no copyrighted text):

- **210.8(A)** - GFCI requirements (CA extends beyond base NEC)
- **210.12(D)** - AFCI requirements
- **250.32** - Grounding for separate buildings/structures
- **680.26** - Pool equipment grounding (CA-specific)
- **690.12** - Solar PV rapid shutdown (integrates with CA Title 24 energy requirements)

All CA amendments are tracked in the `cecAmendmentRefs` field for each item.

## Exam Rules (PSI CIB)

The Rules Engine enforces PSI's Candidate Information Bulletin requirements for the CA General Electrician exam.

### Exam Format

| Rule | Value | Source |
|------|-------|--------|
| Vendor | PSI | CIB |
| Question Count | 100 | CIB |
| Time Limit | 240 minutes (4 hours) | Industry standard |
| Pass Threshold | 70% | CIB |

**Database Model** (`RuleSet`):
```typescript
{
  examVendor: 'PSI',
  questionCount: 100,
  timeLimitMinutes: 240,
  passThresholdPercent: 70.0,
}
```

### Allowed Materials

Per PSI CIB, examinees may bring:

| Material | Allowed | Notes |
|----------|---------|-------|
| NEC 2020 | ✅ | Original code book only |
| CEC 2022 | ✅ | California amendments |
| Calculator | ✅ | Basic or scientific only (no programmable) |
| Tabs/Sticky Notes | ✅ | Pre-placed tabs allowed |
| Highlighting | ✅ | Code book may be highlighted |
| Handwritten Notes | ❌ | Not allowed in code book |

**Configuration**:
```typescript
allowedCodeBooks: ['NEC 2020 (NFPA 70)', 'CEC 2022 (California Electrical Code)'],
allowedCalculator: true,
calculatorTypes: ['basic', 'scientific'],
allowTabbing: true,
allowHighlighting: true,
allowNotes: false,
```

### Retake & Scheduling Policies

| Policy | Value | Source |
|--------|-------|--------|
| Retake Wait | 14 days | PSI standard |
| Reschedule Notice | 24 hours before | PSI policy |
| Max Attempts/Year | Unlimited (with wait period) | DIR/PSI |
| Early Arrival | 30 minutes | PSI requirement |

**Configuration**:
```typescript
retakeWaitDays: 14,
rescheduleHoursBefore: 24,
maxAttemptsPerYear: null,
earlyArrivalMinutes: 30,
```

## Blueprint Weights

Blueprint weights define the content distribution across exam topics. These percentages mirror the CA journeyman exam blueprint and NEC chapter emphasis.

| Topic | Weight | NEC Articles | Notes |
|-------|--------|--------------|-------|
| Definitions & General | 10% | 90, 100, 110 | Fundamental concepts |
| Branch Circuits, Feeders & Services | 12% | 210-230 | Wiring methods |
| Conductor Sizing & Ampacity | 18% | 310, Table 310.16 | Heavily tested |
| Overcurrent Protection | 12% | 240 | OCPD sizing |
| Grounding & Bonding | 15% | 250 | Critical safety topic |
| Motors & Transformers | 10% | 430, 450 | Complex calculations |
| Boxes & Enclosures | 8% | 314 | Box fill calculations |
| Raceway & Conduit Fill | 8% | Chapter 9 | Table 1, 4, 5 |
| Special Occupancies | 5% | 500-590 | Hazardous locations, etc. |
| Load & Service Calculations | 12% | 220.82, 220.83 | Dwelling calcs |

**Total**: 100%

**Validation**: The `validateBlueprintWeights()` function in `ca.ts` ensures weights sum to exactly 1.0.

## Exam Form Building

The `buildExamForm()` utility (`src/lib/exam/form-builder.ts`) composes 100-question exams according to blueprint weights:

1. **Calculate item distribution**: Multiply each topic weight by 100
2. **Adjust for rounding**: Ensure total = 100 questions
3. **Select items**: Pull items from item bank, matching target difficulty (IRT b-param)
4. **Randomize order**: Shuffle final exam to prevent pattern recognition

Example: For conductor_sizing (18%), form builder selects 18 items from the conductor_sizing topic.

## Item Bank Metadata

Every exam item includes CA-specific metadata:

### Required Fields

```typescript
{
  jurisdictionId: string,        // Links to CA jurisdiction
  codeEditionId: string,         // Links to CEC 2022 (NEC 2020)
  topic: string,                 // Blueprint category
  cognitive: 'LOOKUP' | 'CALC' | 'THEORY',
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  necArticleRefs: string[],      // e.g., ['310.16', 'Table 310.16']
  cecAmendmentRefs: string[],    // e.g., ['210.8(A)'] if CA-specific
}
```

### IRT Parameters (Item Response Theory)

For adaptive testing and ability estimation:

- **irtA** (discrimination): 0.5 - 2.5 (how well item differentiates ability)
- **irtB** (difficulty): -3 to +3 (negative = easier, positive = harder)
- **irtC** (guessing): typically 0.25 for 4-option MC

## PSI UX Patterns

The Exam Simulator mirrors PSI's testing interface:

### Layout

- **Header**: Exam title, timer (countdown), current question number
- **Sidebar**: Question navigator grid (shows answered/flagged status)
- **Main Panel**: Single-question display with A/B/C/D options
- **Footer**: Navigation buttons (Previous, Next, Flag, Submit)

### Features

- **Timer**: Counts down from 240 minutes, auto-submits at 0:00
- **Flag for Review**: Orange marker for questions to revisit
- **Question Navigator**: Grid of 1-100, click to jump to question
- **Answer Changing**: Can revise answers before submit
- **Code Panel**: Overlay that simulates code book (tracks lookup time)

### Keyboard Shortcuts

- **A/B/C/D**: Select answer
- **F**: Flag for review
- **N**: Next question
- **P**: Previous question
- **C**: Open code panel
- **Enter**: Submit exam (confirmation required)

## Edition Agility

When California adopts a new code edition (e.g., NEC 2023), the system supports smooth migration:

### DiffMap Facility

1. Create new `CodeEdition` record for NEC 2023
2. Run `diffMap` utility to compare article changes
3. Flag items with impacted `necArticleRefs`
4. Admin reviews and updates flagged items
5. Bulk retag items with new article references

**Example Diff**:
```
NEC 2020: Table 310.15(B)(16) → NEC 2023: Table 310.16
NEC 2020: 310.15(B)(3)(a) → NEC 2023: 310.15(C)(1)
```

Items citing old references are flagged for review.

## Testing Against CIB

To verify compliance with PSI CIB requirements:

1. **Rules Engine Validation**: Ensure RuleSet matches CIB exactly
2. **Blueprint Validation**: Confirm weights match published blueprint
3. **Code Edition Validation**: Verify correct NEC/CEC versions
4. **UX Compliance**: PSI interface patterns are non-IP (general UI/UX)

## Telemetry & Analytics

The system tracks CA-specific metrics:

### Code Panel Usage

- **Time to First Open**: How quickly examinee opens code book
- **Article Hit Accuracy**: Whether examinee navigates to correct article
- **Lookup Path**: Sequence of articles/tables accessed
- **Average Lookup Time**: Time spent in code panel per question

### Topic Mastery

- **Mastery Percent**: Accuracy per blueprint topic
- **Weak Areas**: Bottom 3 topics by performance
- **Recommended Study**: Articles to review based on errors

### Ability Estimation (IRT-Lite)

- **Theta**: Estimated ability (-3 to +3 scale)
- **Standard Error**: Confidence in estimate
- **Pass Probability**: Likelihood of passing real exam

## Resources

- [CA DIR Electrician Certification Unit](https://www.dir.ca.gov/dlse/ecu/electricaltrade.html)
- [PSI Exam Scheduling](https://www.psiexams.com)
- [NFPA NEC Online](https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=70)
- [IAEI California](https://www.iaei.org/page/california-electrical-ceus)

## Notes

- **No Copyrighted Content**: This software cites article/table numbers only. No NEC/CEC text is embedded.
- **PSI Trademark**: PSI® is a registered trademark. This software is not affiliated with PSI Services LLC.
- **NFPA Trademark**: NEC® is a registered trademark of NFPA. This software is not affiliated with or endorsed by NFPA.
- **Educational Use**: This software is for exam preparation only and does not replace official study materials.
