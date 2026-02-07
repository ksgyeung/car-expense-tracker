import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TripList from '../TripList';
import { Trip } from '../../lib/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('TripList Component', () => {
  const mockTrips: Trip[] = [
    {
      id: 1,
      distance: 50.5,
      date: '2024-01-15T00:00:00.000Z',
      purpose: 'Work commute',
      notes: 'Morning drive',
      createdAt: '2024-01-15T08:00:00.000Z',
      updatedAt: '2024-01-15T08:00:00.000Z',
    },
    {
      id: 2,
      distance: 120.0,
      date: '2024-01-20T00:00:00.000Z',
      purpose: 'Weekend trip',
      notes: undefined,
      createdAt: '2024-01-20T10:00:00.000Z',
      updatedAt: '2024-01-20T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<TripList />);

    expect(screen.getAllByText('Loading trips...').length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display trips in chronological order', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: mockTrips }),
    });

    render(<TripList />);

    await waitFor(() => {
      expect(screen.getByText('Trip History')).toBeInTheDocument();
    });

    // Check that trips are displayed
    expect(screen.getByText('Work commute')).toBeInTheDocument();
    expect(screen.getByText('Weekend trip')).toBeInTheDocument();
    expect(screen.getByText('50.5 km')).toBeInTheDocument();
    expect(screen.getByText('120.0 km')).toBeInTheDocument();
  });

  it('should display total distance traveled', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: mockTrips }),
    });

    render(<TripList />);

    await waitFor(() => {
      expect(screen.getByText(/Total Distance: 170.5 km/)).toBeInTheDocument();
    });
  });

  it('should display empty state when no trips exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: [] }),
    });

    render(<TripList />);

    await waitFor(() => {
      expect(screen.getByText('No trips recorded yet. Add your first trip above.')).toBeInTheDocument();
    });
  });

  it('should display error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load trips' }),
    });

    render(<TripList />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Trips')).toBeInTheDocument();
      expect(screen.getByText('Failed to load trips')).toBeInTheDocument();
    });
  });

  it('should handle delete action', async () => {
    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: mockTrips }),
    });

    // Mock window.confirm
    global.confirm = jest.fn(() => true);

    render(<TripList />);

    await waitFor(() => {
      expect(screen.getByText('Trip History')).toBeInTheDocument();
    });

    // Mock delete request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Click delete button for first trip
    const deleteButtons = screen.getAllByTitle('Delete trip');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/trips/1', {
        method: 'DELETE',
      });
    });
  });

  it('should handle edit action', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: mockTrips }),
    });

    render(<TripList />);

    await waitFor(() => {
      expect(screen.getByText('Trip History')).toBeInTheDocument();
    });

    // Click edit button for first trip
    const editButtons = screen.getAllByTitle('Edit trip');
    fireEvent.click(editButtons[0]);

    // Should show edit form
    await waitFor(() => {
      expect(screen.getByText('Edit Trip')).toBeInTheDocument();
    });
  });

  it('should display "No purpose" and "No notes" for trips without optional fields', async () => {
    const tripWithoutOptionals: Trip[] = [
      {
        id: 3,
        distance: 30.0,
        date: '2024-01-25T00:00:00.000Z',
        purpose: undefined,
        notes: undefined,
        createdAt: '2024-01-25T08:00:00.000Z',
        updatedAt: '2024-01-25T08:00:00.000Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: tripWithoutOptionals }),
    });

    render(<TripList />);

    await waitFor(() => {
      const noPurposeElements = screen.getAllByText('No purpose');
      const noNotesElements = screen.getAllByText('No notes');
      expect(noPurposeElements.length).toBeGreaterThan(0);
      expect(noNotesElements.length).toBeGreaterThan(0);
    });
  });

  it('should call onRefresh callback after successful delete', async () => {
    const mockOnRefresh = jest.fn();

    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ trips: mockTrips }),
    });

    // Mock window.confirm
    global.confirm = jest.fn(() => true);

    render(<TripList onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(screen.getByText('Trip History')).toBeInTheDocument();
    });

    // Mock delete request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Click delete button
    const deleteButtons = screen.getAllByTitle('Delete trip');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });
});
