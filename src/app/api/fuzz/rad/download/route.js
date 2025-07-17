import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { db } from '@/lib/firebase-Admin';
import { doc, getDoc } from 'firebase/firestore';
import archiver from 'archiver';
import { PassThrough } from 'stream';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  const downloadAll = searchParams.get('all') === 'true';

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  try {
    // Get job info from Firestore
    const docRef = doc(db, 'radamsa_jobs', jobId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`Job not found in Firestore: ${jobId}`);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = docSnap.data();
    const resultsDir = path.join(process.cwd(), 'results', jobId);

    // Verify results directory exists
    try {
      await fs.access(resultsDir);
    } catch (err) {
      console.error(`Results directory not found: ${resultsDir}`, err);
      return NextResponse.json(
        { error: 'Fuzzed files not found on server' },
        { status: 404 }
      );
    }

    // Get files in directory
    let filesInDir;
    try {
      filesInDir = await fs.readdir(resultsDir);
    } catch (err) {
      console.error(`Error reading directory: ${resultsDir}`, err);
      return NextResponse.json(
        { error: 'Error reading fuzzed files directory' },
        { status: 500 }
      );
    }

    const fuzzedFiles = filesInDir.filter(file => file.startsWith('fuzzed_'));

    if (fuzzedFiles.length === 0) {
      console.error(`No fuzzed files found in directory: ${resultsDir}`);
      return NextResponse.json(
        { error: 'No fuzzed files available for download' },
        { status: 404 }
      );
    }

    if (downloadAll) {
      // Create zip archive for all files
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      const passThrough = new PassThrough();

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        passThrough.emit('error', err);
      });

      // Add files to archive
      for (const filename of fuzzedFiles) {
        const filePath = path.join(resultsDir, filename);
        try {
          await fs.access(filePath);
          archive.file(filePath, { name: filename });
        } catch (err) {
          console.error(`File not found: ${filePath}`, err);
          continue;
        }
      }

      archive.finalize();
      archive.pipe(passThrough);

      return new NextResponse(passThrough, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${jobId}_fuzzed_files.zip"`,
        },
      });
    } else {
      // Download single file
      const filename = fuzzedFiles[0];
      const filePath = path.join(resultsDir, filename);

      try {
        await fs.access(filePath);
        const fileStream = await fs.readFile(filePath);
        const cleanFilename = filename.replace(/^fuzzed_\d+_/, '');

        return new NextResponse(fileStream, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${cleanFilename}"`,
          },
        });
      } catch (err) {
        console.error(`Error accessing file: ${filePath}`, err);
        return NextResponse.json(
          { error: 'Requested file not found on server' },
          { status: 404 }
        );
      }
    }
  } catch (err) {
    console.error('Server error during download:', err);
    return NextResponse.json(
      { error: 'Internal server error during download' },
      { status: 500 }
    );
  }
}