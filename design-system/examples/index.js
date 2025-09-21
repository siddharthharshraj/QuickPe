/**
 * QuickPe Design System - Usage Examples
 *
 * Practical examples showing how to use the design system in React components.
 */

import React from 'react';
import {
  colors,
  typography,
  spacing,
  Button,
  Input,
  Card,
  Badge,
  Modal
} from '../index.js';

// Example 1: Basic Button Component
export function ExampleButton() {
  return (
    <div style={{ padding: spacing.space[4], gap: spacing.space[3] }}>
      <button style={Button.primary('md')}>
        Primary Button
      </button>

      <button style={Button.secondary('md')}>
        Secondary Button
      </button>

      <button style={Button.ghost('md')}>
        Ghost Button
      </button>
    </div>
  );
}

// Example 2: Form Component
export function ExampleForm() {
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: spacing.space[6],
      ...Card.default,
    }}>
      <h2 style={{
        ...typography.textStyles.h2,
        marginBottom: spacing.space[6],
        textAlign: 'center',
      }}>
        Sign In
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.space[4] }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: spacing.space[2],
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.medium,
            color: colors.text.secondary,
          }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email"
            style={Input.default('md')}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: spacing.space[2],
            fontSize: typography.fontSizes.sm,
            fontWeight: typography.fontWeights.medium,
            color: colors.text.secondary,
          }}>
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter your password"
            style={Input.default('md')}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.space[2] }}>
          <input
            type="checkbox"
            id="remember"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
            style={{
              width: '16px',
              height: '16px',
              accentColor: colors.primary[500],
            }}
          />
          <label
            htmlFor="remember"
            style={{
              fontSize: typography.fontSizes.sm,
              color: colors.text.secondary,
              cursor: 'pointer',
            }}
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          style={{
            ...Button.primary('md'),
            width: '100%',
            marginTop: spacing.space[2],
          }}
        >
          Sign In
        </button>
      </form>
    </div>
  );
}

// Example 3: Card with Badges
export function ExampleCard() {
  const transactions = [
    { id: '1', description: 'Payment received', amount: '+₹500', status: 'success', time: '2 hours ago' },
    { id: '2', description: 'Money sent', amount: '-₹200', status: 'info', time: '5 hours ago' },
    { id: '3', description: 'Transfer failed', amount: '₹0', status: 'error', time: '1 day ago' },
  ];

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: spacing.space[4],
      gap: spacing.space[4],
    }}>
      <div style={Card.elevated}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.space[4],
        }}>
          <h3 style={typography.textStyles.h3}>
            Recent Transactions
          </h3>
          <span style={Badge.primary('sm')}>
            3 transactions
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.space[3] }}>
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.space[3],
                borderRadius: '0.5rem',
                background: colors.neutral[50],
              }}
            >
              <div>
                <p style={{
                  margin: 0,
                  fontWeight: typography.fontWeights.medium,
                  color: colors.text.primary,
                }}>
                  {transaction.description}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: typography.fontSizes.sm,
                  color: colors.text.secondary,
                }}>
                  {transaction.time}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.space[2] }}>
                <span style={{
                  fontWeight: typography.fontWeights.semibold,
                  color: transaction.amount.startsWith('+')
                    ? colors.success[600]
                    : transaction.amount.startsWith('-')
                      ? colors.error[600]
                      : colors.text.primary,
                }}>
                  {transaction.amount}
                </span>
                <span style={
                  transaction.status === 'success' ? Badge.success('xs') :
                  transaction.status === 'error' ? Badge.error('xs') :
                  Badge.info('xs')
                }>
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Example 4: Modal Component
export function ExampleModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div style={Modal.overlay} onClick={onClose}>
      <div
        style={Modal.container}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={Modal.header}>
          <h3 style={typography.textStyles.h3}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: typography.fontSizes.xl,
              cursor: 'pointer',
              color: colors.text.secondary,
              padding: spacing.space[1],
              borderRadius: '0.25rem',
            }}
          >
            ×
          </button>
        </div>

        <div style={Modal.body}>
          {children}
        </div>

        <div style={Modal.footer}>
          <button
            onClick={onClose}
            style={Button.secondary('sm')}
          >
            Cancel
          </button>
          <button
            style={Button.primary('sm')}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 5: Responsive Layout
export function ExampleResponsiveLayout() {
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.background.secondary,
    }}>
      {/* Header */}
      <header style={{
        background: colors.background.primary,
        padding: `${spacing.space[4]} ${spacing.space[6]}`,
        borderBottom: `1px solid ${colors.border.light}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h1 style={{
            ...typography.textStyles.h1,
            margin: 0,
            background: colors.brand.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            QuickPe
          </h1>

          <nav style={{
            display: 'flex',
            gap: spacing.space[6],
            alignItems: 'center',
          }}>
            <a href="#" style={{
              color: colors.text.secondary,
              textDecoration: 'none',
              fontWeight: typography.fontWeights.medium,
              transition: 'color 0.2s ease',
            }}>
              Dashboard
            </a>
            <a href="#" style={{
              color: colors.text.secondary,
              textDecoration: 'none',
              fontWeight: typography.fontWeights.medium,
              transition: 'color 0.2s ease',
            }}>
              Transactions
            </a>
            <button style={Button.primary('sm')}>
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: spacing.space[6],
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: spacing.space[6],
        }}>
          {/* Balance Card */}
          <div style={Card.elevated}>
            <h3 style={typography.textStyles.h3}>
              Current Balance
            </h3>
            <p style={{
              ...typography.textStyles.body,
              fontSize: typography.fontSizes['2xl'],
              fontWeight: typography.fontWeights.bold,
              color: colors.primary[600],
              margin: `${spacing.space[2]} 0`,
            }}>
              ₹12,345.67
            </p>
            <p style={{
              ...typography.textStyles.caption,
              color: colors.success[600],
              margin: 0,
            }}>
              ↑ +2.5% from last month
            </p>
          </div>

          {/* Quick Actions */}
          <div style={Card.default}>
            <h3 style={typography.textStyles.h3}>
              Quick Actions
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.space[3],
              marginTop: spacing.space[4],
            }}>
              <button style={Button.primary('md')}>
                Add Money
              </button>
              <button style={Button.secondary('md')}>
                Send Money
              </button>
              <button style={Button.ghost('md')}>
                View Transactions
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Export all examples
export {
  ExampleButton,
  ExampleForm,
  ExampleCard,
  ExampleModal,
  ExampleResponsiveLayout,
};
