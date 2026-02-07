import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpenseForm from '../ExpenseForm';
import { Expense } from '../../lib/types';

// Mock fetch
global.fetch = jest.fn();

describe('ExpenseForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders form with all required fields', () => {
      render(<ExpenseForm />);

      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
    });

    it('displays validation errors for empty required fields', async () => {
      render(<ExpenseForm />);

      // Fill in date to bypass HTML5 validation, but leave type and amount empty
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/expense type is required/i)).toBeInTheDocument();
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for negative amount', async () => {
      render(<ExpenseForm />);

      // Fill in required fields - select from dropdown
      const typeSelect = screen.getByLabelText(/type/i);
      fireEvent.change(typeSelect, { target: { value: 'Car Wash' } });

      const amountInput = screen.getByLabelText(/amount/i);
      fireEvent.change(amountInput, { target: { value: '-10' } });

      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be a positive number/i)).toBeInTheDocument();
      });
    });

    it('displays validation error for zero amount', async () => {
      render(<ExpenseForm />);

      // Fill in required fields - select from dropdown
      const typeSelect = screen.getByLabelText(/type/i);
      fireEvent.change(typeSelect, { target: { value: 'Car Wash' } });

      const amountInput = screen.getByLabelText(/amount/i);
      fireEvent.change(amountInput, { target: { value: '0' } });

      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be a positive number/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      const mockOnSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          expense: {
            id: 1,
            type: 'car wash',
            amount: 25.50,
            date: '2024-01-15T00:00:00.000Z',
            description: 'Full service wash',
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
          },
        }),
      });

      render(<ExpenseForm onSuccess={mockOnSuccess} />);

      // Fill in form - select from dropdown
      fireEvent.change(screen.getByLabelText(/type/i), {
        target: { value: 'Car Wash' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '25.50' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-01-15' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Full service wash' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('Car Wash'),
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

      render(<ExpenseForm />);

      // Fill in form - select from dropdown
      fireEvent.change(screen.getByLabelText(/type/i), {
        target: { value: 'Oil Change' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/date/i), {
        target: { value: '2024-01-15' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('resets form after successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          expense: {
            id: 1,
            type: 'Car Wash',
            amount: 25.50,
            date: '2024-01-15T00:00:00.000Z',
            createdAt: '2024-01-15T10:00:00.000Z',
            updatedAt: '2024-01-15T10:00:00.000Z',
          },
        }),
      });

      render(<ExpenseForm />);

      // Fill in form - select from dropdown
      const typeSelect = screen.getByLabelText(/type/i) as HTMLSelectElement;
      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
      
      fireEvent.change(typeSelect, { target: { value: 'Car Wash' } });
      fireEvent.change(amountInput, { target: { value: '25.50' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(typeSelect.value).toBe('');
        expect(amountInput.value).toBe('');
      });
    });
  });

  describe('Edit Mode', () => {
    const mockExpense: Expense = {
      id: 1,
      type: 'maintenance',
      amount: 150.00,
      date: '2024-01-10T00:00:00.000Z',
      description: 'Oil change',
      createdAt: '2024-01-10T10:00:00.000Z',
      updatedAt: '2024-01-10T10:00:00.000Z',
    };

    it('renders form with expense data pre-filled', () => {
      render(<ExpenseForm expense={mockExpense} />);

      expect(screen.getByDisplayValue('maintenance')).toBeInTheDocument();
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Oil change')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update expense/i })).toBeInTheDocument();
    });

    it('submits update request with modified data', async () => {
      const mockOnSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          expense: {
            ...mockExpense,
            amount: 175.00,
          },
        }),
      });

      render(<ExpenseForm expense={mockExpense} onSuccess={mockOnSuccess} />);

      // Modify amount
      const amountInput = screen.getByLabelText(/amount/i);
      fireEvent.change(amountInput, { target: { value: '175' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/expenses/1',
          expect.objectContaining({
            method: 'PUT',
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows cancel button in edit mode', () => {
      const mockOnCancel = jest.fn();
      render(<ExpenseForm expense={mockExpense} onCancel={mockOnCancel} />);

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

      render(<ExpenseForm />);

      // Fill in form - select from dropdown
      fireEvent.change(screen.getByLabelText(/type/i), {
        target: { value: 'Car Wash' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '25' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/adding.../i)).toBeInTheDocument();
        expect(screen.getByLabelText(/type/i)).toBeDisabled();
        expect(screen.getByLabelText(/amount/i)).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<ExpenseForm />);

      // Fill in form - select from dropdown
      fireEvent.change(screen.getByLabelText(/type/i), {
        target: { value: 'Car Wash' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '25' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add expense/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred while saving the expense/i)).toBeInTheDocument();
      });
    });

    it('allows dismissing error messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Test error',
        }),
      });

      render(<ExpenseForm />);

      // Fill in and submit form to trigger error - select from dropdown
      fireEvent.change(screen.getByLabelText(/type/i), {
        target: { value: 'Car Wash' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '25' },
      });
      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

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
