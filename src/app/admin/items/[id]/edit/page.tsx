/**
 * Edit Item Form
 *
 * Form for editing existing exam questions
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { CognitiveType, DifficultyLevel } from '@prisma/client';

interface EditItemPageProps {
  params: {
    id: string;
  };
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch item data
  const { data: item, isLoading: itemLoading } = trpc.admin.getItem.useQuery({ id: params.id });

  // Form state
  const [formData, setFormData] = useState({
    stem: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    topic: '',
    cognitive: 'LOOKUP' as CognitiveType,
    difficulty: 'MEDIUM' as DifficultyLevel,
    necArticleRefs: '',
    cecAmendmentRefs: '',
    isActive: true,
  });

  // Populate form when item loads
  useEffect(() => {
    if (item) {
      setFormData({
        stem: item.stem,
        optionA: item.optionA,
        optionB: item.optionB,
        optionC: item.optionC,
        optionD: item.optionD,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation || '',
        topic: item.topic,
        cognitive: item.cognitive,
        difficulty: item.difficulty,
        necArticleRefs: Array.isArray(item.necArticleRefs) ? item.necArticleRefs.join(', ') : '',
        cecAmendmentRefs: Array.isArray(item.cecAmendmentRefs) ? item.cecAmendmentRefs.join(', ') : '',
        isActive: item.isActive,
      });
    }
  }, [item]);

  // Update mutation
  const updateMutation = trpc.admin.updateItem.useMutation({
    onSuccess: () => {
      router.push('/admin/items');
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validation
    if (!formData.stem || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // Parse NEC references
    const necArticleRefs = formData.necArticleRefs
      .split(',')
      .map((ref) => ref.trim())
      .filter((ref) => ref.length > 0);

    const cecAmendmentRefs = formData.cecAmendmentRefs
      .split(',')
      .map((ref) => ref.trim())
      .filter((ref) => ref.length > 0);

    updateMutation.mutate({
      id: params.id,
      data: {
        stem: formData.stem,
        optionA: formData.optionA,
        optionB: formData.optionB,
        optionC: formData.optionC,
        optionD: formData.optionD,
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation || undefined,
        topic: formData.topic,
        cognitive: formData.cognitive,
        difficulty: formData.difficulty,
        necArticleRefs,
        cecAmendmentRefs,
        isActive: formData.isActive,
      },
    });
  };

  if (itemLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading item...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Item not found</p>
          <Link href="/admin/items" className="text-sm underline mt-2 inline-block">
            ← Back to Items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/admin/items" className="text-blue-600 hover:text-blue-800 mr-2">
            ← Back to Items
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
        <p className="text-sm text-gray-600 mt-1">
          Editing: {item.jurisdiction.name} - {item.topic}
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
        {/* Metadata */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cognitive Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.cognitive}
              onChange={(e) => setFormData({ ...formData, cognitive: e.target.value as CognitiveType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="LOOKUP">Lookup</option>
              <option value="CALC">Calculation</option>
              <option value="THEORY">Theory</option>
              <option value="APPLIED">Applied</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Active (item can be used in exams)
          </label>
        </div>

        {/* Question Stem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Stem <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.stem}
            onChange={(e) => setFormData({ ...formData, stem: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Answer Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Answer Options</h3>

          {(['A', 'B', 'C', 'D'] as const).map((option) => (
            <div key={option} className="flex items-start space-x-3">
              <input
                type="radio"
                name="correctAnswer"
                value={option}
                checked={formData.correctAnswer === option}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                className="mt-1"
              />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option {option} <span className="text-red-500">*</span>
                  {formData.correctAnswer === option && (
                    <span className="ml-2 text-xs text-green-600 font-semibold">(Correct Answer)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData[`option${option}` as keyof typeof formData] as string}
                  onChange={(e) =>
                    setFormData({ ...formData, [`option${option}`]: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Code References */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NEC Article References</label>
            <input
              type="text"
              value={formData.necArticleRefs}
              onChange={(e) => setFormData({ ...formData, necArticleRefs: e.target.value })}
              placeholder="e.g., 210.19, 240.6, 250.122"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CEC Amendment References</label>
            <input
              type="text"
              value={formData.cecAmendmentRefs}
              onChange={(e) => setFormData({ ...formData, cecAmendmentRefs: e.target.value })}
              placeholder="e.g., CEC-210.19, CEC-250.122"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list (if applicable)</p>
          </div>
        </div>

        {/* Vector Embedding Status */}
        {item.embedding && (
          <div className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ This item has a vector embedding (created {new Date(item.embedding.createdAt).toLocaleDateString()})
            </p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <Link
            href="/admin/items"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
