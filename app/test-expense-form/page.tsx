'use client';

import ExpenseForm from '../../src/components/ExpenseForm';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Test page for ExpenseForm component
 * This page is for development/testing purposes only
 */
export default function TestExpenseFormPage() {
  const handleSuccess = () => {
    alert('Expense saved successfully!');
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <h1 className="mb-4">ExpenseForm Component Test</h1>
          <ExpenseForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
