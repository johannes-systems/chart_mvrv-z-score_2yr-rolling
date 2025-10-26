# GitHub Secrets Setup Guide

This guide explains how to configure GitHub Secrets for the CI/CD pipeline. These secrets are **required** for automatic deployments and are **only accessible to repository owners**.

## Security Notes

- ✅ **Safe for public repos**: Secrets are encrypted and never exposed in logs
- ✅ **Owner-only access**: Only repository owners/admins can add/edit secrets
- ✅ **Fork protection**: Forked repositories don't have access to your secrets
- ✅ **Environment protection**: Production/staging environments add extra approval gates

## Required Secrets

### 1. CLOUDFLARE_API_TOKEN

**Purpose**: Authenticates GitHub Actions to deploy to Cloudflare Workers

**How to get it**:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use template: "Edit Cloudflare Workers"
4. Permissions needed:
   - Account > Workers Scripts > Edit
   - Account > Workers KV Storage > Edit
5. Copy the token (you'll only see it once!)

**Add to GitHub**:
```bash
gh secret set CLOUDFLARE_API_TOKEN
# Paste your token when prompted
```

Or via GitHub UI:
1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Click "New repository secret"
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: Your Cloudflare API token
5. Click "Add secret"

---

### 2. CLOUDFLARE_ACCOUNT_ID

**Purpose**: Identifies your Cloudflare account for deployments

**Value for this project**:
```
4d706162cd415e66ef4c2935c27c8af5
```

**How to get it** (if needed for other projects):
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select any website or Workers & Pages
3. Look at the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/...`
4. Or find it in the right sidebar under "Account ID"

**Add to GitHub**:
```bash
gh secret set CLOUDFLARE_ACCOUNT_ID --body "4d706162cd415e66ef4c2935c27c8af5"
```

Or via GitHub UI:
1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Click "New repository secret"
3. Name: `CLOUDFLARE_ACCOUNT_ID`
4. Value: `4d706162cd415e66ef4c2935c27c8af5`
5. Click "Add secret"

---

## Optional Secrets

### SNYK_TOKEN (Security Scanning)

**Purpose**: Enables Snyk security vulnerability scanning

**How to get it**:
1. Sign up at [Snyk.io](https://snyk.io/) (free for open source)
2. Go to Account Settings → API Token
3. Copy your token

**Add to GitHub**:
```bash
gh secret set SNYK_TOKEN
# Paste your Snyk token when prompted
```

**Note**: If you don't add this secret, the security scan step will be skipped (continue-on-error: true)

---

## Quick Setup via GitHub CLI

If you have `gh` CLI installed:

```bash
# Login to GitHub CLI (if not already)
gh auth login

# Set all required secrets at once
gh secret set CLOUDFLARE_API_TOKEN  # Paste when prompted
gh secret set CLOUDFLARE_ACCOUNT_ID --body "4d706162cd415e66ef4c2935c27c8af5"

# Optional: Add Snyk token
gh secret set SNYK_TOKEN  # Paste when prompted

# Verify secrets are set
gh secret list
```

---

## Environment Protection (Optional but Recommended)

Add extra protection for production deployments:

### Via GitHub UI:
1. Go to: `Settings` → `Environments`
2. Create environment: `production`
3. Add protection rules:
   - ✅ Required reviewers: Add yourself
   - ✅ Wait timer: 0 minutes (or add delay)
   - ✅ Deployment branches: Only `main`
4. Create environment: `staging`
5. Add protection rules:
   - ✅ Deployment branches: Only `develop`

### Via GitHub CLI:
```bash
# This requires GitHub Enterprise or paid plan
gh api repos/:owner/:repo/environments/production -X PUT -f deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}'
```

---

## Worker URLs

After deployment, your workers will be available at:

- **Production**: `https://mvrv-2yr-rolling.johannes-systems.workers.dev`
- **Staging**: `https://mvrv-2yr-rolling-staging.johannes-systems.workers.dev`

---

## Verification

Test that secrets are working:

```bash
# Trigger manual workflow with staging
gh workflow run ci-cd.yml -f environment=staging

# Check workflow status
gh run list --workflow=ci-cd.yml --limit 1

# View logs
gh run view --log
```

---

## Troubleshooting

### Error: "CLOUDFLARE_API_TOKEN not found"
- Make sure the secret is added to the repository (not organization)
- Check secret name matches exactly (case-sensitive)

### Error: "Authentication failed"
- Verify your Cloudflare API token has the correct permissions
- Check token isn't expired
- Regenerate token if needed

### Error: "Account ID not found"
- Verify the account ID matches your Cloudflare account
- Check you're using the correct account ID (not zone ID)

### Deployment succeeds but worker not updated
- Check Cloudflare dashboard to verify worker exists
- Verify KV namespace IDs in `wrangler.jsonc` are correct
- Check wrangler logs in GitHub Actions for errors

---

## Security Best Practices

1. ✅ **Rotate tokens regularly**: Generate new API tokens every 90 days
2. ✅ **Use scoped tokens**: Only grant minimum required permissions
3. ✅ **Monitor access logs**: Check Cloudflare audit logs regularly
4. ✅ **Enable branch protection**: Require PR reviews before merging to main
5. ✅ **Use environments**: Add manual approval for production deployments

---

## Need Help?

- 📖 [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- 📖 [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- 📖 [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- 🐛 [Report Issues](https://github.com/johannes-systems/chart_mvrv-z-score_2yr-rolling/issues)
