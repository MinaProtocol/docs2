import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSignedCreditScore } from '../../../lib/signCreditScore';

// Implement toJSON for BigInt so we can include values in response
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// docs:start route
export function GET(request: NextRequest) {
  const searchParams = new URLSearchParams(request.nextUrl.search);
  return NextResponse.json(
    getSignedCreditScore(+(searchParams.get('user') ?? 0)),
    { status: 200 }
  );
}
// docs:end route
