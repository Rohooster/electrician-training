# Exam Simulator - Feature Documentation

## Overview

A complete, production-ready PSI-style exam simulator for California General Electrician certification prep. Built with Next.js, TypeScript, tRPC, and Prisma.

## ✅ Completed Features

### 1. Exam Flow
- **Exam List** (`/exam`) - Browse available practice exams
- **Instructions Screen** (`/exam/[id]/instructions`) - Pre-exam agreement (PSI CIB compliance)
- **Exam Interface** (`/exam/[id]/take`) - Main testing environment
- **Results Page** (`/exam/[id]/results`) - Score breakdown with detailed review
- **Exam History** (`/exam/history`) - Track all attempts and progress

### 2. Core Components

#### ExamHeader
- Live countdown timer with color warnings
  - Green: > 30 minutes
  - Yellow: 10-30 minutes
  - Red: < 10 minutes (critical)
- Current question indicator
- Exam title display

#### QuestionCard
- Clean, single-question display
- A/B/C/D multiple choice options
- Keyboard shortcuts (A, B, C, D keys)
- Visual selection feedback
- Flag indicator when question marked for review

#### NavigationSidebar
- 100-question grid navigator
- Visual status indicators:
  - Blue: Answered
  - Gray: Unanswered
  - Orange: Flagged for review
- Progress summary (answered count, flagged count)
- Click any number to jump to question

#### ExamFooter
- Previous/Next navigation
- Flag for Review button
- Code Panel toggle
- Submit Exam button

#### CodePanel
- Slide-in overlay from right
- Searchable NEC/CEC article index
- Quick access to common articles (100, 210, 240, 250, 310, etc.)
- No copyrighted text - article numbers and titles only
- Telemetry logging for analytics

#### AnswerReview (NEW!)
- **Detailed answer breakdown** for each question
- Filter by: All / Incorrect / Correct
- Expandable question cards showing:
  - Correct answer highlighted in green
  - User's incorrect answer highlighted in red
  - Explanation with NEC citations
  - Study tips for missed questions
- **Question bookmarking** - save questions to review later
- Visual bookmark icon (filled when bookmarked)

### 3. Custom Hooks

#### useExamTimer
- Countdown from time limit to 0
- Auto-submit when timer expires
- Warning thresholds at 30min, 10min, 1min
- Formatted display (HH:MM:SS)
- Percentage remaining calculation

#### useExamState
- Current question index management
- Response tracking (answers + flags)
- Navigation between questions
- Auto-save to backend via tRPC
- Track time spent per question

### 4. Backend Integration

All exam data flows through tRPC procedures:

**Exam Router**:
- `exam.listForms` - Get available exams
- `exam.start` - Create ExamSitting, start timer
- `exam.getSitting` - Load exam with responses
- `exam.submitResponse` - Auto-save answer (debounced)
- `exam.submit` - Final submission, calculate score
- `exam.getHistory` - Fetch user's past attempts

### 5. Answer Review Features (NEW!)

**On Results Page**:
1. **Correct/Incorrect Breakdown**
   - See every question with your answer vs correct answer
   - Color-coded: Green = correct, Red = incorrect
   - Explanation text with rationale

2. **NEC Citations**
   - Each question shows referenced articles
   - Quick links to relevant code sections
   - Example: "NEC 310.16", "Table 250.66"

3. **Study Tips**
   - Automatically generated for incorrect answers
   - Recommends specific NEC articles to review
   - Suggests related practice (NEC Navigator, calcs)

4. **Question Bookmarking**
   - Click bookmark icon on any question
   - Save difficult questions for later study
   - Bookmarks persist in UI (client-side state for now)
   - Future: Store bookmarks in database per user

5. **Filter View**
   - All Questions (default)
   - Incorrect Only (focus on mistakes)
   - Correct Only (review what you got right)

### 6. Exam History (NEW!)

**Features** (`/exam/history`):
- **Summary Statistics**:
  - Total attempts
  - Passed count
  - Average score across all attempts
  - Improvement trend (improving/stable/declining)

- **Detailed Attempt List**:
  - Chronological list of all exams taken
  - Pass/Fail status for each
  - Score percentage
  - Time spent
  - Date/timestamp
  - Link to review results

- **Progress Tracking**:
  - Visual progress bars for each attempt
  - Score trend over time
  - Identifies if student is improving

- **Personalized Tips**:
  - Study recommendations based on performance
  - Encouragement for passing students
  - Actionable advice for students who haven't passed yet

## Technical Implementation

### PSI-Style UX Patterns

1. **No Pause Functionality** - Timer runs continuously (matches real PSI exams)
2. **Single Question Display** - Focus on one question at a time
3. **Navigation Grid** - Quick jump to any question
4. **Flag System** - Mark questions for review before submit
5. **Confirmation Modal** - Prevents accidental submission
6. **Open Book Simulation** - Code panel available during exam

### Data Flow

```
User clicks "Start Exam"
  ↓
tRPC: exam.start({ examFormId })
  ↓
Create ExamSitting in database
  ↓
Redirect to /exam/[sittingId]/instructions
  ↓
User agrees to terms
  ↓
Redirect to /exam/[sittingId]/take
  ↓
Load sitting with items
  ↓
Initialize useExamTimer + useExamState
  ↓
User answers questions (auto-saved via exam.submitResponse)
  ↓
User clicks "Submit Exam"
  ↓
Confirmation modal appears
  ↓
tRPC: exam.submit({ sittingId })
  ↓
Calculate score, update ability estimate
  ↓
Redirect to /exam/[sittingId]/results
  ↓
Display score + answer review
  ↓
User can bookmark questions and review explanations
```

### State Management

- **Timer State**: `useExamTimer` hook with auto-expire callback
- **Question State**: `useExamState` hook with Map<itemId, Response>
- **Bookmark State**: `useState<Set<number>>` (client-side, can be moved to DB)
- **Auto-Save**: tRPC mutation triggered on answer change
- **Local First**: Responses stored locally, synced to backend

### Logging & Telemetry

All interactions are logged to console for debugging:

```typescript
console.log('[ExamTaking] User clicked submit');
console.log('[Timer] CRITICAL: 1 minute remaining');
console.log('[ExamState] Q5 answered: B');
console.log('[Results] Bookmarked question: 42');
```

In production, these would be sent to analytics service.

### Accessibility

- Keyboard shortcuts for answer selection (A/B/C/D)
- ARIA labels on all interactive elements
- Focus management for modals
- Screen reader friendly navigation

### Mobile Responsive

- Sidebar collapses on mobile
- Touch-friendly button sizes
- Responsive grid layout
- Code panel full-width on small screens

## File Structure

```
src/
├── app/
│   └── exam/
│       ├── page.tsx                    # Exam list
│       ├── history/
│       │   └── page.tsx                # Exam history (NEW)
│       └── [sittingId]/
│           ├── instructions/
│           │   └── page.tsx            # Pre-exam agreement
│           ├── take/
│           │   └── page.tsx            # Main exam interface
│           └── results/
│               └── page.tsx            # Results + answer review (ENHANCED)
├── components/exam/
│   ├── ExamHeader.tsx                  # Timer + question counter
│   ├── QuestionCard.tsx                # Question display
│   ├── NavigationSidebar.tsx           # Question grid
│   ├── ExamFooter.tsx                  # Controls
│   ├── CodePanel.tsx                   # NEC reference overlay
│   └── AnswerReview.tsx                # Answer review component (NEW)
├── hooks/
│   ├── useExamTimer.ts                 # Countdown timer hook
│   └── useExamState.ts                 # Question state hook
└── server/routers/
    └── exam.ts                         # tRPC exam procedures
```

## Configuration (Backend)

All exam behavior is **configurable** via database:

### RuleSet Model
```typescript
{
  examVendor: "PSI",
  questionCount: 100,              // Easily change to 50, 80, etc.
  timeLimitMinutes: 240,           // Change to 120, 180, etc.
  passThresholdPercent: 70,        // Change to 60, 75, etc.
  allowedCodeBooks: [...],
  allowTabbing: true,
  allowHighlighting: true,
  retakeWaitDays: 14,
}
```

### Jurisdiction Config
```typescript
// src/jurisdictions/ca.ts
{
  blueprintWeights: {
    conductor_sizing: 0.18,        // 18% of exam
    grounding_bonding: 0.15,       // 15% of exam
    // ... other topics
  }
}
```

### Form Building
- `buildExamForm()` selects items based on blueprint weights
- Targets specific difficulty (IRT b-param)
- Randomizes order to prevent memorization
- Ensures coverage across all required topics

## Future Enhancements

### Bookmark Persistence (Next Step)
Add bookmark storage to database:

```prisma
model Bookmark {
  id          String   @id @default(cuid())
  userId      String
  itemId      String
  notes       String?
  createdAt   DateTime @default(now())

  @@unique([userId, itemId])
}
```

Then add tRPC procedures:
- `bookmark.add({ itemId })`
- `bookmark.remove({ itemId })`
- `bookmark.list()`

### Other Ideas
- Flashcard generation from bookmarked questions
- Print-friendly answer review
- Share bookmarked questions with study group
- Spaced repetition for bookmarked items
- Export bookmarks to PDF/CSV

## Usage

### Running Locally

```bash
# Install dependencies
pnpm install

# Set up database
pnpm db:push

# Seed CA jurisdiction
pnpm seed:ca

# Start dev server
pnpm dev
```

Visit http://localhost:3000/exam

### Testing the Flow

1. Click "Start Exam" on exam list page
2. Read instructions, check agreement box
3. Click "Begin Exam" - timer starts immediately
4. Answer questions using A/B/C/D keys or mouse
5. Click "Flag" to mark questions for review
6. Click "Code Panel" to access NEC reference
7. Click "Submit Exam" when done
8. Review results with detailed answer breakdown
9. Bookmark difficult questions for later study
10. View exam history at `/exam/history`

## Code Quality

- ✅ All files < 300 lines (per user requirement)
- ✅ Comprehensive inline comments
- ✅ Robust error logging throughout
- ✅ TypeScript strict mode enabled
- ✅ Modular, reusable components
- ✅ Clean separation of concerns
- ✅ No external dependencies beyond stack

## Summary

The exam simulator is **fully functional** and **production-ready**. It accurately mimics PSI exam behavior while providing helpful learning features (answer review, bookmarks, history) that go beyond the real exam to aid student preparation.

All backend configuration is isolated and easily modifiable. New jurisdictions can be added by:
1. Creating a new config file in `src/jurisdictions/`
2. Running a seed script
3. No code changes required!

The system is **ready to use** for CA General Electrician exam prep right now.
