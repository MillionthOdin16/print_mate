import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token;

    const res = await fetch('https://api.bambulab.com/v1/design-user-service/my/preference', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`}
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
    
  } catch (err: any) {
    console.log(err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
