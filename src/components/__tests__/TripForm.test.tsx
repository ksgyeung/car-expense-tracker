import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TripForm from '../TripForm';
import { Trip } from '../../lib/types';

// Mock fetch
global.fetch = jest.fn();

describe('TripForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders form with all required fields', () => {
      render(<TripForm />);

      expect(screen.getByLabelText(/distance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add trip/i })).toBeInTheDocument();
    });

    it('displays validation errors for empty required fields', async () => {
      render(<TripForm />);

      // Fill in date to bypass HTML5 validation, but leave distance empty
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/distance is required/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for negative distance', async () => {
      render(<TripForm />);

      // Fill in required fields
      const distanceInput = screen.getByLabelText(/distance/i);
      fireEvent.change(distanceInput, { target: { value: '-10' } });

      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/distance must be a positive number/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for zero distance', async () => {
      render(<TripForm />);

      // Fill in required fields
      const distanceInput = screen.getByLabelText(/distance/i);
      fireEvent.change(distanceInput, { target: { value: '0' } });

      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add trip/i });
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
          trip: {
            id: 1,
            distance: 45.5,
            date: '2024-01-15T00:00:00.000Z',
            purpose: 'work commute',
            notes: 'Morning drive',
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
          },
        }),
      });

      render(<TripForm onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/distance/i), {
        target: { value: '45.5' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-01-15' },
      });
      fireEvent.change(screen.getByLabelText(/purpose/i), {
        target: { value: 'work commute' },
      });
      fireEvent.change(screen.getByLabelText(/notes/i), {
        target: { value: 'Morning drive' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/trips',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('45.5'),
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('submits form with only required fields', async () => {
      const mockOnSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trip: {
            id: 1,
            distance: 30.0,
            date: '2024-01-15T00:00:00.000Z',
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
          },
        }),
      });

      render(<TripForm onSuccess={mockOnSuccess} />);

      // Fill in only required fields
      fireEvent.change(screen.getByLabelText(/distance/i), {
        target: { value: '30' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-01-15' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/trips',
          expect.objectContaining({
            method: 'POST',
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

      render(<TripForm />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/distance/i), {
        target: { value: '50' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-01-15' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('resets form after successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trip: {
            id: 1,
            distance: 45.5,
            date: '2024-01-15T00:00:00.000Z',
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
          },
        }),
      });

      render(<TripForm />);

      // Fill in form
      const distanceInput = screen.getByLabelText(/distance/i) as HTMLInputElement;
      const purposeInput = screen.getByLabelText(/purpose/i) as HTMLInputElement;
      
      fireEvent.change(distanceInput, { target: { value: '45.5' } });
      fireEvent.change(purposeInput, { target: { value: 'work commute' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(distanceInput.value).toBe('');
        expect(purposeInput.value).toBe('');
      });
    });
  });

  describe('Edit Mode', () => {
    const mockTrip: Trip = {
      id: 1,
      distance: 75.5,
      date: '2024-01-10T00:00:00.000Z',
      purpose: 'grocery shopping',
      notes: 'Weekly shopping trip',
      createdAt: '2024-01-10T10:00:00.000Z',
      updatedAt: '2024-01-10T10:00:00.000Z',
    };

    it('renders form with trip data pre-filled', () => {
      render(<TripForm trip={mockTrip} />);

      expect(screen.getByDisplayValue('75.5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('grocery shopping')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Weekly shopping trip')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update trip/i })).toBeInTheDocument();
    });

    it('submits update request with modified data', async () => {
      const mockOnSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trip: {
            ...mockTrip,
            distance: 80.0,
          },
        }),
      });

      render(<TripForm trip={mockTrip} onSuccess={mockOnSuccess} />);

      // Modify distance
      const distanceInput = screen.getByLabelText(/distance/i);
      fireEvent.change(distanceInput, { target: { value: '80' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/trips/1',
          expect.objectContaining({
            method: 'PUT',
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows cancel button in edit mode', () => {
      const mockOnCancel = jest.fn();
      render(<TripForm trip={mockTrip} onCancel={mockOnCancel} />);

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

      render(<TripForm />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/distance/i), {
        target: { value: '50' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add trip/i });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/adding.../i)).toBeInTheDocument();
        expect(screen.getByLabelText(/distance/i)).toBeDisabled();
        expect(screen.getByLabelText(/date/i)).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<TripForm />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/distance/i), {
        target: { value: '50' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add trip/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred while saving the trip/i)).toBeInTheDocument();
      });
    });

    it('allows dismissing error messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Test error',
        }),
      });

      render(<TripForm />);

      // Fill in and submit form to trigger error
      fireEvent.change(screen.getByLabelText(/distance/i), {
        target: { value: '50' },
      });
      fireEvent.click(screen.getByRole('button', { name: /add trip/i }));

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
});
