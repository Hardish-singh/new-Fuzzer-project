import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { db } from '@/lib/firebase-Admin';
import { doc, setDoc } from 'firebase/firestore';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);

export async function POST(req) {
  try {
    const body = await req.json();
    const target = body.target;

    if (!target || !target.startsWith('http')) {
      return NextResponse.json({ error: 'Missing or invalid target URL' }, { status: 400 });
    }

    const resultsDir = path.join(process.cwd(), 'results');
    if (!fs.existsSync(resultsDir)) {
      await mkdirAsync(resultsDir);
    }

    const timestamp = Date.now();
    const jobId = `dalfox_${timestamp}`;
    const outputPath = path.join(resultsDir, jobId);
    const command = `dalfox url "${target}" --format json -o "${outputPath}"`;

    // Run Dalfox
    const { stderr } = await execAsync(command);
    if (stderr) {
      console.warn('Dalfox stderr:', stderr);
    }

    let resultData;
    try {
      const fileData = await readFileAsync(outputPath, 'utf-8');
      resultData = JSON.parse(fileData);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to parse Dalfox output' }, { status: 500 });
    }

    const plainJobId = jobId.replace('.json', '');
    const docRef = doc(db, 'dalfoxJobs', plainJobId);

    await setDoc(docRef, {
      target,
      jobId,
      command,
      createdAt: new Date().toISOString(),
      result: resultData,
    });

    return NextResponse.json({ jobId, result: resultData }, { status: 200 });

  } catch (err) {
    console.error('Dalfox API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
