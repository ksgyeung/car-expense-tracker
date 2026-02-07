'use client';

import { useState, FormEvent } from 'react';
import { Refill } from '../lib/types';
import { apiUrl } from '../lib/api';

/**
 * RefillForm Component
 * 
 * A form component for creating and editing fuel refill records.
 * Features:
 * - Bootstrap-styled form with fields for amount spent, distance traveled, date, and notes
 * - Client-side and server-side validation
 * - Error message display
 * - Loading state during submission
 * - Support for both create and edit modes
 * - Automatic efficiency calculation on the backend
 * 
 * Requirements: 3.1, 7.2, 7.3, 7.4
 */

interface RefillFormProps {
  /** Existing refill to edit (optional - if not provided, form is in create mode) */
  refill?: Refill;
  /** Callback function called after successful submission */
  onSuccess?: () => void;
  /** Callback function called when form is cancelled */
  onCancel?: () => void;
}

export default function RefillForm({ refill, onSuccess, onCancel }: RefillFormProps) {
  // Form state
  const [amountSpent, setAmountSpent] = useState(refill?.amountSpent?.toString() || '');
  const [distanceTraveled, setDistanceTraveled] = useState(refill?.distanceTraveled?.toString() || '');
  const [date, setDate] = useState(
    refill?.date ? refill.date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(refill?.notes || '');
  
  // UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Validates form inputs on the client side
   * Returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate amount spent
    if (!amountSpent.trim()) {
      errors.amountSpent = 'Amount spent is required';
    } else {
      const amountNum = parseFloat(amountSpent);
      if (isNaN(amountNum)) {
        errors.amountSpent = 'Amount must be a valid number';
      } else if (amountNum <= 0) {
        errors.amountSpent = 'Amount must be a positive number';
      }
    }

    // Validate distance traveled
    if (!distanceTraveled.trim()) {
      errors.distanceTraveled = 'Distance traveled is required';
    } else {
      const distanceNum = parseFloat(distanceTraveled);
      if (isNaN(distanceNum)) {
        errors.distanceTraveled = 'Distance must be a valid number';
      } else if (distanceNum <= 0) {
        errors.distanceTraveled = 'Distance must be a positive number';
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
      const refillData = {
        amountSpent: parseFloat(amountSpent),
        distanceTraveled: parseFloat(distanceTraveled),
        date: new Date(date).toISOString(),
        notes: notes.trim() || undefined,
      };

      const url = refill ? apiUrl(`/api/refills/${refill.id}`) : apiUrl('/api/refills');
      const method = refill ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refillData),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - reset form if creating, call success callback
        if (!refill) {
          setAmountSpent('');
          setDistanceTraveled('');
          setDate(new Date().toISOString().split('T')[0]);
          setNotes('');
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Display error message from server
        setError(data.error || 'Failed to save refill');
      }
    } catch (err) {
      console.error('Error submitting refill:', err);
      setError('An error occurred while saving the refill. Please try again.');
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
          {refill ? 'Edit Refill' : 'Add New Refill'}
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

        {/* Refill Form - Requirements 3.1, 7.2 */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Amount Spent Field */}
          <div className="mb-3">
            <label htmlFor="refill-amount" className="form-label">
              Amount Spent <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className={`form-control ${validationErrors.amountSpent ? 'is-invalid' : ''}`}
                id="refill-amount"
                value={amountSpent}
                onChange={(e) => setAmountSpent(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                disabled={isLoading}
                required
              />
              {validationErrors.amountSpent && (
                <div className="invalid-feedback">{validationErrors.amountSpent}</div>
              )}
            </div>
            <div className="form-text">
              Enter the total cost of fuel purchased
            </div>
          </div>

          {/* Distance Traveled Field */}
          <div className="mb-3">
            <label htmlFor="refill-distance" className="form-label">
              Distance Traveled <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <input
                type="number"
                className={`form-control ${validationErrors.distanceTraveled ? 'is-invalid' : ''}`}
                id="refill-distance"
                value={distanceTraveled}
                onChange={(e) => setDistanceTraveled(e.target.value)}
                placeholder="0.0"
                step="0.1"
                min="0.1"
                disabled={isLoading}
                required
              />
              <span className="input-group-text">km</span>
              {validationErrors.distanceTraveled && (
                <div className="invalid-feedback">{validationErrors.distanceTraveled}</div>
              )}
            </div>
            <div className="form-text">
              Enter kilometers traveled since last refill (or starting odometer for first entry)
            </div>
          </div>

          {/* Date Field */}
          <div className="mb-3">
            <label htmlFor="refill-date" className="form-label">
              Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className={`form-control ${validationErrors.date ? 'is-invalid' : ''}`}
              id="refill-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
              required
            />
            {validationErrors.date && (
              <div className="invalid-feedback">{validationErrors.date}</div>
            )}
          </div>

          {/* Notes Field (Optional) */}
          <div className="mb-3">
            <label htmlFor="refill-notes" className="form-label">
              Notes <span className="text-muted">(optional)</span>
            </label>
            <textarea
              className="form-control"
              id="refill-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this refill"
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
                  {refill ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                refill ? 'Update Refill' : 'Add Refill'
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
