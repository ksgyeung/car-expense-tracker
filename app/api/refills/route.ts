import { NextRequest, NextResponse } from 'next/server';
import {
  createRefill,
  getRefills,
} from '../../../src/lib/services/refillService';
import { validateApiRequest } from '../../../src/lib/auth';

/**
 * GET /api/refills
 * Retrieves all refills ordered chronologically
 */
export async function GET(request: NextRequest) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const refills = getRefills();
    
    return NextResponse.json(
      { refills },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching refills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/refills
 * Creates a new refill with validation and efficiency calculation
 */
export async function POST(request: NextRequest) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const body = await request.json();
    const { amountSpent, distanceTraveled, date, notes, liters } = body;

    // Validate required fields
    if (amountSpent === undefined || amountSpent === null) {
      return NextResponse.json(
        { error: 'Required field missing: amountSpent' },
        { status: 400 }
      );
    }

    if (distanceTraveled === undefined || distanceTraveled === null) {
      return NextResponse.json(
        { error: 'Required field missing: distanceTraveled' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Required field missing: date' },
        { status: 400 }
      );
    }

    // Create refill (service layer handles additional validation and efficiency calculation)
    const refill = createRefill({
      amountSpent,
      liters,
      distanceTraveled,
      date,
      notes,
    });

    return NextResponse.json(
      { refill },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating refill:', error);
    
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
      { error: 'Failed to create refill' },
      { status: 500 }
    );
  }
}
