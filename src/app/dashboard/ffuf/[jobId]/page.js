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
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { useRouter } from 'next/navigation';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1'];

const getStatusColor = (status) => {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
  if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800';
  if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
  if (status >= 500) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

export default function FFUFJobDetail() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!jobId) {
      setError('Missing job ID');
      setLoading(false);
      return;
    }

    const ref = doc(db, 'fuzzJobs', jobId);
    const unsub = onSnapshot(ref, 
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const results = data.results || data.raw?.results || [];
            
            // Calculate stats
            const stats = {
              total: results.length,
              successful: results.filter(r => r.status >= 200 && r.status < 300).length,
              redirects: results.filter(r => r.status >= 300 && r.status < 400).length,
              clientErrors: results.filter(r => r.status >= 400 && r.status < 500).length,
              serverErrors: results.filter(r => r.status >= 500).length
            };

            setJob({
              ...data,
              results,
              stats
            });
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
              onClick={() => router.push('/dashboard/ffuf')}
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
          onClick={() => router.push('/dashboard/ffuf')}
        >
          Back to Scans
        </Button>
      </div>
    );
  }

  const results = job.results || [];
  const successfulResults = results.filter(r => r.status >= 200 && r.status < 300);
  const errorResults = results.filter(r => r.status >= 400);
  const displayResults = activeTab === 'success' ? successfulResults : 
                       activeTab === 'errors' ? errorResults : results;

  // Prepare data for charts
  const statusCounts = results.reduce((acc, res) => {
    const status = res.status?.toString() || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));

  const lineData = results.map((res, i) => ({
    index: i + 1,
    length: res.length ?? 0,
    status: res.status?.toString() || 'unknown',
  }));

  const statusCodes = [...new Set(results.map(r => r.status?.toString()))].sort();
  const barData = statusCodes.map(status => ({
    status,
    count: results.filter(r => r.status?.toString() === status).length
  }));

  const downloadUrl = job.outputfile 
    ? `/api/fuzz/ffuf/download?jobId=${job.jobId || job.id}`
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/ffuf')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scans
        </Button>
        {downloadUrl && (
          <a href={downloadUrl}>
            <Button variant="default">
              <Download className="w-4 h-4 mr-2" />
              Download Results
            </Button>
          </a>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Details</CardTitle>
          <CardDescription>Job ID: {job.jobId || job.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Target URL</p>
              <p className="text-sm text-muted-foreground break-all">
                {job.target || job.raw?.url}
              </p>
            </div>
            <div>
              <p className="font-medium">Command</p>
              <code className="text-sm text-muted-foreground break-all">
                {job.command || job.raw?.cmdline}
              </code>
            </div>
            <div>
              <p className="font-medium">Started At</p>
              <p className="text-sm text-muted-foreground">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">
                {Math.round((job.summary?.duration || 0) / 1000000)} ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-2xl">{job.stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Successful (2xx)</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {job.stats?.successful || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Client Errors (4xx)</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {job.stats?.clientErrors || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Server Errors (5xx)</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {job.stats?.serverErrors || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Code Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Code Counts</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Response Length Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="length" 
                stroke="#3b82f6" 
                name="Response Length"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Request Details</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant={activeTab === 'all' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('all')}
              >
                All ({job.stats?.total || 0})
              </Button>
              <Button 
                variant={activeTab === 'success' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('success')}
              >
                Successful ({job.stats?.successful || 0})
              </Button>
              <Button 
                variant={activeTab === 'errors' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('errors')}
              >
                Errors ({job.stats?.clientErrors + job.stats?.serverErrors || 0})
              </Button>
            </div>
          </div>
          <CardDescription>
            Showing {displayResults.length} of {job.stats?.total || 0} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayResults.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Payload</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Content Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {result.url}
                        </a>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.input?.FUZZ || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {result.length} bytes
                      </TableCell>
                      <TableCell>
                        {result['content-type'] || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No results found for this filter
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}