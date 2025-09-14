import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuickPeLogo from '../../../frontend/src/components/QuickPeLogo';

describe('QuickPeLogo Component', () => {
    it('renders logo with default props', () => {
        render(<QuickPeLogo />);
        
        // Check if the SVG is rendered
        const svg = screen.getByRole('img', { hidden: true });
        expect(svg).toBeInTheDocument();
        
        // Check if text is shown by default
        const text = screen.getByText('QuickPe');
        expect(text).toBeInTheDocument();
        expect(text).toHaveClass('bg-gradient-to-r', 'from-emerald-600', 'to-teal-600');
    });

    it('renders logo without text when showText is false', () => {
        render(<QuickPeLogo showText={false} />);
        
        // SVG should still be there
        const svg = screen.getByRole('img', { hidden: true });
        expect(svg).toBeInTheDocument();
        
        // Text should not be rendered
        expect(screen.queryByText('QuickPe')).not.toBeInTheDocument();
    });

    it('applies correct size classes', () => {
        const { rerender } = render(<QuickPeLogo size="sm" />);
        let container = screen.getByRole('img', { hidden: true }).parentElement;
        expect(container).toHaveClass('w-6', 'h-6');

        rerender(<QuickPeLogo size="lg" />);
        container = screen.getByRole('img', { hidden: true }).parentElement;
        expect(container).toHaveClass('w-12', 'h-12');

        rerender(<QuickPeLogo size="xl" />);
        container = screen.getByRole('img', { hidden: true }).parentElement;
        expect(container).toHaveClass('w-16', 'h-16');
    });

    it('applies correct text size classes', () => {
        const { rerender } = render(<QuickPeLogo size="sm" />);
        let text = screen.getByText('QuickPe');
        expect(text).toHaveClass('text-lg');

        rerender(<QuickPeLogo size="lg" />);
        text = screen.getByText('QuickPe');
        expect(text).toHaveClass('text-2xl');

        rerender(<QuickPeLogo size="xl" />);
        text = screen.getByText('QuickPe');
        expect(text).toHaveClass('text-3xl');
    });

    it('applies custom className', () => {
        render(<QuickPeLogo className="custom-class" />);
        const container = screen.getByText('QuickPe').parentElement;
        expect(container).toHaveClass('custom-class');
    });

    it('renders SVG with correct gradient and paths', () => {
        render(<QuickPeLogo />);
        const svg = screen.getByRole('img', { hidden: true });
        
        // Check for gradient definition
        const gradient = svg.querySelector('#quickpe-gradient');
        expect(gradient).toBeInTheDocument();
        
        // Check for main circle
        const circle = svg.querySelector('circle[cx="16"][cy="16"][r="15"]');
        expect(circle).toBeInTheDocument();
        expect(circle).toHaveAttribute('fill', 'url(#quickpe-gradient)');
        
        // Check for indicator dots
        const dots = svg.querySelectorAll('circle[fill="#ffffff"]');
        expect(dots).toHaveLength(3);
    });
});
