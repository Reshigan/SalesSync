import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ss.gonxt.tech/api';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/currency`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch currency settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Currency settings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currency, currencySymbol } = body;

    if (!currency || !currencySymbol) {
      return NextResponse.json(
        { error: 'Currency and currency symbol are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/settings/currency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency,
        currencySymbol,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to save currency settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Currency settings save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}