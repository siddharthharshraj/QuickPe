# QuickPe Design System

A comprehensive design system for the QuickPe digital wallet application, built with scalability and consistency in mind.

## 📋 Overview

The QuickPe Design System provides a unified approach to design and development across all platforms. It includes design tokens, component libraries, utilities, and documentation to ensure consistent user experiences.

## 🚀 Quick Start

### Installation

```bash
# Import the entire design system
import { theme, colors, typography, spacing } from './design-system';

# Or import specific parts
import { primary, secondary } from './design-system/tokens/colors';
import { Button, Card } from './design-system/components';
```

### Usage in CSS

```css
@import './design-system/global.css';

/* Use design tokens */
.my-component {
  color: var(--color-primary-600);
  font-size: var(--font-size-lg);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}
```

### Usage in JavaScript/React

```jsx
import { Button, Card } from './design-system/components';
import { colors } from './design-system/tokens/colors';

function MyComponent() {
  return (
    <Card.default>
      <Button.primary size="md">
        Click me
      </Button.primary>
    </Card.default>
  );
}
```

## 📁 Structure

```
design-system/
├── index.js              # Main entry point
├── theme.js              # Theme configuration
├── global.js             # Global styles and CSS variables
├── tokens/               # Design tokens
│   ├── colors.js         # Color system
│   ├── typography.js     # Typography system
│   ├── spacing.js        # Spacing system
│   ├── layout.js         # Layout system
│   ├── components.js     # Component tokens
│   ├── animations.js     # Animation system
│   └── responsive.js     # Responsive system
├── components/           # Pre-built components
│   └── index.js          # Component library
├── utilities/            # Utility functions
│   └── index.js          # Utility helpers
├── docs/                 # Documentation
├── examples/             # Usage examples
└── README.md            # This file
```

## 🎨 Design Tokens

### Colors
- **Primary**: Emerald/Teal gradient system
- **Semantic**: Success, warning, error, info states
- **Neutral**: Grayscale for text and backgrounds
- **Brand**: QuickPe-specific colors

### Typography
- **Fonts**: Inter (primary), JetBrains Mono (code)
- **Sizes**: Modular scale from xs to 9xl
- **Weights**: Thin to black (100-900)
- **Line Heights**: Tight to loose ratios

### Spacing
- **Scale**: Base-4 system (4px increments)
- **Semantic**: Component-specific spacing
- **Responsive**: Mobile-first spacing

### Animations
- **Easing**: Custom cubic-bezier functions
- **Duration**: Fast to glacial timing
- **Keyframes**: Fade, slide, scale, bounce effects

## 🧩 Components

### Buttons
- Primary (gradient background)
- Secondary (outlined)
- Ghost (text only)
- Sizes: xs, sm, md, lg, xl

### Form Elements
- Input (default, filled variants)
- Select, Checkbox, Radio
- Textarea, File upload

### Layout Components
- Card (default, elevated, outlined)
- Modal/Dialog
- Badge, Tag
- Notification/Toast

### Navigation
- Header, Footer
- Sidebar, Breadcrumb
- Tabs, Pagination

## 📱 Responsive Design

### Breakpoints
- **xs**: 0px (mobile)
- **sm**: 576px (large mobile)
- **md**: 768px (tablet)
- **lg**: 992px (small desktop)
- **xl**: 1200px (desktop)
- **xxl**: 1400px (large desktop)

### Container Sizes
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## 🎯 Best Practices

### 1. Use Design Tokens
```javascript
// ✅ Good
const buttonStyles = {
  background: colors.primary[500],
  padding: spacing.space[4],
  fontSize: typography.fontSizes.base,
};

// ❌ Avoid
const buttonStyles = {
  background: '#059669',
  padding: '1rem',
  fontSize: '1rem',
};
```

### 2. Follow Component Patterns
```jsx
// ✅ Good
<Button.primary size="md" variant="solid">
  Save Changes
</Button.primary>

// ❌ Avoid
<button className="custom-button-styles">
  Save Changes
</button>
```

### 3. Responsive First
```css
/* ✅ Good */
.my-component {
  padding: var(--spacing-4);
}

@media (min-width: 768px) {
  .my-component {
    padding: var(--spacing-6);
  }
}

/* ❌ Avoid */
.my-component {
  padding: 1rem;
}

@media (min-width: 768px) {
  .my-component {
    padding: 1.5rem;
  }
}
```

## 🔧 Customization

### Extending the Theme
```javascript
import { theme } from './design-system';

// Create custom theme
const customTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    primary: {
      ...theme.colors.primary,
      500: '#your-custom-color',
    },
  },
};
```

### Adding Custom Components
```javascript
// design-system/components/custom.js
export const CustomButton = {
  special: {
    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
    color: 'white',
    // ... other styles
  },
};
```

### CSS Variables Override
```css
:root {
  --color-primary-500: #your-brand-color;
  --spacing-4: 1.5rem; /* Custom spacing */
}
```

## 📚 Documentation

- **[Color Guide](./docs/colors.md)** - Color usage and accessibility
- **[Typography](./docs/typography.md)** - Font usage and hierarchy
- **[Components](./docs/components.md)** - Component usage and props
- **[Responsive](./docs/responsive.md)** - Responsive design patterns
- **[Animation](./docs/animation.md)** - Animation and transition guide

## 🛠️ Development

### Adding New Tokens
1. Add to appropriate token file (e.g., `tokens/colors.js`)
2. Update `theme.js` if needed
3. Add CSS variables to `global.js`
4. Update documentation

### Testing Changes
```bash
# Run design system tests
npm test -- --testPathPattern=design-system

# Visual regression testing
npm run test:visual
```

### Building Documentation
```bash
# Generate styleguide
npm run build:docs

# Generate CSS variables
npm run build:css
```

## 🤝 Contributing

### Guidelines
1. **Consistency**: Follow existing patterns
2. **Accessibility**: Ensure WCAG compliance
3. **Performance**: Optimize for bundle size
4. **Documentation**: Update docs for changes

### Pull Request Process
1. Create feature branch from `main`
2. Make changes following guidelines
3. Update tests and documentation
4. Submit PR with detailed description

## 📄 License

Copyright © 2024 QuickPe. All rights reserved.

## 📞 Support

- **Design Team**: design@quickpe.com
- **Development**: dev@quickpe.com
- **Issues**: [GitHub Issues](https://github.com/quickpe/design-system/issues)

---

**Built with ❤️ by the QuickPe Team**
