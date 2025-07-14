// src/app/api/testFuzzer/route.js

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: '✅ GET route is working!' });
}
