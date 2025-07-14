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
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

const getStatusColor = (status = '') => {
  if (!status) return 'bg-gray-100 text-gray-800';
  if (status.startsWith('2')) return 'bg-green-100 text-green-800';
  if (status.startsWith('3')) return 'bg-blue-100 text-blue-800';
  if (status.startsWith('4')) return 'bg-yellow-100 text-yellow-800';
  if (status.startsWith('5')) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

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
        url: target.replace('FUZZ', match[6]),
        uniqueKey: `${match[1].padStart(5, '0')}-${match[6]}`
      });
    }
  }

  return results;
};

export default function WfuzzJobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  useEffect(() => {
    if (!jobId) {
      setError('Missing job ID');
      setLoading(false);
      return;
    }

    const ref = doc(db, 'wfuzz_jobs', jobId);
    const unsub = onSnapshot(ref, 
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            let results = [];
            let stats = {
              total: 0,
              byStatus: {
                '2xx': 0,
                '3xx': 0,
                '4xx': 0,
                '5xx': 0
              }
            };

            if (data.rawOutput || data.result?.[0]?.rawOutput) {
              const rawOutput = data.rawOutput || data.result[0].rawOutput;
              results = parseRawOutput(rawOutput, data.target);
              
              stats.total = results.length;
              stats.byStatus = {
                '2xx': results.filter(r => r.status?.startsWith('2')).length,
                '3xx': results.filter(r => r.status?.startsWith('3')).length,
                '4xx': results.filter(r => r.status?.startsWith('4')).length,
                '5xx': results.filter(r => r.status?.startsWith('5')).length,
              };
            } 
            else if (Array.isArray(data.result)) {
              results = data.result;
              stats.total = results.length;
              stats.byStatus = {
                '2xx': results.filter(r => r.status?.startsWith('2')).length,
                '3xx': results.filter(r => r.status?.startsWith('3')).length,
                '4xx': results.filter(r => r.status?.startsWith('4')).length,
                '5xx': results.filter(r => r.status?.startsWith('5')).length,
              };
            }
            else if (data.stats) {
              stats = data.stats;
            }

            setJob({
              ...data,
              parsedResults: results,
              stats,
              hasRawOutput: !!data.rawOutput || !!data.result?.[0]?.rawOutput
            });
          } else {
            setError('Job not found');
          }
        } catch (e) {
          setError('Error processing job data');
          console.error(e);
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

  const results = job?.parsedResults || [];
  const successfulResults = results.filter(r => r.status?.startsWith('2'));
  const errorResults = results.filter(r => !r.status?.startsWith('2'));
  const displayResults = activeTab === 'success' ? successfulResults : 
                       activeTab === 'errors' ? errorResults : results;

  const stats = job?.stats || {
    total: results.length,
    successful: successfulResults.length,
    errors: errorResults.length,
    byStatus: {
      '2xx': successfulResults.length,
      '3xx': results.filter(r => r.status?.startsWith('3')).length,
      '4xx': results.filter(r => r.status?.startsWith('4')).length,
      '5xx': results.filter(r => r.status?.startsWith('5')).length,
    }
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
              onClick={() => router.push('/dashboard/wfuzz')}
            >
              Back to Scans
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
          onClick={() => router.push('/dashboard/wfuzz')}
        >
          Back to Scans
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Scan Results</h1>
          <p className="text-muted-foreground">Job ID: {job.jobId}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/wfuzz')}>
          Back to Scans
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Successful (2xx)</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.byStatus['2xx']}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Client Errors (4xx)</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.byStatus['4xx']}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Server Errors (5xx)</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.byStatus['5xx']}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex space-x-2 border-b pb-2">
        <Button 
          variant={activeTab === 'all' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('all')}
        >
          All Results ({stats.total})
        </Button>
        <Button 
          variant={activeTab === 'success' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('success')}
        >
          Successful ({stats.byStatus['2xx']})
        </Button>
        <Button 
          variant={activeTab === 'errors' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('errors')}
        >
          Errors ({stats.total - stats.byStatus['2xx']})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Showing {displayResults.length} of {stats.total} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayResults.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>Response Size</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayResults.map((item) => (
                  <TableRow key={item.uniqueKey || item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.payload}
                    </TableCell>
                    <TableCell>
                      {item.chars} chars / {item.lines} lines
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {item.url}
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : job.hasRawOutput ? (
            <div className="space-y-4">
              <div className="text-yellow-600 p-4 bg-yellow-50 rounded-md">
                Results could not be automatically parsed. Showing raw output:
              </div>
              <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
                {job.rawOutput || job.result?.[0]?.rawOutput}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No results found for this scan
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}