import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For demo purposes, return mock data
    // In production, this would proxy to your actual backend
    if (body.email === 'demo@salessync.com' && body.password === 'demo123') {
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'demo@salessync.com',
            name: 'Demo User',
            role: 'admin',
            tenantId: 'default'
          },
          token: 'mock-jwt-token-12345',
          refreshToken: 'mock-refresh-token-67890'
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}