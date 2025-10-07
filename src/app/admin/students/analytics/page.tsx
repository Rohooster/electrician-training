'use client';

/**
 * Admin Student Analytics Dashboard
 *
 * Provides comprehensive analytics for administrators:
 * - Student progress across all learning paths
 * - Mastery statistics by concept
 * - Completion rates and time-to-completion
 * - Exam readiness distribution
 * - Engagement metrics (streaks, study time)
 */

import { useState } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import {
  Users,
  TrendingUp,
  Award,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  BookOpen,
} from 'lucide-react';

export default function AdminStudentAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Mock data - in production, these would come from tRPC queries
  const analytics = {
    totalStudents: 156,
    activePaths: 342,
    completedPaths: 89,
    avgCompletionRate: 68.5,
    avgStudyTime: 187, // minutes
    examReadyCount: 42,
    readyCount: 67,
    developingCount: 38,
    notReadyCount: 9,
  };

  const topPerformers = [
    {
      id: '1',
      name: 'John Doe',
      level: 12,
      pathsCompleted: 3,
      overallProgress: 87,
      estimatedExamScore: 92,
      readiness: 'EXAM_READY',
    },
    {
      id: '2',
      name: 'Jane Smith',
      level: 10,
      pathsCompleted: 2,
      overallProgress: 75,
      estimatedExamScore: 85,
      readiness: 'READY',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      level: 9,
      pathsCompleted: 2,
      overallProgress: 72,
      estimatedExamScore: 81,
      readiness: 'READY',
    },
  ];

  const conceptMastery = [
    { concept: 'Grounding & Bonding', avgMastery: 0.82, studentsCount: 145 },
    { concept: 'Load Calculations', avgMastery: 0.71, studentsCount: 132 },
    { concept: 'Wiring Methods', avgMastery: 0.78, studentsCount: 156 },
    { concept: 'Overcurrent Protection', avgMastery: 0.65, studentsCount: 128 },
    { concept: 'Motor Circuits', avgMastery: 0.58, studentsCount: 98 },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Student Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor student progress, engagement, and exam readiness
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '7d'
              ? 'Last 7 days'
              : range === '30d'
              ? 'Last 30 days'
              : range === '90d'
              ? 'Last 90 days'
              : 'All time'}
          </Button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Total Students</span>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.totalStudents}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.activePaths} active paths
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Avg Completion
            </span>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.avgCompletionRate}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.completedPaths} paths completed
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Avg Study Time
            </span>
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.floor(analytics.avgStudyTime / 60)}h {analytics.avgStudyTime % 60}
            m
          </div>
          <p className="text-xs text-gray-500 mt-1">Per student</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Exam Ready</span>
            <Target className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.examReadyCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {((analytics.examReadyCount / analytics.totalStudents) * 100).toFixed(
              0
            )}
            % of students
          </p>
        </Card>
      </div>

      {/* Readiness Distribution */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Exam Readiness Distribution
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Exam Ready</span>
              <span className="text-gray-600">
                {analytics.examReadyCount} students (
                {(
                  (analytics.examReadyCount / analytics.totalStudents) *
                  100
                ).toFixed(0)}
                %)
              </span>
            </div>
            <Progress
              value={(analytics.examReadyCount / analytics.totalStudents) * 100}
              className="h-3 bg-gray-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Ready</span>
              <span className="text-gray-600">
                {analytics.readyCount} students (
                {((analytics.readyCount / analytics.totalStudents) * 100).toFixed(
                  0
                )}
                %)
              </span>
            </div>
            <Progress
              value={(analytics.readyCount / analytics.totalStudents) * 100}
              className="h-3 bg-gray-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Developing</span>
              <span className="text-gray-600">
                {analytics.developingCount} students (
                {(
                  (analytics.developingCount / analytics.totalStudents) *
                  100
                ).toFixed(0)}
                %)
              </span>
            </div>
            <Progress
              value={(analytics.developingCount / analytics.totalStudents) * 100}
              className="h-3 bg-gray-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Not Ready</span>
              <span className="text-gray-600">
                {analytics.notReadyCount} students (
                {((analytics.notReadyCount / analytics.totalStudents) * 100).toFixed(
                  0
                )}
                %)
              </span>
            </div>
            <Progress
              value={(analytics.notReadyCount / analytics.totalStudents) * 100}
              className="h-3 bg-gray-200"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Performers */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Performers
          </h2>
          <div className="space-y-4">
            {topPerformers.map((student, idx) => (
              <div
                key={student.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">
                      {student.name}
                    </span>
                    <Badge
                      variant="default"
                      className={
                        student.readiness === 'EXAM_READY'
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }
                    >
                      {student.readiness}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>
                      <div className="text-xs text-gray-500">Level</div>
                      <div className="font-medium">{student.level}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Progress</div>
                      <div className="font-medium">{student.overallProgress}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Exam Score</div>
                      <div className="font-medium">{student.estimatedExamScore}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Concept Mastery */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            Concept Mastery Overview
          </h2>
          <div className="space-y-4">
            {conceptMastery.map((concept) => (
              <div key={concept.concept}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">
                    {concept.concept}
                  </span>
                  <span className="text-gray-600">
                    {(concept.avgMastery * 100).toFixed(0)}% ({concept.studentsCount}{' '}
                    students)
                  </span>
                </div>
                <Progress
                  value={concept.avgMastery * 100}
                  className="h-2"
                />
                {concept.avgMastery < 0.7 && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Needs attention
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* At-Risk Students */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Students Needing Support
        </h2>
        <p className="text-gray-600 mb-4">
          Students with low progress or engagement who may need intervention
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p>
            Feature in development: This section will show students with low streaks,
            stalled progress, or poor performance metrics.
          </p>
        </div>
      </Card>
    </div>
  );
}
