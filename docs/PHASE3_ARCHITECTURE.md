# Phase 3: Adaptive Assessment & Personalized Learning - Architecture

**Status**: Implementation in Progress
**Owner**: AI System Development
**Priority**: CRITICAL (Core Product Differentiator)

## Overview

Phase 3 implements the adaptive assessment engine and personalized learning path system that makes this platform superior to all competitors. This is the **most important phase** of the entire project.

## Design Principles

1. **Modularity**: All files under 300 lines, clear separation of concerns
2. **Admin Control**: Every parameter configurable via admin UI
3. **Transparency**: Full visibility into how algorithms make decisions
4. **Robustness**: Comprehensive error handling, logging, and fallbacks
5. **Personalization**: Every student gets a unique experience based on their data
6. **Performance**: Efficient algorithms, optimized queries, fast UX

## Core Components

### 1. Adaptive Assessment Engine

**Purpose**: Efficiently determine student's knowledge baseline using IRT (Item Response Theory)

**Key Files**:
- `src/lib/adaptive/irt-engine.ts` - IRT calculations (ability estimation, information functions)
- `src/lib/adaptive/question-selector.ts` - Question selection algorithm (max information + coverage)
- `src/lib/adaptive/assessment-session.ts` - Session state management, termination logic
- `src/server/routers/adaptive.ts` - tRPC procedures for adaptive assessments
- `src/app/student/assessment/page.tsx` - Student UI for taking assessments
- `src/app/admin/assessments/config/page.tsx` - Admin configuration UI

**Algorithm**:
```
1. Initialize ability estimate θ = 0 (average ability)
2. While not converged:
   a. Calculate information function I(θ) for all available items
   b. Select item with max I(θ) that satisfies coverage constraints
   c. Present item to student
   d. Update ability estimate using Bayes: θ_new = f(θ_old, response, item_params)
   e. Calculate standard error SE(θ)
   f. Check termination: SE(θ) < threshold OR max questions reached
3. Generate diagnostic report by concept
```

**IRT Model**: 3-Parameter Logistic (3PL)
```
P(correct | θ, a, b, c) = c + (1-c) / (1 + exp(-a(θ - b)))

where:
  θ = student ability
  a = item discrimination (0.5-2.5)
  b = item difficulty (-3 to +3)
  c = guessing parameter (~0.25 for 4-option MC)
```

**Termination Criteria**:
- SE(θ) < 0.3 (ability estimate sufficiently precise)
- OR Questions asked >= max_questions (default: 25)
- AND Questions asked >= min_questions (default: 10)
- AND All major topics covered (at least 1 question each)

**Admin Controls**:
- Min/max questions
- SE threshold for termination
- Topic coverage requirements (which topics, how many per topic)
- Starting ability estimate
- IRT parameter overrides (for manual calibration)

### 2. Learning Path Generator

**Purpose**: Create personalized study plans based on assessment results and prerequisite graph

**Key Files**:
- `src/lib/learning-path/path-generator.ts` - Path creation algorithm
- `src/lib/learning-path/path-tracker.ts` - Progress tracking, milestone calculations
- `src/lib/learning-path/milestone-engine.ts` - Milestone logic and rewards
- `src/server/routers/learning-path.ts` - tRPC procedures for path management
- `src/app/student/learning-path/page.tsx` - Student path following UI
- `src/app/admin/paths/templates/page.tsx` - Admin path template UI

**Algorithm**:
```
1. Analyze assessment results:
   - Identify weak concepts (mastery < threshold)
   - Identify strong concepts (mastery >= threshold)

2. Build learning sequence:
   - Start with weak concepts
   - Use prerequisite graph to determine order
   - Topological sort ensures prerequisites come first

3. For each concept in sequence:
   - Find similar items using embeddings
   - Select N practice items (difficulty appropriate for student)
   - Add study materials (NEC references, explanations)
   - Define mastery criteria (# correct, accuracy threshold)

4. Add milestones:
   - Checkpoint after each major concept
   - Practice exam at 50% completion
   - Final assessment at 100%

5. Estimate timeline:
   - Concept study time + practice time
   - Student pace factor (faster/slower than average)
```

**Path Structure**:
```typescript
LearningPath {
  id: string
  userId: string
  createdFromAssessmentId: string

  steps: LearningPathStep[] {
    sequence: number
    type: 'CONCEPT_STUDY' | 'PRACTICE_ITEMS' | 'CHECKPOINT' | 'EXAM'
    conceptId?: string
    itemIds: string[]
    requiredAccuracy: number  // 0.7-0.9
    estimatedMinutes: number
    status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'
  }

  milestones: Milestone[] {
    sequence: number
    title: string
    description: string
    requiredSteps: number[]
    reward: 'BADGE' | 'UNLOCK_FEATURE'
  }

  overallProgress: number  // 0-100%
  estimatedCompletionDate: Date
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
}
```

**Admin Controls**:
- Path templates (pre-defined sequences for common scenarios)
- Practice item count per concept (default: 10)
- Mastery thresholds (accuracy required to advance)
- Milestone definitions
- Pacing factors (slow/medium/fast)
- Manual path editing (add/remove steps, reorder)

### 3. Student Profile & Mastery Tracking

**Purpose**: Track student progress, calculate mastery levels, show growth over time

**Key Files**:
- `src/lib/student/profile-service.ts` - Profile CRUD, stats calculations
- `src/lib/student/progress-service.ts` - Progress metrics, learning curves
- `src/lib/student/mastery-calculator.ts` - Concept mastery calculations
- `src/server/routers/student.ts` - tRPC procedures for student data
- `src/app/student/dashboard/page.tsx` - Student dashboard with visualizations
- `src/app/admin/students/[id]/page.tsx` - Admin student detail view

**Student Profile Data**:
```typescript
StudentProfile {
  userId: string

  // Ability estimates
  overallAbility: number  // θ from most recent assessment
  abilityByTopic: Map<string, number>  // Topic-specific abilities

  // Mastery levels
  conceptMastery: Map<conceptId, {
    level: number  // 0-100%
    lastPracticed: Date
    totalAttempts: number
    correctAttempts: number
    averageTime: number
  }>

  // Progress tracking
  totalQuestionsAnswered: number
  totalStudyTimeMinutes: number
  currentStreak: number  // Days studied consecutively
  longestStreak: number

  // Achievements
  badges: Badge[]
  level: number  // Gamification level (1-50)
  xp: number

  // Learning preferences
  pace: 'SLOW' | 'MEDIUM' | 'FAST'
  studyGoalMinutesPerDay: number
  preferredStudyTime: 'MORNING' | 'AFTERNOON' | 'EVENING'
}
```

**Mastery Calculation**:
```
mastery_level = weighted_average([
  recent_accuracy * 0.5,      // Last 10 attempts
  overall_accuracy * 0.3,     // All-time accuracy
  time_efficiency * 0.1,      // Speed vs average
  retention_score * 0.1       // Performance decay over time
])

Thresholds:
  0-40%:   NOVICE (needs study)
  40-70%:  DEVELOPING (needs practice)
  70-85%:  PROFICIENT (ready for exam)
  85-100%: MASTERY (can teach others)
```

**Admin Visibility**:
- Student list with progress indicators
- Individual student detail pages
- Response history with timestamps
- Concept mastery heatmaps
- Learning curve graphs
- Cohort comparison tools

### 4. Data Model Extensions

**New Tables**:

```prisma
// Adaptive assessments
model AdaptiveAssessment {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id])
  jurisdictionId        String
  jurisdiction          Jurisdiction @relation(fields: [jurisdictionId], references: [id])

  // Configuration
  minQuestions          Int      @default(10)
  maxQuestions          Int      @default(25)
  seThreshold           Float    @default(0.3)
  topicCoverageRules    Json     // { "grounding": 2, "conductor_sizing": 3, ... }

  // Session state
  status                String   // 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  startedAt             DateTime
  completedAt           DateTime?

  // Results
  finalAbility          Float?   // θ estimate
  finalSE               Float?   // Standard error
  questionsAsked        Int      @default(0)

  responses             AdaptiveResponse[]
  generatedPath         LearningPath?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model AdaptiveResponse {
  id                    String   @id @default(cuid())
  assessmentId          String
  assessment            AdaptiveAssessment @relation(fields: [assessmentId], references: [id])

  sequence              Int      // Question number (1, 2, 3, ...)
  itemId                String
  item                  Item     @relation(fields: [itemId], references: [id])

  // IRT state at time of selection
  abilityEstimate       Float    // θ before this question
  standardError         Float    // SE(θ) before this question
  itemInformation       Float    // I(θ) for this item

  // Student response
  selectedAnswer        String   // 'A' | 'B' | 'C' | 'D'
  isCorrect             Boolean
  timeSpentSeconds      Int

  // Updated estimates after response
  abilityAfter          Float    // θ after incorporating this response
  seAfter               Float    // SE(θ) after

  createdAt             DateTime @default(now())
}

// Learning paths
model LearningPath {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id])

  title                 String
  description           String

  // Source
  assessmentId          String?  @unique
  assessment            AdaptiveAssessment? @relation(fields: [assessmentId], references: [id])
  templateId            String?
  template              PathTemplate? @relation(fields: [templateId], references: [id])

  // Progress
  status                String   // 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  overallProgress       Float    @default(0)  // 0-100%
  currentStepIndex      Int      @default(0)

  estimatedMinutes      Int      // Total estimated time
  actualMinutes         Int      @default(0)
  estimatedCompletionDate DateTime?

  steps                 LearningPathStep[]
  milestones            PathMilestone[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model LearningPathStep {
  id                    String   @id @default(cuid())
  pathId                String
  path                  LearningPath @relation(fields: [pathId], references: [id])

  sequence              Int
  type                  String   // 'CONCEPT_STUDY' | 'PRACTICE_ITEMS' | 'CHECKPOINT' | 'EXAM'

  conceptId             String?
  concept               Concept? @relation(fields: [conceptId], references: [id])
  items                 Item[]

  // Requirements
  requiredAccuracy      Float    @default(0.7)  // 70% to pass
  requiredAttempts      Int      @default(1)

  // Progress
  status                String   @default('LOCKED')  // 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'
  attemptsCount         Int      @default(0)
  correctCount          Int      @default(0)
  totalTimeSeconds      Int      @default(0)

  estimatedMinutes      Int
  completedAt           DateTime?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([pathId, sequence])
}

model PathMilestone {
  id                    String   @id @default(cuid())
  pathId                String
  path                  LearningPath @relation(fields: [pathId], references: [id])

  sequence              Int
  title                 String
  description           String

  requiredStepIndices   Json     // [1, 2, 3] - steps that must be completed
  rewardType            String?  // 'BADGE' | 'UNLOCK_FEATURE'
  rewardData            Json?

  status                String   @default('LOCKED')  // 'LOCKED' | 'UNLOCKED' | 'CLAIMED'
  unlockedAt            DateTime?

  createdAt             DateTime @default(now())
}

// Path templates (admin-created reusable paths)
model PathTemplate {
  id                    String   @id @default(cuid())

  slug                  String   @unique
  name                  String
  description           String

  jurisdictionId        String
  jurisdiction          Jurisdiction @relation(fields: [jurisdictionId], references: [id])

  // Template configuration
  targetAudience        String   // 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimatedDays         Int

  conceptSequence       Json     // [conceptId1, conceptId2, ...] ordered by prerequisites
  itemsPerConcept       Int      @default(10)

  paths                 LearningPath[]

  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// Student profile
model StudentProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])

  // Ability estimates
  overallAbility        Float    @default(0)
  abilityByTopic        Json     @default("{}")  // { "grounding": 0.5, ... }

  // Concept mastery
  conceptMastery        Json     @default("{}")  // { conceptId: { level, lastPracticed, ... } }

  // Statistics
  totalQuestionsAnswered Int    @default(0)
  totalStudyMinutes      Int    @default(0)
  currentStreak          Int    @default(0)
  longestStreak          Int    @default(0)

  // Gamification
  level                  Int    @default(1)
  xp                     Int    @default(0)
  badges                 Json   @default("[]")

  // Preferences
  pace                   String @default('MEDIUM')  // 'SLOW' | 'MEDIUM' | 'FAST'
  studyGoalMinutesPerDay Int   @default(30)
  preferredStudyTime     String?  // 'MORNING' | 'AFTERNOON' | 'EVENING'

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

## Implementation Strategy

### Stage 1: Core IRT Engine (Days 1-2)
1. Build IRT calculation functions
2. Build question selection algorithm
3. Build session manager
4. Create tRPC procedures
5. Build student assessment UI
6. Test with real items

### Stage 2: Learning Path System (Days 3-4)
1. Build path generation algorithm
2. Build progress tracking
3. Build milestone system
4. Create tRPC procedures
5. Build student path UI
6. Test end-to-end flow

### Stage 3: Student Dashboard (Days 5-6)
1. Build mastery calculator
2. Build progress visualizations
3. Build student dashboard
4. Add achievement system
5. Build profile management

### Stage 4: Admin Tools (Days 7-8)
1. Assessment configuration UI
2. Path template management
3. Student analytics dashboard
4. Cohort comparison tools
5. Manual intervention tools

## Success Metrics

1. **Assessment Efficiency**: Average 15-20 questions to convergence (vs 100 in traditional test)
2. **Prediction Accuracy**: Adaptive assessment predicts actual exam score within ±5%
3. **Learning Effectiveness**: Students following paths score 15-20% higher than control group
4. **Engagement**: 70%+ path completion rate
5. **Satisfaction**: 4.5+ star rating from students

## Competitive Advantage

This system provides:
- **10x faster** baseline assessment (20 questions vs 200)
- **Personalized** learning paths (vs one-size-fits-all)
- **Adaptive** difficulty (vs static practice)
- **Data-driven** recommendations (vs guesswork)
- **Full transparency** into student progress (vs black box)

No competitor in the electrician exam prep space has this level of sophistication.
