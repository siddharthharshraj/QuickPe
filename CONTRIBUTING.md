# 🤝 Contributing to QuickPe

First off, thank you for considering contributing to QuickPe! It's people like you that make QuickPe such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to contact@siddharth-dev.tech.

### Our Standards

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Work together towards common goals
- **Be Professional**: Keep discussions focused and constructive
- **Be Inclusive**: Welcome newcomers and help them get started

---

## 🎯 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** and motivation
- **Proposed solution**
- **Alternative solutions** considered
- **Mockups** (if applicable)

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Simple issues perfect for beginners
- `help wanted` - Issues that need attention
- `documentation` - Documentation improvements

---

## 🛠️ Development Setup

### Prerequisites

- Node.js v18+
- MongoDB v6+
- Git
- npm or yarn

### Setup Steps

1. **Fork and Clone**
```bash
git clone https://github.com/YOUR_USERNAME/QuickPe.git
cd QuickPe
```

2. **Install Dependencies**
```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

3. **Environment Setup**
```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your values
nano backend/.env
nano frontend/.env
```

4. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

5. **Verify Setup**
- Frontend: http://localhost:5173
- Backend: http://localhost:5001
- API Health: http://localhost:5001/health

---

## 🔄 Pull Request Process

### Before Submitting

1. **Create a Branch**
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make Your Changes**
- Follow coding standards
- Add tests if applicable
- Update documentation

3. **Test Your Changes**
```bash
# Run tests
npm test

# Check linting
npm run lint

# Build to ensure no errors
npm run build
```

4. **Commit Your Changes**
```bash
git add .
git commit -m "feat: add amazing feature"
```

### Submitting the PR

1. **Push to Your Fork**
```bash
git push origin feature/your-feature-name
```

2. **Create Pull Request**
- Go to the original repository
- Click "New Pull Request"
- Select your branch
- Fill in the PR template

3. **PR Checklist**
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No merge conflicts

### After Submission

- Respond to review comments promptly
- Make requested changes
- Keep the PR updated with main branch
- Be patient - reviews take time!

---

## 💻 Coding Standards

### JavaScript/React

```javascript
// ✅ Good
const handleSubmit = async (data) => {
  try {
    const response = await apiClient.post('/endpoint', data);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// ❌ Bad
const handleSubmit = async (data) => {
  return await apiClient.post('/endpoint', data).then(r => r.data);
};
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.jsx`)
- **Functions**: camelCase (`handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Files**: kebab-case (`user-profile.js`)
- **CSS Classes**: kebab-case (`user-profile-card`)

### Code Organization

```javascript
// Component structure
import statements
constants
component definition
  state
  effects
  handlers
  render
export statement
```

### Comments

```javascript
// ✅ Good - Explains WHY
// Use exponential backoff to avoid overwhelming the server
const delay = Math.pow(2, retryCount) * 1000;

// ❌ Bad - Explains WHAT (obvious from code)
// Set delay to 2 raised to retryCount times 1000
const delay = Math.pow(2, retryCount) * 1000;
```

---

## 📝 Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
feat(auth): add two-factor authentication

# Bug fix
fix(transfer): resolve race condition in balance update

# Documentation
docs(readme): update installation instructions

# Refactor
refactor(api): simplify error handling logic
```

### Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line should be 50 characters or less
- Reference issues and PRs in footer

---

## 🧪 Testing Guidelines

### Writing Tests

```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };
      
      const user = await UserService.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.password).not.toBe('SecurePass123!'); // Should be hashed
    });
    
    it('should throw error with invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'SecurePass123!'
      };
      
      await expect(UserService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- Test happy paths and error cases
- Test edge cases and boundary conditions
- Mock external dependencies

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific file
npm test -- UserService.test.js
```

---

## 🎨 UI/UX Guidelines

### Design Principles

- **Consistency**: Use existing components and patterns
- **Accessibility**: Follow WCAG 2.1 AA standards
- **Responsiveness**: Test on mobile, tablet, and desktop
- **Performance**: Optimize images and minimize re-renders

### Component Guidelines

```jsx
// ✅ Good - Accessible, semantic, responsive
<button
  onClick={handleClick}
  disabled={isLoading}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
  aria-label="Submit form"
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// ❌ Bad - Not accessible, not semantic
<div onClick={handleClick} className="button">
  Submit
</div>
```

---

## 📚 Documentation Guidelines

### Code Documentation

```javascript
/**
 * Transfers money from one user to another
 * 
 * @param {string} fromUserId - ID of the sender
 * @param {string} toUserId - ID of the recipient
 * @param {number} amount - Amount to transfer
 * @returns {Promise<Transaction>} The created transaction
 * @throws {InsufficientBalanceError} If sender has insufficient balance
 * @throws {UserNotFoundError} If recipient doesn't exist
 */
async function transferMoney(fromUserId, toUserId, amount) {
  // Implementation
}
```

### README Updates

When adding features, update:
- Feature list
- API documentation
- Usage examples
- Screenshots (if UI changed)

---

## 🐛 Debugging Tips

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify network connectivity

2. **Port Already in Use**
   ```bash
   # Kill process on port 5001
   lsof -ti:5001 | xargs kill -9
   ```

3. **Module Not Found**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode

```bash
# Backend with debug logs
DEBUG=* npm start

# Frontend with source maps
npm run dev -- --sourcemap
```

---

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

Top contributors may be invited to join the core team!

---

## 📞 Getting Help

- 💬 [GitHub Discussions](https://github.com/siddharthharshraj/QuickPe/discussions)
- 📧 Email: contact@siddharth-dev.tech
- 🐛 [GitHub Issues](https://github.com/siddharthharshraj/QuickPe/issues)

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<div align="center">

**Thank you for contributing to QuickPe! 🎉**

[⬆ Back to Top](#-contributing-to-quickpe)

</div>
