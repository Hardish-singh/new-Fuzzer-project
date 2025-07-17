'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-Admin';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, ExternalLink, Rocket, History, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Fuzzer</h1>
          <p className="text-muted-foreground">Discover hidden endpoints and directories with FFUF</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="flex-1 md:flex-none"
          >
            Back to Dashboard
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open('https://github.com/ffuf/ffuf', '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>FFUF Documentation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-600" />
            <span>New Scan</span>
          </CardTitle>
          <CardDescription>Configure and launch a new fuzzing job</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Target URL</label>
              <Input 
                value={target} 
                onChange={(e) => setTarget(e.target.value)} 
                placeholder="http://example.com/FUZZ" 
                className="bg-white"
              />
              <p className="text-xs text-muted-foreground">
                Must include <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">FUZZ</Badge> placeholder
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Wordlist</label>
              <div className="flex gap-2">
                <Input 
                  value={wordlist} 
                  onChange={(e) => setWordlist(e.target.value)} 
                  placeholder="common.txt" 
                  className="bg-white"
                />
                <Button variant="outline" size="sm" className="whitespace-nowrap">
                  Browse
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: common.txt, big.txt, directories.txt
              </p>
            </div>
            
            <div className="flex items-center">
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
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Launch Scan
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-600" />
            <span>Scan History</span>
          </CardTitle>
          <CardDescription>Recent and past fuzzing jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No scan jobs found
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {jobs.map((job) => (
                  <Card 
                    key={job.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors group border-gray-100"
                    onClick={() => router.push(`/dashboard/ffuf/${job.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-mono flex items-center gap-2">
                            {job.jobId || job.id}
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(job.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="px-2 py-1">
                                  {job.stats?.total || 0} req
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Total requests</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="success" className="px-2 py-1">
                                  {job.stats?.successful || 0}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Successful responses (2xx)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">Target:</span>
                        <span className="font-mono text-sm truncate max-w-[300px] md:max-w-[400px]">
                          {job.target || job.raw?.url}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {job.wordlist || 'common.txt'}
                        </Badge>
                        <div className="flex gap-1">
                          <Badge variant="blue" className="text-xs">
                            {job.stats?.redirects || 0} redirects
                          </Badge>
                          <Badge variant="orange" className="text-xs">
                            {job.stats?.clientErrors || 0} 4xx
                          </Badge>
                          <Badge variant="red" className="text-xs">
                            {job.stats?.serverErrors || 0} 5xx
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}