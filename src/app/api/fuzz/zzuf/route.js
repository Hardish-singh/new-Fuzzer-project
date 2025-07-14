import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase-Admin';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const execAsync = promisify(exec);

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const ratio = formData.get('ratio') || 0.4;
    const seed = formData.get('seed') || uuidv4();
    const timeout = formData.get('timeout') || 30; // seconds

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size (max 50MB for binary files)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    const jobId = `zzuf_${Date.now()}`;
    const uploadDir = path.join(process.cwd(), 'uploads');
    const resultsDir = path.join(process.cwd(), 'results');
    const extension = path.extname(file.name);
    const baseName = path.basename(file.name, extension);
    
    // Create directories if they don't exist
    await Promise.all([
      fs.mkdir(uploadDir, { recursive: true }),
      fs.mkdir(resultsDir, { recursive: true })
    ]);

    const inputPath = path.join(uploadDir, `${jobId}_${file.name}`);
    const outputPath = path.join(resultsDir, `${jobId}_fuzzed_${baseName}${extension}`);
    const logPath = path.join(resultsDir, `${jobId}_log.txt`);

    // Write the uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    // Prepare zzuf command with timeout
    const cmd = `timeout ${timeout}s zzuf -s ${seed} -r ${ratio} < "${inputPath}" > "${outputPath}" 2> "${logPath}"`;

    // Start timestamp for performance metrics
    const startTime = process.hrtime();

    // Execute zzuf
    try {
      await execAsync(cmd);
    } catch (error) {
      // timeout is expected behavior, we'll handle it
      if (!error.message.includes('Command failed: timeout')) {
        throw error;
      }
    }

    // Calculate execution time
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const executionTime = seconds + nanoseconds / 1e9;

    // Get file stats
    const [inputStats, outputStats] = await Promise.all([
      fs.stat(inputPath),
      fs.stat(outputPath).catch(() => ({ size: 0 })) // Handle case where output wasn't created
    ]);

    // Read log file
    const logContent = await fs.readFile(logPath, 'utf8').catch(() => 'No logs generated');

    // Store metadata in Firestore
    await setDoc(doc(db, 'zzuf_jobs', jobId), {
      jobId,
      tool: 'zzuf',
      status: 'completed',
      originalFileName: file.name,
      originalSize: inputStats.size,
      fuzzedSize: outputStats.size,
      ratio,
      seed,
      timeout,
      executionTime,
      inputPath,
      outputPath,
      logPath,
      logContent,
      createdAt: serverTimestamp(),
      downloadUrl: `/api/fuzz/zzuf/download?jobId=${jobId}`,
    });

    return NextResponse.json({
      jobId,
      tool: 'zzuf',
      status: 'completed',
      executionTime,
      originalSize: inputStats.size,
      fuzzedSize: outputStats.size,
      downloadUrl: `/api/fuzz/zfuzz/download?jobId=${jobId}`,
    });

  } catch (err) {
    return NextResponse.json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // Get job metadata
    const docRef = doc(db, 'zzuf_jobs', jobId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = docSnap.data();
    
    // Check if file exists
    try {
      await fs.access(jobData.outputPath);
    } catch {
      return NextResponse.json({ error: 'Fuzzed file not found' }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(jobData.outputPath);
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

