import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:12001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy to the actual backend API
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        tenantCode: body.tenantCode || 'DEMO' // Default to DEMO tenant
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}