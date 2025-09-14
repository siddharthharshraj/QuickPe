import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Balance } from '../../../frontend/src/components/Balance';

// Mock apiClient
const mockApiClient = {
    get: vi.fn(),
    post: vi.fn()
};

vi.mock('../../../frontend/src/api/apiClient', () => ({
    default: mockApiClient
}));

describe('Balance Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders balance display correctly', async () => {
        mockApiClient.get.mockResolvedValueOnce({
            data: { balance: 15750.50 }
        });

        render(<Balance />);
        
        await waitFor(() => {
            expect(screen.getByText('₹15,750.50')).toBeInTheDocument();
        });
        
        expect(screen.getByText('Current Balance')).toBeInTheDocument();
    });

    it('handles loading state', () => {
        mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves
        
        render(<Balance />);
        
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles API error gracefully', async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));
        
        render(<Balance />);
        
        await waitFor(() => {
            expect(screen.getByText('₹0.00')).toBeInTheDocument();
        });
    });

    it('opens add money modal when button clicked', async () => {
        mockApiClient.get.mockResolvedValueOnce({
            data: { balance: 1000 }
        });

        render(<Balance />);
        
        await waitFor(() => {
            expect(screen.getByText('₹1,000.00')).toBeInTheDocument();
        });

        const addMoneyButton = screen.getByText('Add Money');
        fireEvent.click(addMoneyButton);
        
        expect(screen.getByText('Add Money to Wallet')).toBeInTheDocument();
    });

    it('processes add money transaction', async () => {
        mockApiClient.get.mockResolvedValueOnce({
            data: { balance: 1000 }
        });
        mockApiClient.post.mockResolvedValueOnce({
            data: { success: true, newBalance: 1500 }
        });

        render(<Balance />);
        
        await waitFor(() => {
            expect(screen.getByText('₹1,000.00')).toBeInTheDocument();
        });

        // Open modal
        const addMoneyButton = screen.getByText('Add Money');
        fireEvent.click(addMoneyButton);
        
        // Enter amount
        const amountInput = screen.getByPlaceholderText('Enter amount');
        fireEvent.change(amountInput, { target: { value: '500' } });
        
        // Submit
        const submitButton = screen.getByText('Add Money');
        fireEvent.click(submitButton);
        
        await waitFor(() => {
            expect(mockApiClient.post).toHaveBeenCalledWith('/account/add-money', {
                amount: 500
            });
        });
    });

    it('validates amount input', async () => {
        mockApiClient.get.mockResolvedValueOnce({
            data: { balance: 1000 }
        });

        render(<Balance />);
        
        await waitFor(() => {
            const addMoneyButton = screen.getByText('Add Money');
            fireEvent.click(addMoneyButton);
        });
        
        // Try to submit without amount
        const submitButton = screen.getByText('Add Money');
        fireEvent.click(submitButton);
        
        expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    });

    it('handles negative amounts', async () => {
        mockApiClient.get.mockResolvedValueOnce({
            data: { balance: 1000 }
        });

        render(<Balance />);
        
        await waitFor(() => {
            const addMoneyButton = screen.getByText('Add Money');
            fireEvent.click(addMoneyButton);
        });
        
        const amountInput = screen.getByPlaceholderText('Enter amount');
        fireEvent.change(amountInput, { target: { value: '-100' } });
        
        const submitButton = screen.getByText('Add Money');
        fireEvent.click(submitButton);
        
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
    });

    it('closes modal when cancel is clicked', async () => {
        mockApiClient.get.mockResolvedValueOnce({
            data: { balance: 1000 }
        });

        render(<Balance />);
        
        await waitFor(() => {
            const addMoneyButton = screen.getByText('Add Money');
            fireEvent.click(addMoneyButton);
        });
        
        expect(screen.getByText('Add Money to Wallet')).toBeInTheDocument();
        
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
        
        expect(screen.queryByText('Add Money to Wallet')).not.toBeInTheDocument();
    });

    it('refreshes balance after successful add money', async () => {
        mockApiClient.get
            .mockResolvedValueOnce({ data: { balance: 1000 } })
            .mockResolvedValueOnce({ data: { balance: 1500 } });
        
        mockApiClient.post.mockResolvedValueOnce({
            data: { success: true, newBalance: 1500 }
        });

        render(<Balance />);
        
        await waitFor(() => {
            const addMoneyButton = screen.getByText('Add Money');
            fireEvent.click(addMoneyButton);
        });
        
        const amountInput = screen.getByPlaceholderText('Enter amount');
        fireEvent.change(amountInput, { target: { value: '500' } });
        
        const submitButton = screen.getByText('Add Money');
        fireEvent.click(submitButton);
        
        await waitFor(() => {
            expect(mockApiClient.get).toHaveBeenCalledTimes(2);
        });
    });
});
