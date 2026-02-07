'use client';

import { useState, FormEvent } from 'react';
import { Trip } from '../lib/types';
import { apiUrl } from '../lib/api';

/**
 * TripForm Component
 * 
 * A form component for creating and editing trip records.
 * Features:
 * - Bootstrap-styled form with fields for distance, date, purpose, and notes
 * - Client-side and server-side validation
 * - Error message display
 * - Loading state during submission
 * - Support for both create and edit modes
 * 
 * Requirements: 4.1, 7.2, 7.3, 7.4
 */

interface TripFormProps {
  /** Existing trip to edit (optional - if not provided, form is in create mode) */
  trip?: Trip;
  /** Callback function called after successful submission */
  onSuccess?: () => void;
  /** Callback function called when form is cancelled */
  onCancel?: () => void;
}

export default function TripForm({ trip, onSuccess, onCancel }: TripFormProps) {
  // Form state
  const [distance, setDistance] = useState(trip?.distance?.toString() || '');
  const [date, setDate] = useState(
    trip?.date ? trip.date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [purpose, setPurpose] = useState(trip?.purpose || '');
  const [notes, setNotes] = useState(trip?.notes || '');
  
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

    // Validate distance
    if (!distance.trim()) {
      errors.distance = 'Distance is required';
    } else {
      const distanceNum = parseFloat(distance);
      if (isNaN(distanceNum)) {
        errors.distance = 'Distance must be a valid number';
      } else if (distanceNum <= 0) {
        errors.distance = 'Distance must be a positive number';
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
      const tripData = {
        distance: parseFloat(distance),
        date: new Date(date).toISOString(),
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const url = trip ? apiUrl(`/api/trips/${trip.id}`) : apiUrl('/api/trips');
      const method = trip ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - reset form if creating, call success callback
        if (!trip) {
          setDistance('');
          setDate(new Date().toISOString().split('T')[0]);
          setPurpose('');
          setNotes('');
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Display error message from server
        setError(data.error || 'Failed to save trip');
      }
    } catch (err) {
      console.error('Error submitting trip:', err);
      setError('An error occurred while saving the trip. Please try again.');
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
          {trip ? 'Edit Trip' : 'Add New Trip'}
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

        {/* Trip Form - Requirements 4.1, 7.2 */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Distance Field */}
          <div className="mb-3">
            <label htmlFor="trip-distance" className="form-label">
              Distance <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <input
                type="number"
                className={`form-control ${validationErrors.distance ? 'is-invalid' : ''}`}
                id="trip-distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="0.0"
                step="0.1"
                min="0.1"
                disabled={isLoading}
                required
              />
              <span className="input-group-text">km</span>
              {validationErrors.distance && (
                <div className="invalid-feedback">{validationErrors.distance}</div>
              )}
            </div>
            <div className="form-text">
              Enter the distance traveled for this trip
            </div>
          </div>

          {/* Date Field */}
          <div className="mb-3">
            <label htmlFor="trip-date" className="form-label">
              Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className={`form-control ${validationErrors.date ? 'is-invalid' : ''}`}
              id="trip-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
              required
            />
            {validationErrors.date && (
              <div className="invalid-feedback">{validationErrors.date}</div>
            )}
          </div>

          {/* Purpose Field (Optional) */}
          <div className="mb-3">
            <label htmlFor="trip-purpose" className="form-label">
              Purpose <span className="text-muted">(optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="trip-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., work commute, grocery shopping, road trip"
              disabled={isLoading}
            />
            <div className="form-text">
              Enter the purpose or reason for this trip
            </div>
          </div>

          {/* Notes Field (Optional) */}
          <div className="mb-3">
            <label htmlFor="trip-notes" className="form-label">
              Notes <span className="text-muted">(optional)</span>
            </label>
            <textarea
              className="form-control"
              id="trip-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this trip"
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
                  {trip ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                trip ? 'Update Trip' : 'Add Trip'
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
