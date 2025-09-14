import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../../frontend/src/components/Header';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/dashboard' })
    };
});

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('Header Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    it('renders logo and navigates to home when clicked', () => {
        renderWithRouter(<Header />);
        
        const logo = screen.getByText('QuickPe');
        expect(logo).toBeInTheDocument();
        
        fireEvent.click(logo.closest('div'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('shows sign in and get started buttons when not authenticated', () => {
        renderWithRouter(<Header />);
        
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByText('Get Started')).toBeInTheDocument();
        expect(screen.getByText('Contact Developer')).toBeInTheDocument();
    });

    it('shows user menu when authenticated', () => {
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'token') return 'fake-token';
            if (key === 'user') return JSON.stringify({ firstName: 'John', lastName: 'Doe' });
            return null;
        });

        renderWithRouter(<Header />);
        
        expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('shows navigation items when authenticated', () => {
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'token') return 'fake-token';
            if (key === 'user') return JSON.stringify({ firstName: 'John' });
            return null;
        });

        renderWithRouter(<Header />);
        
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Send Money')).toBeInTheDocument();
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    it('handles logout correctly', async () => {
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'token') return 'fake-token';
            if (key === 'user') return JSON.stringify({ firstName: 'John' });
            return null;
        });

        renderWithRouter(<Header />);
        
        // Open user dropdown
        const userButton = screen.getByText('John');
        fireEvent.click(userButton);
        
        // Click logout
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
        
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('toggles mobile menu', () => {
        renderWithRouter(<Header />);
        
        const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
        fireEvent.click(mobileMenuButton);
        
        // Mobile menu should be visible (check for mobile-specific elements)
        expect(screen.getAllByText('Sign In')).toHaveLength(2); // Desktop and mobile versions
    });

    it('loads and displays notifications', async () => {
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'token') return 'fake-token';
            if (key === 'user') return JSON.stringify({ firstName: 'John' });
            return null;
        });

        // Mock successful fetch response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                notifications: [
                    { id: 1, message: 'Test notification', read: false, timestamp: new Date().toISOString() }
                ]
            })
        });

        renderWithRouter(<Header />);
        
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/v1/notifications', {
                headers: { 'Authorization': 'Bearer fake-token' }
            });
        });
    });

    it('handles notification API failure gracefully', async () => {
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'token') return 'fake-token';
            if (key === 'user') return JSON.stringify({ firstName: 'John' });
            return null;
        });

        // Mock failed fetch response
        fetch.mockRejectedValueOnce(new Error('API Error'));

        renderWithRouter(<Header />);
        
        // Should still render without crashing and show mock notifications
        await waitFor(() => {
            expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
        });
    });

    it('formats last login time correctly', () => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
        
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'token') return 'fake-token';
            if (key === 'user') return JSON.stringify({ 
                firstName: 'John', 
                lastLogin: fiveMinutesAgo.toISOString() 
            });
            return null;
        });

        renderWithRouter(<Header />);
        
        expect(screen.getByText(/Last login: 5m ago/)).toBeInTheDocument();
    });
});
