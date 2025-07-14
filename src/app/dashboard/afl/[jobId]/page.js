'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase-Admin';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Code, Clock, ArrowLeft, AlertCircle, Gauge, Zap, Terminal, FileInput, FileOutput, Cpu, Activity, Bug, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AFLJobDetail() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Formatting helper functions
  const formatNumber = useCallback((value) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return value.toLocaleString();
  }, []);

  const formatTime = useCallback((seconds) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m ` : ''}${secs}s`;
  }, []);

  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp?.toDate?.() || timestamp).toLocaleString();
  }, []);

  const downloadArtifact = async (type) => {
    try {
      const res = await fetch(`/api/fuzz/afl/artifacts?jobId=${jobId}&type=${type}`);
      if (!res.ok) throw new Error(await res.text());
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${jobId}_${type}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(`Downloaded ${type} artifacts`);
    } catch (err) {
      toast.error(`Download failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!jobId) {
      setError('Missing job ID');
      setLoading(false);
      return;
    }

    const ref = doc(db, 'afl_jobs', jobId);
    const unsub = onSnapshot(ref, 
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Calculate actual duration for completed jobs
            let actualDuration = 0;
            if (data.startTime && data.endTime) {
              const start = new Date(data.startTime).getTime();
              const end = new Date(data.endTime).getTime();
              actualDuration = Math.floor((end - start) / 1000);
            }
            
            const jobData = {
              ...data,
              actualDuration
            };
            
            setJob(jobData);

            // Update chart data only if job is active
            if (data.status === 'fuzzing' && data.stats?.execs_per_sec) {
              setChartData(prev => {
                const newData = {
                  time: Math.floor((actualDuration || data.totalRunTime || 0) / 60), // minutes
                  execsPerSec: data.stats.execs_per_sec,
                  coverage: typeof data.coverage === 'number' ? data.coverage : 0,
                  crashes: data.crashes || 0,
                  cycles: data.stats.cycles_done || 0
                };
                
                // Keep last 30 data points
                return [...prev.slice(-29), newData];
              });
            }
          } else {
            setError('Job not found');
          }
        } catch (err) {
          setError('Error loading job data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Failed to load job');
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [jobId]);

  // Calculate time elapsed or total runtime
  const getRunTime = useCallback(() => {
    if (!job) return 0;
    
    // If job is still running, calculate based on current time
    if (job.status === 'fuzzing' && job.startTime) {
      const start = new Date(job.startTime).getTime();
      return Math.floor((currentTime - start) / 1000);
    }
    
    // For stopped/completed jobs, use the actual duration
    return job.actualDuration || job.totalRunTime || 0;
  }, [job, currentTime]);

  // Update current time every second only if job is active
  useEffect(() => {
    let timer;
    if (job?.status === 'fuzzing') {
      timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [job?.status]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="animate-spin w-6 h-6 mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading job details...</p>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/dashboard/afl')}
            >
              Back to AFL++
            </Button>
          </CardContent>
        </Card>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No job data available</p>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/dashboard/afl')}
        >
          Back to AFL++
        </Button>
        <Toaster position="top-right" />
      </div>
    );
  }

  const runTime = getRunTime();
  const progress = job.duration > 0 ? 
    Math.min(100, (runTime / (job.duration * 3600)) * 100) : 
    0;

  // Enhanced AFL++ Status Panel with better output parsing
  const AflStatusPanel = () => (
    <Card className="bg-black text-green-400 font-mono p-4 overflow-auto">
      <pre className="whitespace-pre-wrap">
        {job.logs?.map((log, i) => (
          <div key={i} className={log.includes('ERROR:') ? 'text-red-400' : ''}>
            {log}
          </div>
        )) || 'No output available'}
      </pre>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/afl')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AFL++
        </Button>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Fuzzing Job: {job.jobId}
        </h2>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">
            {formatTime(runTime)} {job.status === 'fuzzing' ? 'elapsed' : 'total'}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">AFL++ Status</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
                <CardDescription>Configuration and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={
                      job.status === 'completed' ? 'success' :
                      job.status === 'fuzzing' ? 'secondary' :
                      job.status === 'stopped' ? 'warning' :
                      'destructive'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source File</p>
                    <p className="truncate">{job.uploadedCFile}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seed Input</p>
                    <p className="truncate">{job.uploadedSeedFile || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Memory Limit</p>
                    <p>{job.memoryLimit} MB</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPU Cores</p>
                    <p>{job.cpuLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Target Function</p>
                    <p>{job.targetFunction}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Time</span>
                    </div>
                    <span>
                      {formatTime(runTime)} / {job.duration > 0 ? `${job.duration}h` : 'Unlimited'}
                    </span>
                  </div>
                  {job.duration > 0 && (
                    <>
                      <Progress value={progress} />
                      {job.status === 'fuzzing' && (
                        <div className="text-sm text-muted-foreground">
                          {progress < 100 ? (
                            `Estimated completion in ${formatTime(job.duration * 3600 - runTime)}`
                          ) : 'Completed'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key fuzzing metrics</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                  <Gauge className="w-6 h-6 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Execs/s</span>
                  <span className="text-xl font-bold">{formatNumber(job.stats?.execs_per_sec || 0)}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                  <span className="text-sm text-muted-foreground">Cycles</span>
                  <span className="text-xl font-bold">{formatNumber(job.stats?.cycles_done || 0)}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                  <Bug className="w-6 h-6 text-red-600" />
                  <span className="text-sm text-muted-foreground">Crashes</span>
                  <span className="text-xl font-bold">{job.crashes || 0}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Hangs</span>
                  <span className="text-xl font-bold">{job.hangs || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status">
          <AflStatusPanel />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Fuzzing performance over time</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Minutes', position: 'insideBottomRight' }} 
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="execsPerSec" 
                    stroke="#3b82f6" 
                    name="Execs/sec" 
                    dot={false}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="coverage" 
                    stroke="#10b981" 
                    name="Coverage %" 
                    dot={false}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="crashes" 
                    stroke="#ef4444" 
                    name="Crashes" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cycle Analysis</CardTitle>
              <CardDescription>Fuzzing cycle progress</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cycles" fill="#8884d8" name="Cycles" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Fuzzing Logs</CardTitle>
              <CardDescription>Real-time fuzzing output</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 rounded-md border p-4 font-mono text-sm">
                {job.logs?.map((entry, i) => (
                  <div key={i} className="whitespace-pre-wrap mb-2">{entry}</div>
                )) || 'No logs available'}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artifacts">
          <Card>
            <CardHeader>
              <CardTitle>Artifacts</CardTitle>
              <CardDescription>Download fuzzing results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="w-5 h-5" />
                      Crashes
                    </CardTitle>
                    <CardDescription>
                      {job.crashes || 0} unique crashes found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadArtifact('crashes')}
                      className="w-full"
                      disabled={!job.crashes || job.crashes === 0}
                    >
                      Download Crashes
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Hangs
                    </CardTitle>
                    <CardDescription>
                      {job.hangs || 0} hangs detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadArtifact('hangs')}
                      className="w-full"
                      disabled={!job.hangs || job.hangs === 0}
                    >
                      Download Hangs
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Test Cases
                    </CardTitle>
                    <CardDescription>
                      Generated test cases
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadArtifact('queue')}
                      className="w-full"
                    >
                      Download Test Cases
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileOutput className="w-5 h-5" />
                      Full Results
                    </CardTitle>
                    <CardDescription>
                      Complete fuzzing output
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadArtifact('full')}
                      className="w-full"
                    >
                      Download All
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}