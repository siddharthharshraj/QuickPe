# 🤝 Contributing to QuickPe

Welcome to QuickPe! We're excited that you're interested in contributing to our digital wallet platform. This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Contributing Workflow](#-contributing-workflow)
- [Coding Standards](#-coding-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Issue Guidelines](#-issue-guidelines)
- [Security](#-security)
- [Community](#-community)

## 🌟 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be collaborative**: Work together to build something amazing
- **Be constructive**: Provide helpful feedback and suggestions
- **Be professional**: Maintain a professional tone in all interactions

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18.0+ installed
- **npm** or **yarn** package manager
- **MongoDB** (local or Atlas account)
- **Git** for version control
- A **GitHub account**

### First-Time Setup

1. **Fork the Repository**
   ```bash
   # Go to https://github.com/siddharthharshraj/QuickPe
   # Click "Fork" button to create your copy
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/QuickPe.git
   cd QuickPe
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/siddharthharshraj/QuickPe.git
   ```

4. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

## 🔧 Development Setup

### Environment Configuration

1. **Backend Environment**
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/quickpe
   JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters_long
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   PORT=5001
   ```

2. **Frontend Environment**
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   
   Edit `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5001/api/v1
   VITE_SOCKET_URL=http://localhost:5001
   ```

### Starting Development Servers

```bash
# Option 1: Start both servers simultaneously
npm run dev

# Option 2: Start servers separately
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## 🔄 Contributing Workflow

### 1. Stay Updated

Before starting work, sync your fork:
```bash
git checkout main
git pull upstream main
git push origin main
```

### 2. Create Feature Branch

Use descriptive branch names:
```bash
# Feature branches
git checkout -b feature/add-payment-notifications
git checkout -b feature/improve-dashboard-ui

# Bug fix branches
git checkout -b bugfix/fix-balance-calculation
git checkout -b bugfix/resolve-login-issue

# Documentation branches
git checkout -b docs/update-api-documentation
git checkout -b docs/add-setup-guide
```

### 3. Make Changes

- Write clean, readable code
- Follow existing code patterns
- Add comments for complex logic
- Update documentation as needed
- Add tests for new features

### 4. Commit Changes

Use conventional commit messages:
```bash
# Feature commits
git commit -m "feat: add real-time notification system"
git commit -m "feat(auth): implement password reset functionality"

# Bug fix commits
git commit -m "fix: resolve balance update synchronization issue"
git commit -m "fix(ui): correct responsive layout on mobile devices"

# Documentation commits
git commit -m "docs: update API endpoint documentation"
git commit -m "docs(readme): add contribution guidelines"

# Other types
git commit -m "style: improve button hover animations"
git commit -m "refactor: optimize database query performance"
git commit -m "test: add unit tests for transaction service"
git commit -m "chore: update dependencies to latest versions"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
# Then create a Pull Request on GitHub
```

## 📏 Coding Standards

### JavaScript/React Standards

- **ES6+**: Use modern JavaScript features
- **Functional Components**: Prefer function components over class components
- **Hooks**: Use React hooks appropriately
- **Destructuring**: Use destructuring for props and state
- **Arrow Functions**: Use arrow functions for inline functions

```javascript
// ✅ Good
const UserProfile = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = useCallback((data) => {
    onUpdate(data);
    setIsEditing(false);
  }, [onUpdate]);

  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
};

// ❌ Avoid
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isEditing: false };
  }
  // ...
}
```

### Node.js/Express Standards

- **Async/Await**: Use async/await over promises
- **Error Handling**: Always handle errors properly
- **Middleware**: Use middleware for common functionality
- **Validation**: Validate all inputs

```javascript
// ✅ Good
const transferMoney = async (req, res) => {
  try {
    const { amount, toQuickpeId } = req.body;
    
    // Validate input
    if (!amount || !toQuickpeId) {
      return res.status(400).json({ 
        message: 'Amount and recipient ID are required' 
      });
    }
    
    const result = await accountService.transfer(req.userId, amount, toQuickpeId);
    res.json(result);
  } catch (error) {
    logger.error('Transfer failed:', error);
    res.status(500).json({ message: 'Transfer failed' });
  }
};

// ❌ Avoid
const transferMoney = (req, res) => {
  accountService.transfer(req.userId, req.body.amount, req.body.toQuickpeId)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ error }));
};
```

### CSS/Styling Standards

- **Tailwind CSS**: Use Tailwind utility classes
- **Responsive Design**: Mobile-first approach
- **Consistent Spacing**: Use Tailwind spacing scale
- **QuickPe Branding**: Use emerald color scheme (#059669)

```jsx
// ✅ Good
<button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
  Send Money
</button>

// ❌ Avoid inline styles
<button style={{backgroundColor: '#059669', color: 'white', padding: '8px 16px'}}>
  Send Money
</button>
```

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests  
npm run test:backend

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

### Writing Tests

#### Frontend Component Tests
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { Balance } from '../Balance';

describe('Balance Component', () => {
  test('displays balance correctly', () => {
    render(<Balance balance={1000} />);
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
  });

  test('handles balance update', () => {
    const onUpdate = jest.fn();
    render(<Balance balance={1000} onUpdate={onUpdate} />);
    
    fireEvent.click(screen.getByText('Refresh'));
    expect(onUpdate).toHaveBeenCalled();
  });
});
```

#### Backend API Tests
```javascript
const request = require('supertest');
const app = require('../app');

describe('POST /api/v1/account/transfer', () => {
  test('should transfer money successfully', async () => {
    const response = await request(app)
      .post('/api/v1/account/transfer')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        amount: 100,
        toQuickpeId: 'QPK-123456'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Transfer successful');
  });
});
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% for new code
- **Critical Paths**: 95% coverage for payment/auth flows
- **Edge Cases**: Test error conditions and edge cases
- **Integration Tests**: Test API endpoints end-to-end

## 🔍 Pull Request Process

### Before Submitting

1. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

2. **Update Documentation**
   - Update README if needed
   - Add/update API documentation
   - Update component documentation

3. **Check Performance**
   - Ensure no performance regressions
   - Test on mobile devices
   - Check bundle size impact

### PR Template

When creating a PR, use this template:

```markdown
## 📝 Description
Brief description of changes made

## 🎯 Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if UI changes)

## 📱 Screenshots (if applicable)
Add screenshots for UI changes

## 📋 Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No console.log statements left
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Manual testing by reviewers
4. **Approval**: Approved PRs will be merged

## 📝 Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**🐛 Bug Description**
Clear description of the bug

**🔄 Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**✅ Expected Behavior**
What should happen

**❌ Actual Behavior**
What actually happens

**📱 Environment**
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox, Safari]
- Version: [e.g., 22]
- Device: [e.g., iPhone X, Desktop]

**📷 Screenshots**
If applicable, add screenshots
```

### Feature Requests

Use the feature request template:

```markdown
**✨ Feature Description**
Clear description of the feature

**🎯 Problem Statement**
What problem does this solve?

**💡 Proposed Solution**
How should it work?

**🔄 Alternatives Considered**
Other solutions considered

**📋 Additional Context**
Any other context or screenshots
```

## 🔒 Security

### Reporting Security Issues

- **DO NOT** create public issues for security vulnerabilities
- Email security issues to: [security@siddharth-dev.tech](mailto:security@siddharth-dev.tech)
- Include detailed steps to reproduce
- We'll respond within 24 hours

### Security Best Practices

- Never commit sensitive data (API keys, passwords, etc.)
- Validate all inputs on both frontend and backend
- Use parameterized queries to prevent SQL injection
- Implement proper authentication for new endpoints
- Follow OWASP security guidelines

## 🏷️ Labels and Milestones

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issue
- `priority: medium` - Medium priority issue
- `priority: low` - Low priority issue

### Component Labels

- `frontend` - Frontend React components
- `backend` - Backend Node.js/Express
- `database` - Database related
- `api` - API endpoints
- `ui/ux` - User interface and experience
- `security` - Security related
- `performance` - Performance improvements

## 🌍 Community

### Getting Help

- **GitHub Discussions**: Ask questions and get help
- **Discord**: Join our contributor community
- **Email**: [contact@siddharth-dev.tech](mailto:contact@siddharth-dev.tech)

### Recognition

Contributors are recognized through:
- **Contributors section** in README
- **Release notes** mentions
- **Commit history** credit
- **Contributor Discord** access
- **Special badges** for significant contributions

### Becoming a Core Contributor

To become a core contributor:
- Submit 5+ meaningful pull requests
- Help with code reviews and issue triage
- Contribute to documentation and testing
- Engage positively with the community
- Demonstrate expertise in the codebase

## 📞 Contact

- **Project Lead**: Siddharth Harsh Raj
- **Email**: [contact@siddharth-dev.tech](mailto:contact@siddharth-dev.tech)
- **GitHub**: [@siddharthharshraj](https://github.com/siddharthharshraj)

---

**Thank you for contributing to QuickPe! Together, we're building the future of digital payments. 🚀**
