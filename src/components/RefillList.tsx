'use client';

import { useState, useEffect } from 'react';
import { Refill } from '../lib/types';
import RefillForm from './RefillForm';
import { apiUrl } from '../lib/api';

/**
 * RefillList Component
 * 
 * Displays a list of fuel refills in chronological order with efficiency metrics,
 * edit and delete functionality.
 * Features:
 * - Bootstrap-styled table displaying all refills with efficiency metrics
 * - Edit and delete actions for each refill
 * - Loading state during data fetch
 * - Error state display
 * - Inline editing mode
 * 
 * Requirements: 3.4, 3.6, 3.7, 7.2, 7.3
 */

interface RefillListProps {
  /** Callback function called when the list needs to be refreshed */
  onRefresh?: () => void;
}

export default function RefillList({ onRefresh }: RefillListProps) {
  // Data state
  const [refills, setRefills] = useState<Refill[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRefillId, setEditingRefillId] = useState<number | null>(null);
  const [deletingRefillId, setDeletingRefillId] = useState<number | null>(null);

  /**
   * Fetches refills from the API
   */
  const fetchRefills = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/refills'));
      const data = await response.json();

      if (response.ok) {
        // Refills are already sorted chronologically by the API
        setRefills(data.refills || []);
      } else {
        setError(data.error || 'Failed to load refills');
      }
    } catch (err) {
      console.error('Error fetching refills:', err);
      setError('An error occurred while loading refills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles deleting a refill
   * Requirement 3.7: Delete refill entry
   */
  const handleDelete = async (id: number) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this refill?')) {
      return;
    }

    setDeletingRefillId(id);
    setError('');

    try {
      const response = await fetch(apiUrl(`/api/refills/${id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove refill from local state
        setRefills(refills.filter(refill => refill.id !== id));
        
        // Call refresh callback if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete refill');
      }
    } catch (err) {
      console.error('Error deleting refill:', err);
      setError('An error occurred while deleting the refill. Please try again.');
    } finally {
      setDeletingRefillId(null);
    }
  };

  /**
   * Handles starting edit mode for a refill
   * Requirement 3.6: Edit refill entry
   */
  const handleEdit = (id: number) => {
    setEditingRefillId(id);
    setError('');
  };

  /**
   * Handles canceling edit mode
   */
  const handleCancelEdit = () => {
    setEditingRefillId(null);
  };

  /**
   * Handles successful refill update
   */
  const handleUpdateSuccess = () => {
    setEditingRefillId(null);
    fetchRefills();
    
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

  /**
   * Formats distance for display
   */
  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(1)} km`;
  };

  /**
   * Formats liters for display
   */
  const formatLiters = (liters: number | undefined): string => {
    if (liters === undefined || liters === null) return 'N/A';
    return `${liters.toFixed(2)} L`;
  };

  /**
   * Formats efficiency for display
   * Requirement 3.4: Display efficiency metrics
   */
  const formatEfficiency = (efficiency: number | undefined): string => {
    if (efficiency === undefined || efficiency === null) {
      return 'N/A';
    }
    return `$${efficiency.toFixed(3)}/km`;
  };

  // Fetch refills on component mount
  useEffect(() => {
    fetchRefills();
  }, []);

  // Loading state - Requirement 7.3
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading refills...</span>
          </div>
          <p className="mt-2 mb-0">Loading refills...</p>
        </div>
      </div>
    );
  }

  // Error state - Requirement 7.3
  if (error && refills.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <h5 className="alert-heading">Error Loading Refills</h5>
            <p className="mb-0">{error}</p>
            <hr />
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={fetchRefills}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (refills.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted">
          <p className="mb-0">No refills recorded yet. Add your first refill above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Refill History</h5>

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

        {/* Refills Table - Requirements 3.4, 7.2 */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount Spent</th>
                <th>Liters</th>
                <th>Distance</th>
                <th>Efficiency</th>
                <th>Notes</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refills.map((refill) => (
                <tr key={refill.id}>
                  {editingRefillId === refill.id ? (
                    // Edit mode - show form inline
                    <td colSpan={7}>
                      <RefillForm
                        refill={refill}
                        onSuccess={handleUpdateSuccess}
                        onCancel={handleCancelEdit}
                      />
                    </td>
                  ) : (
                    // Display mode - show refill data
                    <>
                      <td>{formatDate(refill.date)}</td>
                      <td>
                        <strong>{formatAmount(refill.amountSpent)}</strong>
                      </td>
                      <td>{formatLiters(refill.liters)}</td>
                      <td>{formatDistance(refill.distanceTraveled)}</td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {formatEfficiency(refill.efficiency)}
                        </span>
                      </td>
                      <td>
                        {refill.notes || (
                          <span className="text-muted fst-italic">No notes</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          {/* Edit Button - Requirement 3.6 */}
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleEdit(refill.id)}
                            disabled={deletingRefillId === refill.id}
                            title="Edit refill"
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </button>
                          
                          {/* Delete Button - Requirement 3.7 */}
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(refill.id)}
                            disabled={deletingRefillId === refill.id}
                            title="Delete refill"
                          >
                            {deletingRefillId === refill.id ? (
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
          <small>Total: {refills.length} refill{refills.length !== 1 ? 's' : ''}</small>
        </div>
      </div>
    </div>
  );
}
