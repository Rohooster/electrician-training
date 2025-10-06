# Admin Panel Architecture - Vector-Based Learning Pathways

## 🧠 Vision

Build an admin panel that manages content AND enables **personalized, adaptive learning pathways** using vector embeddings and semantic similarity.

### Core Innovation

Traditional approach:
```
User takes exam → See score → Generic "study these topics" advice
```

Our approach:
```
User takes adaptive assessment
  ↓
Identify weak concepts (vector space)
  ↓
Find related prerequisite concepts (graph traversal)
  ↓
Generate personalized study sequence (vector similarity + IRT)
  ↓
Adaptive content delivery (adjusts based on performance)
```

---

## 🏗️ Architecture Layers

### Layer 1: Vector Embeddings
**Every piece of content gets a semantic representation**

```
Item (question) → Vector embedding (1536 dimensions via OpenAI Ada-002)
Concept (learning objective) → Vector embedding
User performance → Weak concept vectors
```

**Why vectors?**
- Semantic similarity (not just keyword matching)
- Find related concepts automatically
- Build knowledge graphs
- Personalized content discovery
- Multi-lingual support (future)

### Layer 2: Concept Graph
**Learning objectives with prerequisites**

```
Concept: "Grounding Electrode Conductor Sizing"
  ├─ Prerequisites: ["Grounding Systems Basics", "Service Calculations"]
  ├─ Related: ["Bonding Jumpers", "Equipment Grounding"]
  ├─ Items: [item_1, item_2, item_3...]
  └─ Vector: [0.023, -0.154, 0.891, ...]
```

### Layer 3: Learning Paths
**Personalized study sequences**

```
User weak on: "Grounding" (75% vector similarity to "Grounding Electrode Conductors")
  ↓
Generate path:
  1. Review prerequisites (if gaps detected)
  2. Core concept items (adaptive difficulty)
  3. Related concepts (breadth)
  4. Practice test (validation)
```

---

## 📊 Database Schema Extensions

### New Tables

```prisma
// ============================================================================
// VECTOR EMBEDDINGS & SEMANTIC SEARCH
// ============================================================================

// Note: Requires pgvector extension
// Run: CREATE EXTENSION IF NOT EXISTS vector;

model ItemEmbedding {
  id              String   @id @default(cuid())

  itemId          String   @unique
  item            Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  // Vector embedding (OpenAI Ada-002 = 1536 dimensions)
  embedding       Unsupported("vector(1536)")

  // Metadata for regeneration
  embeddingModel  String   @default("text-embedding-ada-002")
  embeddingSource String   // "stem_only", "stem_options", "stem_explanation"

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("item_embeddings")
  @@index([itemId])
}

// ============================================================================
// CONCEPT MANAGEMENT (Learning Objectives)
// ============================================================================

model Concept {
  id              String   @id @default(cuid())

  // Basic info
  slug            String   @unique // "grounding-electrode-conductor-sizing"
  name            String   // "Grounding Electrode Conductor Sizing"
  description     String   // Detailed explanation

  // Jurisdictional scope
  jurisdictionId  String
  jurisdiction    Jurisdiction @relation(fields: [jurisdictionId], references: [id])

  // NEC references this concept covers
  necArticleRefs  Json     // ["250.66", "Table 250.66"]

  // Concept classification
  category        String   // "grounding_bonding", "conductor_sizing", etc.
  difficultyLevel DifficultyLevel @default(MEDIUM)

  // Estimated study time (minutes)
  estimatedMinutes Int    @default(30)

  // Vector embedding
  embedding       Unsupported("vector(1536)")?

  // Relations
  items           ConceptItem[]
  prerequisites   ConceptPrerequisite[] @relation("ConceptPrerequisites")
  dependents      ConceptPrerequisite[] @relation("ConceptDependents")
  pathSteps       LearningPathStep[]
  userMastery     ConceptMastery[]

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("concepts")
  @@index([category])
  @@index([jurisdictionId])
}

// Many-to-many: Items can cover multiple concepts
model ConceptItem {
  id              String   @id @default(cuid())

  conceptId       String
  concept         Concept  @relation(fields: [conceptId], references: [id], onDelete: Cascade)

  itemId          String
  item            Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  // How well this item tests this concept (0-1)
  relevanceScore  Float    @default(1.0)

  // Specific aspect of concept this item tests
  aspect          String?  // "calculation", "code_lookup", "theory"

  createdAt       DateTime @default(now())

  @@unique([conceptId, itemId])
  @@map("concept_items")
}

// Prerequisite graph (DAG - Directed Acyclic Graph)
model ConceptPrerequisite {
  id              String   @id @default(cuid())

  // conceptId REQUIRES prerequisiteId
  conceptId       String
  concept         Concept  @relation("ConceptPrerequisites", fields: [conceptId], references: [id], onDelete: Cascade)

  prerequisiteId  String
  prerequisite    Concept  @relation("ConceptDependents", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  // Strength of prerequisite relationship (0-1)
  // 1.0 = must know, 0.5 = helpful but not required
  strength        Float    @default(1.0)

  createdAt       DateTime @default(now())

  @@unique([conceptId, prerequisiteId])
  @@map("concept_prerequisites")
  @@index([conceptId])
  @@index([prerequisiteId])
}

// ============================================================================
// PERSONALIZED LEARNING PATHS
// ============================================================================

model LearningPath {
  id              String   @id @default(cuid())

  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Generation metadata
  generatedFrom   String   // "adaptive_assessment", "topic_filter", "manual"
  generationData  Json     // Stores weak concepts, assessment results, etc.

  // Path metadata
  name            String   // "Personalized Path: Grounding & Bonding"
  description     String?
  estimatedHours  Float?   // Total estimated study time

  // Progress tracking
  status          PathStatus @default(NOT_STARTED)
  currentStepId   String?
  startedAt       DateTime?
  completedAt     DateTime?

  steps           LearningPathStep[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("learning_paths")
  @@index([userId])
  @@index([status])
}

enum PathStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

model LearningPathStep {
  id              String   @id @default(cuid())

  pathId          String
  path            LearningPath @relation(fields: [pathId], references: [id], onDelete: Cascade)

  // Step order in path
  sequence        Int

  // What to study
  conceptId       String?
  concept         Concept? @relation(fields: [conceptId], references: [id])

  itemId          String?
  item            Item?    @relation(fields: [itemId], references: [id])

  // Step type
  stepType        StepType

  // Step metadata
  title           String   // "Review: Grounding Basics"
  description     String?  // "Complete 5 practice questions on grounding fundamentals"
  estimatedMinutes Int    @default(15)

  // Completion tracking
  status          StepStatus @default(LOCKED)
  startedAt       DateTime?
  completedAt     DateTime?
  performanceScore Float?   // 0-1 score on this step

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([pathId, sequence])
  @@map("learning_path_steps")
  @@index([pathId])
  @@index([conceptId])
}

enum StepType {
  CONCEPT_REVIEW    // Read concept explanation
  PRACTICE_ITEM     // Answer single question
  PRACTICE_SET      // Answer set of questions
  DRILL             // Timed NEC lookup drill
  CALCULATION       // Calculation practice
  ASSESSMENT        // Mini-assessment to validate mastery
}

enum StepStatus {
  LOCKED            // Prerequisites not met
  AVAILABLE         // Ready to start
  IN_PROGRESS       // Started but not completed
  COMPLETED         // Finished successfully
  SKIPPED           // User chose to skip
}

// ============================================================================
// CONCEPT MASTERY TRACKING
// ============================================================================

model ConceptMastery {
  id              String   @id @default(cuid())

  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  conceptId       String
  concept         Concept  @relation(fields: [conceptId], references: [id], onDelete: Cascade)

  // Mastery metrics
  masteryLevel    Float    @default(0.0) // 0-1 scale
  confidence      Float    @default(0.5) // 0-1 scale (certainty of mastery estimate)

  // Performance data
  totalAttempts   Int      @default(0)
  correctCount    Int      @default(0)
  avgTimeSeconds  Float?

  // IRT-based ability estimate for this concept
  theta           Float?   // -3 to +3 scale

  // Last practice
  lastPracticed   DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, conceptId])
  @@map("concept_mastery")
  @@index([userId])
  @@index([masteryLevel])
}

// ============================================================================
// ADAPTIVE ASSESSMENT
// ============================================================================

model AdaptiveAssessment {
  id              String   @id @default(cuid())

  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  jurisdictionId  String
  jurisdiction    Jurisdiction @relation(fields: [jurisdictionId], references: [id])

  // Assessment config
  targetItems     Int      @default(20) // Adaptive test length
  algorithm       String   @default("cat") // "cat" = Computerized Adaptive Testing

  // Results
  status          AssessmentStatus @default(IN_PROGRESS)

  // Identified weak concepts (vector similarity scores)
  weakConcepts    Json?    // [{conceptId, score, confidence}]

  // Generated learning path
  generatedPathId String?
  generatedPath   LearningPath? @relation(fields: [generatedPathId], references: [id])

  startedAt       DateTime @default(now())
  completedAt     DateTime?

  @@map("adaptive_assessments")
  @@index([userId])
}

enum AssessmentStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

---

## 🎨 Admin Panel Features

### 1. **Dashboard** (`/admin`)
- Content overview (items, concepts, paths)
- System health (embeddings status, vector index performance)
- Recent activity (new items, user signups)
- Quick actions

### 2. **Item Management** (`/admin/items`)
- **List View**: Table with filters (topic, difficulty, cognitive type)
- **Create/Edit**: Rich editor with live preview
- **Vector Operations**:
  - Generate embeddings (single or bulk)
  - Find similar items (vector search)
  - View item in concept graph
- **Quality Control**:
  - Flag for review
  - Usage analytics (times used, avg time, performance)
  - A/B testing

### 3. **Concept Management** (`/admin/concepts`)
- **Concept List**: Hierarchical tree view
- **Create/Edit**:
  - Define learning objectives
  - Link to items
  - Set prerequisites
  - Generate concept embedding
- **Graph Visualization**: D3.js force-directed graph of concept relationships
- **Coverage Analysis**: Which concepts need more items

### 4. **Learning Path Builder** (`/admin/paths`)
- **Template Builder**: Create reusable path templates
- **Preview**: See generated paths for different user profiles
- **A/B Testing**: Test different path generation strategies
- **Analytics**: Path completion rates, bottlenecks

### 5. **Vector Operations** (`/admin/vectors`)
- **Bulk Generate**: Generate embeddings for all items/concepts
- **Similarity Search**: Find similar content
- **Cluster Analysis**: Identify natural groupings
- **Visualization**: t-SNE/UMAP dimension reduction plots
- **Quality Metrics**: Embedding quality scores

### 6. **User Management** (`/admin/users`)
- User list with search
- View user learning paths
- View concept mastery
- Change roles
- Ban/unban users

### 7. **Jurisdiction Config** (`/admin/jurisdictions`)
- Edit blueprint weights
- Configure exam rules
- Import/export content

### 8. **Analytics** (`/admin/analytics`)
- Item performance metrics
- Concept coverage gaps
- Learning path effectiveness
- User engagement metrics
- System performance (vector operations timing)

---

## 🔧 Tech Stack

### Backend
- **Vectors**: PostgreSQL with **pgvector** extension
- **Embeddings**: OpenAI `text-embedding-ada-002` (1536 dimensions)
- **Similarity**: Cosine similarity (pgvector built-in)
- **Graph**: Adjacency list with recursive CTEs

### Frontend
- **UI**: React with shadcn/ui components
- **Graphs**: D3.js force-directed graphs
- **Tables**: TanStack Table (filtering, sorting, pagination)
- **Forms**: React Hook Form + Zod validation
- **Rich Editor**: Tiptap or Lexical

### APIs
- **OpenAI API**: For embedding generation
- **tRPC**: Admin procedures (CRUD + vector ops)

---

## 📈 Learning Path Generation Algorithm

```typescript
async function generatePersonalizedPath(userId, assessmentResults) {
  // 1. Identify weak concepts from assessment
  const weakConcepts = await identifyWeakConcepts(assessmentResults);

  // 2. For each weak concept, find prerequisites
  const conceptGraph = await buildPrerequisiteGraph(weakConcepts);

  // 3. Topological sort to get study order
  const studyOrder = topologicalSort(conceptGraph);

  // 4. For each concept, select items using IRT + vector similarity
  const pathSteps = [];
  for (const concept of studyOrder) {
    // Start with easy items, progress to harder
    const items = await selectAdaptiveItems(concept, userAbility);
    pathSteps.push(...items);

    // Add drill if concept requires code lookup
    if (concept.requiresCodeLookup) {
      pathSteps.push(generateDrill(concept));
    }

    // Add mini-assessment to validate mastery
    pathSteps.push(generateMiniAssessment(concept));
  }

  // 5. Create learning path
  return createLearningPath(userId, pathSteps);
}
```

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Add pgvector to Prisma schema
- [ ] Create embedding generation utility
- [ ] Build basic admin dashboard layout
- [ ] Implement item CRUD

### Phase 2: Concepts (Week 3-4)
- [ ] Build concept management UI
- [ ] Create concept graph visualization
- [ ] Implement prerequisite system
- [ ] Seed initial concepts

### Phase 3: Vectors (Week 5-6)
- [ ] Generate embeddings for all items
- [ ] Build similarity search UI
- [ ] Create clustering visualizations
- [ ] Optimize vector queries

### Phase 4: Learning Paths (Week 7-8)
- [ ] Implement path generation algorithm
- [ ] Build path builder UI
- [ ] Create path preview
- [ ] Add progress tracking

### Phase 5: Adaptive Assessment (Week 9-10)
- [ ] Build CAT (Computerized Adaptive Testing) algorithm
- [ ] Create assessment UI
- [ ] Integrate with learning path generation
- [ ] Add analytics

---

## 💡 Future Enhancements

1. **Multi-modal embeddings**: Include images/diagrams
2. **Collaborative filtering**: Use other users' success paths
3. **Reinforcement learning**: Optimize path generation based on outcomes
4. **Real-time adaptation**: Adjust paths mid-study based on performance
5. **Knowledge tracing**: Bayesian Knowledge Tracing for mastery estimation
6. **Spaced repetition**: Optimize review timing
7. **Content generation**: AI-generated practice problems using weak concept vectors

---

This architecture positions the platform for true personalized, adaptive learning at scale while maintaining a clean, manageable admin interface.
