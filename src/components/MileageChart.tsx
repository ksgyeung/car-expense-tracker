'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { apiUrl } from '../lib/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * MileageChart Component
 * 
 * Displays a line chart showing cumulative distance traveled over time.
 * Features:
 * - Fetches mileage data from /api/trips/mileage
 * - Renders responsive line chart
 * - Shows "No data available" message when empty
 * - Mobile-friendly responsive design
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 7.2
 */

interface MileageDataPoint {
  date: string;
  cumulativeDistance: number;
}

interface MileageChartProps {
  /** Optional callback when data is refreshed */
  onRefresh?: () => void;
}

export default function MileageChart({ onRefresh }: MileageChartProps) {
  // Data state
  const [mileageData, setMileageData] = useState<MileageDataPoint[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Fetches mileage data from the API
   */
  const fetchMileageData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/trips/mileage'));
      const data = await response.json();

      if (response.ok) {
        setMileageData(data.data || []);
      } else {
        setError(data.error || 'Failed to load mileage data');
      }
    } catch (err) {
      console.error('Error fetching mileage data:', err);
      setError('An error occurred while loading mileage data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Formats a date string for display on the chart
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Fetch mileage data on component mount
  useEffect(() => {
    fetchMileageData();
  }, []);

  // Prepare chart data
  const chartData = {
    labels: mileageData.map(point => formatDate(point.date)),
    datasets: [
      {
        label: 'Cumulative Distance (km)',
        data: mileageData.map(point => point.cumulativeDistance),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  // Chart options - Requirement 5.4 (responsive for mobile)
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Mileage Over Time',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Distance: ${context.parsed.y?.toFixed(1) ?? '0'} km`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Distance (km)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  // Loading state - Requirement 7.2
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading chart...</span>
          </div>
          <p className="mt-2 mb-0">Loading mileage data...</p>
        </div>
      </div>
    );
  }

  // Error state - Requirement 7.2
  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            <h5 className="alert-heading">Error Loading Chart</h5>
            <p className="mb-0">{error}</p>
            <hr />
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={fetchMileageData}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - Requirement 5.4
  if (mileageData.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="alert alert-info" role="alert">
            <h5 className="alert-heading">No Data Available</h5>
            <p className="mb-0">
              Start recording trips to see your mileage trends over time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Chart display - Requirements 5.1, 5.2, 5.3
  return (
    <div className="card">
      <div className="card-body">
        <div className="chart-container" style={{ position: 'relative', height: '400px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
        
        {/* Summary information */}
        <div className="mt-3 text-center text-muted">
          <small>
            Showing {mileageData.length} data point{mileageData.length !== 1 ? 's' : ''}
            {mileageData.length > 0 && (
              <> • Total: {mileageData[mileageData.length - 1].cumulativeDistance.toFixed(1)} km</>
            )}
          </small>
        </div>
      </div>
    </div>
  );
}
