import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RefillList from '../RefillList';
import { Refill } from '../../lib/types';

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn();

const mockRefills: Refill[] = [
  {
    id: 1,
    amountSpent: 45.50,
    distanceTraveled: 350.5,
    date: '2024-01-10T00:00:00.000Z',
    notes: 'Regular unleaded',
    efficiency: 0.1298,
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-10T10:00:00.000Z',
  },
  {
    id: 2,
    amountSpent: 50.00,
    distanceTraveled: 400.0,
    date: '2024-01-15T00:00:00.000Z',
    notes: 'Premium fuel',
    efficiency: 0.1250,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 3,
    amountSpent: 48.75,
    distanceTraveled: 380.0,
    date: '2024-01-20T00:00:00.000Z',
    efficiency: 0.1283,
    createdAt: '2024-01-20T10:00:00.000Z',
    updatedAt: '2024-01-20T10:00:00.000Z',
  },
];

describe('RefillList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('Loading State', () => {
    it('displays loading spinner while fetching refills', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<RefillList />);

      expect(screen.getAllByText(/loading refills/i).length).toBeGreaterThan(0);
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

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/error loading refills/i)).toBeInTheDocument();
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('displays error message when network error occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred while loading refills/i)).toBeInTheDocument();
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
          json: async () => ({ refills: mockRefills }),
        });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
        expect(screen.queryByText(/database error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays message when no refills exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: [] }),
      });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/no refills recorded yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Display Refills', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: mockRefills }),
      });
    });

    it('displays all refills in a table', async () => {
      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
        expect(screen.getByText(/premium fuel/i)).toBeInTheDocument();
      });
    });

    it('displays refill details correctly', async () => {
      render(<RefillList />);

      await waitFor(() => {
        // Check amounts are formatted correctly
        expect(screen.getByText('$45.50')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText('$48.75')).toBeInTheDocument();

        // Check distances
        expect(screen.getByText('350.5 km')).toBeInTheDocument();
        expect(screen.getByText('400.0 km')).toBeInTheDocument();
        expect(screen.getByText('380.0 km')).toBeInTheDocument();

        // Check notes
        expect(screen.getByText('Regular unleaded')).toBeInTheDocument();
        expect(screen.getByText('Premium fuel')).toBeInTheDocument();
        expect(screen.getByText(/no notes/i)).toBeInTheDocument();
      });
    });

    it('displays efficiency metrics for each refill', async () => {
      render(<RefillList />);

      await waitFor(() => {
        // Check efficiency values are displayed
        expect(screen.getByText('$0.130/km')).toBeInTheDocument();
        expect(screen.getByText('$0.125/km')).toBeInTheDocument();
        expect(screen.getByText('$0.128/km')).toBeInTheDocument();
      });
    });

    it('displays refills in chronological order', async () => {
      render(<RefillList />);

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

    it('displays total count of refills', async () => {
      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/total: 3 refills/i)).toBeInTheDocument();
      });
    });

    it('displays edit and delete buttons for each refill', async () => {
      render(<RefillList />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

        expect(editButtons).toHaveLength(3);
        expect(deleteButtons).toHaveLength(3);
      });
    });
  });

  describe('Efficiency Display', () => {
    it('handles refills with undefined efficiency', async () => {
      const refillsWithoutEfficiency: Refill[] = [
        {
          id: 1,
          amountSpent: 45.50,
          distanceTraveled: 350.5,
          date: '2024-01-10T00:00:00.000Z',
          notes: 'Regular unleaded',
          efficiency: undefined,
          createdAt: '2024-01-10T10:00:00.000Z',
          updatedAt: '2024-01-10T10:00:00.000Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: refillsWithoutEfficiency }),
      });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Functionality', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: mockRefills }),
      });
    });

    it('enters edit mode when edit button is clicked', async () => {
      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        // Should show the refill form
        expect(screen.getByLabelText(/amount spent/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/distance traveled/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /update refill/i })).toBeInTheDocument();
      });
    });

    it('exits edit mode when cancel is clicked', async () => {
      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
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
        expect(screen.queryByRole('button', { name: /update refill/i })).not.toBeInTheDocument();
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });
    });

    it.skip('refreshes list after successful update', async () => {
      const updatedRefills = [...mockRefills];
      updatedRefills[0] = { ...updatedRefills[0], amountSpent: 55.00, efficiency: 0.1569 };

      // Initial fetch - return original refills
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ refills: mockRefills }),
        })
        // Mock the update request
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ refill: updatedRefills[0] }),
        })
        // Mock the subsequent refetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ refills: updatedRefills }),
        });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText('$45.50')).toBeInTheDocument();
      });

      // Enter edit mode
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/amount spent/i)).toBeInTheDocument();
      });

      // Update amount
      const amountInput = screen.getByLabelText(/amount spent/i);
      fireEvent.change(amountInput, { target: { value: '55.00' } });

      // Submit update
      const updateButton = screen.getByRole('button', { name: /update refill/i });
      fireEvent.click(updateButton);

      // Wait for the update to complete and list to refresh
      await waitFor(() => {
        expect(screen.queryByText('$45.50')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(screen.getByText('$55.00')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('calls onRefresh callback after successful update', async () => {
      const mockOnRefresh = jest.fn();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ refills: mockRefills }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ refill: mockRefills[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ refills: mockRefills }),
        });

      render(<RefillList onRefresh={mockOnRefresh} />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });

      // Enter edit mode and submit
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update refill/i })).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update refill/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('prompts for confirmation before deleting', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: mockRefills }),
      });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this refill?'
      );
    });

    it('does not delete if user cancels confirmation', async () => {
      (global.confirm as jest.Mock).mockReturnValueOnce(false);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: mockRefills }),
      });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      // Should not make delete request
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
    });

    it('removes refill from list after successful deletion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: mockRefills }),
      });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText(/regular unleaded/i)).not.toBeInTheDocument();
        expect(screen.getByText(/premium fuel/i)).toBeInTheDocument();
      });
    });

    it('displays error message if deletion fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: mockRefills }),
      });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });

      // Clear previous mocks and set up delete failure
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete refill' }),
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete refill/i)).toBeInTheDocument();
        // Refill should still be in the list
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });
    });

    it('shows loading spinner on delete button during deletion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: mockRefills }),
      });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
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
        json: async () => ({ refills: mockRefills }),
      });

      render(<RefillList onRefresh={mockOnRefresh} />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ refills: mockRefills }),
      });

      render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });

      // Clear previous mocks and mock delete to fail
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
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
        json: async () => ({ refills: mockRefills }),
      });
    });

    it('uses responsive table wrapper', async () => {
      const { container } = render(<RefillList />);

      await waitFor(() => {
        expect(screen.getByText(/regular unleaded/i)).toBeInTheDocument();
      });

      const tableWrapper = container.querySelector('.table-responsive');
      expect(tableWrapper).toBeInTheDocument();
    });
  });
});
