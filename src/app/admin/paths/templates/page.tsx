'use client';

/**
 * Admin Path Template Management
 *
 * Allows administrators to:
 * - View all path templates
 * - Create new templates
 * - Edit existing templates
 * - See usage statistics
 * - Configure template parameters
 */

import { useState } from 'react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  BookOpen,
  Plus,
  Edit,
  Copy,
  Trash2,
  Users,
  Clock,
  Target,
  Settings,
} from 'lucide-react';

export default function PathTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock templates - in production, these would come from tRPC queries
  const templates = [
    {
      id: '1',
      name: 'Beginner to Journeyman',
      description:
        'Comprehensive 60-day path covering all fundamental concepts for new electricians',
      targetLevel: 'BEGINNER',
      conceptsCount: 42,
      estimatedDays: 60,
      itemsPerConcept: 10,
      requiredAccuracy: 0.75,
      timesUsed: 87,
      isActive: true,
    },
    {
      id: '2',
      name: 'Weak Areas Reinforcement',
      description:
        'Targeted 14-day path focusing on commonly failed exam topics',
      targetLevel: 'INTERMEDIATE',
      conceptsCount: 15,
      estimatedDays: 14,
      itemsPerConcept: 15,
      requiredAccuracy: 0.8,
      timesUsed: 134,
      isActive: true,
    },
    {
      id: '3',
      name: 'Exam Prep Sprint',
      description: 'Intensive 7-day final review before taking the exam',
      targetLevel: 'ADVANCED',
      conceptsCount: 25,
      estimatedDays: 7,
      itemsPerConcept: 8,
      requiredAccuracy: 0.85,
      timesUsed: 56,
      isActive: true,
    },
    {
      id: '4',
      name: 'NEC Code Focus',
      description:
        'Deep dive into National Electrical Code requirements and references',
      targetLevel: 'INTERMEDIATE',
      conceptsCount: 30,
      estimatedDays: 21,
      itemsPerConcept: 12,
      requiredAccuracy: 0.75,
      timesUsed: 23,
      isActive: false,
    },
  ];

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Learning Path Templates
          </h1>
          <p className="text-gray-600">
            Manage reusable templates for personalized learning paths
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Label htmlFor="search">Search Templates</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Templates</span>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            {templates.filter((t) => t.isActive).length} active
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Usage</span>
            <Users className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {templates.reduce((sum, t) => sum + t.timesUsed, 0)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Paths generated</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Duration</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(
              templates.reduce((sum, t) => sum + t.estimatedDays, 0) /
                templates.length
            )}
            d
          </div>
          <p className="text-xs text-gray-500 mt-1">Days per template</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Most Used</span>
            <Target className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-sm font-semibold text-gray-900 line-clamp-2">
            {templates.sort((a, b) => b.timesUsed - a.timesUsed)[0]?.name ||
              'N/A'}
          </div>
        </Card>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {template.name}
                  </h3>
                  {template.isActive ? (
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Badge variant="outline">{template.targetLevel}</Badge>
                </div>
                <p className="text-gray-600">{template.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Concepts</div>
                <div className="text-lg font-semibold text-gray-900">
                  {template.conceptsCount}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Duration</div>
                <div className="text-lg font-semibold text-gray-900">
                  {template.estimatedDays} days
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Items/Concept</div>
                <div className="text-lg font-semibold text-gray-900">
                  {template.itemsPerConcept}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Required Accuracy</div>
                <div className="text-lg font-semibold text-gray-900">
                  {(template.requiredAccuracy * 100).toFixed(0)}%
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Times Used</div>
                <div className="text-lg font-semibold text-gray-900">
                  {template.timesUsed}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredTemplates.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or create a new template
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
