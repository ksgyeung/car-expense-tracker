import { NextRequest, NextResponse } from 'next/server';
import { getMileageOverTime } from '../../../../src/lib/services/tripService';
import { validateApiRequest } from '../../../../src/lib/auth';

/**
 * GET /api/trips/mileage
 * Retrieves mileage over time data for chart visualization
 * Aggregates distance data from trips and refills
 */
export async function GET(request: NextRequest) {
  // Validate session
  const sessionValidation = await validateApiRequest(request);
  if (sessionValidation instanceof NextResponse) {
    return sessionValidation;
  }
  
  try {
    const data = getMileageOverTime();
    
    return NextResponse.json(
      { data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching mileage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mileage data' },
      { status: 500 }
    );
  }
}
