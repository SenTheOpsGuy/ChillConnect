import { useState } from 'react'
import { FiCreditCard, FiArrowUpRight, FiArrowDownLeft, FiDollarSign, FiShield } from 'react-icons/fi'

const Wallet = () => {
  const [activeTab, setActiveTab] = useState('balance')
  
  // Mock data - will be replaced with actual data
  const mockWallet = {
    balance: 120,
    escrowBalance: 30,
    totalEarned: 500,
    totalSpent: 380
  }

  const mockTransactions = [
    {
      id: 1,
      type: 'PURCHASE',
      amount: 50,
      description: 'Token purchase via PayPal',
      date: '2023-12-01',
      status: 'completed'
    },
    {
      id: 2,
      type: 'BOOKING_PAYMENT',
      amount: -25,
      description: 'Booking payment for Sarah Johnson',
      date: '2023-11-30',
      status: 'completed'
    },
    {
      id: 3,
      type: 'ESCROW_HOLD',
      amount: -30,
      description: 'Escrow hold for booking #12345',
      date: '2023-11-29',
      status: 'pending'
    }
  ]

  const tokenPackages = [
    { tokens: 10, price: 1000, popular: false },
    { tokens: 25, price: 2500, popular: false },
    { tokens: 50, price: 5000, popular: true },
    { tokens: 100, price: 10000, popular: false },
    { tokens: 250, price: 25000, popular: false },
    { tokens: 500, price: 50000, popular: false }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet</h1>
        <p className="text-gray-600">Manage your tokens and transactions</p>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm">Available Balance</p>
            <p className="text-3xl font-bold">{mockWallet.balance} Tokens</p>
            <p className="text-primary-200 text-sm">≈ ₹{mockWallet.balance * 100}</p>
          </div>
          <div className="text-right">
            <p className="text-primary-200 text-sm">Escrow Balance</p>
            <p className="text-xl font-semibold">{mockWallet.escrowBalance} Tokens</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <FiArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900">{mockWallet.totalEarned}</p>
              <p className="text-sm text-gray-500">≈ ₹{mockWallet.totalEarned * 100}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <FiArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{mockWallet.totalSpent}</p>
              <p className="text-sm text-gray-500">≈ ₹{mockWallet.totalSpent * 100}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('balance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'balance'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Purchase Tokens
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'balance' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Tokens</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tokenPackages.map((pkg, index) => (
                  <div
                    key={index}
                    className={`relative border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                      pkg.popular
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{pkg.tokens}</div>
                      <div className="text-sm text-gray-500">Tokens</div>
                      <div className="text-lg font-semibold text-gray-900 mt-2">
                        ₹{pkg.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{pkg.price / pkg.tokens} per token
                      </div>
                      <button className="w-full mt-4 btn btn-primary btn-sm">
                        Purchase
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
              <div className="space-y-4">
                {mockTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'PURCHASE' ? (
                          <FiCreditCard className="w-5 h-5 text-green-600" />
                        ) : transaction.type === 'ESCROW_HOLD' ? (
                          <FiShield className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <FiDollarSign className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} tokens
                      </p>
                      <p className={`text-sm capitalize ${
                        transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Wallet