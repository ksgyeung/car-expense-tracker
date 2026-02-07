import { NextRequest, NextResponse } from 'next/server';
import {
  createExpense,
  getExpenses,
} from '../../../src/lib/services/expenseService';
import { validateApiRequest } from '../../../src/lib/auth';

/**
 * GET /api/expenses
 * Retrieves all expenses ordered chronologically
 */
export async function GET(request: NextRequest) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const expenses = getExpenses();
    
    return NextResponse.json(
      { expenses },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Creates a new expense with validation
 */
export async function POST(request: NextRequest) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const body = await request.json();
    const { type, amount, date, description } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Required field missing: type' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Required field missing: amount' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Required field missing: date' },
        { status: 400 }
      );
    }

    // Create expense (service layer handles additional validation)
    const expense = createExpense({
      type,
      amount,
      date,
      description,
    });

    return NextResponse.json(
      { expense },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    
    // Handle validation errors from service layer
    if (error instanceof Error) {
      // Check for specific validation error messages
      if (error.message.includes('Required field missing')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
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
    }
    
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
