import { NextRequest, NextResponse } from 'next/server';
import {
  createTrip,
  getTrips,
} from '../../../src/lib/services/tripService';
import { validateApiRequest } from '../../../src/lib/auth';

/**
 * GET /api/trips
 * Retrieves all trips ordered chronologically
 */
export async function GET(request: NextRequest) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const trips = getTrips();
    
    return NextResponse.json(
      { trips },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trips
 * Creates a new trip with validation
 */
export async function POST(request: NextRequest) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const body = await request.json();
    const { distance, date, purpose, notes } = body;

    // Validate required fields
    if (distance === undefined || distance === null) {
      return NextResponse.json(
        { error: 'Required field missing: distance' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Required field missing: date' },
        { status: 400 }
      );
    }

    // Create trip (service layer handles additional validation)
    const trip = createTrip({
      distance,
      date,
      purpose,
      notes,
    });

    return NextResponse.json(
      { trip },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating trip:', error);
    
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
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
