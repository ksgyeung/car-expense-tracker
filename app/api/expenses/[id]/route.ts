import { NextRequest, NextResponse } from 'next/server';
import {
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../../../../src/lib/services/expenseService';
import { validateApiRequest } from '../../../../src/lib/auth';

/**
 * PUT /api/expenses/[id]
 * Updates an existing expense
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const { id } = await params;
    const expenseId = parseInt(id, 10);

    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, amount, date, description } = body;

    // Build updates object with only provided fields
    const updates: any = {};
    
    if (type !== undefined) {
      updates.type = type;
    }
    
    if (amount !== undefined) {
      updates.amount = amount;
    }
    
    if (date !== undefined) {
      updates.date = date;
    }
    
    if (description !== undefined) {
      updates.description = description;
    }

    // Update expense (service layer handles validation)
    const expense = updateExpense(expenseId, updates);

    return NextResponse.json(
      { expense },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating expense:', error);
    
    // Handle specific errors from service layer
    if (error instanceof Error) {
      if (error.message === 'Resource not found') {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('must be a positive number')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Invalid date format')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('cannot be empty')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * Deletes an expense
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const { id } = await params;
    const expenseId = parseInt(id, 10);

    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }

    const success = deleteExpense(expenseId);

    if (!success) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting expense:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
