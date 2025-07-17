import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { db } from '@/lib/firebase-Admin';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import archiver from 'archiver';

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${dirPath}:`, err);
    throw err;
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const iterations = parseInt(formData.get('iterations')) || 10;
    const seed = formData.get('seed') || '';

    if (!file || !file.name) {
      return NextResponse.json({ error: 'Missing uploaded file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalSize = buffer.length;

    const jobId = `radamsa_${Date.now()}`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const resultsDir = path.join(process.cwd(), 'results', jobId);
    const inputPath = path.join(uploadsDir, `${jobId}_${file.name}`);
    const outputPattern = path.join(resultsDir, `fuzzed_%n_${file.name}`);

    // Ensure directories exist
    await ensureDirectoryExists(uploadsDir);
    await ensureDirectoryExists(resultsDir);

    // Write input file
    await fs.writeFile(inputPath, buffer);

    // Build radamsa command
    const cmd = `radamsa "${inputPath}" -o "${outputPattern}" -n ${iterations} ${
      seed ? `-s ${seed}` : ''
    }`;

    return new Promise((resolve) => {
      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          console.error('Radamsa error:', error);
          return resolve(
            NextResponse.json({ error: stderr || error.message }, { status: 500 })
          );
        }

        // Get all generated files
        let fuzzedFiles = [];
        try {
          const files = await fs.readdir(resultsDir);
          fuzzedFiles = files
            .filter(f => f.startsWith('fuzzed_'))
            .map(f => ({
              name: f,
              path: path.join(resultsDir, f)
            }));
        } catch (err) {
          console.error('Error reading output directory:', err);
          return resolve(
            NextResponse.json({ error: 'Failed to read output files' }, { status: 500 })
          );
        }

        if (fuzzedFiles.length === 0) {
          return resolve(
            NextResponse.json({ error: 'No fuzzed files were generated' }, { status: 500 })
          );
        }

        // Get file sizes
        const fileSizes = await Promise.all(
          fuzzedFiles.map(async (f) => {
            try {
              const stats = await fs.stat(f.path);
              return stats.size;
            } catch (err) {
              console.error('Error getting file size:', err);
              return 0;
            }
          })
        );

        const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);
        const avgSize = Math.round(totalSize / fuzzedFiles.length);

        // Prepare Firestore data
        const jobData = {
          jobId,
          originalFile: file.name,
          fuzzedFiles: fuzzedFiles.map(f => f.name),
          primaryFuzzedFile: fuzzedFiles[0].name,
          originalSize,
          fuzzedSize: fileSizes[0], // Size of first fuzzed file
          avgFuzzedSize: avgSize,
          totalFuzzedSize: totalSize,
          iterations,
          seed: seed || null,
          resultsDir: jobId,
          createdAt: new Date().toISOString(),
          status: 'completed'
        };

        try {
          await setDoc(doc(db, 'radamsa_jobs', jobId), jobData);
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          return resolve(
            NextResponse.json({ error: 'Failed to save job data' }, { status: 500 })
          );
        }

        return resolve(
          NextResponse.json({
            jobId,
            tool: 'radamsa',
            result: `Generated ${fuzzedFiles.length} fuzzed files`,
            fileCount: fuzzedFiles.length
          })
        );
      });
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  const downloadAll = searchParams.get('all') === 'true';

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  try {
    // Get job info from Firestore
    const docRef = doc(db, 'radamsa_jobs', jobId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = docSnap.data();
    const resultsDir = path.join(process.cwd(), 'results', jobData.resultsDir);

    // Verify results directory exists
    try {
      await fs.access(resultsDir);
    } catch (err) {
      console.error('Results directory not found:', resultsDir);
      return NextResponse.json({ error: 'Fuzzed files not found on server' }, { status: 404 });
    }

    if (downloadAll) {
      // Create a zip archive of all files
      const archive = archiver('zip', { zlib: { level: 9 } });
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      
      archive.on('data', (chunk) => writer.write(chunk));
      archive.on('end', () => writer.close());
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        writer.abort(err);
      });

      // Verify and add each file to archive
      let filesAdded = 0;
      for (const filename of jobData.fuzzedFiles || []) {
        const filePath = path.join(resultsDir, filename);
        try {
          await fs.access(filePath);
          archive.file(filePath, { name: filename });
          filesAdded++;
        } catch (err) {
          console.error(`File ${filename} not found:`, err);
        }
      }

      if (filesAdded === 0) {
        return NextResponse.json({ error: 'No fuzzed files available for download' }, { status: 404 });
      }
      
      archive.finalize();

      return new NextResponse(stream.readable, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${jobId}_fuzzed_files.zip"`,
        },
      });
    } else {
      // Download single file
      const filename = jobData.primaryFuzzedFile || jobData.fuzzedFiles?.[0];
      if (!filename) {
        return NextResponse.json({ error: 'No file specified for download' }, { status: 400 });
      }

      const filePath = path.join(resultsDir, filename);
      try {
        await fs.access(filePath);
        const fileBuffer = await fs.readFile(filePath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename.replace(/^fuzzed_\d+_/, '')}"`,
          },
        });
      } catch (err) {
        console.error('File not found:', filePath);
        return NextResponse.json({ error: 'Requested file not found on server' }, { status: 404 });
      }
    }
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}