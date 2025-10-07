'use client';

/**
 * Student Dashboard
 *
 * Main student landing page showing:
 * - Overall statistics (level, XP, streak, exam readiness)
 * - Active learning paths with progress
 * - Recent achievements and badges
 * - Study recommendations
 */

import { trpc } from '~/lib/trpc-client';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Progress } from '~/components/ui/progress';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  TrendingUp,
  Target,
  Flame,
  Clock,
  CheckCircle,
  ArrowRight,
  Trophy,
  Star,
} from 'lucide-react';

export default function StudentDashboard() {
  const { data: stats, isLoading: statsLoading } =
    trpc.learningPath.getStudentStats.useQuery();

  const { data: paths, isLoading: pathsLoading } =
    trpc.learningPath.getUserPaths.useQuery();

  if (statsLoading || pathsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const activePaths = paths?.filter((p) => p.status === 'ACTIVE') || [];
  const completedPaths = paths?.filter((p) => p.status === 'COMPLETED') || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Student! 👋
        </h1>
        <p className="text-gray-600">
          Continue your journey to becoming a licensed electrician
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Level & XP */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Level & XP</span>
            <Award className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            Level {stats?.level || 1}
          </div>
          <Progress
            value={stats ? ((stats.xp % 1000) / 1000) * 100 : 0}
            className="mb-2"
          />
          <p className="text-xs text-gray-500">
            {stats?.xpToNextLevel || 1000} XP to Level {(stats?.level || 1) + 1}
          </p>
        </Card>

        {/* Current Streak */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Current Streak</span>
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.currentStreak || 0} days
          </div>
          <p className="text-xs text-gray-500">
            Longest: {stats?.longestStreak || 0} days
          </p>
          {(stats?.currentStreak || 0) >= 7 && (
            <Badge variant="default" className="mt-2 bg-orange-500">
              On Fire! 🔥
            </Badge>
          )}
        </Card>

        {/* Study Time */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Study Time</span>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {Math.floor((stats?.totalStudyMinutes || 0) / 60)}h{' '}
            {(stats?.totalStudyMinutes || 0) % 60}m
          </div>
          <p className="text-xs text-gray-500">Total study time</p>
        </Card>

        {/* Exam Readiness */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">
              Exam Readiness
            </span>
            <Target className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.estimatedExamScore
              ? `${stats.estimatedExamScore.toFixed(0)}%`
              : 'N/A'}
          </div>
          <Badge
            variant={
              stats?.readinessLevel === 'EXAM_READY'
                ? 'default'
                : stats?.readinessLevel === 'READY'
                ? 'default'
                : 'secondary'
            }
            className={
              stats?.readinessLevel === 'EXAM_READY'
                ? 'bg-green-500'
                : stats?.readinessLevel === 'READY'
                ? 'bg-blue-500'
                : ''
            }
          >
            {stats?.readinessLevel || 'NOT_READY'}
          </Badge>
        </Card>
      </div>

      {/* Active Learning Paths */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Active Learning Paths</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/assessment/new">
              <TrendingUp className="mr-2 h-4 w-4" />
              Take Assessment
            </Link>
          </Button>
        </div>

        {activePaths.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Learning Paths
            </h3>
            <p className="text-gray-600 mb-4">
              Take an adaptive assessment to generate your personalized learning path
            </p>
            <Button asChild>
              <Link href="/student/assessment/new">Start Assessment</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activePaths.map((path) => (
              <Card key={path.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {path.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {path.description}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-blue-500">
                    Active
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">
                      {path.progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={path.progress} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    {path.completedSteps} / {path.totalSteps} steps completed
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">
                      Estimated Days
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {path.estimatedDays}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Steps</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {path.totalSteps}
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/student/path/${path.id}`}>
                    Continue Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Badges & Achievements */}
      {stats && stats.badges && stats.badges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Recent Badges
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stats.badges.slice(0, 6).map((badge: any) => (
              <Card
                key={badge.id}
                className="p-4 text-center hover:shadow-lg transition-shadow"
              >
                <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-sm font-semibold text-gray-900">
                  {badge.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Paths */}
      {completedPaths.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Completed Paths
          </h2>
          <div className="space-y-3">
            {completedPaths.map((path) => (
              <Card
                key={path.id}
                className="p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{path.name}</h3>
                      <p className="text-sm text-gray-600">
                        {path.totalSteps} steps · {path.estimatedDays} days
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completed
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
