'use client';

import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ExpenseForm from '../../src/components/ExpenseForm';
import ExpenseList from '../../src/components/ExpenseList';
import RefillForm from '../../src/components/RefillForm';
import RefillList from '../../src/components/RefillList';
import TripForm from '../../src/components/TripForm';
import TripList from '../../src/components/TripList';

/**
 * Dashboard Client Component
 * 
 * Main application page with all features organized into tabs.
 * Features:
 * - Tab-based navigation for Expenses, Refills, Trips, and Charts
 * - Responsive layout for mobile devices
 * - Integration of all form and list components
 * - Mileage visualization chart
 * 
 * Requirements: 7.2, 7.5
 */
export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'refills' | 'trips'>('expenses');
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Handles tab change
   */
  const handleTabChange = (tab: 'expenses' | 'refills' | 'trips') => {
    setActiveTab(tab);
  };

  /**
   * Triggers a refresh of data (used after form submissions)
   */
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h2 mb-1">
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </h1>
              <p className="text-muted mb-0">Manage your vehicle expenses, refills, and trips</p>
            </div>
          </div>

          {/* Tab Navigation - Requirement 7.2 */}
          <ul className="nav nav-tabs mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'expenses' ? 'active' : ''}`}
                onClick={() => handleTabChange('expenses')}
                type="button"
                role="tab"
                aria-selected={activeTab === 'expenses'}
              >
                <i className="bi bi-receipt me-2"></i>
                Expenses
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'refills' ? 'active' : ''}`}
                onClick={() => handleTabChange('refills')}
                type="button"
                role="tab"
                aria-selected={activeTab === 'refills'}
              >
                <i className="bi bi-fuel-pump me-2"></i>
                Refills
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'trips' ? 'active' : ''}`}
                onClick={() => handleTabChange('trips')}
                type="button"
                role="tab"
                aria-selected={activeTab === 'trips'}
              >
                <i className="bi bi-geo-alt me-2"></i>
                Trips
              </button>
            </li>
            {/* Charts tab removed - no longer used */}
          </ul>

          {/* Tab Content - Requirement 7.5 (responsive layout) */}
          <div className="tab-content">
            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <div className="row g-4">
                  <div className="col-12 col-lg-4">
                    <ExpenseForm onSuccess={handleRefresh} />
                  </div>
                  <div className="col-12 col-lg-8">
                    <ExpenseList key={`expenses-${refreshKey}`} onRefresh={handleRefresh} />
                  </div>
                </div>
              </div>
            )}

            {/* Refills Tab */}
            {activeTab === 'refills' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <div className="row g-4">
                  <div className="col-12 col-lg-4">
                    <RefillForm onSuccess={handleRefresh} />
                  </div>
                  <div className="col-12 col-lg-8">
                    <RefillList key={`refills-${refreshKey}`} onRefresh={handleRefresh} />
                  </div>
                </div>
              </div>
            )}

            {/* Trips Tab */}
            {activeTab === 'trips' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <div className="row g-4">
                  <div className="col-12 col-lg-4">
                    <TripForm onSuccess={handleRefresh} />
                  </div>
                  <div className="col-12 col-lg-8">
                    <TripList key={`trips-${refreshKey}`} onRefresh={handleRefresh} />
                  </div>
                </div>
              </div>
            )}

            {/* Charts content removed */}
          </div>
        </div>
      </div>
    </div>
  );
}
