import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpenseList from '../ExpenseList';
import { Expense } from '../../lib/types';

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn();

const mockExpenses: Expense[] = [
  {
    id: 1,
    type: 'car wash',
    amount: 25.50,
    date: '2024-01-10T00:00:00.000Z',
    description: 'Full service wash',
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-10T10:00:00.000Z',
  },
  {
    id: 2,
    type: 'maintenance',
    amount: 150.00,
    date: '2024-01-15T00:00:00.000Z',
    description: 'Oil change',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 3,
    type: 'insurance',
    amount: 500.00,
    date: '2024-01-20T00:00:00.000Z',
    createdAt: '2024-01-20T10:00:00.000Z',
    updatedAt: '2024-01-20T10:00:00.000Z',
  },
];

describe('ExpenseList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('Loading State', () => {
    it('displays loading spinner while fetching expenses', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ExpenseList />);

      expect(screen.getAllByText(/loading expenses/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Database connection failed',
        }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/error loading expenses/i)).toBeInTheDocument();
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('displays error message when network error occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred while loading expenses/i)).toBeInTheDocument();
      });
    });

    it('allows retrying after error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Database error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ expenses: mockExpenses }),
        });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
        expect(screen.queryByText(/database error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays message when no expenses exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expenses: [] }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/no expenses recorded yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Display Expenses', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });
    });

    it('displays all expenses in a table', async () => {
      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
        expect(screen.getByText(/maintenance/i)).toBeInTheDocument();
        expect(screen.getByText(/insurance/i)).toBeInTheDocument();
      });
    });

    it('displays expense details correctly', async () => {
      render(<ExpenseList />);

      await waitFor(() => {
        // Check amounts are formatted correctly
        expect(screen.getByText('$25.50')).toBeInTheDocument();
        expect(screen.getByText('$150.00')).toBeInTheDocument();
        expect(screen.getByText('$500.00')).toBeInTheDocument();

        // Check descriptions
        expect(screen.getByText('Full service wash')).toBeInTheDocument();
        expect(screen.getByText('Oil change')).toBeInTheDocument();
        expect(screen.getByText(/no description/i)).toBeInTheDocument();
      });
    });

    it('displays expenses in chronological order', async () => {
      render(<ExpenseList />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // Skip header row
        const dataRows = rows.slice(1);
        
        // Verify order by checking dates
        expect(dataRows[0]).toHaveTextContent('Jan 10');
        expect(dataRows[1]).toHaveTextContent('Jan 15');
        expect(dataRows[2]).toHaveTextContent('Jan 20');
      });
    });

    it('displays total count of expenses', async () => {
      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/total: 3 expenses/i)).toBeInTheDocument();
      });
    });

    it('displays edit and delete buttons for each expense', async () => {
      render(<ExpenseList />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

        expect(editButtons).toHaveLength(3);
        expect(deleteButtons).toHaveLength(3);
      });
    });
  });

  describe('Edit Functionality', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });
    });

    it('enters edit mode when edit button is clicked', async () => {
      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        // Should show the expense form
        expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /update expense/i })).toBeInTheDocument();
      });
    });

    it('exits edit mode when cancel is clicked', async () => {
      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      // Enter edit mode
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      // Cancel edit
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        // Should return to display mode
        expect(screen.queryByRole('button', { name: /update expense/i })).not.toBeInTheDocument();
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });
    });

    it('refreshes list after successful update', async () => {
      const updatedExpenses = [...mockExpenses];
      updatedExpenses[0] = { ...updatedExpenses[0], amount: 30.00 };

      // Initial fetch - return original expenses
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText('$25.50')).toBeInTheDocument();
      });

      // Enter edit mode
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      });

      // Update amount
      const amountInput = screen.getByLabelText(/amount/i);
      fireEvent.change(amountInput, { target: { value: '30.00' } });

      // Mock the update and subsequent refetch
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: update expense
          return Promise.resolve({
            ok: true,
            json: async () => ({ expense: updatedExpenses[0] }),
          });
        } else {
          // Second call: refetch expenses
          return Promise.resolve({
            ok: true,
            json: async () => ({ expenses: updatedExpenses }),
          });
        }
      });

      // Submit update
      const updateButton = screen.getByRole('button', { name: /update expense/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('$30.00')).toBeInTheDocument();
        expect(screen.queryByText('$25.50')).not.toBeInTheDocument();
      });
    });

    it('calls onRefresh callback after successful update', async () => {
      const mockOnRefresh = jest.fn();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ expenses: mockExpenses }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ expense: mockExpenses[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ expenses: mockExpenses }),
        });

      render(<ExpenseList onRefresh={mockOnRefresh} />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      // Enter edit mode and submit
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update expense/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update expense/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('prompts for confirmation before deleting', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this expense?'
      );
    });

    it('does not delete if user cancels confirmation', async () => {
      (global.confirm as jest.Mock).mockReturnValueOnce(false);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      // Should not make delete request
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
    });

    it('removes expense from list after successful deletion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText(/car wash/i)).not.toBeInTheDocument();
        expect(screen.getByText(/maintenance/i)).toBeInTheDocument();
        expect(screen.getByText(/insurance/i)).toBeInTheDocument();
      });
    });

    it('displays error message if deletion fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      // Now mock the delete to fail
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to delete expense' }),
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete expense/i)).toBeInTheDocument();
        // Expense should still be in the list
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });
    });

    it('shows loading spinner on delete button during deletion', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      // Mock a slow delete operation that never resolves immediately
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      // The delete button should be disabled and show spinner
      await waitFor(() => {
        const deleteButton = deleteButtons[0];
        expect(deleteButton).toBeDisabled();
      });
    });

    it('calls onRefresh callback after successful deletion', async () => {
      const mockOnRefresh = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });

      render(<ExpenseList onRefresh={mockOnRefresh} />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it('allows dismissing delete error messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });

      render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      // Mock delete to fail
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/delete failed/i)).toBeInTheDocument();
      });

      // Dismiss error
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/delete failed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expenses: mockExpenses }),
      });
    });

    it('uses responsive table wrapper', async () => {
      const { container } = render(<ExpenseList />);

      await waitFor(() => {
        expect(screen.getByText(/car wash/i)).toBeInTheDocument();
      });

      const tableWrapper = container.querySelector('.table-responsive');
      expect(tableWrapper).toBeInTheDocument();
    });
  });
});
