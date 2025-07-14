'use client';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase-Admin';
import { collection, onSnapshot, orderBy, query, doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileInput, FileOutput, Clock, Bug, Gauge, Activity, Cpu, Memory, Zap, Terminal, Brain, BrainCircuit } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function AFLPage() {
  const [cfile, setCFile] = useState(null);
  const [seed, setSeed] = useState(null);
  const [duration, setDuration] = useState(0);
  const [targetFunction, setTargetFunction] = useState('main');
  const [memoryLimit, setMemoryLimit] = useState(200);
  const [cpuLimit, setCpuLimit] = useState(1);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [elapsedTimes, setElapsedTimes] = useState({});
  const router = useRouter();
  const intervalRef = useRef(null);

  // Calculate elapsed time for running jobs
  useEffect(() => {
    if (activeJobs.length > 0) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        setElapsedTimes(prev => {
          const newTimes = {...prev};
          activeJobs.forEach(job => {
            if (job.status === 'fuzzing' && job.startTime) {
              const start = new Date(job.startTime).getTime();
              newTimes[job.jobId] = Math.floor((now - start) / 1000);
            }
          });
          return newTimes;
        });
      }, 1000);

      return () => clearInterval(intervalRef.current);
    }
  }, [activeJobs]);

  // Fetch jobs from Firestore
  useEffect(() => {
    const q = query(collection(db, 'afl_jobs'), orderBy('startTime', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const allJobs = snap.docs.map(doc => {
        const data = doc.data();
        // Calculate actual duration for completed jobs
        let actualDuration = 0;
        if (data.startTime && data.endTime) {
          const start = new Date(data.startTime).getTime();
          const end = new Date(data.endTime).getTime();
          actualDuration = Math.floor((end - start) / 1000);
        }
        return { 
          id: doc.id, 
          ...data,
          actualDuration 
        };
      });
      setJobs(allJobs);
      
      const active = allJobs.filter(job => ['compiling', 'fuzzing'].includes(job.status));
      setActiveJobs(active);
      
      setElapsedTimes(prev => {
        const newTimes = {...prev};
        active.forEach(job => {
          if (!prev[job.jobId] && job.startTime) {
            const start = new Date(job.startTime).getTime();
            newTimes[job.jobId] = Math.floor((Date.now() - start) / 1000);
          }
        });
        return newTimes;
      });
    });
    
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!cfile) {
      toast.error('Please select a C file to fuzz');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('cfile', cfile);
      if (seed) formData.append('seed', seed);
      formData.append('duration', duration);
      formData.append('targetFunction', targetFunction);
      formData.append('memoryLimit', memoryLimit);
      formData.append('cpuLimit', cpuLimit);

      const response = await fetch('/api/fuzz/afl', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(`Fuzzing started with Job ID: ${result.jobId}`);
      } else {
        toast.error(result.error || 'Failed to start fuzzing');
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
      setCFile(null);
      setSeed(null);
    }
  };

  const stopFuzzing = async (jobId) => {
    try {
      const response = await fetch(`/api/fuzz/afl?jobId=${jobId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(`Fuzzing stopped for Job ID: ${jobId}`);
      } else {
        toast.error(result.error || 'Failed to stop fuzzing');
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m ` : ''}${secs}s`;
  };

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
  };

  const getProgressValue = (job) => {
    if (!job.duration || job.duration <= 0) return 0;
    const elapsed = elapsedTimes[job.jobId] || job.stats?.run_time || 0;
    const totalSeconds = job.duration * 3600;
    return Math.min(100, (elapsed / totalSeconds) * 100);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      case 'fuzzing': return 'default';
      case 'compiling': return 'secondary';
      case 'stopped': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          AFL++ Fuzzing Dashboard
        </h1>
        <Button onClick={() => router.push('/dashboard/fuzz')}>
          Back to Fuzzing Tools
        </Button>
      </div>

      <Card className="border border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            New Fuzzing Session
          </CardTitle>
          <CardDescription>
            Configure and launch a new AFL++ fuzzing session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cfile" className="flex items-center gap-2">
                  <FileInput className="w-4 h-4" />
                  C Source File *
                </Label>
                <Input 
                  id="cfile" 
                  type="file" 
                  accept=".c,.h"
                  onChange={(e) => setCFile(e.target.files?.[0] || null)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seed" className="flex items-center gap-2">
                  <FileOutput className="w-4 h-4" />
                  Seed Input (Optional)
                </Label>
                <Input 
                  id="seed" 
                  type="file" 
                  onChange={(e) => setSeed(e.target.files?.[0] || null)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetFunction">Target Function</Label>
                <Input
                  id="targetFunction"
                  value={targetFunction}
                  onChange={(e) => setTargetFunction(e.target.value)}
                  placeholder="main"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration: {duration > 0 ? `${duration} hours` : 'Unlimited'}
                </Label>
                <Slider
                  value={[duration]}
                  max={24}
                  step={1}
                  onValueChange={([value]) => setDuration(value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" />
                  Memory Limit: {memoryLimit} MB
                </Label>
                <Slider
                  value={[memoryLimit]}
                  min={50}
                  max={2048}
                  step={50}
                  onValueChange={([value]) => setMemoryLimit(value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  CPU Cores: {cpuLimit}
                </Label>
                <Slider
                  value={[cpuLimit]}
                  min={1}
                  max={8}
                  step={1}
                  onValueChange={([value]) => setCpuLimit(value)}
                />
              </div>
            </div>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading || !cfile}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Fuzzing Session...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Start Fuzzing
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {activeJobs.length > 0 && (
        <Card className="border border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Active Fuzzing Sessions
            </CardTitle>
            <CardDescription>
              {activeJobs.length} currently running fuzzing sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJobs.map(job => {
              const currentElapsed = elapsedTimes[job.jobId] || job.stats?.run_time || 0;
              const execsPerSec = job.stats?.execs_per_sec || 0;
              const crashes = job.crashes || 0;
              const hangs = job.hangs || 0;
              const cyclesDone = job.stats?.cycles_done || 0;
              const corpusCount = job.stats?.corpus_count || 0;
              
              return (
                <Card key={job.jobId} className="hover:bg-gray-50 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-mono">{job.jobId}</CardTitle>
                        <CardDescription className="mt-1">
                          {job.uploadedCFile} targeting {job.targetFunction}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status.toUpperCase()}
                        </Badge>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => stopFuzzing(job.jobId)}
                        >
                          Stop
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/afl/${job.jobId}`)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm">
                          <Gauge className="w-4 h-4 text-blue-600" />
                          <span>Execs/s</span>
                        </div>
                        <span className="font-bold text-lg">
                          {formatNumber(execsPerSec)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm">
                          <Bug className="w-4 h-4 text-red-600" />
                          <span>Crashes</span>
                        </div>
                        <span className="font-bold text-lg">{crashes}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span>Runtime</span>
                        </div>
                        <span className="font-bold text-lg">
                          {formatTime(currentElapsed)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm">
                          <Brain className="w-4 h-4 text-orange-600" />
                          <span>Cycles</span>
                        </div>
                        <span className="font-bold text-lg">{cyclesDone}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm">
                          <FileOutput className="w-4 h-4 text-green-600" />
                          <span>Corpus Count</span>
                        </div>
                        <span className="font-bold text-lg">{corpusCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm">
                          <Bug className="w-4 h-4 text-yellow-600" />
                          <span>Hangs</span>
                        </div>
                        <span className="font-bold text-lg">{hangs}</span>
                      </div>
                    </div>

                    {job.duration > 0 && (
                      <>
                        <Progress 
                          value={getProgressValue(job)}
                          className="mt-4"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>Elapsed: {formatTime(currentElapsed)}</span>
                          <span>Total: {job.duration}h</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileOutput className="w-5 h-5" />
            Fuzzing History
          </CardTitle>
          <CardDescription>Previous fuzzing sessions and results</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.filter(job => !activeJobs.some(aj => aj.id === job.id)).map(job => (
            <Card 
              key={job.id} 
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/dashboard/afl/${job.jobId}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-mono">{job.jobId}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(job.status)}>
                    {job.status.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(job.startTime).toLocaleString()}
                  {job.endTime && (
                    <span className="block text-xs">
                      Duration: {formatTime(job.actualDuration)}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm">Crashes:</span>
                    <span className="font-medium">{job.crashes || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">Hangs:</span>
                    <span className="font-medium">{job.hangs || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">Execs/s:</span>
                    <span className="font-medium">
                      {formatNumber(job.stats?.execs_per_sec || 0)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">Cycles:</span>
                    <span className="font-medium">
                      {formatNumber(job.stats?.cycles_done || 0)}
                    </span>
                  </div>
                </div>
                {job.duration > 0 && (
                  <div className="mt-2 text-sm">
                    <span>Target Duration: </span>
                    <span className="font-medium">{job.duration}h</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}