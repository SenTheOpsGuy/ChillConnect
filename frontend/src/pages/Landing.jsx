import { Link } from 'react-router-dom'
import { useState } from 'react'

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="nav-container">
            <div className="nav-brand">
              <div className="logo-icon">C</div>
              <span className="brand-name">ChillConnect</span>
            </div>
            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How It Works</a>
              <a href="#safety" className="nav-link">Safety</a>
              <Link to="/login" className="nav-link login-link">Login</Link>
              <Link to="/register" className="nav-link cta-button">Get Started</Link>
            </div>
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                Connect. Book. <span className="highlight">Experience.</span>
              </h1>
              <p className="hero-description">
                Discover premium services and genuine connections across India. 
                Our secure platform connects you with verified providers for 
                unforgettable experiences.
              </p>
              <div className="hero-cta">
                <Link to="/register-new" className="cta-primary">Start Exploring</Link>
                <Link to="/register-new" className="cta-primary cta-green" style={{ marginLeft: '12px' }}>Quick Sign Up</Link>
                <Link to="/login" className="cta-secondary">Login</Link>
                <a href="#how-it-works" className="cta-tertiary">Learn More</a>
              </div>
              <div className="trust-indicators">
                <div className="trust-item">
                  <span className="trust-number">10K+</span>
                  <span className="trust-label">Active Users</span>
                </div>
                <div className="trust-item">
                  <span className="trust-number">500+</span>
                  <span className="trust-label">Verified Providers</span>
                </div>
                <div className="trust-item">
                  <span className="trust-number">98%</span>
                  <span className="trust-label">Satisfaction Rate</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image">
                <div className="feature-card slide-in" style={{ animationDelay: '0.1s' }}>
                  <div className="feature-icon">🔒</div>
                  <h3>Secure & Safe</h3>
                  <p>End-to-end encryption and verified profiles</p>
                </div>
                <div className="feature-card slide-in" style={{ animationDelay: '0.2s' }}>
                  <div className="feature-icon">⚡</div>
                  <h3>Instant Connect</h3>
                  <p>Real-time chat and instant booking</p>
                </div>
                <div className="feature-card slide-in" style={{ animationDelay: '0.3s' }}>
                  <div className="feature-icon">🌟</div>
                  <h3>Premium Quality</h3>
                  <p>Curated providers and premium experiences</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="container">
            <div className="section-header">
              <h2>Why Choose ChillConnect?</h2>
              <p>Experience the difference with our premium platform designed for your comfort and safety.</p>
            </div>
            <div className="features-grid">
              <div className="feature-item fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="feature-icon-large">🛡️</div>
                <h3>Verified Providers</h3>
                <p>Every provider goes through our comprehensive verification process including background checks and document verification.</p>
              </div>
              <div className="feature-item fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="feature-icon-large">💬</div>
                <h3>Real-time Chat</h3>
                <p>Communicate securely with providers through our encrypted messaging system with media sharing capabilities.</p>
              </div>
              <div className="feature-item fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="feature-icon-large">⭐</div>
                <h3>Rating System</h3>
                <p>Transparent reviews and ratings help you make informed decisions based on genuine user experiences.</p>
              </div>
              <div className="feature-item fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="feature-icon-large">🔐</div>
                <h3>Secure Payments</h3>
                <p>Token-based payment system ensures secure transactions with escrow protection for all bookings.</p>
              </div>
              <div className="feature-item fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="feature-icon-large">📱</div>
                <h3>Mobile First</h3>
                <p>Optimized mobile experience with responsive design for seamless access on any device.</p>
              </div>
              <div className="feature-item fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="feature-icon-large">🎯</div>
                <h3>Smart Matching</h3>
                <p>Advanced algorithms match you with the most suitable providers based on your preferences and location.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works-section">
          <div className="container">
            <div className="section-header">
              <h2>How It Works</h2>
              <p>Get started in just three simple steps</p>
            </div>
            <div className="steps-container">
              <div className="step slide-in-left" style={{ animationDelay: '0.1s' }}>
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Create Profile</h3>
                  <p>Sign up and complete your profile with preferences. Our verification process ensures a safe community.</p>
                </div>
              </div>
              <div className="step slide-in-left" style={{ animationDelay: '0.2s' }}>
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Browse & Connect</h3>
                  <p>Explore verified providers, read reviews, and connect through our secure messaging system.</p>
                </div>
              </div>
              <div className="step slide-in-left" style={{ animationDelay: '0.3s' }}>
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Book & Enjoy</h3>
                  <p>Make secure bookings with our token system and enjoy premium experiences with peace of mind.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section id="safety" className="safety-section">
          <div className="container">
            <div className="safety-content">
              <div className="safety-text">
                <h2>Your Safety is Our Priority</h2>
                <p>We've built comprehensive safety measures to ensure your security and privacy at every step.</p>
                <div className="safety-features">
                  <div className="safety-feature fade-in" style={{ animationDelay: '0.1s' }}>
                    <span className="safety-icon">✓</span>
                    <span>24/7 moderation and support</span>
                  </div>
                  <div className="safety-feature fade-in" style={{ animationDelay: '0.2s' }}>
                    <span className="safety-icon">✓</span>
                    <span>End-to-end encrypted communications</span>
                  </div>
                  <div className="safety-feature fade-in" style={{ animationDelay: '0.3s' }}>
                    <span className="safety-icon">✓</span>
                    <span>Comprehensive background verification</span>
                  </div>
                  <div className="safety-feature fade-in" style={{ animationDelay: '0.4s' }}>
                    <span className="safety-icon">✓</span>
                    <span>Secure payment with escrow protection</span>
                  </div>
                  <div className="safety-feature fade-in" style={{ animationDelay: '0.5s' }}>
                    <span className="safety-icon">✓</span>
                    <span>Emergency contact and reporting system</span>
                  </div>
                </div>
              </div>
              <div className="safety-visual">
                <div className="safety-badge bounce-in">
                  <div className="badge-icon">🛡️</div>
                  <div className="badge-text">
                    <strong>Verified Safe</strong>
                    <span>SSL Encrypted Platform</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content slide-in-right">
              <h2>Ready to Get Started?</h2>
              <p>Join thousands of users who trust ChillConnect for premium experiences.</p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-primary large">Launch App</Link>
                <Link to="/login" className="cta-secondary large">Login</Link>
                <a href="#features" className="cta-tertiary large">Learn More</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-small">C</div>
                <span>ChillConnect</span>
              </div>
              <p>Connecting you with premium experiences across India.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Platform</h4>
                <ul>
                  <li><Link to="/register">Web App</Link></li>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#safety">Safety</a></li>
                  <li><a href="/pricing">Pricing</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <ul>
                  <li><a href="/help">Help Center</a></li>
                  <li><a href="/contact">Contact Us</a></li>
                  <li><a href="/safety-tips">Safety Tips</a></li>
                  <li><a href="/community">Community</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><a href="/privacy">Privacy Policy</a></li>
                  <li><a href="/terms">Terms of Service</a></li>
                  <li><a href="/guidelines">Community Guidelines</a></li>
                  <li><a href="/cookies">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p>&copy; 2024 ChillConnect. All rights reserved.</p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="Instagram">📷</a>
                <a href="#" aria-label="LinkedIn">💼</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing