# Phase 4: Personalized Learning Pathways - Architecture

**Status**: Implementation in Progress
**Owner**: AI System Development
**Priority**: CRITICAL (Core User Experience)

## Overview

Phase 4 implements the personalized learning pathway system that transforms adaptive assessment results into actionable study plans. This is where all previous phases converge to deliver **the actual learning experience** to students.

## Design Philosophy

1. **Truly Personalized**: Every path unique to the student's knowledge gaps
2. **Scientifically Grounded**: Based on IRT ability estimates and concept mastery
3. **Prerequisite-Aware**: Respects concept dependencies from Phase 1 graph
4. **Content-Rich**: Uses embedding similarity from Phase 2 to find perfect practice items
5. **Adaptive**: Adjusts difficulty and pacing based on performance
6. **Motivating**: Gamification, visible progress, achievable milestones
7. **Admin-Controllable**: Templates, parameters, manual interventions

## System Integration Map

```
Phase 1 (Concepts) → Prerequisite Graph → Path Ordering
Phase 2 (Embeddings) → Similarity Search → Practice Item Selection
Phase 3 (Adaptive Assessment) → Diagnostic Report → Weak Concepts → Path Generation
Phase 4 (Learning Paths) → Student Progress → Updated Mastery → New Assessments
```

## Core Components

### 1. Path Generation Algorithm

**Purpose**: Create personalized study plan from assessment results

**Inputs**:
- Diagnostic report from adaptive assessment
- Student profile (ability, preferences, pace)
- Available concepts with prerequisites
- Item pool with embeddings

**Algorithm**:
```typescript
function generateLearningPath(diagnosticReport, studentProfile, concepts, items):
  // 1. Identify weak concepts (accuracy < 70% or low mastery)
  weakConcepts = diagnosticReport.weakConcepts

  // 2. Get prerequisite chains for each weak concept
  conceptsToLearn = []
  for concept in weakConcepts:
    chain = getPrerequisiteChain(concept)  // Phase 1 graph traversal
    conceptsToLearn.push(...chain)

  // 3. Topological sort to ensure prerequisites first
  orderedConcepts = topologicalSort(conceptsToLearn)

  // 4. For each concept, find best practice items
  steps = []
  for concept in orderedConcepts:
    // Use embedding similarity (Phase 2)
    practiceItems = findItemsForConcept(concept, {
      limit: 10,
      minSimilarity: 0.65,
      difficultyRange: [studentAbility - 0.5, studentAbility + 0.5]
    })

    // Create varied step types
    steps.push({
      type: 'CONCEPT_STUDY',
      concept: concept,
      estimatedMinutes: concept.estimatedMinutes
    })

    steps.push({
      type: 'PRACTICE_SET',
      concept: concept,
      items: practiceItems,
      requiredAccuracy: 0.75,  // Adaptive based on concept difficulty
      estimatedMinutes: practiceItems.length * 2
    })

    // Checkpoint every 3-4 concepts
    if (steps.length % 7 == 0):
      steps.push({
        type: 'CHECKPOINT',
        requiredSteps: last 7 steps,
        reward: 'BADGE'
      })

  // 5. Add final assessment
  steps.push({
    type: 'ASSESSMENT',
    conceptsCovered: orderedConcepts,
    estimatedMinutes: 20
  })

  // 6. Calculate timeline based on student pace
  totalMinutes = sum(step.estimatedMinutes for step in steps)
  dailyMinutes = studentProfile.dailyGoalMinutes
  estimatedDays = totalMinutes / dailyMinutes

  return LearningPath {
    steps: steps,
    estimatedDays: estimatedDays,
    totalMinutes: totalMinutes
  }
```

**Key Features**:
- Respects prerequisites (never study advanced before basics)
- Finds semantically similar practice items (not just topic match)
- Adjusts difficulty to student ability (±0.5θ range)
- Creates varied activities (study, practice, checkpoints)
- Realistic timeline estimation

### 2. Mastery Calculation Engine

**Purpose**: Accurately measure concept mastery from practice performance

**Mastery Formula**:
```typescript
mastery = weighted_average([
  recent_accuracy * 0.40,      // Last 10 attempts (most important)
  overall_accuracy * 0.25,     // All-time accuracy
  time_efficiency * 0.15,      // Speed relative to average
  consistency * 0.10,          // Low variance in performance
  retention * 0.10             // Performance decay over time
])
```

**Components**:

1. **Recent Accuracy** (40% weight)
   - Last 10 attempts on this concept
   - Exponential weighting (most recent = highest weight)
   - `recent_accuracy = sum(correct[i] * 0.9^(10-i)) / sum(0.9^(10-i))`

2. **Overall Accuracy** (25% weight)
   - All attempts on this concept
   - Simple proportion: `correctCount / totalAttempts`

3. **Time Efficiency** (15% weight)
   - Compare to average time for this concept
   - `efficiency = min(1.0, avgTime / studentTime)`
   - Faster = better mastery

4. **Consistency** (10% weight)
   - Low variance indicates stable understanding
   - `consistency = 1 - (stddev(last10) / 0.5)`

5. **Retention** (10% weight)
   - Accounts for forgetting over time
   - If not practiced recently, apply decay
   - `retention = exp(-daysSinceLastPractice / 14)`  // Half-life of 14 days

**Mastery Levels**:
- **0-40%**: NOVICE (needs initial study)
- **40-70%**: DEVELOPING (needs more practice)
- **70-85%**: PROFICIENT (ready for exam)
- **85-100%**: MASTERY (can teach others)

### 3. Progress Tracking System

**Purpose**: Monitor student advancement through learning path

**Tracking Data**:
```typescript
interface PathProgress {
  pathId: string
  userId: string

  // Overall progress
  overallProgress: number  // 0-100%
  currentStepIndex: number
  stepsCompleted: number
  stepsTotal: number

  // Time tracking
  totalTimeSpent: number  // minutes
  estimatedTimeRemaining: number

  // Performance
  conceptsMastered: number  // mastery >= 0.85
  conceptsDeveloping: number  // 0.40 < mastery < 0.85
  conceptsWeak: number  // mastery < 0.40

  // Recent activity
  lastActivity: Date
  currentStreak: number  // consecutive days

  // Milestones
  milestonesUnlocked: number
  milestonesTotal: number

  // Adaptive adjustments
  difficultyAdjustments: Array<{
    date: Date
    reason: string
    oldDifficulty: number
    newDifficulty: number
  }>
}
```

**Step Progression Logic**:
```typescript
function canAdvanceToNextStep(currentStep, performance):
  if currentStep.type == 'CONCEPT_STUDY':
    // Just needs to be marked as read
    return performance.completed

  if currentStep.type == 'PRACTICE_SET':
    // Must meet accuracy requirement
    accuracy = performance.correctCount / performance.totalAttempts
    return accuracy >= currentStep.requiredAccuracy

  if currentStep.type == 'CHECKPOINT':
    // All required steps must be completed
    return all(requiredSteps are completed)

  if currentStep.type == 'ASSESSMENT':
    // Must take assessment (no minimum score required)
    return performance.completed
```

**Adaptive Difficulty Adjustment**:
```typescript
function adjustDifficulty(studentPerformance):
  if recentAccuracy > 0.90 and avgTime < expectedTime:
    // Student is finding it too easy
    newDifficulty = currentDifficulty + 0.3
    replaceItemsWithHarder()

  else if recentAccuracy < 0.50:
    // Student is struggling
    newDifficulty = currentDifficulty - 0.3
    replaceItemsWithEasier()

  // Always stay within reasonable bounds
  newDifficulty = clamp(newDifficulty, studentAbility - 1.0, studentAbility + 1.0)
```

### 4. Milestone & Reward System

**Purpose**: Motivate students with achievements and unlocks

**Milestone Types**:

1. **Concept Completion** - Finish a major concept
2. **Checkpoint** - Pass checkpoint assessment
3. **Streak** - Study N consecutive days
4. **Speed** - Complete X items in under Y minutes
5. **Accuracy** - Achieve X% accuracy on Y items
6. **Path Progress** - Reach 25%, 50%, 75%, 100% completion

**Rewards**:

1. **Badges**:
   - Visual achievements displayed on profile
   - Examples: "Grounding Master", "Speed Demon", "Perfect Streak"

2. **XP & Leveling**:
   - Gain XP for every completed step
   - Level up every 1000 XP
   - Higher levels unlock features (custom study modes, etc.)

3. **Unlocks**:
   - Practice exam access at 50% path completion
   - Final exam simulator at 100% path completion
   - Advanced features (code search, calc tools)

**Milestone Checking**:
```typescript
function checkMilestones(student, path):
  newMilestones = []

  // Check each milestone
  for milestone in path.milestones:
    if milestone.status != 'LOCKED':
      continue

    // Check if requirements met
    requiredStepsCompleted = all(
      path.steps[idx].status == 'COMPLETED'
      for idx in milestone.requiredStepIndices
    )

    if requiredStepsCompleted:
      milestone.status = 'UNLOCKED'
      milestone.unlockedAt = now()
      newMilestones.push(milestone)

      // Award rewards
      if milestone.rewardType == 'BADGE':
        awardBadge(student, milestone.rewardData.badgeId)
      else if milestone.rewardType == 'UNLOCK_EXAM':
        unlockExam(student, milestone.rewardData.examId)

  return newMilestones
```

### 5. Student Profile Management

**Purpose**: Centralized tracking of all student data

**Profile Updates**:
```typescript
function updateStudentProfile(userId, newPerformance):
  profile = getStudentProfile(userId)

  // Update ability estimates
  if newPerformance.type == 'ADAPTIVE_ASSESSMENT':
    profile.overallTheta = newPerformance.finalTheta
    profile.overallSE = newPerformance.finalSE
    profile.topicThetas[topic] = newPerformance.topicTheta

  // Update concept mastery
  for concept in newPerformance.concepts:
    mastery = calculateConceptMastery(userId, concept.id)
    profile.conceptMastery[concept.id] = mastery

  // Update statistics
  profile.totalQuestionsAnswered += newPerformance.questionsAnswered
  profile.totalCorrect += newPerformance.correctCount
  profile.overallAccuracy = profile.totalCorrect / profile.totalQuestionsAnswered
  profile.totalStudyMinutes += newPerformance.timeSpent

  // Update streak
  if isToday(newPerformance.date):
    if isYesterday(profile.lastStudyDate):
      profile.currentStreak += 1
      profile.longestStreak = max(profile.currentStreak, profile.longestStreak)
    else if !isToday(profile.lastStudyDate):
      profile.currentStreak = 1
    profile.lastStudyDate = today()

  // Update gamification
  profile.xp += newPerformance.xpEarned
  profile.level = floor(profile.xp / 1000) + 1

  // Recalculate exam readiness
  profile.estimatedExamScore = predictExamScore(profile)
  profile.readinessLevel = determineReadiness(profile.estimatedExamScore)

  // Identify weak/strong topics
  profile.weakTopics = getWeakTopics(profile.conceptMastery)
  profile.strongTopics = getStrongTopics(profile.conceptMastery)

  saveStudentProfile(profile)
```

## Data Flow

```
1. Student completes adaptive assessment (Phase 3)
   ↓
2. Diagnostic report identifies weak concepts
   ↓
3. Path Generator creates personalized learning path
   - Uses prerequisite graph (Phase 1)
   - Uses embedding similarity (Phase 2)
   - Orders concepts topologically
   - Selects appropriate difficulty items
   ↓
4. Student follows path, completing steps
   ↓
5. Progress Tracker monitors completion
   - Updates step status
   - Calculates concept mastery
   - Checks milestone requirements
   ↓
6. Mastery Calculator determines proficiency
   - Recent accuracy (40%)
   - Overall accuracy (25%)
   - Time efficiency (15%)
   - Consistency (10%)
   - Retention (10%)
   ↓
7. Student Profile updated continuously
   - Ability estimates
   - Concept mastery levels
   - Statistics (questions, accuracy, time)
   - Gamification (XP, level, badges)
   - Exam readiness
   ↓
8. Adaptive adjustments made
   - Difficulty adjusted if too easy/hard
   - Pacing adjusted if ahead/behind schedule
   - Additional practice recommended if struggling
   ↓
9. Milestones unlocked as progress
   - Badges awarded
   - Features unlocked
   - Motivational feedback
   ↓
10. Student reaches path completion
    - Final assessment administered
    - Exam readiness evaluated
    - Next path recommended if needed
```

## Admin Controls

### Path Templates
- Pre-defined paths for common scenarios
- "Beginner to Journeyman" (30-60 days)
- "Weak Areas Reinforcement" (7-14 days)
- "Exam Prep Sprint" (3-7 days)
- Customizable parameters (items per concept, accuracy requirements)

### Manual Interventions
- Add/remove steps from active paths
- Adjust difficulty for struggling students
- Reset concept mastery if needed
- Extend/compress timelines

### Analytics Dashboard
- Cohort comparison (this class vs average)
- Completion rates by concept
- Time-to-mastery distributions
- Predictive analytics (likely to complete? likely to pass exam?)

## Success Metrics

1. **Path Completion Rate**: 70%+ students complete their paths
2. **Mastery Achievement**: 85%+ of concepts reach proficiency (>0.70 mastery)
3. **Engagement**: 60%+ students study 5+ days per week
4. **Exam Performance**: Students following paths score 15-20% higher than control
5. **Time to Readiness**: 30-45 days from beginner to exam-ready

## Competitive Advantages

**No electrician exam prep competitor has:**
1. Personalized paths based on scientific assessment
2. Prerequisite-aware concept sequencing
3. AI-powered practice item selection via embeddings
4. Real-time mastery calculation with 5-factor model
5. Adaptive difficulty adjustment
6. Comprehensive gamification with milestones
7. Full admin visibility and control
8. Predictive analytics for exam readiness

**This system delivers a Netflix-like experience for exam prep**: personalized, adaptive, engaging, and proven effective.
