import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${BACKEND_URL}/api/contact`, formData);
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('[Contact] Error submitting form:', err.message);
      setErrors({ submit: 'Failed to send message. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black font-sans">
      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-4">Contact Nexora</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Our team is ready to assist you 24/7
            </p>
          </div>

          <div className="max-w-6xl mx-auto bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6 p-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-300">
                  <div className="p-2 bg-cyan-600 rounded-md">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Email Support</h3>
                    <p className="text-gray-400 text-sm">support@nexora.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-300">
                  <div className="p-2 bg-cyan-600 rounded-md">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Phone Support</h3>
                    <p className="text-gray-400 text-sm">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-300">
                  <div className="p-2 bg-cyan-600 rounded-md">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">HQ Location</h3>
                    <p className="text-gray-400 text-sm">123 Auction Ave, NY 10001</p>
                  </div>
                </div>
              </div>

              <form className="space-y-6 p-4" onSubmit={handleSubmit}>
                {success && (
                  <div className="bg-green-600 text-white p-3 rounded-lg text-sm animate-slide-in">
                    Message sent successfully!
                  </div>
                )}
                {errors.submit && (
                  <div className="bg-red-600 text-white p-3 rounded-lg text-sm animate-slide-in">
                    {errors.submit}
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg bg-gray-800 border ${errors.name ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm`}
                    placeholder="John Doe"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-red-500 text-xs mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg bg-gray-800 border ${errors.email ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm`}
                    placeholder="john@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-red-500 text-xs mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg bg-gray-800 border ${errors.message ? 'border-red-500' : 'border-gray-600'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm`}
                    placeholder="Your message..."
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                  ></textarea>
                  {errors.message && (
                    <p id="message-error" className="text-red-500 text-xs mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-cyan-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-300 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Send Message"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Find answers to common questions about Nexora
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <details className="bg-gray-900 rounded-lg p-4">
              <summary className="text-lg font-semibold text-cyan-400 cursor-pointer">
                How do I start bidding on auctions?
              </summary>
              <p className="text-gray-400 text-sm mt-2">
                To start bidding, create an account via the <Link to="/register" className="text-cyan-400 hover:underline">Register</Link> page, verify your email, and browse live auctions on the <Link to="/auctions" className="text-cyan-400 hover:underline">Auctions</Link> page. You’ll need to link a payment method in your profile to place bids.
              </p>
            </details>

            <details className="bg-gray-900 rounded-lg p-4">
              <summary className="text-lg font-semibold text-cyan-400 cursor-pointer">
                How can I sell items on Nexora?
              </summary>
              <p className="text-gray-400 text-sm mt-2">
                Sellers must register as a seller account. After verification, you can list items via the <Link to="/create-auction" className="text-cyan-400 hover:underline">Create Auction</Link> page. Ensure your item meets our quality standards, and provide detailed descriptions and images.
              </p>
            </details>

            <details className="bg-gray-900 rounded-lg p-4">
              <summary className="text-lg font-semibold text-cyan-400 cursor-pointer">
                What are the fees for buying or selling?
              </summary>
              <p className="text-gray-400 text-sm mt-2">
                Nexora charges a 5% commission for sellers with no hidden fees. Buyers pay the bid amount plus applicable taxes and shipping. See our <Link to="/terms" className="text-cyan-400 hover:underline">Terms</Link> for details.
              </p>
            </details>

            <details className="bg-gray-900 rounded-lg p-4">
              <summary className="text-lg font-semibold text-cyan-400 cursor-pointer">
                How secure is my payment information?
              </summary>
              <p className="text-gray-400 text-sm mt-2">
                We use AES-256 encryption and biometric authentication to protect your payment details. All transactions are processed through secure, PCI-compliant payment gateways.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;