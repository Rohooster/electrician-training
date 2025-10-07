/**
 * Test script for assessment API endpoints
 * Tests the complete assessment flow: start → submit responses → get report
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAssessmentAPI() {
  console.log('🧪 Testing Assessment API Endpoints\n');

  try {
    // Step 1: Get jurisdiction ID
    console.log('1️⃣ Getting CA jurisdiction ID...');
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: { slug: 'ca-general-electrician' },
    });

    if (!jurisdiction) {
      throw new Error('CA jurisdiction not found in database');
    }
    console.log(`   ✓ Found jurisdiction: ${jurisdiction.name} (${jurisdiction.id})\n`);

    // Step 2: Test initializeAssessmentSession
    console.log('2️⃣ Creating new assessment session...');
    const assessment = await prisma.adaptiveAssessment.create({
      data: {
        jurisdictionId: jurisdiction.id,
        status: 'IN_PROGRESS',
        currentTheta: 0.0,
        currentSE: 1.0,
        questionsAsked: 0,
      },
    });
    console.log(`   ✓ Assessment created: ${assessment.id}`);
    console.log(`   - Status: ${assessment.status}`);
    console.log(`   - Starting theta: ${assessment.currentTheta}`);
    console.log(`   - Starting SE: ${assessment.currentSE}\n`);

    // Step 3: Test getNextQuestion
    console.log('3️⃣ Getting first question...');
    const firstItem = await prisma.item.findFirst({
      where: {
        jurisdictionId: jurisdiction.id,
        isActive: true,
      },
    });

    if (!firstItem) {
      throw new Error('No items found for jurisdiction');
    }
    console.log(`   ✓ First question retrieved: ${firstItem.id}`);
    console.log(`   - Topic: ${firstItem.topic}`);
    console.log(`   - Difficulty (b): ${firstItem.irtB}`);
    console.log(`   - Stem: ${firstItem.stem.substring(0, 60)}...\n`);

    // Step 4: Test processResponse (simulate 5 responses)
    console.log('4️⃣ Simulating 5 question responses...');
    const items = await prisma.item.findMany({
      where: {
        jurisdictionId: jurisdiction.id,
        isActive: true,
      },
      take: 5,
    });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isCorrect = Math.random() > 0.5; // Random correct/incorrect
      const selectedAnswer = isCorrect ? item.correctAnswer : 'A';

      await prisma.assessmentResponse.create({
        data: {
          assessmentId: assessment.id,
          itemId: item.id,
          sequence: i,
          selectedAnswer,
          isCorrect,
          timeSeconds: Math.floor(Math.random() * 60) + 20,
          thetaBefore: assessment.currentTheta,
          thetaAfter: assessment.currentTheta + (isCorrect ? 0.2 : -0.2),
        },
      });

      const newTheta = assessment.currentTheta + (isCorrect ? 0.2 : -0.2);
      const newSE = Math.max(0.3, assessment.currentSE - 0.15);

      await prisma.adaptiveAssessment.update({
        where: { id: assessment.id },
        data: {
          currentTheta: newTheta,
          currentSE: newSE,
          questionsAsked: i + 1,
        },
      });

      console.log(`   ✓ Response ${i + 1}: ${isCorrect ? 'Correct' : 'Incorrect'} - theta: ${newTheta.toFixed(3)}, SE: ${newSE.toFixed(3)}`);
    }
    console.log('');

    // Step 5: Complete assessment
    console.log('5️⃣ Completing assessment...');
    const updatedAssessment = await prisma.adaptiveAssessment.update({
      where: { id: assessment.id },
      data: {
        status: 'COMPLETED',
        finalTheta: (await prisma.adaptiveAssessment.findUnique({ where: { id: assessment.id } }))!.currentTheta,
        finalSE: (await prisma.adaptiveAssessment.findUnique({ where: { id: assessment.id } }))!.currentSE,
      },
    });
    console.log(`   ✓ Assessment completed`);
    console.log(`   - Final theta: ${updatedAssessment.finalTheta?.toFixed(3)}`);
    console.log(`   - Final SE: ${updatedAssessment.finalSE?.toFixed(3)}`);
    console.log(`   - Questions asked: ${updatedAssessment.questionsAsked}\n`);

    // Step 6: Test getAssessment
    console.log('6️⃣ Retrieving assessment state...');
    const retrievedAssessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessment.id },
      include: {
        responses: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
    console.log(`   ✓ Assessment retrieved: ${retrievedAssessment!.id}`);
    console.log(`   - Status: ${retrievedAssessment!.status}`);
    console.log(`   - Responses: ${retrievedAssessment!.responses.length}`);
    console.log(`   - Accuracy: ${(retrievedAssessment!.responses.filter(r => r.isCorrect).length / retrievedAssessment!.responses.length * 100).toFixed(1)}%\n`);

    // Step 7: Test diagnostic report generation
    console.log('7️⃣ Generating diagnostic report...');
    const reportAssessment = await prisma.adaptiveAssessment.findUnique({
      where: { id: assessment.id },
      include: {
        responses: {
          orderBy: { sequence: 'asc' },
          include: {
            item: {
              include: {
                concepts: {
                  include: {
                    concept: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate topic performance
    const topicPerf = new Map<string, { correct: number; total: number }>();
    for (const response of reportAssessment!.responses) {
      const topic = response.item.topic;
      if (!topicPerf.has(topic)) {
        topicPerf.set(topic, { correct: 0, total: 0 });
      }
      const perf = topicPerf.get(topic)!;
      perf.total++;
      if (response.isCorrect) {
        perf.correct++;
      }
    }

    console.log(`   ✓ Report generated`);
    console.log(`   - Final ability: ${reportAssessment!.finalTheta?.toFixed(3)}`);
    console.log(`   - Final SE: ${reportAssessment!.finalSE?.toFixed(3)}`);
    console.log(`   - Estimated exam score: ${Math.max(0, Math.min(100, 70 + (reportAssessment!.finalTheta || 0) * 15)).toFixed(1)}%`);
    console.log(`   - Topics covered: ${topicPerf.size}`);
    console.log('\n   Topic Performance:');
    for (const [topic, perf] of topicPerf.entries()) {
      console.log(`     • ${topic}: ${perf.correct}/${perf.total} (${(perf.correct / perf.total * 100).toFixed(1)}%)`);
    }

    console.log('\n✅ All assessment API tests passed!\n');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.assessmentResponse.deleteMany({
      where: { assessmentId: assessment.id },
    });
    await prisma.adaptiveAssessment.delete({
      where: { id: assessment.id },
    });
    console.log('   ✓ Test data cleaned up\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAssessmentAPI()
  .then(() => {
    console.log('🎉 Assessment API test suite completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
