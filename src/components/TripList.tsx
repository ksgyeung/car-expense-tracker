'use client';

import { useState, useEffect } from 'react';
import { Trip } from '../lib/types';
import TripForm from './TripForm';
import { apiUrl } from '../lib/api';

/**
 * TripList Component
 * 
 * Displays a list of trips in chronological order with edit and delete functionality.
 * Features:
 * - Bootstrap-styled table displaying all trips
 * - Shows total distance traveled across all trips
 * - Edit and delete actions for each trip
 * - Loading state during data fetch
 * - Error state display
 * - Inline editing mode
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.6, 7.2, 7.3
 */

interface TripListProps {
  /** Callback function called when the list needs to be refreshed */
  onRefresh?: () => void;
}

export default function TripList({ onRefresh }: TripListProps) {
  // Data state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<number | null>(null);

  /**
   * Fetches trips from the API
   */
  const fetchTrips = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/trips'));
      const data = await response.json();

      if (response.ok) {
        // Trips are already sorted chronologically by the API (Requirement 4.2)
        setTrips(data.trips || []);
        
        // Calculate total distance (Requirement 4.6)
        const total = (data.trips || []).reduce((sum: number, trip: Trip) => sum + trip.distance, 0);
        setTotalDistance(total);
      } else {
        setError(data.error || 'Failed to load trips');
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('An error occurred while loading trips. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles deleting a trip
   */
  const handleDelete = async (id: number) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this trip?')) {
      return;
    }

    setDeletingTripId(id);
    setError('');

    try {
      const response = await fetch(apiUrl(`/api/trips/${id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove trip from local state and recalculate total
        const deletedTrip = trips.find(trip => trip.id === id);
        const updatedTrips = trips.filter(trip => trip.id !== id);
        setTrips(updatedTrips);
        
        if (deletedTrip) {
          setTotalDistance(totalDistance - deletedTrip.distance);
        }
        
        // Call refresh callback if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete trip');
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
      setError('An error occurred while deleting the trip. Please try again.');
    } finally {
      setDeletingTripId(null);
    }
  };

  /**
   * Handles starting edit mode for a trip
   */
  const handleEdit = (id: number) => {
    setEditingTripId(id);
    setError('');
  };

  /**
   * Handles canceling edit mode
   */
  const handleCancelEdit = () => {
    setEditingTripId(null);
  };

  /**
   * Handles successful trip update
   */
  const handleUpdateSuccess = () => {
    setEditingTripId(null);
    fetchTrips();
    
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
   * Formats distance for display
   */
  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(1)} km`;
  };

  // Fetch trips on component mount
  useEffect(() => {
    fetchTrips();
  }, []);

  // Loading state - Requirement 7.3
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading trips...</span>
          </div>
          <p className="mt-2 mb-0">Loading trips...</p>
        </div>
      </div>
    );
  }

  // Error state - Requirement 7.3
  if (error && trips.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <h5 className="alert-heading">Error Loading Trips</h5>
            <p className="mb-0">{error}</p>
            <hr />
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={fetchTrips}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (trips.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted">
          <p className="mb-0">No trips recorded yet. Add your first trip above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Trip History</h5>

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

        {/* Trips Table - Requirements 4.2, 7.2 */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Distance</th>
                <th>Purpose</th>
                <th>Notes</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  {editingTripId === trip.id ? (
                    // Edit mode - show form inline
                    <td colSpan={5}>
                      <TripForm
                        trip={trip}
                        onSuccess={handleUpdateSuccess}
                        onCancel={handleCancelEdit}
                      />
                    </td>
                  ) : (
                    // Display mode - show trip data
                    <>
                      <td>{formatDate(trip.date)}</td>
                      <td>
                        <strong>{formatDistance(trip.distance)}</strong>
                      </td>
                      <td>
                        {trip.purpose || (
                          <span className="text-muted fst-italic">No purpose</span>
                        )}
                      </td>
                      <td>
                        {trip.notes || (
                          <span className="text-muted fst-italic">No notes</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          {/* Edit Button - Requirement 4.3 */}
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleEdit(trip.id)}
                            disabled={deletingTripId === trip.id}
                            title="Edit trip"
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </button>
                          
                          {/* Delete Button - Requirement 4.4 */}
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(trip.id)}
                            disabled={deletingTripId === trip.id}
                            title="Delete trip"
                          >
                            {deletingTripId === trip.id ? (
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

        {/* Summary - Requirement 4.6 */}
        <div className="mt-3 d-flex justify-content-between text-muted">
          <small>Total: {trips.length} trip{trips.length !== 1 ? 's' : ''}</small>
          <small>
            <strong>Total Distance: {formatDistance(totalDistance)}</strong>
          </small>
        </div>
      </div>
    </div>
  );
}
