import React from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiShield, FiLock, FiEye, FiDatabase, FiUsers, FiAlertTriangle } from 'react-icons/fi'

const PrivacyPolicy = () => {
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
            <h1 className="auth-title">Privacy Policy</h1>
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
                  At ChillConnect, we take your privacy seriously. This Privacy Policy explains how we 
                  collect, use, disclose, and safeguard your information when you use our adult services 
                  booking platform.
                </p>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiLock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-300 mb-2">Privacy Commitment</p>
                      <p className="text-blue-200 text-sm">
                        We understand the sensitive nature of our platform and implement the highest 
                        standards of privacy protection and data security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiDatabase className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">2. Information We Collect</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">Personal Information:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Name, email address, and phone number</li>
                    <li>Date of birth (for age verification)</li>
                    <li>Profile photos and descriptions</li>
                    <li>Government-issued ID (for verification purposes)</li>
                    <li>Payment information (processed securely by third parties)</li>
                    <li>Location data (when enabled)</li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">Usage Information:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Platform usage patterns and preferences</li>
                    <li>Search queries and booking history</li>
                    <li>Communication records (messages, reviews)</li>
                    <li>Device information and IP addresses</li>
                    <li>Cookies and tracking technologies</li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">Sensitive Information:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Service preferences and requirements</li>
                    <li>Health and safety information (when provided)</li>
                    <li>Sexual orientation and preferences (optional)</li>
                    <li>Relationship status and personal details</li>
                  </ul>
                  <p className="text-yellow-300 text-sm mt-3">
                    <strong>Note:</strong> All sensitive information is encrypted and stored with 
                    enhanced security measures.
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiEye className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">3. How We Use Your Information</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>We use your information for the following purposes:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Platform Operations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Account creation and management</li>
                      <li>Service matching and recommendations</li>
                      <li>Booking processing and coordination</li>
                      <li>Payment processing and billing</li>
                      <li>Customer support and assistance</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Safety & Security:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Age and identity verification</li>
                      <li>Fraud detection and prevention</li>
                      <li>Safety monitoring and enforcement</li>
                      <li>Compliance with legal requirements</li>
                      <li>Dispute resolution</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Communication:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Service notifications and updates</li>
                      <li>Marketing communications (opt-in)</li>
                      <li>Platform announcements</li>
                      <li>Emergency safety alerts</li>
                      <li>Legal notices and policy changes</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Improvement:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Platform optimization and enhancement</li>
                      <li>User experience improvements</li>
                      <li>Analytics and insights</li>
                      <li>Feature development</li>
                      <li>Quality assurance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiUsers className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">4. Information Sharing</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-300 mb-2">Important:</p>
                      <p className="text-red-200 text-sm">
                        We never sell your personal information. Sharing only occurs in specific, 
                        limited circumstances as outlined below.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">With Other Users:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                      <li>Profile information you choose to make public</li>
                      <li>Communication through our platform messaging</li>
                      <li>Reviews and ratings (anonymized when possible)</li>
                      <li>Booking-related information for confirmed appointments</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">With Service Providers:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                      <li>Payment processors (Stripe, PayPal) - financial data only</li>
                      <li>Identity verification services - verification data only</li>
                      <li>Cloud storage providers - encrypted data only</li>
                      <li>Email service providers - communication data only</li>
                      <li>Security services - threat detection data only</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Legal Requirements:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                      <li>Law enforcement requests with valid legal process</li>
                      <li>Court orders and legal proceedings</li>
                      <li>Regulatory compliance and reporting</li>
                      <li>Protection of rights, property, or safety</li>
                      <li>Prevention of illegal activities</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiLock className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">5. Data Security</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  We implement comprehensive security measures to protect your information:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-green-300 mb-3">Technical Safeguards:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-200">
                      <li>End-to-end encryption for messages</li>
                      <li>AES-256 encryption for stored data</li>
                      <li>SSL/TLS for data transmission</li>
                      <li>Regular security audits and penetration testing</li>
                      <li>Multi-factor authentication</li>
                      <li>Secure cloud infrastructure</li>
                    </ul>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-300 mb-3">Administrative Safeguards:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-200">
                      <li>Limited access on need-to-know basis</li>
                      <li>Employee background checks</li>
                      <li>Regular security training</li>
                      <li>Incident response procedures</li>
                      <li>Data breach notification protocols</li>
                      <li>Privacy by design principles</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="font-semibold text-yellow-300 mb-2">Security Notice:</p>
                  <p className="text-yellow-200 text-sm">
                    While we implement industry-leading security measures, no system is 100% secure. 
                    We encourage users to use strong passwords and enable two-factor authentication.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiShield className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">6. Your Privacy Rights</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>You have the following rights regarding your personal information:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Access Rights:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>View your personal information</li>
                      <li>Download your data</li>
                      <li>Understand how your data is used</li>
                      <li>Request information about third-party sharing</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Control Rights:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Update or correct your information</li>
                      <li>Delete your account and data</li>
                      <li>Opt-out of marketing communications</li>
                      <li>Restrict data processing</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Portability Rights:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Export your data in standard formats</li>
                      <li>Transfer data to other services</li>
                      <li>Request data in machine-readable format</li>
                      <li>Obtain copies of your communications</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Privacy Controls:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Manage profile visibility settings</li>
                      <li>Control location sharing</li>
                      <li>Set communication preferences</li>
                      <li>Manage cookie preferences</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="font-semibold text-blue-300 mb-2">Exercising Your Rights:</p>
                  <p className="text-blue-200 text-sm">
                    To exercise any of these rights, contact us at privacy@chillconnect.in. 
                    We will respond to your request within 30 days and may require identity verification.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiDatabase className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">7. Data Retention</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>We retain your information for different periods based on the type of data:</p>
                
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Account Information:</h4>
                    <p className="text-sm">
                      Retained while your account is active and for 2 years after account deletion 
                      for safety and legal compliance purposes.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Transaction Records:</h4>
                    <p className="text-sm">
                      Financial records are retained for 7 years as required by law. 
                      Booking history is retained for 3 years for dispute resolution.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Communication Data:</h4>
                    <p className="text-sm">
                      Messages and communications are retained for 1 year after the last activity 
                      or until account deletion, whichever comes first.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Security Data:</h4>
                    <p className="text-sm">
                      Logs and security information are retained for 2 years for fraud prevention 
                      and platform security purposes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiUsers className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">8. International Data Transfers</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  ChillConnect operates globally, and your information may be transferred to and 
                  processed in countries other than your residence.
                </p>
                
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-3">Transfer Protections:</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-blue-200 text-sm">
                    <li>Standard Contractual Clauses (SCCs) with service providers</li>
                    <li>Adequacy decisions from privacy authorities</li>
                    <li>Privacy Shield or equivalent certifications</li>
                    <li>Additional safeguards for sensitive data</li>
                    <li>Regular compliance assessments</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiEye className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">9. Cookies and Tracking</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>We use cookies and similar technologies to enhance your experience:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Essential Cookies:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Authentication and security</li>
                      <li>Platform functionality</li>
                      <li>Load balancing</li>
                      <li>Error detection</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Analytics Cookies:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Usage patterns and trends</li>
                      <li>Performance monitoring</li>
                      <li>Feature usage analytics</li>
                      <li>Error tracking</li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm">
                  You can manage cookie preferences through your browser settings or our cookie 
                  preference center. Note that disabling essential cookies may affect platform functionality.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FiUsers className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">10. Contact Information</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  For privacy-related questions or concerns, please contact us:
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Privacy Officer:</strong> privacy@chillconnect.in</p>
                      <p><strong>Data Protection:</strong> dpo@chillconnect.in</p>
                      <p><strong>Support:</strong> support@chillconnect.in</p>
                    </div>
                    <div>
                      <p><strong>Response Time:</strong> Within 48 hours</p>
                      <p><strong>Data Requests:</strong> Within 30 days</p>
                      <p><strong>Emergency Contact:</strong> Available 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Policy Updates */}
            <section className="border-t border-gray-600 pt-8">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-300 mb-3">Policy Updates</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  We may update this Privacy Policy periodically. Significant changes will be 
                  communicated via email and platform notifications. Continued use of our services 
                  after changes constitutes acceptance of the updated policy.
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

export default PrivacyPolicy