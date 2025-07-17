'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-Admin';
import { collection, orderBy, onSnapshot, query } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileInput, FileOutput, ArrowLeft, ExternalLink } from 'lucide-react';
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

export default function RadamsaPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [iterations, setIterations] = useState(10);
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'radamsa_jobs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const jobsData = snap.docs.map((doc) => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        };
      });
      setJobs(jobsData);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('iterations', iterations);
      if (seed) formData.append('seed', seed);

      const res = await fetch('/api/fuzz/radamsa', { 
        method: 'POST', 
        body: formData 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Fuzzing failed');
      }

      const data = await res.json();
      // Optionally show success message
    } catch (err) {
      setError(err.message);
      console.error('Fuzzing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

const handleDownload = async (jobId, downloadAll = false) => {
  try {
    setError(null);
    const url = `/api/fuzz/rad/download?jobId=${jobId}${
      downloadAll ? '&all=true' : ''
    }`;

    // Create a temporary iframe for download
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Remove iframe after some time
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 10000);

    // Fallback if iframe doesn't work
    setTimeout(() => {
      const links = document.querySelectorAll('a[href]');
      const downloaded = Array.from(links).some(link => 
        link.href === window.location.origin + url
      );
      if (!downloaded) {
        window.open(url, '_blank');
      }
    }, 1000);
  } catch (err) {
    console.error('Download error:', err);
    setError(err.message || 'Failed to initiate download');
  }
};

  // Prepare data for chart
  const chartData = jobs.map(job => ({
    name: job.jobId.substring(0, 8) + '...', // Shorten ID for display
    originalSize: job.originalSize / 1024, // Convert to KB
    fuzzedSize: job.fuzzedSize / 1024,    // Convert to KB
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Radamsa Fuzzer</h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="flex-1 md:flex-none"
            >
              Back to Dashboard
            </Button>
            <div className="relative group">
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open('https://gitlab.com/akihe/radamsa', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <span className="absolute top-10 left-1 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                Radamsa Docs
              </span>
            </div>
          </div>
        </div>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>New Fuzzing Job</CardTitle>
          <CardDescription>Upload a file to generate fuzzed variants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  {file.name} ({formatBytes(file.size)})
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Iterations</label>
              <Input 
                type="number" 
                value={iterations}
                onChange={(e) => setIterations(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="1000"
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
          </div>

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
            ) : 'Start Fuzzing'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Fuzzing Statistics</h3>
        <Card>
          <CardHeader>
            <CardTitle>File Size Comparison</CardTitle>
            <CardDescription>Original vs Fuzzed File Sizes</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {jobs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis label={{ value: 'Size (KB)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="originalSize" name="Original Size" fill="#3b82f6" />
                  <Bar dataKey="fuzzedSize" name="Fuzzed Size" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No fuzzing data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Jobs</h3>
        {jobs.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Original File</TableHead>
                  <TableHead>Fuzzed File</TableHead>
                  <TableHead>Size Change</TableHead>
                  <TableHead>Iterations</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-sm">
                      {job.jobId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileInput className="w-4 h-4" />
                        {job.originalFile}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileOutput className="w-4 h-4" />
                        {formatBytes(job.fuzzedSize)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        job.fuzzedSize > job.originalSize ? 'destructive' : 
                        job.fuzzedSize < job.originalSize ? 'success' : 'outline'
                      }>
                        {job.originalSize > 0 ? 
                          ((job.fuzzedSize - job.originalSize) / job.originalSize * 100).toFixed(2) + '%' : 
                          'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.iterations || 'N/A'}</TableCell>
                    <TableCell>
                      {job.createdAt?.toLocaleString?.() || 'Unknown date'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(job.jobId)}
                        >
                          Download
                        </Button>
                        {job.fuzzedFiles?.length > 1 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownload(job.jobId, true)}
                          >
                            Download All ({job.fuzzedFiles.length})
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No fuzzing jobs found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}