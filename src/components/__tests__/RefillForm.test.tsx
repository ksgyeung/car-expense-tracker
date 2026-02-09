import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RefillForm from '../RefillForm';
import { Refill } from '../../lib/types';

// Mock fetch
global.fetch = jest.fn();

describe('RefillForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders form with all required fields', () => {
      render(<RefillForm />);

      expect(screen.getByLabelText(/amount spent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/distance traveled/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add refill/i })).toBeInTheDocument();
    });

    it('displays validation errors for empty required fields', async () => {
      render(<RefillForm />);

      // Fill in date to bypass HTML5 validation, but leave amount and distance empty
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount spent is required/i)).toBeInTheDocument();
        expect(screen.getByText(/distance traveled is required/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for negative amount', async () => {
      render(<RefillForm />);

      // Fill in required fields
      const amountInput = screen.getByLabelText(/amount spent/i);
      fireEvent.change(amountInput, { target: { value: '-50' } });

      const distanceInput = screen.getByLabelText(/distance traveled/i);
      fireEvent.change(distanceInput, { target: { value: '100' } });

      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be a positive number/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for zero amount', async () => {
      render(<RefillForm />);

      // Fill in required fields
      const amountInput = screen.getByLabelText(/amount spent/i);
      fireEvent.change(amountInput, { target: { value: '0' } });

      const distanceInput = screen.getByLabelText(/distance traveled/i);
      fireEvent.change(distanceInput, { target: { value: '100' } });

      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be a positive number/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for negative distance', async () => {
      render(<RefillForm />);

      // Fill in required fields
      const amountInput = screen.getByLabelText(/amount spent/i);
      fireEvent.change(amountInput, { target: { value: '50' } });

      const distanceInput = screen.getByLabelText(/distance traveled/i);
      fireEvent.change(distanceInput, { target: { value: '-100' } });

      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/distance must be a positive number/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for zero distance', async () => {
      render(<RefillForm />);

      // Fill in required fields
      const amountInput = screen.getByLabelText(/amount spent/i);
      fireEvent.change(amountInput, { target: { value: '50' } });

      const distanceInput = screen.getByLabelText(/distance traveled/i);
      fireEvent.change(distanceInput, { target: { value: '0' } });

      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/distance must be a positive number/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      const mockOnSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          refill: {
            id: 1,
            amountSpent: 60.00,
            distanceTraveled: 450.5,
            date: '2024-01-15T00:00:00.000Z',
            notes: 'Full tank',
            efficiency: 0.133,
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
          },
        }),
      });

      render(<RefillForm onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/amount spent/i), {
        target: { value: '60.00' },
      });
      fireEvent.change(screen.getByLabelText(/distance traveled/i), {
        target: { value: '450.5' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-01-15' },
      });
      fireEvent.change(screen.getByLabelText(/notes/i), {
        target: { value: 'Full tank' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/refills',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('60'),
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('displays server error message on failed submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Database connection failed',
        }),
      });

      render(<RefillForm />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/amount spent/i), {
        target: { value: '50' },
      });
      fireEvent.change(screen.getByLabelText(/distance traveled/i), {
        target: { value: '400' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-01-15' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('resets form after successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          refill: {
            id: 1,
            amountSpent: 60.00,
            distanceTraveled: 450.5,
            date: '2024-01-15T00:00:00.000Z',
            efficiency: 0.133,
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
          },
        }),
      });

      render(<RefillForm />);

      // Fill in form
      const amountInput = screen.getByLabelText(/amount spent/i) as HTMLInputElement;
      const distanceInput = screen.getByLabelText(/distance traveled/i) as HTMLInputElement;
      
      fireEvent.change(amountInput, { target: { value: '60' } });
      fireEvent.change(distanceInput, { target: { value: '450.5' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(amountInput.value).toBe('');
        expect(distanceInput.value).toBe('');
      });
    });
  });

  describe('Edit Mode', () => {
    const mockRefill: Refill = {
      id: 1,
      amountSpent: 55.00,
      distanceTraveled: 420.0,
      date: '2024-01-10T00:00:00.000Z',
      notes: 'Highway driving',
      efficiency: 0.131,
      createdAt: '2024-01-10T10:00:00.000Z',
      updatedAt: '2024-01-10T10:00:00.000Z',
    };

    it('renders form with refill data pre-filled', () => {
      render(<RefillForm refill={mockRefill} />);

      expect(screen.getByDisplayValue('55')).toBeInTheDocument();
      expect(screen.getByDisplayValue('420')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Highway driving')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update refill/i })).toBeInTheDocument();
    });

    it('submits update request with modified data', async () => {
      const mockOnSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          refill: {
            ...mockRefill,
            amountSpent: 60.00,
            efficiency: 0.143,
          },
        }),
      });

      render(<RefillForm refill={mockRefill} onSuccess={mockOnSuccess} />);

      // Modify amount
      const amountInput = screen.getByLabelText(/amount spent/i);
      fireEvent.change(amountInput, { target: { value: '60' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/refills/1',
          expect.objectContaining({
            method: 'PUT',
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows cancel button in edit mode', () => {
      const mockOnCancel = jest.fn();
      render(<RefillForm refill={mockRefill} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();

      fireEvent.click(cancelButton);
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables form inputs and shows loading spinner during submission', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<RefillForm />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/amount spent/i), {
        target: { value: '50' },
      });
      fireEvent.change(screen.getByLabelText(/distance traveled/i), {
        target: { value: '400' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/adding.../i)).toBeInTheDocument();
        expect(screen.getByLabelText(/amount spent/i)).toBeDisabled();
        expect(screen.getByLabelText(/distance traveled/i)).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RefillForm />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/amount spent/i), {
        target: { value: '50' },
      });
      fireEvent.change(screen.getByLabelText(/distance traveled/i), {
        target: { value: '400' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add refill/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred while saving the refill/i)).toBeInTheDocument();
      });
    });

    it('allows dismissing error messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Test error',
        }),
      });

      render(<RefillForm />);

      // Fill in and submit form to trigger error
      fireEvent.change(screen.getByLabelText(/amount spent/i), {
        target: { value: '50' },
      });
      fireEvent.change(screen.getByLabelText(/distance traveled/i), {
        target: { value: '400' },
      });
      fireEvent.click(screen.getByRole('button', { name: /add refill/i }));

      await waitFor(() => {
        expect(screen.getByText(/test error/i)).toBeInTheDocument();
      });

      // Dismiss error
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Help Text', () => {
    it('displays helpful text for distance field mentioning first entry', () => {
      render(<RefillForm />);

      expect(screen.getByText(/Either enter kilometers traveled directly, or provide start and end odometer readings to calculate distance automatically\./i)).toBeInTheDocument();
    });
  });
});
