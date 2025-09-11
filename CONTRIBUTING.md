# Contributing to QuickPe

Thank you for your interest in contributing to QuickPe! We welcome contributions from the community and are pleased to have you join us.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [contact@siddharth-dev.tech](mailto:contact@siddharth-dev.tech).

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Process

### Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/yourusername/quickpe-wallet.git
cd quickpe-wallet

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Start development servers
npm run dev
```

### Coding Standards

- Use meaningful variable and function names
- Write clear, concise comments
- Follow the existing code style
- Use TypeScript where applicable
- Write tests for new features

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

### Testing

Before submitting a pull request, make sure all tests pass:

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run performance tests
npm run test:performance
```

## Project Structure

```
quickpe-wallet/
├── api/                    # Vercel serverless functions
├── frontend/              # React application
├── backend/               # Express.js backend (reference)
├── tests/                 # Testing suite
├── MARKDOWN/              # Documentation
└── .github/workflows/     # CI/CD pipelines
```

## Questions?

Feel free to contact us at [contact@siddharth-dev.tech](mailto:contact@siddharth-dev.tech) if you have any questions.

Thank you for contributing! 🚀
