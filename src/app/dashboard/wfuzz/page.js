'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase-Admin';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ExternalLink } from 'lucide-react';

const parseRawOutput = (rawOutput = '', target = '') => {
  if (!rawOutput) return [];
  
  const results = [];
  const lines = rawOutput.split('\n');
  const pattern = /^(\d+):\s+\d+\.\d+s\s+C=\d+:\s+C=(\d{3})\s+(\d+)\s+L\s+(\d+)\s+W\s+(\d+)\s+Ch\s+[\w\/\.-]+\s+"([^"]+)"/;

  for (const line of lines) {
    if (line.startsWith('---') || line.includes('Total requests') || line.includes('ID C.Time')) continue;
    const match = line.match(pattern);
    if (match) {
      results.push({
        id: match[1].padStart(5, '0'),
        status: match[2],
        lines: match[3],
        words: match[4],
        chars: match[5],
        payload: match[6],
        url: target.replace('FUZZ', match[6])
      });
    }
  }
  return results;
};

const calculateStats = (job) => {
  let stats = {
    total: 0,
    byStatus: {
      '2xx': 0,
      '3xx': 0,
      '4xx': 0,
      '5xx': 0
    }
  };

  if (job.rawOutput || job.result?.[0]?.rawOutput) {
    const rawOutput = job.rawOutput || job.result[0].rawOutput;
    const results = parseRawOutput(rawOutput, job.target);
    
    stats.total = results.length;
    results.forEach(r => {
      if (r.status?.startsWith('2')) stats.byStatus['2xx']++;
      else if (r.status?.startsWith('3')) stats.byStatus['3xx']++;
      else if (r.status?.startsWith('4')) stats.byStatus['4xx']++;
      else if (r.status?.startsWith('5')) stats.byStatus['5xx']++;
    });
  } 
  else if (Array.isArray(job.result)) {
    stats.total = job.result.length;
    job.result.forEach(r => {
      if (r.status?.startsWith('2')) stats.byStatus['2xx']++;
      else if (r.status?.startsWith('3')) stats.byStatus['3xx']++;
      else if (r.status?.startsWith('4')) stats.byStatus['4xx']++;
      else if (r.status?.startsWith('5')) stats.byStatus['5xx']++;
    });
  }

  return stats;
};

export default function WfuzzPage() {
  const [target, setTarget] = useState('http://testphp.vulnweb.com/artists.php?FUZZ=1');
  const [wordlist, setWordlist] = useState('common.txt');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'wfuzz_jobs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const jobsData = snap.docs.map((doc) => {
        const data = doc.data();
        const stats = calculateStats(data);
        
        return { 
          id: doc.id, 
          ...data,
          stats 
        };
      });
      
      setJobs(jobsData);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fuzz/wfuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target, 
          wordlist,
          options: {
            followRedirects: true,
            threads: 5
          }
        }),
      });
      const data = await res.json();
      if (data?.jobId) router.push(`/dashboard/wfuzz/${data.jobId}`);
    } catch (error) {
      console.error('Error starting scan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
       <div className="flex justify-end w-full">
  <div className="flex gap-2 flex-row">
    <Button 
      variant="outline" 
      onClick={() => router.push('/dashboard')}
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
          <p>WFUZZ Documentation</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</div>


      <h2 className="text-2xl font-bold">WFuzz Scanner</h2>
      
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
            File must exist in wordlists directory
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
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning...
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
              onClick={() => router.push(`/dashboard/wfuzz/${job.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-mono">{job.jobId || job.id}</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant="outline">
                      {job.stats?.total || 0} requests
                    </Badge>
                    <Badge variant="success">
                      {job.stats?.byStatus?.['2xx'] || 0} 2xx
                    </Badge>
                    <Badge variant="secondary">
                      {job.stats?.byStatus?.['3xx'] || 0} 3xx
                    </Badge>
                    <Badge variant="warning">
                      {job.stats?.byStatus?.['4xx'] || 0} 4xx
                    </Badge>
                    <Badge variant="destructive">
                      {job.stats?.byStatus?.['5xx'] || 0} 5xx
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm truncate">
                  <span className="font-medium">Target:</span> {job.target}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(job.timestamp?.toDate?.() || job.timestamp).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}