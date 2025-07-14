import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { db } from '@/lib/firebase-Admin';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Process tracking for cleanup
const activeProcesses = new Map();

function parseAflStats(statsContent) {
  const stats = {};
  statsContent.split('\n').forEach(line => {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key && value) {
      stats[key] = isNaN(value) ? value : Number(value);
      const normalizedKey = key.replace(/\s+/g, '_').toLowerCase();
      if (normalizedKey !== key) {
        stats[normalizedKey] = stats[key];
      }
    }
  });
  return stats;
}

function parseAflOutput(output) {
  const result = {};
  const sections = output.split('______');
  
  sections.forEach(section => {
    const lines = section.split('\n').filter(line => line.trim());
    const sectionTitle = lines[0]?.trim().toLowerCase().replace(/\s+/g, '_') || '';
    
    lines.slice(1).forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        result[`${sectionTitle}_${normalizedKey}`] = isNaN(value) ? value : Number(value);
      }
    });
  });
  
  return result;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const cFile = formData.get('cfile');
    const seedFile = formData.get('seed');
    const duration = formData.get('duration') || 0;
    const targetFunction = formData.get('targetFunction') || 'main';
    const memoryLimit = formData.get('memoryLimit') || '200';
    const cpuLimit = formData.get('cpuLimit') || '1';

    if (!cFile || typeof cFile.name !== 'string') {
      return NextResponse.json({ error: 'C file is required' }, { status: 400 });
    }

    const jobId = `afl_${Date.now()}`;
    const baseDir = path.join(process.cwd(), 'fuzz');
    const uploadsDir = path.join(baseDir, 'uploads');
    const resultsDir = path.join(baseDir, 'results');
    const cFilePath = path.join(uploadsDir, `${jobId}_${cFile.name}`);
    const binaryPath = path.join(uploadsDir, `${jobId}_binary`);
    const inputDir = path.join(uploadsDir, `${jobId}_input`);
    const outputDir = path.join(resultsDir, `${jobId}_output`);

    // Create directories if they don't exist
    [uploadsDir, resultsDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // Save uploaded files
    const cBuffer = Buffer.from(await cFile.arrayBuffer());
    fs.writeFileSync(cFilePath, cBuffer);

    // Prepare seed input
    fs.mkdirSync(inputDir, { recursive: true });
    if (seedFile && typeof seedFile.name === 'string') {
      const seedBuffer = Buffer.from(await seedFile.arrayBuffer());
      fs.writeFileSync(path.join(inputDir, seedFile.name), seedBuffer);
    } else {
      fs.writeFileSync(path.join(inputDir, 'default_seed'), 'initial seed');
    }

    // Create initial job document
    const jobRef = doc(db, 'afl_jobs', jobId);
    await setDoc(jobRef, {
      jobId,
      tool: 'afl++',
      status: 'compiling',
      uploadedCFile: cFile.name,
      uploadedSeedFile: seedFile?.name || 'default_seed',
      targetFunction,
      duration: parseInt(duration),
      memoryLimit,
      cpuLimit,
      startTime: new Date().toISOString(),
      endTime: null,
      stats: {},
      crashes: 0,
      hangs: 0,
      execsPerSec: 0,
      coverage: {},
      lastUpdated: new Date().toISOString(),
      pid: null,
      aflOutput: {},
      logs: []
    });

    // Compile with instrumentation
    const compileCmd = [
      'afl-clang-fast',
      '-fsanitize=address,undefined',
      '-fno-omit-frame-pointer',
      '-g',
      cFilePath,
      '-o', binaryPath,
      `-DFUZZ_TARGET="${targetFunction}"`
    ].join(' ');

    await new Promise((resolve, reject) => {
      exec(compileCmd, async (err, stdout, stderr) => {
        if (err) {
          await updateDoc(jobRef, {
            status: 'failed',
            error: `Compilation failed: ${stderr}`,
            endTime: new Date().toISOString(),
            logs: [`Compilation failed: ${stderr}`]
          });
          return reject(new Error(`Compilation failed:\n${stderr}`));
        }
        
        await updateDoc(jobRef, {
          status: 'compiled',
          logs: [`Compilation successful: ${stdout}`]
        });
        resolve();
      });
    });

    // Start fuzzing process
    const fuzzArgs = [
      '-i', inputDir,
      '-o', outputDir,
      '-m', memoryLimit,
      '-t', '1000',
      '-M', 'main',
      '--', binaryPath
    ];

    if (duration > 0) {
      fuzzArgs.unshift(`${duration}h`, 'timeout');
    }

    const fuzzProcess = spawn(
      duration > 0 ? 'timeout' : 'afl-fuzz',
      fuzzArgs,
      { 
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          AFL_NO_UI: '0',
          AFL_I_DONT_CARE_ABOUT_MISSING_CRASHES: '1',
          AFL_SKIP_CPUFREQ: '1'
        }
      }
    );

    activeProcesses.set(jobId, fuzzProcess);
    const pid = fuzzProcess.pid;

    // Get current logs and update
    const jobSnapshot = await getDoc(jobRef);
    const currentLogs = jobSnapshot.exists() ? jobSnapshot.data().logs : [];
    await updateDoc(jobRef, { 
      pid, 
      status: 'fuzzing',
      logs: [...currentLogs, `Fuzzing started with PID: ${pid}`]
    });

    // Buffer for AFL++ UI output
    let aflOutputBuffer = '';
    let lastStatsUpdate = 0;
    
    // Process monitoring
    const monitorInterval = setInterval(async () => {
      try {
        const statsPath = path.join(outputDir, 'fuzzer_stats');
        if (fs.existsSync(statsPath)) {
          const statsContent = fs.readFileSync(statsPath, 'utf-8');
          const stats = parseAflStats(statsContent);

          const crashes = fs.existsSync(path.join(outputDir, 'crashes')) ? 
            fs.readdirSync(path.join(outputDir, 'crashes')).length : 0;
          const hangs = fs.existsSync(path.join(outputDir, 'hangs')) ? 
            fs.readdirSync(path.join(outputDir, 'hangs')).length : 0;

          await updateDoc(jobRef, {
            stats,
            crashes,
            hangs,
            execsPerSec: stats.execs_per_sec || 0,
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Monitoring error:', e);
      }
    }, 2000);

    // Process output
    fuzzProcess.stdout.on('data', async (data) => {
      const output = data.toString();
      console.log(`[AFL++ ${jobId}] ${output}`);
      
      const jobSnapshot = await getDoc(jobRef);
      const currentData = jobSnapshot.exists() ? jobSnapshot.data() : { logs: [] };
      
      // Parse AFL++ UI output
      const parsedOutput = parseAflOutput(output);
      
      await updateDoc(jobRef, {
        stats: {
          ...currentData.stats,
          ...parsedOutput,
          last_updated: new Date().toISOString()
        },
        crashes: parsedOutput.crashes || currentData.crashes,
        hangs: parsedOutput.hangs || currentData.hangs,
        logs: [...currentData.logs, output],
        aflOutput: parsedOutput
      });

      aflOutputBuffer += output;
      
      if (Date.now() - lastStatsUpdate > 2000 && aflOutputBuffer.includes('______')) {
        try {
          const parsedOutput = parseAflOutput(aflOutputBuffer);
          await updateDoc(jobRef, {
            aflOutput: parsedOutput,
            lastUpdated: new Date().toISOString()
          });
          aflOutputBuffer = '';
          lastStatsUpdate = Date.now();
        } catch (e) {
          console.error('Error parsing AFL++ output:', e);
        }
      }
    });

    fuzzProcess.stderr.on('data', async (data) => {
      const errorOutput = data.toString();
      console.error(`[AFL++ ${jobId} ERROR] ${errorOutput}`);
      
      const jobSnapshot = await getDoc(jobRef);
      const currentLogs = jobSnapshot.exists() ? jobSnapshot.data().logs : [];
      await updateDoc(jobRef, {
        logs: [...currentLogs, `ERROR: ${errorOutput}`]
      });
    });

    fuzzProcess.on('exit', async (code, signal) => {
      clearInterval(monitorInterval);
      activeProcesses.delete(jobId);
      
      const finalStatsPath = path.join(outputDir, 'fuzzer_stats');
      const finalStats = fs.existsSync(finalStatsPath) ? 
        parseAflStats(fs.readFileSync(finalStatsPath, 'utf-8')) : {};
      
      let coverage = {};
      try {
        const coveragePath = path.join(outputDir, 'coverage');
        if (fs.existsSync(coveragePath)) {
          coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
        }
      } catch (e) {
        console.error('Coverage read error:', e);
      }

      const status = 
        code === 0 ? 'completed' :
        signal === 'SIGINT' ? 'stopped' :
        'failed';

      const jobSnapshot = await getDoc(jobRef);
      const currentLogs = jobSnapshot.exists() ? jobSnapshot.data().logs : [];
      
      await updateDoc(jobRef, {
        status,
        endTime: new Date().toISOString(),
        stats: finalStats,
        coverage,
        lastUpdated: new Date().toISOString(),
        pid: null,
        logs: [...currentLogs, `Process exited with code ${code}, signal ${signal}`]
      });
    });

    return NextResponse.json({ 
      jobId,
      message: 'Fuzzing started successfully',
      pid
    });

  } catch (err) {
    console.error('Fuzzing error:', err);
    return NextResponse.json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const jobRef = doc(db, 'afl_jobs', jobId);
    const process = activeProcesses.get(jobId);

    if (process) {
      process.kill('SIGINT');
      activeProcesses.delete(jobId);
      const jobSnapshot = await getDoc(jobRef);
      const currentLogs = jobSnapshot.exists() ? jobSnapshot.data().logs : [];
      await updateDoc(jobRef, {
        status: 'stopped',
        endTime: new Date().toISOString(),
        pid: null,
        logs: [...currentLogs, 'Fuzzing stopped by user']
      });
      return NextResponse.json({ message: 'Fuzzing stopped successfully' });
    } else {
      await updateDoc(jobRef, {
        status: 'stopped',
        endTime: new Date().toISOString(),
        pid: null
      });
      return NextResponse.json({ message: 'Job marked as stopped' });
    }
  } catch (err) {
    console.error('Stop error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}