'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-Admin';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function DalfoxPage() {
  const router = useRouter();
  const [target, setTarget] = useState('http://testphp.vulnweb.com/test.php?param=1');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'dalfoxJobs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, 
      (snap) => {
        const jobsData = snap.docs.map((doc) => {
          const data = doc.data();
          
          // Handle both array and object result formats
          const issues = Array.isArray(data.result) ? data.result : data.result?.data || [];
          
          // Calculate stats - make sure to handle case sensitivity
          const stats = {
            total: issues.length,
            critical: issues.filter(i => i.severity?.toLowerCase() === 'critical').length,
            high: issues.filter(i => i.severity?.toLowerCase() === 'high').length,
            medium: issues.filter(i => i.severity?.toLowerCase() === 'medium').length,
            low: issues.filter(i => i.severity?.toLowerCase() === 'low').length
          };

          return { 
            id: doc.id, 
            ...data,
            stats,
            issues // Store the issues for later use if needed
          };
        });
        setJobs(jobsData);
      },
      (err) => {
        setError('Failed to load scan jobs');
        console.error(err);
      }
    );
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!target) {
      setError('Target URL is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fuzz/dalfox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      if (data?.jobId) {
        router.push(`/dashboard/dalfox/${data.jobId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to start scan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-red-600" />
          Dalfox XSS Scanner
        </h2>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
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
          <CardTitle>New Scan</CardTitle>
          <CardDescription>Test for XSS vulnerabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Target URL</label>
            <Input 
              value={target} 
              onChange={(e) => setTarget(e.target.value)} 
              placeholder="http://example.com/test.php?param=1" 
            />
            <p className="text-xs text-muted-foreground">
              Must include parameters to test
            </p>
          </div>
          
          <Button 
            className="w-full" 
            disabled={loading} 
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Starting Scan...
              </>
            ) : 'Start XSS Scan'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Scans</h3>
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => {
            // Calculate the highest severity for the badge
            const highestSeverity = job.stats?.critical > 0 ? 'critical' :
                                  job.stats?.high > 0 ? 'high' :
                                  job.stats?.medium > 0 ? 'medium' :
                                  job.stats?.low > 0 ? 'low' : null;

            return (
              <Card 
                key={job.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/dalfox/${job.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-mono">{job.jobId || job.id}</CardTitle>
                    <div className="flex space-x-2">
                      <Badge variant="outline">
                        {job.stats?.total || 0} issues
                      </Badge>
                      {highestSeverity && (
                        <Badge className={getSeverityColor(highestSeverity)}>
                          {job.stats[highestSeverity]} {highestSeverity.charAt(0).toUpperCase() + highestSeverity.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm truncate">
                    <span className="font-medium">Target:</span> {job.target}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job.createdAt?.toDate?.() || job.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}