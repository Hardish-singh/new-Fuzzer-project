'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-Admin';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileInput, Binary, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function ZzufPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [ratio, setRatio] = useState(0.4);
  const [seed, setSeed] = useState('');
  const [timeout, setTimeout] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('new');

  useEffect(() => {
    const q = query(collection(db, 'zzuf_jobs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file');
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ratio', ratio);
      if (seed) formData.append('seed', seed);
      formData.append('timeout', timeout);

      const res = await fetch('/api/fuzz/zzuf', { 
        method: 'POST', 
        body: formData 
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      toast.success(`Fuzzing job started - Job ID: ${data.jobId}`);
      setFile(null);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">zzuf Binary Fuzzer</h2>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="new">New Job</TabsTrigger>
          <TabsTrigger value="history">Job History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>New Fuzzing Job</CardTitle>
              <CardDescription>Fuzz binary files with zzuf</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Card className="border-red-500">
                  <CardHeader className="text-red-600">
                    <CardTitle>Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{error}</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium">Input File</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)} 
                    className="w-full"
                  />
                  {file && (
                    <Badge variant="outline" className="whitespace-nowrap">
                      <Binary className="w-4 h-4 mr-2" />
                      {file.name} ({formatBytes(file.size)})
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Mutation Ratio (0-1)</label>
                  <Input 
                    type="number" 
                    value={ratio}
                    onChange={(e) => setRatio(Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)))}
                    min="0"
                    max="1"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Seed (optional)</label>
                  <Input 
                    type="text" 
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Random seed for reproducibility"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Timeout (seconds)</label>
                  <Input 
                    type="number" 
                    value={timeout}
                    onChange={(e) => setTimeout(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              <Separator />

              <Button 
                className="w-full" 
                disabled={loading || !file}
                onClick={handleSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Fuzzing...
                  </>
                ) : (
                  <>
                    <Binary className="w-4 h-4 mr-2" />
                    Start Fuzzing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Previous fuzzing jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Ratio</TableHead>
                    <TableHead>Size Change</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const sizeChange = ((job.fuzzedSize - job.originalSize) / job.originalSize * 100) || 0;
                    return (
                      <TableRow key={job.jobId}>
                        <TableCell className="font-mono text-sm">{job.jobId}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{job.originalFileName}</TableCell>
                        <TableCell>{job.ratio}</TableCell>
                        <TableCell>
                          <Badge variant={
                            sizeChange > 0 ? 'destructive' : 
                            sizeChange < 0 ? 'success' : 'outline'
                          }>
                            {sizeChange.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(job.executionTime)}</TableCell>
                        <TableCell>
                          <Badge variant={job.status === 'completed' ? 'success' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push(`/dashboard/zfuzz/${job.jobId}`)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Fuzzing Analytics</CardTitle>
              <CardDescription>Performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={jobs.slice(0, 10).map(job => ({
                    name: job.jobId,
                    originalSize: job.originalSize / 1024, // KB
                    fuzzedSize: job.fuzzedSize / 1024,    // KB
                    ratio: job.ratio * 100,              // Percentage
                    time: job.executionTime,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="originalSize" name="Original Size (KB)" fill="#3b82f6" />
                  <Bar yAxisId="left" dataKey="fuzzedSize" name="Fuzzed Size (KB)" fill="#10b981" />
                  <Bar yAxisId="right" dataKey="ratio" name="Mutation Ratio (%)" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}