/**
 * Create New Concept Form
 *
 * Form for creating new learning concepts with:
 * - Name, slug, description
 * - NEC article references (multi-input)
 * - Category and difficulty
 * - Estimated study time
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { DifficultyLevel } from '@prisma/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ component: 'AdminConceptCreate' });

export default function NewConceptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info('Create concept page mounted');
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    jurisdictionId: 'ca-general-electrician', // TODO: Make dynamic
    slug: '',
    name: '',
    description: '',
    category: '',
    difficultyLevel: 'MEDIUM' as DifficultyLevel,
    estimatedMinutes: 30,
    necArticleRefs: [''],
  });

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  // NEC references management
  const addNECRef = () => {
    setFormData({
      ...formData,
      necArticleRefs: [...formData.necArticleRefs, ''],
    });
  };

  const updateNECRef = (index: number, value: string) => {
    const newRefs = [...formData.necArticleRefs];
    newRefs[index] = value;
    setFormData({
      ...formData,
      necArticleRefs: newRefs,
    });
  };

  const removeNECRef = (index: number) => {
    const newRefs = formData.necArticleRefs.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      necArticleRefs: newRefs.length > 0 ? newRefs : [''],
    });
  };

  // Create mutation
  const createMutation = trpc.concept.createConcept.useMutation({
    onSuccess: (data) => {
      logger.info('Concept created successfully', {
        conceptId: data.id,
        slug: data.slug,
      });
      router.push(`/admin/concepts/${data.id}`);
    },
    onError: (err) => {
      logger.error('Failed to create concept', err, { formData });
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    logger.info('Form submission started', {
      slug: formData.slug,
      name: formData.name,
      category: formData.category,
    });

    // Validation
    if (!formData.name) {
      logger.warn('Validation failed: No name provided');
      setError('Concept name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      logger.warn('Validation failed: Description too short');
      setError('Description must be at least 10 characters');
      setIsSubmitting(false);
      return;
    }

    if (!formData.category) {
      logger.warn('Validation failed: No category');
      setError('Category is required');
      setIsSubmitting(false);
      return;
    }

    // Clean and filter NEC references
    const necRefs = formData.necArticleRefs
      .map((ref) => ref.trim())
      .filter((ref) => ref.length > 0);

    if (necRefs.length === 0) {
      logger.warn('Validation failed: No NEC references');
      setError('At least one NEC article reference is required');
      setIsSubmitting(false);
      return;
    }

    logger.debug('Submitting concept creation', {
      slug: formData.slug,
      necRefs: necRefs.length,
    });

    createMutation.mutate({
      jurisdictionId: formData.jurisdictionId,
      slug: formData.slug,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      difficultyLevel: formData.difficultyLevel,
      estimatedMinutes: formData.estimatedMinutes,
      necArticleRefs: necRefs,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/admin/concepts" className="text-blue-600 hover:text-blue-800 mr-2">
            ← Back to Concepts
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Concept</h1>
        <p className="text-sm text-gray-600 mt-1">
          Define a learning concept with NEC references and prerequisites
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concept Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Grounding Electrode Conductor Sizing"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="grounding-electrode-conductor-sizing"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              pattern="[a-z0-9-]+"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              URL-friendly identifier (lowercase, hyphens only). Auto-generated from name.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Explain what this concept covers and why it's important..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be shown to students when they study this concept. Be clear and helpful.
            </p>
          </div>
        </div>

        {/* NEC References */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">NEC Article References</h3>
            <button
              type="button"
              onClick={addNECRef}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Reference
            </button>
          </div>

          {formData.necArticleRefs.map((ref, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={ref}
                onChange={(e) => updateNECRef(index, e.target.value)}
                placeholder="e.g., 250.66, Table 250.66"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.necArticleRefs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeNECRef(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <p className="text-xs text-gray-500">
            NEC 2020 article references related to this concept. Students will use these for lookup drills.
          </p>
        </div>

        {/* Metadata */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., grounding_bonding"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use underscore_format to match item topics
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.difficultyLevel}
              onChange={(e) =>
                setFormData({ ...formData, difficultyLevel: e.target.value as DifficultyLevel })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Minutes <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.estimatedMinutes}
              onChange={(e) =>
                setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 30 })
              }
              min="5"
              max="180"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              How long to master this concept
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2 font-medium">Next Steps After Creation:</p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Link relevant items to this concept</li>
            <li>Define prerequisite relationships</li>
            <li>Generate vector embedding for semantic search</li>
          </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <Link
            href="/admin/concepts"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Concept'}
          </button>
        </div>
      </form>
    </div>
  );
}
