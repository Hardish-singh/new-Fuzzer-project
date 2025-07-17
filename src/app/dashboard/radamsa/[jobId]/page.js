'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-Admin';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileInput, FileOutput, Download, ArrowLeft } from 'lucide-react';

export default function RadamsaJobPage() {
  const router = useRouter();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const docRef = doc(db, 'radamsa_jobs', jobId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Job not found');
        }

        const data = docSnap.data();
        setJob({
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/fuzz/radamsa/download?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fuzzed_${job?.originalFile || jobId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => router.push('/dashboard/fuzz/radamsa')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Radamsa Fuzzer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Job not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/fuzz/radamsa')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Radamsa Fuzzer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Radamsa Job Details</h2>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/fuzz/radamsa')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Jobs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
          <CardDescription>Details of fuzzing job {jobId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Original File</h3>
              <div className="flex items-center gap-2 mt-1">
                <FileInput className="w-4 h-4" />
                <p>{job.originalFile}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Original Size</h3>
              <p className="mt-1">{formatBytes(job.originalSize)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Fuzzed File</h3>
              <div className="flex items-center gap-2 mt-1">
                <FileOutput className="w-4 h-4" />
                <p>{job.fuzzedFile}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Fuzzed Size</h3>
              <p className="mt-1">{formatBytes(job.fuzzedSize)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Size Change</h3>
              <div className="mt-1">
                <Badge variant={
                  job.fuzzedSize > job.originalSize ? 'destructive' : 
                  job.fuzzedSize < job.originalSize ? 'success' : 'outline'
                }>
                  {job.originalSize > 0 ? 
                    ((job.fuzzedSize - job.originalSize) / job.originalSize * 100).toFixed(2) + '%' : 
                    'N/A'}
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Iterations</h3>
              <p className="mt-1">{job.iterations || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Seed</h3>
              <p className="mt-1">{job.seed || 'Random'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p className="mt-1">{job.createdAt?.toLocaleString?.() || 'Unknown date'}</p>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleDownload} className="w-full md:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Download Fuzzed File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}