const jwt = require('jsonwebtoken')

module.exports = {
  generateAuthToken: function(requestParams, context, ee, next) {
    // Generate a test JWT token for load testing
    const payload = {
      userId: 'load-test-user-' + Math.random().toString(36).substr(2, 9),
      role: 'USER',
      email: 'loadtest@example.com'
    }
    
    // Use a test JWT secret (should match your test environment)
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret', {
      expiresIn: '1h'
    })
    
    context.vars.authToken = token
    return next()
  },

  generateProviderToken: function(requestParams, context, ee, next) {
    const payload = {
      userId: 'load-test-provider-' + Math.random().toString(36).substr(2, 9),
      role: 'PROVIDER',
      email: 'provider-loadtest@example.com'
    }
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret', {
      expiresIn: '1h'
    })
    
    context.vars.authToken = token
    return next()
  },

  generateRandomBookingData: function(requestParams, context, ee, next) {
    const bookingData = {
      serviceType: Math.random() > 0.5 ? 'INCALL' : 'OUTCALL',
      scheduledAt: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: [30, 60, 90, 120][Math.floor(Math.random() * 4)],
      tokenAmount: Math.floor(Math.random() * 1000) + 200
    }
    
    context.vars.bookingData = bookingData
    return next()
  },

  logResponse: function(requestParams, response, context, ee, next) {
    console.log(`Status: ${response.statusCode}, URL: ${requestParams.url}`)
    return next()
  }
}