# Components

This directory contains reusable React components for the Car Expense Tracker application.

## ExpenseForm

A form component for creating and editing vehicle expenses.

### Usage

#### Create Mode (Add New Expense)

```tsx
import ExpenseForm from '@/components/ExpenseForm';

function MyPage() {
  const handleSuccess = () => {
    console.log('Expense created successfully!');
    // Refresh expense list, show success message, etc.
  };

  return (
    <ExpenseForm onSuccess={handleSuccess} />
  );
}
```

#### Edit Mode (Update Existing Expense)

```tsx
import ExpenseForm from '@/components/ExpenseForm';
import { Expense } from '@/lib/types';

function MyPage() {
  const expense: Expense = {
    id: 1,
    type: 'car wash',
    amount: 25.50,
    date: '2024-01-15T00:00:00.000Z',
    description: 'Full service wash',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  };

  const handleSuccess = () => {
    console.log('Expense updated successfully!');
    // Close modal, refresh list, etc.
  };

  const handleCancel = () => {
    console.log('Edit cancelled');
    // Close modal, reset state, etc.
  };

  return (
    <ExpenseForm 
      expense={expense}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
```

### Props

- `expense?: Expense` - Optional. If provided, the form will be in edit mode with pre-filled values.
- `onSuccess?: () => void` - Optional. Callback function called after successful form submission.
- `onCancel?: () => void` - Optional. Callback function called when the cancel button is clicked (only shown in edit mode).

### Features

- ✅ Bootstrap-styled form with responsive design
- ✅ Client-side validation with error messages
- ✅ Server-side validation error display
- ✅ Loading state with spinner during submission
- ✅ Automatic form reset after successful creation
- ✅ Support for both create and edit modes
- ✅ Dismissible error alerts
- ✅ Required field indicators
- ✅ Input validation for positive amounts
- ✅ Date picker with default to today's date

### Validation Rules

- **Type**: Required, cannot be empty
- **Amount**: Required, must be a positive number (> 0)
- **Date**: Required, must be a valid date
- **Description**: Optional

### Requirements Satisfied

- Requirement 2.1: Create expense entries with type, amount, date, and description
- Requirement 7.2: Responsive interface using Bootstrap components
- Requirement 7.3: Immediate visual feedback during operations
- Requirement 7.4: Clear display of validation errors
