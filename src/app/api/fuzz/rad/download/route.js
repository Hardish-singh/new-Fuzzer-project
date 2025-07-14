import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase-Admin';
import { doc as getDocRef, getDoc } from 'firebase/firestore';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const docRef = getDocRef(db, 'radamsa_jobs', jobId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const data = docSnap.data();
    const filename = data.fuzzedFile;

    if (!filename) {
      return NextResponse.json({ error: 'No file info found in DB' }, { status: 500 });
    }

    const filePath = path.join(process.cwd(), 'results', filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Fuzzed file not found on server' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
