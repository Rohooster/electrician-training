/**
 * Create New Item Form
 *
 * Form for creating new exam questions with:
 * - Full item metadata
 * - Multiple choice options
 * - NEC references
 * - Validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';
import { CognitiveType, DifficultyLevel } from '@prisma/client';

export default function NewItemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch jurisdictions for dropdown
  const { data: jurisdictions } = trpc.trainer.getJurisdictions.useQuery();

  // Form state
  const [formData, setFormData] = useState({
    jurisdictionId: '',
    codeEditionId: '',
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
  });

  // Create mutation
  const createMutation = trpc.admin.createItem.useMutation({
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
    if (!formData.jurisdictionId) {
      setError('Please select a jurisdiction');
      setIsSubmitting(false);
      return;
    }
    if (!formData.stem || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // Get code edition from selected jurisdiction
    const selectedJurisdiction = jurisdictions?.find((j) => j.id === formData.jurisdictionId);
    if (!selectedJurisdiction) {
      setError('Invalid jurisdiction selected');
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

    createMutation.mutate({
      jurisdictionId: formData.jurisdictionId,
      codeEditionId: selectedJurisdiction.codeEditionId,
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
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/admin/items" className="text-blue-600 hover:text-blue-800 mr-2">
            ← Back to Items
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Item</h1>
        <p className="text-sm text-gray-600 mt-1">Add a new exam question to the item bank</p>
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
        {/* Jurisdiction & Metadata */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jurisdiction <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.jurisdictionId}
              onChange={(e) => setFormData({ ...formData, jurisdictionId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select jurisdiction...</option>
              {jurisdictions?.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., conductor_sizing, grounding_bonding"
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

        {/* Question Stem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Stem <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.stem}
            onChange={(e) => setFormData({ ...formData, stem: e.target.value })}
            rows={4}
            placeholder="Enter the question text..."
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
                  placeholder={`Enter option ${option}...`}
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
            placeholder="Explain why the correct answer is right..."
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
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
