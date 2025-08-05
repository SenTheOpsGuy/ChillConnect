import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiShield, FiUsers, FiLock, FiAlertTriangle } from 'react-icons/fi'

const TermsOfService = () => {
  return (
    <div className="auth-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/register" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Registration
          </Link>
        </div>

        {/* Logo */}
        <div className="auth-logo mb-8">
          <div className="logo-icon">C</div>
          <span className="brand-name">ChillConnect</span>
        </div>

        <div className="auth-form">
          <div className="text-center mb-8">
            <h1 className="auth-title">Terms of Service</h1>
            <p className="auth-subtitle">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-8 text-left">
            {/* Introduction */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiShield className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Welcome to ChillConnect ("we," "our," or "us"). These Terms of Service ("Terms") 
                  govern your use of our adult services booking platform and any related services 
                  (collectively, the "Service").
                </p>
                <p>
                  By accessing or using our Service, you agree to be bound by these Terms. 
                  If you disagree with any part of these terms, you may not access the Service.
                </p>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-300 mb-2">Adult Content Warning</p>
                      <p className="text-red-200 text-sm">
                        This platform contains adult content and services. You must be 18+ years old 
                        and legally able to access such content in your jurisdiction.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Age Verification */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiUsers className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">2. Age Verification & Eligibility</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>To use ChillConnect, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Be at least 18 years of age</li>
                  <li>Have the legal capacity to enter into binding agreements</li>
                  <li>Not be prohibited by law from accessing adult content</li>
                  <li>Provide accurate and truthful information during registration</li>
                  <li>Verify your identity when requested</li>
                </ul>
                <p>
                  We reserve the right to verify your age and identity at any time. 
                  Failure to provide accurate information may result in account suspension or termination.
                </p>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiLock className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">3. User Responsibilities</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>As a user of ChillConnect, you agree to:</p>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">For All Users:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Respect the privacy and rights of other users</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Report suspicious or illegal activity</li>
                    <li>Not use the platform for illegal activities</li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">For Service Providers:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Ensure all services offered are legal in your jurisdiction</li>
                    <li>Maintain professional standards and boundaries</li>
                    <li>Honor all confirmed bookings or provide reasonable notice</li>
                    <li>Maintain current health and safety certifications where required</li>
                    <li>Protect client confidentiality and privacy</li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">For Service Seekers:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Treat service providers with respect and professionalism</li>
                    <li>Honor confirmed bookings and payment obligations</li>
                    <li>Respect provider boundaries and limitations</li>
                    <li>Provide accurate information about your requirements</li>
                    <li>Follow provider guidelines and instructions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Prohibited Activities */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiAlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">4. Prohibited Activities</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>The following activities are strictly prohibited on our platform:</p>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Any form of human trafficking or exploitation</li>
                    <li>Services involving minors (under 18 years)</li>
                    <li>Non-consensual activities or services</li>
                    <li>Illegal drug use or distribution</li>
                    <li>Violence, threats, or intimidation</li>
                    <li>Harassment, discrimination, or hate speech</li>
                    <li>Fraud, scams, or deceptive practices</li>
                    <li>Sharing or distributing explicit content without consent</li>
                    <li>Impersonation or false identity</li>
                    <li>Spam, phishing, or malicious software</li>
                  </ul>
                </div>
                <p>
                  Violation of these prohibitions may result in immediate account termination 
                  and reporting to appropriate authorities.
                </p>
              </div>
            </section>

            {/* Privacy & Data */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiShield className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">5. Privacy & Data Protection</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Your privacy is important to us. Our collection, use, and protection of your 
                  personal information is governed by our Privacy Policy, which is incorporated 
                  into these Terms by reference.
                </p>
                <p>
                  We implement industry-standard security measures to protect your data, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>End-to-end encryption for sensitive communications</li>
                  <li>Secure payment processing through certified providers</li>
                  <li>Regular security audits and updates</li>
                  <li>Limited data access on a need-to-know basis</li>
                  <li>Secure data storage and backup procedures</li>
                </ul>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiLock className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">6. Payment Terms</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  ChillConnect facilitates payments between users but is not a party to the 
                  service agreements between providers and seekers.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Platform fees are clearly disclosed before transaction completion</li>
                  <li>Refunds are subject to our refund policy and provider agreement</li>
                  <li>Disputed payments are handled through our dispute resolution process</li>
                  <li>All financial transactions are processed securely</li>
                  <li>Tax obligations are the responsibility of individual users</li>
                </ul>
              </div>
            </section>

            {/* Liability & Disclaimers */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiShield className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">7. Liability & Disclaimers</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="font-semibold text-yellow-300 mb-2">Important Disclaimer:</p>
                  <p className="text-yellow-200 text-sm">
                    ChillConnect is a platform that connects consenting adults. We are not responsible 
                    for the quality, safety, legality, or any other aspect of services provided by users.
                  </p>
                </div>
                <p>
                  By using our platform, you acknowledge that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All service arrangements are between individual users</li>
                  <li>We do not verify the accuracy of user-provided information</li>
                  <li>We are not liable for user actions or interactions</li>
                  <li>You use the platform at your own risk</li>
                  <li>We provide the platform "as is" without warranties</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiAlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">8. Account Termination</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  We reserve the right to suspend or terminate your account at any time for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violation of these Terms of Service</li>
                  <li>Illegal or harmful activity</li>
                  <li>Fraudulent or deceptive behavior</li>
                  <li>Repeated policy violations</li>
                  <li>Extended account inactivity</li>
                </ul>
                <p>
                  You may terminate your account at any time through your account settings. 
                  Upon termination, some data may be retained as required by law or for 
                  business purposes.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiUsers className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">9. Contact Information</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p><strong>Email:</strong> legal@chillconnect.in</p>
                  <p><strong>Support:</strong> support@chillconnect.in</p>
                  <p><strong>Address:</strong> ChillConnect Legal Department</p>
                  <p className="text-sm text-gray-400 mt-4">
                    We aim to respond to all inquiries within 48 hours.
                  </p>
                </div>
              </div>
            </section>

            {/* Agreement */}
            <section className="border-t border-gray-600 pt-8">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                <h3 className="font-semibold text-red-300 mb-3">Acknowledgment</h3>
                <p className="text-red-200 text-sm leading-relaxed">
                  By creating an account or using ChillConnect, you acknowledge that you have read, 
                  understood, and agree to be bound by these Terms of Service. You also confirm 
                  that you are of legal age and have the authority to enter into this agreement.
                </p>
              </div>
            </section>
          </div>

          {/* Back to Registration */}
          <div className="mt-8 pt-6 border-t border-gray-600 text-center">
            <Link 
              to="/register" 
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Return to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService