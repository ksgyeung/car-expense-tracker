'use client';

import { useState, FormEvent } from 'react';
import { Expense } from '../lib/types';
import { apiUrl } from '../lib/api';

/**
 * ExpenseForm Component
 * 
 * A form component for creating and editing vehicle expenses.
 * Features:
 * - Bootstrap-styled form with fields for type, amount, date, and description
 * - Client-side and server-side validation
 * - Error message display
 * - Loading state during submission
 * - Support for both create and edit modes
 * 
 * Requirements: 2.1, 7.2, 7.3, 7.4
 */

interface ExpenseFormProps {
  /** Existing expense to edit (optional - if not provided, form is in create mode) */
  expense?: Expense;
  /** Callback function called after successful submission */
  onSuccess?: () => void;
  /** Callback function called when form is cancelled */
  onCancel?: () => void;
}

// Common expense types
const COMMON_EXPENSE_TYPES = [
  'Car Wash',
  'Oil Change',
  'Tire Replacement',
  'Brake Service',
  'Battery Replacement',
  'Air Filter',
  'Transmission Service',
  'Coolant Flush',
  'Wheel Alignment',
  'Inspection',
  'Registration',
  'Insurance',
  'Parking',
  'Toll',
  'Detailing',
  'Paint/Body Work',
  'Glass Repair',
  'Other',
];

// Render the common types sorted alphabetically, but keep 'Other' as the last option
const SORTED_EXPENSE_TYPES = (() => {
  const types = [...COMMON_EXPENSE_TYPES];
  const otherIndex = types.indexOf('Other');
  const hasOther = otherIndex !== -1;
  if (hasOther) types.splice(otherIndex, 1);
  return types.sort((a, b) => a.localeCompare(b)).concat(hasOther ? ['Other'] : []);
})();

export default function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  // Determine if the expense has a custom type (not in the common list)
  const isCustomType = expense?.type && !COMMON_EXPENSE_TYPES.includes(expense.type);
  
  // Form state
  const [type, setType] = useState(isCustomType ? '' : (expense?.type || ''));
  const [customType, setCustomType] = useState(isCustomType ? expense?.type || '' : '');
  const [showCustomInput, setShowCustomInput] = useState(isCustomType || false);
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [date, setDate] = useState(
    expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(expense?.description || '');
  
  // UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Handles dropdown change
   */
  const handleTypeChange = (value: string) => {
    if (value === 'Other') {
      setShowCustomInput(true);
      setType('');
      setCustomType('');
    } else {
      setShowCustomInput(false);
      setType(value);
      setCustomType('');
    }
  };

  /**
   * Validates form inputs on the client side
   * Returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate type
    const finalType = showCustomInput ? customType.trim() : type.trim();
    if (!finalType) {
      errors.type = 'Expense type is required';
    }

    // Validate amount
    if (!amount.trim()) {
      errors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) {
        errors.amount = 'Amount must be a valid number';
      } else if (amountNum <= 0) {
        errors.amount = 'Amount must be a positive number';
      }
    }

    // Validate date
    if (!date) {
      errors.date = 'Date is required';
    } else {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.date = 'Invalid date format';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const finalType = showCustomInput ? customType.trim() : type.trim();
      
      const expenseData = {
        type: finalType,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        description: description.trim() || undefined,
      };

      const url = expense ? apiUrl(`/api/expenses/${expense.id}`) : apiUrl('/api/expenses');
      const method = expense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - reset form if creating, call success callback
        if (!expense) {
          setType('');
          setCustomType('');
          setShowCustomInput(false);
          setAmount('');
          setDate(new Date().toISOString().split('T')[0]);
          setDescription('');
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Display error message from server
        setError(data.error || 'Failed to save expense');
      }
    } catch (err) {
      console.error('Error submitting expense:', err);
      setError('An error occurred while saving the expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles cancel button click
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </h5>

        {/* Error Alert - Requirement 7.4 */}
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

        {/* Expense Form - Requirements 2.1, 7.2 */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Type Field */}
          <div className="mb-3">
            <label htmlFor={showCustomInput ? "expense-custom-type" : "expense-type"} className="form-label">
              Type <span className="text-danger">*</span>
            </label>
            
            {!showCustomInput ? (
              <>
                <select
                  className={`form-select ${validationErrors.type ? 'is-invalid' : ''}`}
                  id="expense-type"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  disabled={isLoading}
                  required
                >
                  <option value="">Select expense type...</option>
                  {SORTED_EXPENSE_TYPES.map((expenseType) => (
                    <option key={expenseType} value={expenseType}>
                      {expenseType}
                    </option>
                  ))}
                </select>
                {validationErrors.type && (
                  <div className="invalid-feedback">{validationErrors.type}</div>
                )}
                <div className="form-text">
                  Select a common expense type or choose "Other" to enter a custom type
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <input
                    type="text"
                    className={`form-control ${validationErrors.type ? 'is-invalid' : ''}`}
                    id="expense-custom-type"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Enter custom expense type"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomType('');
                      setType('');
                    }}
                    disabled={isLoading}
                    title="Back to dropdown"
                  >
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  {validationErrors.type && (
                    <div className="invalid-feedback">{validationErrors.type}</div>
                  )}
                </div>
                <div className="form-text">
                  Enter a custom expense type or click the arrow to go back to the dropdown
                </div>
              </>
            )}
          </div>

          {/* Amount Field */}
          <div className="mb-3">
            <label htmlFor="expense-amount" className="form-label">
              Amount <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className={`form-control ${validationErrors.amount ? 'is-invalid' : ''}`}
                id="expense-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                disabled={isLoading}
                required
              />
              {validationErrors.amount && (
                <div className="invalid-feedback">{validationErrors.amount}</div>
              )}
            </div>
          </div>

          {/* Date Field */}
          <div className="mb-3">
            <label htmlFor="expense-date" className="form-label">
              Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className={`form-control ${validationErrors.date ? 'is-invalid' : ''}`}
              id="expense-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
              required
            />
            {validationErrors.date && (
              <div className="invalid-feedback">{validationErrors.date}</div>
            )}
          </div>

          {/* Description Field (Optional) */}
          <div className="mb-3">
            <label htmlFor="expense-description" className="form-label">
              Description <span className="text-muted">(optional)</span>
            </label>
            <textarea
              className="form-control"
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes about this expense"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Form Actions - Requirement 7.3 */}
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {expense ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                expense ? 'Update Expense' : 'Add Expense'
              )}
            </button>
            
            {onCancel && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
