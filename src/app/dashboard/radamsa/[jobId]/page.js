'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { Loader2, FileInput, FileOutput, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from '@/components/ui/progress';

export default function RadamsaJobDetail() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      setError('Missing job ID');
      setLoading(false);
      return;
    }

    const ref = doc(db, 'radamsa_jobs', jobId);
    const unsub = onSnapshot(ref, 
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setJob(data);
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

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSizeChangePercent = () => {
    if (!job) return 0;
    return ((job.fuzzedSize - job.originalSize) / job.originalSize) * 100;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="animate-spin w-6 h-6 mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading job details...</p>
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
              onClick={() => router.push('/dashboard/radamsa')}
            >
              Back to Radamsa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No job data available</p>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/dashboard/radamsa')}
        >
          Back to Radamsa
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/radamsa')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Radamsa
        </Button>
        <h2 className="text-xl font-bold">Fuzzing Job Details</h2>
        <div></div> {/* Spacer */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
            <CardDescription>Job ID: {job.jobId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={job.status === 'completed' ? 'success' : 'secondary'}>
                {job.status || 'processing'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p>{new Date(job.createdAt?.toDate?.() || job.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Iterations</p>
              <p>{job.iterations || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seed</p>
              <p>{job.seed || 'Random'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileInput className="w-5 h-5" />
                <span>Original File</span>
              </div>
              <span>{formatBytes(job.originalSize)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileOutput className="w-5 h-5" />
                <span>Fuzzed File</span>
              </div>
              <span>{formatBytes(job.fuzzedSize)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Size Change</span>
                <span className="text-sm font-medium">
                  {getSizeChangePercent().toFixed(2)}%
                </span>
              </div>
              <Progress 
                value={Math.abs(getSizeChangePercent())} 
                className={getSizeChangePercent() > 0 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              variant="default" 
              onClick={() => window.open(job.downloadUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <FileOutput className="w-4 h-4" />
              Download Fuzzed File
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/radamsa')}
            >
              Run New Fuzzing Job
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Job Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(job, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}