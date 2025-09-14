import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../frontend/src/components/Button';

describe('Button Component', () => {
    it('renders button with children', () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
    });

    it('applies primary variant styles by default', () => {
        render(<Button>Primary Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
    });

    it('applies secondary variant styles', () => {
        render(<Button variant="secondary">Secondary Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-gray-200', 'text-gray-900', 'hover:bg-gray-300');
    });

    it('applies danger variant styles', () => {
        render(<Button variant="danger">Danger Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('applies custom className', () => {
        render(<Button className="custom-class">Custom Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
    });

    it('applies default width and padding when not overridden', () => {
        render(<Button>Default Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('px-4', 'py-2', 'w-full');
    });

    it('forwards other props to button element', () => {
        render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
        const button = screen.getByTestId('submit-btn');
        expect(button).toHaveAttribute('type', 'submit');
    });

    it('does not call onClick when disabled', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
        
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        expect(handleClick).not.toHaveBeenCalled();
    });
});
