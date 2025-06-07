import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import moment from 'moment-timezone';
import AuctionCard from '../components/AuctionCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Home = () => {
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveAuctions = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auctions`);
        const now = moment().tz('Asia/Kolkata');
        const liveOnly = res.data
          .filter(auction => {
            const startTime = moment.utc(auction.startTime).tz('Asia/Kolkata');
            const endTime = moment.utc(auction.endTime).tz('Asia/Kolkata');
            return startTime.isBefore(now) && endTime.isAfter(now);
          })
          .slice(0, 8);
        setFeaturedAuctions(liveOnly);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveAuctions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-black font-sans">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://media.istockphoto.com/id/1201817558/photo/the-concept-of-auction-in-the-internet.jpg?s=612x612&w=0&k=20&c=kUk37DgFypY0ve9xpfy27VzbJvZLBADdSLWBWsz7x4c="
            alt="Auction Background"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="relative z-10 text-center max-w-4xl animate-slide-in px-4">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
            Discover & Bid on Exclusive Items
          </h1>
          <p className="text-lg sm:text-xl mb-8 text-gray-300">
            Join Nexora’s premium auction platform for rare collectibles, luxury items, and unique treasures worldwide.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/auctions"
              className="bg-cyan-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-cyan-500 transition-all duration-300 shadow-md"
              aria-label="Browse Auctions"
            >
              Browse Auctions
            </Link>
            <Link
              to="/login"
              className="border-2 border-cyan-500 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-cyan-500/20 transition-all duration-300"
              aria-label="Start Selling"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Auctions */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Live Auctions</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Bid now on these exclusive ongoing auctions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredAuctions.map((auction) => (
              <div
                key={auction._id}
                className="transform hover:scale-105 transition-all duration-300"
              >
                <AuctionCard auction={auction} compact={true} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12 animate-slide-in">
            <Link
              to="/auctions"
              className="inline-block bg-cyan-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-cyan-500 transition-all duration-300 shadow-md"
              aria-label="View All Live Auctions"
            >
              View All Live Auctions
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-900 text-white" id="about">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-4">About Nexora</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover the story behind our premium auction platform
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="lg:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                alt="About Nexora"
                className="rounded-xl shadow-lg w-full object-cover h-64 lg:h-auto"
                loading="lazy"
              />
            </div>
            <div className="lg:w-1/2">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">Our Evolution</h3>
              <p className="text-gray-400 mb-4 text-base leading-relaxed">
                Nexora, launched in 2023, revolutionized digital auctions by blending cutting-edge technology with traditional expertise, redefining the collector’s marketplace.
              </p>
              <p className="text-gray-400 mb-4 text-base leading-relaxed">
                With over $500M in transactions, we specialize in rare artifacts, luxury collectibles, and digital assets, connecting passionate buyers and sellers globally.
              </p>
              <Link
                to="/contact"
                className="inline-block bg-cyan-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-cyan-500 transition-all duration-300"
                aria-label="Connect With Us"
              >
                Connect With Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Nexora Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Nexora?</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              The pillars of our exceptional auction experience
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Bank-Grade Security</h3>
              <p className="text-gray-400 text-sm">
                AES-256 encryption and biometric authentication protect every transaction.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cost Efficiency</h3>
              <p className="text-gray-400 text-sm">
                5% flat commission with no hidden fees—industry’s most competitive rates.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Network</h3>
              <p className="text-gray-400 text-sm">
                50+ countries represented in our community of collectors and curators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-black text-white" id="contact">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-4">Contact Nexora</h2>
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

              <form className="space-y-6 p-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
                    placeholder="Your message..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-300"
                  aria-label="Send Message"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold mb-4 flex items-center justify-center sm:justify-start">
                <span className="text-cyan-400">Nex</span>
                <span className="text-white">ora</span>
              </h3>
              <p className="text-gray-400 text-sm">
                Premium auction platform connecting collectors worldwide
              </p>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-base font-semibold mb-4 text-gray-300">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Home</Link></li>
                <li><Link to="/auctions" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Auctions</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Contact</Link></li>
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-base font-semibold mb-4 text-gray-300">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Privacy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Terms</Link></li>
                <li><Link to="/refunds" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Refunds</Link></li>
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-base font-semibold mb-4 text-gray-300">Follow Us</h4>
              <div className="flex space-x-4 justify-center sm:justify-start">
                <Link to="#" className="text-gray-400 hover:text-cyan-400 transition-colors transform hover:scale-110" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </Link>
                <Link to="#" className="text-gray-400 hover:text-cyan-400 transition-colors transform hover:scale-110" aria-label="Instagram">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </Link>
                <Link to="#" className="text-gray-400 hover:text-cyan-400 transition-colors transform hover:scale-110" aria-label="LinkedIn">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Nexora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;