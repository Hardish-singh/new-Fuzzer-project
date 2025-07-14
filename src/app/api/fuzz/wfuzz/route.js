import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { db } from '@/lib/firebase-Admin';
import { doc, setDoc } from 'firebase/firestore';

const execAsync = promisify(exec);

export async function POST(req) {
  // Create abort controller with 60 second timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const body = await req.json();
    const { target, wordlist, options = {} } = body;

    // Validate inputs strictly
    if (!target?.includes('FUZZ') || !wordlist) {
      clearTimeout(timeout);
      return NextResponse.json(
        { error: 'Invalid parameters: target must contain FUZZ and wordlist must be provided' },
        { status: 400 }
      );
    }

    const jobId = `wfuzz_${Date.now()}`;
    const resultsDir = path.join(process.cwd(), 'results');
    const wordlistPath = path.join(process.cwd(), 'wordlists', wordlist);
    const outputPath = path.join(resultsDir, `${jobId}.txt`);
    const debugPath = path.join(resultsDir, `${jobId}_debug.log`);

    // Ensure directories exist
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
    if (!fs.existsSync(wordlistPath)) {
      clearTimeout(timeout);
      return NextResponse.json(
        { error: `Wordlist "${wordlist}" not found in wordlists directory` },
        { status: 404 }
      );
    }

    // Build robust WFuzz command
    const cmd = [
      'wfuzz',
      '-w', `"${wordlistPath}"`,
      '-u', `"${target}"`,
      '-f', `"${outputPath}"`,
      '--hc', options.hideCodes || '404,500',
      options.followRedirects ? '--follow' : '',
      options.delay ? `-s ${options.delay}` : '',
      options.threads ? `-t ${options.threads}` : '',
      '-v'
    ].filter(Boolean).join(' ');

    console.log(`Executing: ${cmd}`);

    // Execute with proper error handling
    const { stdout, stderr } = await execAsync(cmd, { 
      signal: controller.signal,
      timeout: 55000 // Just under our 60s timeout
    });

    // Save debug info
    fs.writeFileSync(debugPath, `COMMAND: ${cmd}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`);

    // Parse results with multiple fallback patterns
    const rawOutput = fs.readFileSync(outputPath, 'utf-8');
    const cleanedOutput = rawOutput.replace(/\x1b\[[0-9;]*m/g, '');
    
    const resultPatterns = [
      /^(\d+)\s+C=(\d{3})\s+(\d+)\s+L\s+(\d+)\s+W\s+(\d+)\s+Ch\s+"([^"]+)"/gm,
      /^(\d+)\s+(\d{3})\s+(\d+)\s+(\d+)\s+(\d+)\s+"([^"]+)"/gm,
      /^(\d+)\s+(\d{3})\s+(\d+)\s+(\d+)\s+(\d+)\s+(.*)/gm
    ];

    const parsedResults = [];
    let match;

    for (const pattern of resultPatterns) {
      while ((match = pattern.exec(cleanedOutput)) !== null) {
        parsedResults.push({
          id: match[1],
          status: match[2],
          lines: match[3],
          words: match[4],
          chars: match[5],
          payload: match[6].replace(/"/g, ''),
          url: target.replace('FUZZ', match[6].replace(/"/g, ''))
        });
      }
      if (parsedResults.length > 0) break; // Stop at first successful pattern
    }

    // Fallback if no results - try direct grep approach
    if (parsedResults.length === 0) {
      const grepCmd = `grep -E "^\\s*[0-9]+\\s+[0-9]{3}\\s+" "${outputPath}"`;
      try {
        const { stdout: grepOutput } = await execAsync(grepCmd);
        grepOutput.split('\n').forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 7) {
            parsedResults.push({
              id: parts[0],
              status: parts[1],
              lines: parts[2],
              words: parts[4],
              chars: parts[6],
              payload: parts.slice(7).join(' ').replace(/"/g, ''),
              url: target.replace('FUZZ', parts.slice(7).join(' ').replace(/"/g, ''))
            });
          }
        });
      } catch (grepError) {
        console.error('Fallback grep failed:', grepError);
      }
    }

    // Final fallback - return raw output if parsing completely fails
    if (parsedResults.length === 0) {
      parsedResults.push({
        note: 'Raw output could not be parsed',
        rawOutput: cleanedOutput
      });
    }

    // Store results in Firestore
    await setDoc(doc(db, 'wfuzz_jobs', jobId), {
      jobId,
      timestamp: new Date().toISOString(),
      target,
      wordlist,
      options,
      result: parsedResults,
      stats: {
        totalRequests: parsedResults.length,
        successful: parsedResults.filter(r => r.status === '200').length,
      },
    });

    clearTimeout(timeout);
    return NextResponse.json({
      jobId,
      result: parsedResults,
      stats: {
        total: parsedResults.length,
        successful: parsedResults.filter(r => r.status === '200').length,
      },
      debug: {
        outputPath,
        debugPath
      }
    });

  } catch (error) {
    clearTimeout(timeout);
    console.error('WFuzz API Error:', error);

    if (error.signal === 'SIGTERM') {
      return NextResponse.json(
        { error: 'Scan timed out after 60 seconds' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        error: 'WFuzz execution failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
