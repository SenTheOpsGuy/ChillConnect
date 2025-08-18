# 🛡️ ChillConnect Security Guidelines

## 🚨 Critical Security Rules

### 1. **NEVER commit credentials to version control**
- ❌ No passwords, API keys, tokens, or secrets in code
- ❌ No real email addresses or usernames  
- ❌ No database connection strings with credentials
- ❌ No private keys or certificates

### 2. **Use Environment Variables**
```javascript
// ❌ BAD - Hard-coded credentials
const password = 'actual-password';
const apiKey = 'sk-1234567890abcdef';

// ✅ GOOD - Environment variables
const password = process.env.TEST_PASSWORD || 'test-default';
const apiKey = process.env.API_KEY;
```

### 3. **Use Placeholder Values**
```javascript
// ✅ GOOD - Safe placeholder values
const testUser = {
  email: 'test@example.com',
  password: 'test-password'
};
```

---

## 🔍 Automated Security Scanning

### Pre-commit Security Checks
Every commit is automatically scanned for:
- Hard-coded passwords and secrets
- API keys and tokens
- Database connection strings with credentials
- Private keys and certificates
- Real email addresses (non-example domains)

### Scanner Tool
```bash
# Run security scan manually
npm run security:scan-secrets

# Run full security audit
npm run security:check
```

### What Gets Detected
The scanner looks for patterns like:
- `password: 'actual-value'`
- `api_key: 'real-key-here'`
- `postgres://user:pass@host/db`
- `AKIA1234567890ABCDEF` (AWS keys)
- `user@realdomain.com` (real emails)

---

## 🚫 Commit Will Be Blocked If:

1. **Secrets Detected**: Hard-coded passwords, API keys, tokens
2. **Real Credentials**: Actual email addresses, connection strings
3. **Private Keys**: RSA, OpenSSH, or other private keys
4. **High-entropy Strings**: Suspicious random strings that look like secrets

---

## ✅ How to Fix Security Issues

### 1. Move to Environment Variables
```bash
# Create .env file (already .gitignored)
echo "TEST_PASSWORD=actual-password" >> .env

# Use in code
const password = process.env.TEST_PASSWORD;
```

### 2. Use Configuration Files
```javascript
// config/test.js
module.exports = {
  testCredentials: {
    email: process.env.TEST_EMAIL || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'test-password'
  }
};
```

### 3. Update Test Files
```javascript
// Before (❌ BLOCKED)
const testUser = {
  email: 'real@domain.com',
  password: 'actual-password'
};

// After (✅ ALLOWED)
const testUser = {
  email: process.env.TEST_EMAIL || 'test@example.com', 
  password: process.env.TEST_PASSWORD || 'test-password'
};
```

---

## 🔧 Emergency: Credentials Already Committed

If credentials were accidentally committed:

### 1. **Immediate Actions**
```bash
# Rotate/invalidate the exposed credentials immediately
# Change passwords, regenerate API keys, etc.

# Remove from latest commit (if not pushed)
git reset --soft HEAD~1
git reset HEAD
# Edit files to remove credentials
git add .
git commit -m "Remove credentials (emergency fix)"
```

### 2. **If Already Pushed to GitHub**
```bash
# ⚠️ WARNING: This rewrites history - coordinate with team
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/file-with-secrets' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - only if necessary)
git push origin --force --all
```

### 3. **Best Practice: Assume Compromise**
- Change all exposed credentials immediately
- Review access logs for unauthorized usage
- Monitor for any suspicious activity
- Update security policies and training

---

## 🎯 Security Best Practices

### Code Level
- Use `process.env` for all sensitive configuration
- Validate and sanitize all user input
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization

### Infrastructure Level
- Keep dependencies updated (`npm audit`)
- Use HTTPS for all communications
- Implement rate limiting and request validation
- Regular security scans and penetration testing

### Development Workflow
- Enable secrets scanning in CI/CD pipeline
- Regular security training for all developers
- Code review with security focus
- Monitor for security vulnerabilities

---

## 📞 Security Contact

If you discover a security vulnerability:
1. **DO NOT** create a public GitHub issue
2. Email security concerns to the team lead
3. Provide detailed information about the vulnerability
4. Allow time for fixes before public disclosure

---

**Remember: Security is everyone's responsibility! 🔒**