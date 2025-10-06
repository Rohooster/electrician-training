/**
 * Homepage
 *
 * Entry point with navigation to exam simulator, trainer, and analytics.
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            California Electrician Exam Prep
          </h1>
          <p className="text-gray-600 mt-2">
            General Electrician (Journeyman) Certification | NEC 2020 / CEC 2022
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Exam Simulator */}
          <Link
            href="/exam"
            className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border-t-4 border-blue-600"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="ml-4 text-xl font-bold text-gray-900">Exam Simulator</h2>
            </div>
            <p className="text-gray-600 mb-4">
              PSI-style practice exams with 100 questions, 4-hour time limit, and open-book simulation.
            </p>
            <div className="text-blue-600 font-medium">Start Practice Exam →</div>
          </Link>

          {/* NEC Navigator Trainer */}
          <Link
            href="/trainer"
            className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border-t-4 border-green-600"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h2 className="ml-4 text-xl font-bold text-gray-900">NEC Navigator</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Timed drills for code lookup practice. Master the Index, Articles, and Tables.
            </p>
            <div className="text-green-600 font-medium">Start Drill →</div>
          </Link>

          {/* Calculation Practice */}
          <Link
            href="/calc"
            className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border-t-4 border-purple-600"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="ml-4 text-xl font-bold text-gray-900">Calculations</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Step-by-step electrical calculations with NEC citations. Service sizing, loads, and more.
            </p>
            <div className="text-purple-600 font-medium">Practice Calculations →</div>
          </Link>

          {/* Analytics Dashboard */}
          <Link
            href="/analytics"
            className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border-t-4 border-orange-600"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="ml-4 text-xl font-bold text-gray-900">Analytics</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Track your progress, identify weak areas, and get personalized study recommendations.
            </p>
            <div className="text-orange-600 font-medium">View Dashboard →</div>
          </Link>

          {/* Admin Panel */}
          <Link
            href="/admin"
            className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border-t-4 border-red-600"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="ml-4 text-xl font-bold text-gray-900">Admin</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Content management, item bank editing, and jurisdiction configuration.
            </p>
            <div className="text-red-600 font-medium">Manage Content →</div>
          </Link>

          {/* Study Resources */}
          <div className="block bg-white rounded-lg shadow-md p-6 border-t-4 border-gray-400">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="ml-4 text-xl font-bold text-gray-900">Resources</h2>
            </div>
            <div className="space-y-2">
              <a href="https://www.dir.ca.gov/dlse/ecu/electricaltrade.html" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                CA Electrician Certification Unit
              </a>
              <a href="https://www.psiexams.com" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                PSI Exam Scheduling
              </a>
              <a href="/docs/ca-readme" className="block text-blue-600 hover:underline">
                CA Configuration Guide
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
