import { Link } from 'react-router-dom'
import { FiShield, FiHeart, FiUsers, FiAlertTriangle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi'

const CommunityGuidelines = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-white/80 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiShield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Community Guidelines
            </h1>
            <p className="text-xl text-white/80">
              Building a safe, respectful, and inclusive community for everyone
            </p>
          </div>

          {/* Core Values */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-8">
            <div className="flex items-center mb-6">
              <FiHeart className="w-6 h-6 text-red-300 mr-3" />
              <h2 className="text-2xl font-bold text-white">Our Core Values</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiShield className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Safety First</h3>
                <p className="text-white/70 text-sm">Protecting our community through verification and trust</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiHeart className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Respect</h3>
                <p className="text-white/70 text-sm">Treating everyone with dignity and consideration</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiUsers className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Inclusion</h3>
                <p className="text-white/70 text-sm">Welcoming all adults regardless of background</p>
              </div>
            </div>
          </div>

          {/* Community Rules */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-8">
            <div className="flex items-center mb-6">
              <FiCheckCircle className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Community Rules</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 text-xs text-green-400">1</span>
                  Age Verification Required
                </h3>
                <p className="text-white/80 ml-9">
                  All users must be 18+ years old. We verify age during registration to ensure compliance with legal requirements and maintain a mature community environment.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 text-xs text-green-400">2</span>
                  Respectful Communication
                </h3>
                <p className="text-white/80 ml-9">
                  Use respectful language in all interactions. Harassment, hate speech, discrimination, or abusive behavior will not be tolerated and may result in immediate account suspension.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 text-xs text-green-400">3</span>
                  Authentic Identity
                </h3>
                <p className="text-white/80 ml-9">
                  Use your real information and recent photos. Fake profiles, impersonation, or misleading information undermines trust and safety for everyone.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 text-xs text-green-400">4</span>
                  Privacy & Consent
                </h3>
                <p className="text-white/80 ml-9">
                  Always obtain explicit consent before sharing personal information, photos, or engaging in any activities. Respect boundaries and privacy at all times.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 text-xs text-green-400">5</span>
                  Safe Meeting Practices
                </h3>
                <p className="text-white/80 ml-9">
                  Meet in public places for initial meetings. Inform trusted friends about your plans. Trust your instincts and prioritize your safety above all else.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-3 text-xs text-green-400">6</span>
                  No Commercial Exploitation
                </h3>
                <p className="text-white/80 ml-9">
                  ChillConnect is for personal connections only. Commercial sex work, escort services, or any form of prostitution is strictly prohibited and illegal.
                </p>
              </div>
            </div>
          </div>

          {/* Prohibited Content */}
          <div className="bg-red-900/20 backdrop-blur-md rounded-2xl border border-red-500/30 p-8 mb-8">
            <div className="flex items-center mb-6">
              <FiAlertTriangle className="w-6 h-6 text-red-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Prohibited Content & Behavior</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-red-300 mb-3">Content Violations</h3>
                <ul className="space-y-2 text-red-200 text-sm">
                  <li>• Non-consensual intimate images</li>
                  <li>• Illegal or exploitative content</li>
                  <li>• Spam or promotional material</li>
                  <li>• Violent or threatening content</li>
                  <li>• Drugs or illegal substances</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-red-300 mb-3">Behavioral Violations</h3>
                <ul className="space-y-2 text-red-200 text-sm">
                  <li>• Harassment or stalking</li>
                  <li>• Financial scams or fraud</li>
                  <li>• Sharing personal info without consent</li>
                  <li>• Creating multiple fake accounts</li>
                  <li>• Circumventing safety features</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reporting */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-8">
            <div className="flex items-center mb-6">
              <FiShield className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Reporting & Safety</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-white/80">
                If you encounter any behavior that violates our guidelines or makes you feel unsafe:
              </p>
              
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold">1.</span>
                  <span className="text-white/80">Use the in-app reporting feature immediately</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold">2.</span>
                  <span className="text-white/80">Block the user to prevent further contact</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold">3.</span>
                  <span className="text-white/80">Contact our support team at <a href="mailto:safety@chillconnect.in" className="text-blue-300 hover:text-blue-200">safety@chillconnect.in</a></span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-400 font-semibold">4.</span>
                  <span className="text-white/80">If you&apos;re in immediate danger, contact local emergency services</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enforcement */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <FiAlertTriangle className="w-6 h-6 text-orange-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Enforcement Actions</h2>
            </div>
            
            <p className="text-white/80 mb-6">
              Violations of our Community Guidelines may result in:
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                <h3 className="font-semibold text-yellow-400 mb-2">Warning</h3>
                <p className="text-yellow-200 text-sm">First-time minor violations</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                <h3 className="font-semibold text-orange-400 mb-2">Temporary Suspension</h3>
                <p className="text-orange-200 text-sm">Repeated or moderate violations</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <h3 className="font-semibold text-red-400 mb-2">Permanent Ban</h3>
                <p className="text-red-200 text-sm">Severe or repeated violations</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
              <p className="text-red-200 text-sm text-center">
                <strong>Remember:</strong> These guidelines exist to protect everyone in our community. 
                By using ChillConnect, you agree to follow these rules and help us maintain a safe, 
                respectful environment for all users.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-white/60 text-sm">
              Last updated: January 2025 | Questions? Contact us at 
              <a href="mailto:support@chillconnect.in" className="text-white/80 hover:text-white ml-1">
                support@chillconnect.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityGuidelines