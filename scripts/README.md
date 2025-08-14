# ChillConnect Scripts

This directory contains utility scripts for managing the ChillConnect project.

## 🔐 GitHub Secrets Management

### `setup-github-secrets.sh`
Interactive script to configure all GitHub Secrets required for the CI/CD pipeline.

```bash
# Run interactive setup
./scripts/setup-github-secrets.sh
```

**Features:**
- Step-by-step secret configuration
- Descriptions and examples for each secret
- Skip option for individual secrets
- Validates GitHub CLI authentication

### `quick-secrets-setup.sh`
Quick setup script with placeholder values for development/testing.

```bash
# Set up basic secrets for testing
./scripts/quick-secrets-setup.sh
```

**Use Cases:**
- Initial CI/CD pipeline testing
- Development environment setup
- Quick demonstration setup

⚠️ **Important**: Replace placeholder values with actual credentials for production use.

### `verify-secrets.sh`
Verification script to check if all required secrets are configured.

```bash
# Check secret configuration
./scripts/verify-secrets.sh
```

**Features:**
- Checks all required secrets
- Lists optional missing secrets
- Provides setup guidance
- Exit codes for automation

## 📋 Usage Examples

### Initial Setup
```bash
# 1. Install and authenticate GitHub CLI
brew install gh
gh auth login

# 2. Run interactive setup
./scripts/setup-github-secrets.sh

# 3. Verify configuration
./scripts/verify-secrets.sh
```

### Development Setup
```bash
# Quick setup for testing
./scripts/quick-secrets-setup.sh

# Update specific secrets
gh secret set NETLIFY_AUTH_TOKEN
gh secret set RAILWAY_TOKEN

# Verify setup
./scripts/verify-secrets.sh
```

### Production Deployment
```bash
# Full interactive setup
./scripts/setup-github-secrets.sh

# Verify all secrets
./scripts/verify-secrets.sh

# Test CI/CD pipeline
git commit -m "test: trigger CI/CD pipeline"
git push
```

## 🔧 GitHub CLI Commands

### Basic Secret Management
```bash
# List all secrets
gh secret list

# Set a secret (will prompt for value)
gh secret set SECRET_NAME

# Set a secret with value
echo "secret-value" | gh secret set SECRET_NAME

# Delete a secret
gh secret delete SECRET_NAME

# Get secret info (won't show value)
gh secret list | grep SECRET_NAME
```

### Bulk Operations
```bash
# Set multiple secrets from file
cat secrets.txt | while read line; do
  name=$(echo $line | cut -d'=' -f1)
  value=$(echo $line | cut -d'=' -f2)
  echo "$value" | gh secret set "$name"
done

# Export secrets list (names only)
gh secret list --json name --jq '.[].name' > secret-names.txt
```

## 🔒 Security Best Practices

### Secret Management
1. **Never commit secrets** to version control
2. **Use different secrets** for staging and production
3. **Rotate secrets regularly** (every 90 days)
4. **Use least-privilege access** for service accounts
5. **Monitor secret usage** in CI/CD logs

### Environment Separation
```bash
# Production secrets
gh secret set PROD_API_BASE_URL --body "https://api.chillconnect.com/api"
gh secret set PROD_NETLIFY_SITE_ID --body "production-site-id"

# Staging secrets
gh secret set STAGING_API_BASE_URL --body "https://staging-api.chillconnect.com/api"
gh secret set STAGING_NETLIFY_SITE_ID --body "staging-site-id"
```

### Access Control
- Repository secrets are accessible to all workflows in the repository
- Organization secrets can be shared across repositories
- Environment secrets provide additional protection

## 🚨 Troubleshooting

### Common Issues

**GitHub CLI not authenticated:**
```bash
gh auth status
# If not authenticated:
gh auth login
```

**Permission denied:**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Check repository permissions
gh repo view --json permissions
```

**Secret not updating:**
```bash
# Delete and recreate
gh secret delete SECRET_NAME
echo "new-value" | gh secret set SECRET_NAME
```

### Validation
```bash
# Check if secret exists
gh secret list | grep SECRET_NAME

# Verify workflow can access secrets
# Check GitHub Actions logs for "Secret not found" errors
```

## 📚 Additional Resources

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [ChillConnect Secrets Guide](.github/SECRETS.md)
- [CI/CD Documentation](../docs/CI-CD.md)

---

*For support, create an issue in the GitHub repository or contact the DevOps team.*