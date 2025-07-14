import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { db } from '@/lib/firebase-Admin';
import { doc as getDocRef, getDoc } from 'firebase/firestore';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const docRef = getDocRef(db, 'zzuf_jobs', jobId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = docSnap.data();
    const outputPath = jobData.outputPath;

    if (!fs.existsSync(outputPath)) {
      return NextResponse.json({ error: 'Fuzzed file not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(outputPath);
    const fileName = `fuzzed_${jobData.originalFileName}`;

    return new Response(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (err) {
    return NextResponse.json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}