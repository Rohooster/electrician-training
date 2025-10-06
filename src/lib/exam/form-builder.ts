/**
 * Exam Form Builder
 *
 * Composes exam forms based on jurisdiction blueprint weights.
 * Ensures content distribution matches required percentages.
 */

import { PrismaClient } from '@prisma/client';

interface BuildFormOptions {
  jurisdictionId: string;
  name: string;
  targetDifficulty?: number; // Target average IRT b-param
}

/**
 * Build an exam form by selecting items according to blueprint weights
 */
export async function buildExamForm(
  prisma: PrismaClient,
  options: BuildFormOptions
) {
  const { jurisdictionId, name, targetDifficulty = 0 } = options;

  // Get jurisdiction with rules and blueprint
  const jurisdiction = await prisma.jurisdiction.findUnique({
    where: { id: jurisdictionId },
    include: { ruleSet: true },
  });

  if (!jurisdiction) {
    throw new Error('Jurisdiction not found');
  }

  const blueprintWeights = jurisdiction.blueprintWeights as Record<string, number>;
  const totalQuestions = jurisdiction.ruleSet.questionCount;

  // Calculate how many questions per topic
  const topicQuestionCounts: Record<string, number> = {};
  let assignedQuestions = 0;

  for (const [topic, weight] of Object.entries(blueprintWeights)) {
    const count = Math.round(totalQuestions * weight);
    topicQuestionCounts[topic] = count;
    assignedQuestions += count;
  }

  // Adjust for rounding errors
  const diff = totalQuestions - assignedQuestions;
  if (diff !== 0) {
    // Add/subtract from largest topic
    const largestTopic = Object.entries(topicQuestionCounts)
      .sort(([, a], [, b]) => b - a)[0][0];
    topicQuestionCounts[largestTopic] += diff;
  }

  // Select items for each topic
  const selectedItems: Array<{ id: string; position: number }> = [];
  let position = 1;

  for (const [topic, count] of Object.entries(topicQuestionCounts)) {
    // Get available items for this topic
    const items = await prisma.item.findMany({
      where: {
        jurisdictionId,
        topic,
        isActive: true,
      },
      select: {
        id: true,
        irtB: true,
        difficulty: true,
      },
    });

    if (items.length < count) {
      console.warn(
        `Not enough items for topic ${topic}: need ${count}, have ${items.length}`
      );
    }

    // Sort by how close to target difficulty, then randomize
    const sorted = items
      .map((item) => ({
        ...item,
        diffScore: Math.abs((item.irtB || 0) - targetDifficulty),
      }))
      .sort((a, b) => a.diffScore - b.diffScore)
      .slice(0, Math.min(count * 2, items.length)); // Take top 2x candidates

    // Shuffle and take required count
    const shuffled = sorted.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    for (const item of selected) {
      selectedItems.push({ id: item.id, position: position++ });
    }
  }

  // Shuffle final order (maintains random presentation)
  const shuffledFinal = selectedItems.sort(() => Math.random() - 0.5);
  shuffledFinal.forEach((item, idx) => {
    item.position = idx + 1;
  });

  // Calculate actual difficulty distribution
  const itemDetails = await prisma.item.findMany({
    where: { id: { in: shuffledFinal.map((i) => i.id) } },
    select: { irtB: true },
  });

  const avgDifficulty =
    itemDetails.reduce((sum, i) => sum + (i.irtB || 0), 0) / itemDetails.length;

  // Create form
  const form = await prisma.examForm.create({
    data: {
      jurisdictionId,
      name,
      targetDifficulty,
      blueprintMatch: topicQuestionCounts,
      isPublished: true,
      publishedAt: new Date(),
      formItems: {
        create: shuffledFinal.map(({ id, position }) => ({
          itemId: id,
          position,
        })),
      },
    },
    include: {
      formItems: {
        include: { item: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  console.log(
    `Built form "${name}": ${shuffledFinal.length} items, avg difficulty ${avgDifficulty.toFixed(2)}`
  );

  return form;
}
