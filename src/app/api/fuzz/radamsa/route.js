// File: src/app/api/fuzz/radamsa/route.js

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { db } from '@/lib/firebase-Admin';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !file.name) {
      return NextResponse.json({ error: 'Missing uploaded file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const jobId = `radamsa_${Date.now()}`;
    const inputPath = path.join(process.cwd(), 'uploads', `${jobId}_${file.name}`);
    const outputPath = path.join(process.cwd(), 'results', `${jobId}_${file.name}`);

    await fs.mkdir(path.dirname(inputPath), { recursive: true });
    await fs.writeFile(inputPath, buffer);

    const cmd = `radamsa "${inputPath}" > "${outputPath}"`;

    return new Promise((resolve) => {
      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          return resolve(
            NextResponse.json({ error: stderr || error.message }, { status: 500 })
          );
        }

        // ✅ Save to Firestore using Client SDK
        await setDoc(doc(db, 'radamsa_jobs', jobId), {
          jobId,
          originalFile: file.name,
          fuzzedFile: `${jobId}_${file.name}`,
          timestamp: new Date().toISOString(),
        });

        return resolve(
          NextResponse.json({
            jobId,
            tool: 'radamsa',
            result: `Fuzzed file saved to /api/fuzz/radamsa/download?jobId=${jobId}&filename=${file.name}`,
          })
        );
      });
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  const filename = searchParams.get('filename');

  if (!jobId || !filename) {
    return NextResponse.json({ error: 'Missing jobId or filename' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'results', `${jobId}_${filename}`);

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
