import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Profile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('[Profile] User:', user);
    if (user) {
      setFormData({ name: user.name || '', email: user.email || '' });
      setIsLoading(false);
    } else {
      setError('User data not available');
      setIsLoading(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Profile] Submitting profile update:', formData);
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.put(
        `${BACKEND_URL}/api/users/me`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('[Profile] Profile updated:', res.data);
      toast.success('Profile updated successfully', {
        position: 'top-right',
        autoClose: 2000,
      });
      setIsEditing(false);
      // Update user in AuthContext (assuming updateUser exists)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(message);
      console.error('[Profile] Update error:', {
        message,
        status: err.response?.status,
      });
      toast.error(message, {
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    console.log('[Profile] Logging out');
    logout();
    toast.success('Logged out successfully', {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-cyan-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-sm">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-600 text-white p-4 rounded-lg text-sm text-center max-w-md mx-auto">
          {error || 'Unable to load profile.'}
          <p className="mt-2">
            <Link to="/" className="text-cyan-400 hover:text-cyan-300 underline">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-700 text-white p-6 sm:p-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-cyan-400">
            Your Profile
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-300">
            Manage your account details and auction preferences
          </p>
        </div>

        {/* Profile Content */}
        <div className="p-6 sm:p-8">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  placeholder="Enter your name"
                  required
                  aria-label="Name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  placeholder="Enter your email"
                  required
                  aria-label="Email"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-lg font-medium text-white transition-all duration-300 ${
                    isSubmitting
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                  aria-label="Save profile"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded-lg font-medium text-gray-300 border border-gray-600 hover:bg-gray-800 transition-all duration-300"
                  aria-label="Cancel edit"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-gray-300">
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-gray-200 w-24">Name:</span>
                <span>{user.name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-gray-200 w-24">Email:</span>
                <span>{user.email || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-gray-200 w-24">Role:</span>
                <span className="capitalize">{user.role || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-gray-200 w-24">Joined:</span>
                <span>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isEditing && (
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-cyan-500 transition-all duration-300"
                aria-label="Edit profile"
              >
                Edit Profile
              </button>
              <Link
                to="/auctions/my"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-500 transition-all duration-300 text-center"
                aria-label="View my auctions"
              >
                View My Auctions
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-500 transition-all duration-300"
                aria-label="Log out"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;