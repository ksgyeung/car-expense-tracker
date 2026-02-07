import { render, screen, waitFor } from '@testing-library/react';
import MileageChart from '../MileageChart';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Chart.js and react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Mocked Line Chart</div>,
}));

describe('MileageChart Component', () => {
  const mockMileageData = [
    { date: '2024-01-15T00:00:00.000Z', cumulativeDistance: 50.5 },
    { date: '2024-01-20T00:00:00.000Z', cumulativeDistance: 170.5 },
    { date: '2024-01-25T00:00:00.000Z', cumulativeDistance: 200.5 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<MileageChart />);

    expect(screen.getAllByText('Loading mileage data...').length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display chart when data is available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockMileageData }),
    });

    render(<MileageChart />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Check summary information
    expect(screen.getByText(/Showing 3 data points/)).toBeInTheDocument();
    expect(screen.getByText(/Total: 200.5 km/)).toBeInTheDocument();
  });

  it('should display "No data available" message when empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(<MileageChart />);

    await waitFor(() => {
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      expect(screen.getByText('Start recording trips to see your mileage trends over time.')).toBeInTheDocument();
    });
  });

  it('should display error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load mileage data' }),
    });

    render(<MileageChart />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Chart')).toBeInTheDocument();
      expect(screen.getByText('Failed to load mileage data')).toBeInTheDocument();
    });
  });

  it('should fetch data from /api/trips/mileage endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockMileageData }),
    });

    render(<MileageChart />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/trips/mileage');
    });
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<MileageChart />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Chart')).toBeInTheDocument();
      expect(screen.getByText('An error occurred while loading mileage data. Please try again.')).toBeInTheDocument();
    });
  });

  it('should display singular "data point" for single entry', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [mockMileageData[0]] }),
    });

    render(<MileageChart />);

    await waitFor(() => {
      expect(screen.getByText(/Showing 1 data point/)).toBeInTheDocument();
    });
  });
});
