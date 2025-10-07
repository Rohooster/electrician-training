-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "CognitiveType" AS ENUM ('LOOKUP', 'CALC', 'THEORY');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "SittingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DrillType" AS ENUM ('ARTICLE_LOOKUP', 'TABLE_LOOKUP', 'INDEX_NAVIGATION');

-- CreateEnum
CREATE TYPE "DrillStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PathStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('CONCEPT_REVIEW', 'PRACTICE_ITEM', 'PRACTICE_SET', 'DRILL', 'CALCULATION', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "jurisdictions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "certType" TEXT NOT NULL,
    "codeEditionId" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "blueprintWeights" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jurisdictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_editions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseCode" TEXT NOT NULL,
    "baseYear" INTEGER NOT NULL,
    "stateAmendment" TEXT,
    "amendmentYear" INTEGER,
    "effectiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "code_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_sets" (
    "id" TEXT NOT NULL,
    "examVendor" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "timeLimitMinutes" INTEGER NOT NULL,
    "passThresholdPercent" DOUBLE PRECISION NOT NULL,
    "allowedCodeBooks" JSONB NOT NULL,
    "allowedCalculator" BOOLEAN NOT NULL DEFAULT true,
    "calculatorTypes" JSONB,
    "allowTabbing" BOOLEAN NOT NULL DEFAULT true,
    "allowHighlighting" BOOLEAN NOT NULL DEFAULT true,
    "allowNotes" BOOLEAN NOT NULL DEFAULT false,
    "retakeWaitDays" INTEGER,
    "rescheduleHoursBefore" INTEGER,
    "maxAttemptsPerYear" INTEGER,
    "earlyArrivalMinutes" INTEGER NOT NULL DEFAULT 30,
    "roomScanRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "codeEditionId" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "vendorStyle" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "cognitive" "CognitiveType" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "necArticleRefs" JSONB NOT NULL,
    "cecAmendmentRefs" JSONB,
    "irtA" DOUBLE PRECISION,
    "irtB" DOUBLE PRECISION,
    "irtC" DOUBLE PRECISION,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSeconds" DOUBLE PRECISION,
    "avgLookupTime" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calc_templates" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "parameterSchema" JSONB NOT NULL,
    "solutionAlgorithm" JSONB NOT NULL,
    "necArticleRefs" JSONB NOT NULL,
    "seedMultiplier" INTEGER NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calc_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_forms" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDifficulty" DOUBLE PRECISION,
    "blueprintMatch" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_items" (
    "id" TEXT NOT NULL,
    "examFormId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "form_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_sittings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examFormId" TEXT NOT NULL,
    "status" "SittingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "timeLimitMinutes" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_sittings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "sittingId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "selectedAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "timeSpentSeconds" INTEGER,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_panel_logs" (
    "id" TEXT NOT NULL,
    "sittingId" TEXT NOT NULL,
    "itemId" TEXT,
    "action" TEXT NOT NULL,
    "targetArticle" TEXT,
    "searchQuery" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_panel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drillType" "DrillType" NOT NULL DEFAULT 'ARTICLE_LOOKUP',
    "prompt" TEXT NOT NULL,
    "targetArticle" TEXT NOT NULL,
    "targetTable" TEXT,
    "targetSection" TEXT,
    "status" "DrillStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "navigationPath" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeSpentSeconds" INTEGER,
    "isCorrect" BOOLEAN,
    "articleMissBy" INTEGER,
    "efficiency" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ability_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theta" DOUBLE PRECISION NOT NULL,
    "standardError" DOUBLE PRECISION NOT NULL,
    "itemsAnswered" INTEGER NOT NULL,
    "jurisdictionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ability_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_mastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSeconds" DOUBLE PRECISION,
    "masteryPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLookupTime" DOUBLE PRECISION,
    "lookupAccuracy" DOUBLE PRECISION,
    "lastPracticed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_embeddings" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    "embeddingSource" TEXT NOT NULL DEFAULT 'stem_explanation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "necArticleRefs" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "difficultyLevel" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "embedding" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_items" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "aspect" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_prerequisites" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatedFrom" TEXT NOT NULL,
    "generationData" JSONB NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "status" "PathStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentStepId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_steps" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "conceptId" TEXT,
    "itemId" TEXT,
    "stepType" "StepType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" "StepStatus" NOT NULL DEFAULT 'LOCKED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "performanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_path_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_mastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSeconds" DOUBLE PRECISION,
    "theta" DOUBLE PRECISION,
    "lastPracticed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptive_assessments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "minQuestions" INTEGER NOT NULL DEFAULT 10,
    "maxQuestions" INTEGER NOT NULL DEFAULT 25,
    "seThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "startingTheta" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "topicCoverage" JSONB,
    "algorithm" TEXT NOT NULL DEFAULT '3pl',
    "status" "AssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentTheta" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentSE" DOUBLE PRECISION NOT NULL DEFAULT 999,
    "questionsAsked" INTEGER NOT NULL DEFAULT 0,
    "finalTheta" DOUBLE PRECISION,
    "finalSE" DOUBLE PRECISION,
    "topicAbilities" JSONB,
    "weakConcepts" JSONB,
    "generatedPathId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adaptive_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptive_responses" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "thetaBefore" DOUBLE PRECISION NOT NULL,
    "seBefore" DOUBLE PRECISION NOT NULL,
    "itemInfo" DOUBLE PRECISION NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSeconds" INTEGER NOT NULL,
    "thetaAfter" DOUBLE PRECISION NOT NULL,
    "seAfter" DOUBLE PRECISION NOT NULL,
    "paramA" DOUBLE PRECISION NOT NULL,
    "paramB" DOUBLE PRECISION NOT NULL,
    "paramC" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adaptive_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "targetLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "estimatedDays" INTEGER NOT NULL DEFAULT 30,
    "conceptIds" JSONB NOT NULL,
    "itemsPerConcept" INTEGER NOT NULL DEFAULT 10,
    "requiredAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "path_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_milestones" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSteps" JSONB NOT NULL,
    "rewardType" TEXT,
    "rewardData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "unlockedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "path_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallTheta" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "overallSE" DOUBLE PRECISION NOT NULL DEFAULT 999,
    "topicThetas" JSONB NOT NULL DEFAULT '{}',
    "totalConcepts" INTEGER NOT NULL DEFAULT 0,
    "masteredConcepts" INTEGER NOT NULL DEFAULT 0,
    "developingConcepts" INTEGER NOT NULL DEFAULT 0,
    "noviceConcepts" INTEGER NOT NULL DEFAULT 0,
    "totalQuestionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "overallAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgTimePerQuestion" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalStudyMinutes" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "badges" JSONB NOT NULL DEFAULT '[]',
    "pace" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 30,
    "preferredTime" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderTime" TEXT,
    "estimatedExamScore" DOUBLE PRECISION,
    "readinessLevel" TEXT NOT NULL DEFAULT 'NOT_READY',
    "weakTopics" JSONB NOT NULL DEFAULT '[]',
    "strongTopics" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CalcTemplateToItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CalcTemplateToItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "jurisdictions_slug_key" ON "jurisdictions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "jurisdictions_ruleSetId_key" ON "jurisdictions"("ruleSetId");

-- CreateIndex
CREATE UNIQUE INDEX "code_editions_slug_key" ON "code_editions"("slug");

-- CreateIndex
CREATE INDEX "items_jurisdictionId_topic_idx" ON "items"("jurisdictionId", "topic");

-- CreateIndex
CREATE INDEX "items_cognitive_idx" ON "items"("cognitive");

-- CreateIndex
CREATE UNIQUE INDEX "calc_templates_slug_key" ON "calc_templates"("slug");

-- CreateIndex
CREATE INDEX "form_items_examFormId_idx" ON "form_items"("examFormId");

-- CreateIndex
CREATE UNIQUE INDEX "form_items_examFormId_position_key" ON "form_items"("examFormId", "position");

-- CreateIndex
CREATE INDEX "exam_sittings_userId_idx" ON "exam_sittings"("userId");

-- CreateIndex
CREATE INDEX "exam_sittings_status_idx" ON "exam_sittings"("status");

-- CreateIndex
CREATE INDEX "responses_sittingId_idx" ON "responses"("sittingId");

-- CreateIndex
CREATE UNIQUE INDEX "responses_sittingId_itemId_key" ON "responses"("sittingId", "itemId");

-- CreateIndex
CREATE INDEX "code_panel_logs_sittingId_idx" ON "code_panel_logs"("sittingId");

-- CreateIndex
CREATE INDEX "drills_userId_idx" ON "drills"("userId");

-- CreateIndex
CREATE INDEX "drills_status_idx" ON "drills"("status");

-- CreateIndex
CREATE INDEX "ability_snapshots_userId_createdAt_idx" ON "ability_snapshots"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "topic_mastery_userId_masteryPercent_idx" ON "topic_mastery"("userId", "masteryPercent");

-- CreateIndex
CREATE UNIQUE INDEX "topic_mastery_userId_topic_key" ON "topic_mastery"("userId", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "item_embeddings_itemId_key" ON "item_embeddings"("itemId");

-- CreateIndex
CREATE INDEX "item_embeddings_itemId_idx" ON "item_embeddings"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "concepts_slug_key" ON "concepts"("slug");

-- CreateIndex
CREATE INDEX "concepts_category_idx" ON "concepts"("category");

-- CreateIndex
CREATE INDEX "concepts_jurisdictionId_idx" ON "concepts"("jurisdictionId");

-- CreateIndex
CREATE UNIQUE INDEX "concept_items_conceptId_itemId_key" ON "concept_items"("conceptId", "itemId");

-- CreateIndex
CREATE INDEX "concept_prerequisites_conceptId_idx" ON "concept_prerequisites"("conceptId");

-- CreateIndex
CREATE INDEX "concept_prerequisites_prerequisiteId_idx" ON "concept_prerequisites"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "concept_prerequisites_conceptId_prerequisiteId_key" ON "concept_prerequisites"("conceptId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "learning_paths_userId_idx" ON "learning_paths"("userId");

-- CreateIndex
CREATE INDEX "learning_paths_status_idx" ON "learning_paths"("status");

-- CreateIndex
CREATE INDEX "learning_path_steps_pathId_idx" ON "learning_path_steps"("pathId");

-- CreateIndex
CREATE INDEX "learning_path_steps_conceptId_idx" ON "learning_path_steps"("conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_steps_pathId_sequence_key" ON "learning_path_steps"("pathId", "sequence");

-- CreateIndex
CREATE INDEX "concept_mastery_userId_idx" ON "concept_mastery"("userId");

-- CreateIndex
CREATE INDEX "concept_mastery_masteryLevel_idx" ON "concept_mastery"("masteryLevel");

-- CreateIndex
CREATE UNIQUE INDEX "concept_mastery_userId_conceptId_key" ON "concept_mastery"("userId", "conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "adaptive_assessments_generatedPathId_key" ON "adaptive_assessments"("generatedPathId");

-- CreateIndex
CREATE INDEX "adaptive_assessments_userId_idx" ON "adaptive_assessments"("userId");

-- CreateIndex
CREATE INDEX "adaptive_assessments_status_idx" ON "adaptive_assessments"("status");

-- CreateIndex
CREATE INDEX "adaptive_assessments_jurisdictionId_idx" ON "adaptive_assessments"("jurisdictionId");

-- CreateIndex
CREATE INDEX "adaptive_responses_assessmentId_sequence_idx" ON "adaptive_responses"("assessmentId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "path_templates_slug_key" ON "path_templates"("slug");

-- CreateIndex
CREATE INDEX "path_templates_jurisdictionId_idx" ON "path_templates"("jurisdictionId");

-- CreateIndex
CREATE INDEX "path_templates_targetLevel_idx" ON "path_templates"("targetLevel");

-- CreateIndex
CREATE INDEX "path_milestones_pathId_sequence_idx" ON "path_milestones"("pathId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "path_milestones_pathId_sequence_key" ON "path_milestones"("pathId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_userId_idx" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_readinessLevel_idx" ON "student_profiles"("readinessLevel");

-- CreateIndex
CREATE INDEX "_CalcTemplateToItem_B_index" ON "_CalcTemplateToItem"("B");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurisdictions" ADD CONSTRAINT "jurisdictions_codeEditionId_fkey" FOREIGN KEY ("codeEditionId") REFERENCES "code_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jurisdictions" ADD CONSTRAINT "jurisdictions_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "rule_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "jurisdictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_codeEditionId_fkey" FOREIGN KEY ("codeEditionId") REFERENCES "code_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calc_templates" ADD CONSTRAINT "calc_templates_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "jurisdictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_forms" ADD CONSTRAINT "exam_forms_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_items" ADD CONSTRAINT "form_items_examFormId_fkey" FOREIGN KEY ("examFormId") REFERENCES "exam_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_items" ADD CONSTRAINT "form_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sittings" ADD CONSTRAINT "exam_sittings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sittings" ADD CONSTRAINT "exam_sittings_examFormId_fkey" FOREIGN KEY ("examFormId") REFERENCES "exam_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_sittingId_fkey" FOREIGN KEY ("sittingId") REFERENCES "exam_sittings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_panel_logs" ADD CONSTRAINT "code_panel_logs_sittingId_fkey" FOREIGN KEY ("sittingId") REFERENCES "exam_sittings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drills" ADD CONSTRAINT "drills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ability_snapshots" ADD CONSTRAINT "ability_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_embeddings" ADD CONSTRAINT "item_embeddings_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_items" ADD CONSTRAINT "concept_items_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_items" ADD CONSTRAINT "concept_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_prerequisites" ADD CONSTRAINT "concept_prerequisites_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_prerequisites" ADD CONSTRAINT "concept_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "path_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_mastery" ADD CONSTRAINT "concept_mastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_mastery" ADD CONSTRAINT "concept_mastery_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_assessments" ADD CONSTRAINT "adaptive_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_assessments" ADD CONSTRAINT "adaptive_assessments_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_assessments" ADD CONSTRAINT "adaptive_assessments_generatedPathId_fkey" FOREIGN KEY ("generatedPathId") REFERENCES "learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_responses" ADD CONSTRAINT "adaptive_responses_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "adaptive_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_responses" ADD CONSTRAINT "adaptive_responses_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_templates" ADD CONSTRAINT "path_templates_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_milestones" ADD CONSTRAINT "path_milestones_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CalcTemplateToItem" ADD CONSTRAINT "_CalcTemplateToItem_A_fkey" FOREIGN KEY ("A") REFERENCES "calc_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CalcTemplateToItem" ADD CONSTRAINT "_CalcTemplateToItem_B_fkey" FOREIGN KEY ("B") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
