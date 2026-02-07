import { NextRequest, NextResponse } from 'next/server';
import {
  getRefillById,
  updateRefill,
  deleteRefill,
} from '../../../../src/lib/services/refillService';
import { validateApiRequest } from '../../../../src/lib/auth';

/**
 * PUT /api/refills/[id]
 * Updates an existing refill with recalculation of efficiency
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
    const refillId = parseInt(id, 10);

    if (isNaN(refillId)) {
      return NextResponse.json(
        { error: 'Invalid refill ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amountSpent, distanceTraveled, date, notes } = body;

    // Build updates object with only provided fields
    const updates: any = {};
    
    if (amountSpent !== undefined) {
      updates.amountSpent = amountSpent;
    }
    
    if (distanceTraveled !== undefined) {
      updates.distanceTraveled = distanceTraveled;
    }
    
    if (date !== undefined) {
      updates.date = date;
    }
    
    if (notes !== undefined) {
      updates.notes = notes;
    }

    // Update refill (service layer handles validation and efficiency recalculation)
    const refill = updateRefill(refillId, updates);

    return NextResponse.json(
      { refill },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating refill:', error);
    
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
      { error: 'Failed to update refill' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/refills/[id]
 * Deletes a refill
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
    const refillId = parseInt(id, 10);

    if (isNaN(refillId)) {
      return NextResponse.json(
        { error: 'Invalid refill ID' },
        { status: 400 }
      );
    }

    const success = deleteRefill(refillId);

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
    console.error('Error deleting refill:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete refill' },
      { status: 500 }
    );
  }
}
