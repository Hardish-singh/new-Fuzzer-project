import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { db } from '@/lib/firebase-Admin';
import { doc, setDoc } from 'firebase/firestore';

const execAsync = promisify(exec);

export async function POST(req) {
  try {
    const body = await req.json();
    const target = body.target;

    if (!target || !target.includes('FUZZ')) {
      return NextResponse.json({ error: 'Target must include FUZZ' }, { status: 400 });
    }

    const wordlist = path.resolve(process.cwd(), 'wordlists/common.txt');
    const timestamp = Date.now();
    const outputFile = path.resolve(process.cwd(), `results/ffuf_${timestamp}.json`);
    const command = `ffuf -u "${target}" -w "${wordlist}" -of json -o "${outputFile}"`;

    await execAsync(command);

    const rawJson = fs.readFileSync(outputFile, 'utf-8');
    const jsonData = JSON.parse(rawJson);

    const results = jsonData.results || [];
    const summary = {
      totalResults: results.length,
      firstURL: results[0]?.url || null,
      duration: results[0]?.duration || null,
    };

    const docId = `ffuf_${timestamp}`;
    const docData = {
      jobId: docId,
      createdAt: new Date().toISOString(),
      target,
      command,
      summary,
      results,
      raw: jsonData,
    };

    try {
      await setDoc(doc(db, 'fuzzJobs', docId), docData);
    } catch (firestoreErr) {
      console.error('❌ Firestore write failed:', firestoreErr);
      return NextResponse.json({ error: 'Failed to save results to Firestore' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Scan successful', jobId: docId, result: jsonData });

  } catch (err) {
    console.error('❌ FFUF Job Error:', err.message);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
