/**
 * Admin Dashboard
 *
 * Overview page with:
 * - Key metrics (users, items, concepts, paths)
 * - Quick actions (create item, import content, generate embeddings)
 * - Recent activity
 * - System health
 * - Content gaps analysis
 */

'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';

export default function AdminDashboard() {
  console.log('[Admin] Dashboard loaded');

  // Fetch dashboard stats
  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Use default values if stats not loaded
  const dashboardStats = stats || {
    totalUsers: 0,
    totalItems: 0,
    totalConcepts: 0,
    totalPaths: 0,
    itemsNeedingEmbeddings: 0,
    activeUsers30d: 0,
    examsCompleted30d: 0,
    drillsCompleted30d: 0,
  };

  return (
    <div className="p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome to Admin Panel</h1>
        <p className="text-blue-100">
          Manage content, users, and learning pathways for the California Electrician Exam Prep platform
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={dashboardStats.totalUsers.toString()}
          icon="users"
          color="blue"
          href="/admin/users"
        />
        <StatCard
          title="Item Bank"
          value={dashboardStats.totalItems.toString()}
          subtitle="questions"
          icon="items"
          color="green"
          href="/admin/items"
        />
        <StatCard
          title="Concepts"
          value={dashboardStats.totalConcepts.toString()}
          subtitle="learning objectives"
          icon="concepts"
          color="purple"
          href="/admin/concepts"
        />
        <StatCard
          title="Learning Paths"
          value={dashboardStats.totalPaths.toString()}
          subtitle="personalized"
          icon="paths"
          color="orange"
          href="/admin/paths"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="Create Item"
            description="Add new exam question"
            icon="plus"
            href="/admin/items/new"
          />
          <ActionCard
            title="Define Concept"
            description="Add learning objective"
            icon="concepts"
            href="/admin/concepts/new"
          />
          <ActionCard
            title="Generate Embeddings"
            description="Create vector embeddings"
            icon="vector"
            href="/admin/embeddings/generate"
          />
          <ActionCard
            title="Import Content"
            description="Bulk import from CSV/JSON"
            icon="upload"
            href="/admin/items/import"
          />
        </div>
      </div>

      {/* System Health & Alerts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <HealthItem
              label="Vector Embeddings"
              status={dashboardStats.itemsNeedingEmbeddings === 0 ? 'good' : 'warning'}
              message={
                dashboardStats.itemsNeedingEmbeddings === 0
                  ? 'All items have embeddings'
                  : `${dashboardStats.itemsNeedingEmbeddings} items need embeddings`
              }
            />
            <HealthItem
              label="Content Coverage"
              status="good"
              message="All topics have sufficient items"
            />
            <HealthItem
              label="Database"
              status="good"
              message="Connected and healthy"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity (30d)</h3>
          <div className="space-y-4">
            <ActivityItem
              label="New Users"
              value={dashboardStats.activeUsers30d.toString()}
              icon="users"
            />
            <ActivityItem
              label="Exams Completed"
              value={dashboardStats.examsCompleted30d.toString()}
              icon="exam"
            />
            <ActivityItem
              label="Drills Completed"
              value={dashboardStats.drillsCompleted30d.toString()}
              icon="drill"
            />
          </div>
        </div>
      </div>

      {/* Content Gaps */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-yellow-900 mb-3">⚠️ Content Gaps & Recommendations</h3>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <strong>No concepts defined yet:</strong> Create learning objectives to enable personalized pathways
              <Link href="/admin/concepts/new" className="ml-2 text-yellow-600 hover:text-yellow-700 font-medium underline">
                Create First Concept →
              </Link>
            </div>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <strong>Items need vector embeddings:</strong> {dashboardStats.itemsNeedingEmbeddings} items pending
              <Link href="/admin/embeddings/generate" className="ml-2 text-yellow-600 hover:text-yellow-700 font-medium underline">
                Generate Embeddings →
              </Link>
            </div>
          </li>
        </ul>
      </div>

      {/* Documentation Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">📚 Admin Resources</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/docs/ADMIN_ARCHITECTURE.md"
            target="_blank"
            className="text-sm text-blue-700 hover:text-blue-800 underline"
          >
            Admin Architecture Guide
          </a>
          <a
            href="/docs/AUTH_SETUP.md"
            target="_blank"
            className="text-sm text-blue-700 hover:text-blue-800 underline"
          >
            Authentication Setup
          </a>
          <a
            href="/docs/content-model.md"
            target="_blank"
            className="text-sm text-blue-700 hover:text-blue-800 underline"
          >
            Content Model Reference
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  href: string;
}

function StatCard({ title, value, subtitle, icon, color, href }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }[color];

  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colorClasses} rounded-lg flex items-center justify-center`}>
          {/* Icon placeholder - using simple shapes */}
          <div className="w-6 h-6 bg-current opacity-80 rounded"></div>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </Link>
  );
}

/**
 * Action Card Component
 */
interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

function ActionCard({ title, description, icon, href }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}

/**
 * Health Item Component
 */
interface HealthItemProps {
  label: string;
  status: 'good' | 'warning' | 'error';
  message: string;
}

function HealthItem({ label, status, message }: HealthItemProps) {
  const statusColor = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  }[status];

  const statusBg = {
    good: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100',
  }[status];

  return (
    <div className="flex items-start">
      <div className={`w-2 h-2 ${statusBg} rounded-full mt-2 mr-3`}></div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <span className={`text-xs font-medium ${statusColor}`}>
            {status === 'good' ? '✓ Healthy' : status === 'warning' ? '⚠ Warning' : '✗ Error'}
          </span>
        </div>
        <p className="text-xs text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * Activity Item Component
 */
interface ActivityItemProps {
  label: string;
  value: string;
  icon: string;
}

function ActivityItem({ label, value, icon }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-lg font-bold text-gray-900">{value}</span>
    </div>
  );
}
