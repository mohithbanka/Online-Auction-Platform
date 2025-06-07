import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="bg-black font-sans">
      {/* Introduction Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-4">About Nexora</h1>
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Evolution</h2>
              <p className="text-gray-400 mb-4 text-base leading-relaxed">
                Launched in 2023, Nexora revolutionized digital auctions by blending cutting-edge technology with traditional auction expertise, creating a seamless marketplace for collectors and enthusiasts worldwide.
              </p>
              <p className="text-gray-400 mb-4 text-base leading-relaxed">
                With over $500M in transactions, Nexora specializes in rare artifacts, luxury collectibles, and exclusive digital assets, fostering a global network of passionate buyers and sellers.
              </p>
              <Link
                to="/contact"
                className="inline-block bg-cyan-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-cyan-500 transition-all duration-300 shadow-md"
                aria-label="Connect With Us"
              >
                Connect With Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Empowering collectors to discover, bid, and sell with confidence
            </p>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gray-400 text-base leading-relaxed mb-4">
              At Nexora, our mission is to democratize access to exclusive auctions, providing a secure, transparent, and user-friendly platform that connects collectors across the globe. We strive to preserve the thrill of traditional auctions while embracing the limitless possibilities of the digital age.
            </p>
            <p className="text-gray-400 text-base leading-relaxed">
              By leveraging advanced technology and a commitment to excellence, we aim to create unforgettable experiences for buyers and sellers, ensuring every transaction is seamless and rewarding.
            </p>
          </div>
        </div>
      </section>

      {/* Why Nexora Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Nexora?</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              The pillars of our exceptional auction experience
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-black shadow-md hover:shadow-lg transition-all duration-300">
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

            <div className="text-center p-6 rounded-xl bg-black shadow-md hover:shadow-lg transition-all duration-300">
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

            <div className="text-center p-6 rounded-xl bg-black shadow-md hover:shadow-lg transition-all duration-300">
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

      {/* Team Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              The passionate individuals driving Nexora’s success
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                alt="Team Member 1"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-1">Jane Doe</h3>
              <p className="text-cyan-400 text-sm mb-2">Founder & CEO</p>
              <p className="text-gray-400 text-sm">
                Jane leads Nexora with a vision to transform the auction industry through innovation.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                alt="Team Member 2"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-1">John Smith</h3>
              <p className="text-cyan-400 text-sm mb-2">CTO</p>
              <p className="text-gray-400 text-sm">
                John drives our technological advancements, ensuring a seamless platform experience.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                alt="Team Member 3"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-1">Emily Johnson</h3>
              <p className="text-cyan-400 text-sm mb-2">Head of Curations</p>
              <p className="text-gray-400 text-sm">
                Emily curates exclusive collections, bringing rare artifacts to our global audience.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;