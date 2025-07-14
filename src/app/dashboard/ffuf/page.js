'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-Admin';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function FFUFPage() {
  const router = useRouter();
  const [target, setTarget] = useState('http://testphp.vulnweb.com/FUZZ');
  const [wordlist, setWordlist] = useState('common.txt');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'fuzzJobs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, 
      (snap) => {
        const jobsData = snap.docs.map((doc) => {
          const data = doc.data();
          const results = data.results || data.raw?.results || [];
          
          // Calculate stats
          const stats = {
            total: results.length,
            successful: results.filter(r => r.status >= 200 && r.status < 300).length,
            redirects: results.filter(r => r.status >= 300 && r.status < 400).length,
            clientErrors: results.filter(r => r.status >= 400 && r.status < 500).length,
            serverErrors: results.filter(r => r.status >= 500).length
          };

          return { 
            id: doc.id, 
            ...data,
            stats
          };
        });
        setJobs(jobsData);
      },
      (err) => {
        setError('Failed to load jobs');
        console.error(err);
      }
    );
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!target.includes('FUZZ')) {
      setError('Target URL must include FUZZ placeholder');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fuzz/ffuf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target, 
          wordlist,
          options: {
            followRedirects: true,
            threads: 40
          }
        }),
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      if (data?.jobId) {
        router.push(`/dashboard/ffuf/${data.jobId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to start scan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">FFUF Scanner</h2>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
        >
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Target URL</label>
          <Input 
            value={target} 
            onChange={(e) => setTarget(e.target.value)} 
            placeholder="http://example.com/FUZZ" 
          />
          <p className="text-xs text-muted-foreground">
            Must include FUZZ placeholder
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Wordlist</label>
          <Input 
            value={wordlist} 
            onChange={(e) => setWordlist(e.target.value)} 
            placeholder="common.txt" 
          />
          <p className="text-xs text-muted-foreground">
            Default: common.txt
          </p>
        </div>
        
        <div className="flex items-end">
          <Button 
            className="w-full" 
            disabled={loading || !target.includes('FUZZ')} 
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Starting Scan...
              </>
            ) : 'Start Scan'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Scans</h3>
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <Card 
              key={job.id} 
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/dashboard/ffuf/${job.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-mono">{job.jobId || job.id}</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant="outline">
                      {job.stats?.total || 0} requests
                    </Badge>
                    <Badge variant="success">
                      {job.stats?.successful || 0} successful
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm truncate">
                  <span className="font-medium">Target:</span> {job.target || job.raw?.url}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}