'use client';

import { useState, useEffect } from 'react';
import { Expense } from '../lib/types';
import ExpenseForm from './ExpenseForm';
import { apiUrl } from '../lib/api';

/**
 * ExpenseList Component
 * 
 * Displays a list of vehicle expenses in chronological order with edit and delete functionality.
 * Features:
 * - Bootstrap-styled table displaying all expenses
 * - Edit and delete actions for each expense
 * - Loading state during data fetch
 * - Error state display
 * - Inline editing mode
 * 
 * Requirements: 2.2, 2.3, 2.4, 7.2, 7.3
 */

interface ExpenseListProps {
  /** Callback function called when the list needs to be refreshed */
  onRefresh?: () => void;
}

export default function ExpenseList({ onRefresh }: ExpenseListProps) {
  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(null);

  /**
   * Fetches expenses from the API
   */
  const fetchExpenses = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/expenses'));
      const data = await response.json();

      if (response.ok) {
        // Expenses are already sorted chronologically by the API (Requirement 2.2)
        setExpenses(data.expenses || []);
      } else {
        setError(data.error || 'Failed to load expenses');
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('An error occurred while loading expenses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles deleting an expense
   */
  const handleDelete = async (id: number) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setDeletingExpenseId(id);
    setError('');

    try {
      const response = await fetch(apiUrl(`/api/expenses/${id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove expense from local state
        setExpenses(expenses.filter(expense => expense.id !== id));
        
        // Call refresh callback if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete expense');
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('An error occurred while deleting the expense. Please try again.');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  /**
   * Handles starting edit mode for an expense
   */
  const handleEdit = (id: number) => {
    setEditingExpenseId(id);
    setError('');
  };

  /**
   * Handles canceling edit mode
   */
  const handleCancelEdit = () => {
    setEditingExpenseId(null);
  };

  /**
   * Handles successful expense update
   */
  const handleUpdateSuccess = () => {
    setEditingExpenseId(null);
    fetchExpenses();
    
    // Call refresh callback if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  /**
   * Formats a date string for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Formats an amount for display
   */
  const formatAmount = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Loading state - Requirement 7.3
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading expenses...</span>
          </div>
          <p className="mt-2 mb-0">Loading expenses...</p>
        </div>
      </div>
    );
  }

  // Error state - Requirement 7.3
  if (error && expenses.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <h5 className="alert-heading">Error Loading Expenses</h5>
            <p className="mb-0">{error}</p>
            <hr />
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={fetchExpenses}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (expenses.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted">
          <p className="mb-0">No expenses recorded yet. Add your first expense above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Expense History</h5>

        {/* Error Alert (for delete errors) - Requirement 7.3 */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Expenses Table - Requirements 2.2, 7.2 */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  {editingExpenseId === expense.id ? (
                    // Edit mode - show form inline
                    <td colSpan={5}>
                      <ExpenseForm
                        expense={expense}
                        onSuccess={handleUpdateSuccess}
                        onCancel={handleCancelEdit}
                      />
                    </td>
                  ) : (
                    // Display mode - show expense data
                    <>
                      <td>{formatDate(expense.date)}</td>
                      <td>
                        <span className="badge bg-secondary">{expense.type}</span>
                      </td>
                      <td>
                        <strong>{formatAmount(expense.amount)}</strong>
                      </td>
                      <td>
                        {expense.description || (
                          <span className="text-muted fst-italic">No description</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          {/* Edit Button - Requirement 2.3 */}
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleEdit(expense.id)}
                            disabled={deletingExpenseId === expense.id}
                            title="Edit expense"
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </button>
                          
                          {/* Delete Button - Requirement 2.4 */}
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(expense.id)}
                            disabled={deletingExpenseId === expense.id}
                            title="Delete expense"
                          >
                            {deletingExpenseId === expense.id ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-trash"></i> Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-3 text-end text-muted">
          <small>Total: {expenses.length} expense{expenses.length !== 1 ? 's' : ''}</small>
        </div>
      </div>
    </div>
  );
}
