import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CreateAuction = () => {
  const { user } = useAuth();
  const { socket, connectionStatus } = useSocket();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [''],
    startTimeLocal: '',
    endTimeLocal: '',
    startPrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle image input changes
  const handleImageChange = (index, value) => {
    setFormData((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  };

  // Add a new image input field
  const addImageField = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  // Remove an image input field
  const removeImageField = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Validate form
  const validateForm = useCallback(() => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (formData.startPrice <= 0 || isNaN(formData.startPrice)) return 'Start price must be a positive number';
    if (!formData.startTimeLocal) return 'Start time is required';
    if (!formData.endTimeLocal) return 'End time is required';
    
    const start = new Date(formData.startTimeLocal);
    const end = new Date(formData.endTimeLocal);
    const now = new Date();
    if (start >= end) return 'End time must be after start time';
    if (end <= now) return 'End time must be in the future';
    
    const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
    const invalidImage = formData.images.some((url, i) => url && !urlRegex.test(url.trim()));
    if (invalidImage) return 'All image URLs must be valid';
    
    return '';
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const images = formData.images.filter((url) => url.trim());
      const payload = {
        title: formData.title,
        description: formData.description,
        images,
        startPrice: Number(formData.startPrice),
        startTime: new Date(formData.startTimeLocal).toISOString(),
        endTime: new Date(formData.endTimeLocal).toISOString(),
      };

      const response = await axios.post(`${BACKEND_URL}/api/auctions`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Emit socket event if connected
      if (socket && connectionStatus === 'connected') {
        socket.emit('newAuction', response.data);
      }

      toast.success('Auction created successfully', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      navigate('/auctions/my');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to create auction';
      setError(message);
      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      images: [''],
      startTimeLocal: '',
      endTimeLocal: '',
      startPrice: '',
    });
    setError('');
    navigate('/auctions/my');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-600 text-white p-4 rounded-lg text-sm text-center max-w-md mx-auto" role="alert">
          Please log in to create an auction.
          <p className="mt-2">
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'seller') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-600 text-white p-4 rounded-lg text-sm text-center max-w-md mx-auto" role="alert">
          Unauthorized: Only sellers can create auctions.
          <p className="mt-2">
            <Link to="/auctions" className="text-cyan-400 hover:text-cyan-300 underline">
              Browse Auctions
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-700 text-white p-6 sm:p-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-cyan-400">
            Create New Auction
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-300">
            List your item for bidding in our marketplace
          </p>
        </div>
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                placeholder="Enter auction title"
                required
                aria-label="Auction title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                placeholder="Describe your item"
                rows={4}
                required
                aria-label="Auction description"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Images (URLs)
              </label>
              {formData.images.map((image, index) => (
                <div key={index} className="flex items-center space-x-2 mt-1">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    aria-label={`Image URL ${index + 1}`}
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="text-red-500 hover:text-red-400"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="mt-2 text-cyan-500 hover:text-cyan-400 text-sm"
                aria-label="Add another image URL"
              >
                + Add Another Image
              </button>
            </div>

            {/* Starting Price */}
            <div>
              <label htmlFor="startPrice" className="block text-sm font-medium text-gray-300">
                Starting Price ($)
              </label>
              <input
                id="startPrice"
                name="startPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.startPrice}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                placeholder="Enter starting price"
                required
                aria-label="Starting price"
              />
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="startTimeLocal" className="block text-sm font-medium text-gray-300">
                Start Time (Your Local Time)
              </label>
              <input
                id="startTimeLocal"
                name="startTimeLocal"
                type="datetime-local"
                value={formData.startTimeLocal}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                required
                aria-label="Auction start time"
              />
            </div>

            {/* End Time */}
            <div>
              <label htmlFor="endTimeLocal" className="block text-sm font-medium text-gray-300">
                End Time (Your Local Time)
              </label>
              <input
                id="endTimeLocal"
                name="endTimeLocal"
                type="datetime-local"
                value={formData.endTimeLocal}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                required
                aria-label="Auction end time"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-600 text-white p-3 rounded-lg text-sm text-center" role="alert">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-2 rounded-lg font-medium text-white transition-all duration-300 ${
                  isSubmitting
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
                aria-label="Create auction"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Auction'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-2 rounded-lg font-medium text-gray-300 border border-gray-600 hover:bg-gray-800 transition-all duration-300"
                aria-label="Cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;