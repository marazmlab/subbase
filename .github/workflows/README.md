# GitHub Actions Workflows

## Pull Request CI (`pull-request.yml`)

This workflow runs automated checks on every pull request to `master` or `develop` branches.

### Workflow Structure

```
lint
  └─> unit-test
        └─> status-comment (after all succeed)
```

### Jobs

#### 1. **Lint** (`lint`)
- Runs ESLint to check code quality
- Must pass before unit tests run

#### 2. **Unit Tests** (`unit-test`)
- Runs Vitest unit tests with coverage
- Uploads coverage reports to Codecov

#### 3. **Status Comment** (`status-comment`)
- Posts a success comment to the PR
- Only runs if all previous jobs succeed
- Updates the same comment on subsequent runs (sticky comment)

### Note on E2E Tests

E2E tests are maintained in the project but not run in CI for faster feedback and reduced complexity. They can be run locally with `npm run test:e2e`.

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

#### Repository Secrets
Optional for coverage reporting:

- `CODECOV_TOKEN` - Token for uploading coverage to Codecov (optional, set `fail_ci_if_error: false`)

### Note on Environment Secrets

The workflow previously used an `integration` environment for E2E tests. This is no longer required as E2E tests are run locally only.

### Setting Up Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for repository-level secrets
4. For environment secrets:
   - Go to **Settings** → **Environments**
   - Create or select the `integration` environment
   - Add environment secrets

### Action Versions Used

All actions use the latest major versions as of January 2026:

- `actions/checkout@v6`
- `actions/setup-node@v6`
- `actions/upload-artifact@v6`
- `codecov/codecov-action@v5`
- `marocchino/sticky-pull-request-comment@v2`

### Coverage Reports

- **Unit Tests**: Coverage is collected via Vitest with `@vitest/coverage-v8` and uploaded to Codecov
- **E2E Tests**: Playwright HTML reports are uploaded as GitHub artifacts (available for 7 days)

### Playwright Configuration

The workflow:
- Installs only Chromium browser (as specified in `playwright.config.ts`)
- Uses `--with-deps` to install system dependencies
- Runs tests with `npm run test:e2e` which starts the dev server automatically

### Node.js Version

The workflow uses the Node.js version specified in `.nvmrc` file (currently 22.14.0).

### Troubleshooting

#### Tests failing in CI but passing locally
- Ensure all environment variables are properly set in the `integration` environment
- Check that the integration environment matches your local test setup
- Review Playwright report artifacts for detailed error information

#### Coverage upload failing
- Verify `CODECOV_TOKEN` is set correctly
- The workflow is configured with `fail_ci_if_error: false`, so it won't fail the build if Codecov upload fails

#### Status comment not appearing
- Ensure the workflow has `pull-requests: write` permission
- Check that all three jobs (lint, unit-test, e2e-test) completed successfully
