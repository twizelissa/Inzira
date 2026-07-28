import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ML_API = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const data = await request.json();
    const res = await fetch(`${ML_API}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('ML API error:', error);
    return NextResponse.json(
      { results: [], error: 'ML API unavailable' },
      { status: 502 }
    );
  }
}
