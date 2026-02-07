import { NextRequest, NextResponse } from 'next/server';
import {
  getTripById,
  updateTrip,
  deleteTrip,
} from '../../../../src/lib/services/tripService';
import { validateApiRequest } from '../../../../src/lib/auth';

/**
 * PUT /api/trips/[id]
 * Updates an existing trip
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
    const tripId = parseInt(id, 10);

    if (isNaN(tripId)) {
      return NextResponse.json(
        { error: 'Invalid trip ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { distance, date, purpose, notes } = body;

    // Build updates object with only provided fields
    const updates: any = {};
    
    if (distance !== undefined) {
      updates.distance = distance;
    }
    
    if (date !== undefined) {
      updates.date = date;
    }
    
    if (purpose !== undefined) {
      updates.purpose = purpose;
    }
    
    if (notes !== undefined) {
      updates.notes = notes;
    }

    // Update trip (service layer handles validation)
    const trip = updateTrip(tripId, updates);

    return NextResponse.json(
      { trip },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating trip:', error);
    
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
    }
    
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trips/[id]
 * Deletes a trip
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
    const tripId = parseInt(id, 10);

    if (isNaN(tripId)) {
      return NextResponse.json(
        { error: 'Invalid trip ID' },
        { status: 400 }
      );
    }

    const success = deleteTrip(tripId);

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
    console.error('Error deleting trip:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
