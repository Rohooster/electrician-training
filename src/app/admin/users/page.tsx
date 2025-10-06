/**
 * User Management
 *
 * User administration interface with:
 * - User list with search
 * - Role management
 * - Ban/unban users
 * - View user activity
 * - User learning paths
 *
 * TODO: Implement full functionality
 */

'use client';

export default function UsersPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            User Management Coming Soon
          </h3>
          <p className="text-gray-600">
            Comprehensive user administration interface
          </p>
        </div>
      </div>
    </div>
  );
}
