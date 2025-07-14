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
import { Loader2, ShieldAlert, ArrowLeft, AlertCircle } from 'lucide-react';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'];

export default function DalfoxJobDetail() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!jobId) {
      setError('Missing job ID');
      setLoading(false);
      return;
    }

    const ref = doc(db, 'dalfoxJobs', jobId);
    const unsub = onSnapshot(ref, 
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Handle both array and object result formats
            const issues = Array.isArray(data.result) ? data.result : data.result?.data || [];
            
            // Calculate stats
            const stats = {
              total: issues.length,
              critical: issues.filter(i => i.severity?.toLowerCase() === 'critical').length,
              high: issues.filter(i => i.severity?.toLowerCase() === 'high').length,
              medium: issues.filter(i => i.severity?.toLowerCase() === 'medium').length,
              low: issues.filter(i => i.severity?.toLowerCase() === 'low').length,
              unclassified: issues.filter(i => !i.severity).length
            };

            setJob({
              ...data,
              issues,
              stats,
              target: data.target || 'Unknown target' // Fallback for target
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

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="animate-spin w-6 h-6 mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading scan results...</p>
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
              onClick={() => router.push('/dashboard/dalfox')}
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
        <p className="text-muted-foreground">No scan data available</p>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/dashboard/dalfox')}
        >
          Back to Scans
        </Button>
      </div>
    );
  }

  const issues = job.issues || [];
  const filteredIssues = activeFilter === 'all' 
    ? issues 
    : issues.filter(i => i.severity?.toLowerCase() === activeFilter);

  // Prepare data for charts
  const severityCounts = issues.reduce((acc, issue) => {
    const severity = issue.severity?.toLowerCase() || 'unclassified';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(severityCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const order = {critical: 0, high: 1, medium: 2, low: 3, unclassified: 4};
      return order[a.name.toLowerCase()] - order[b.name.toLowerCase()];
    });

  const barData = Object.entries(severityCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/dalfox')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scans
        </Button>
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-600" />
          <h2 className="text-xl font-bold">XSS Scan Results</h2>
        </div>
        <div></div> {/* Spacer */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Details</CardTitle>
          <CardDescription>Job ID: {job.jobId || job.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p><strong>Target URL:</strong></p>
            <p className="text-sm text-muted-foreground break-all">{job.target}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Command:</strong></p>
            <code className="text-sm text-muted-foreground break-all">{job.command || 'N/A'}</code>
          </div>
          <div className="space-y-2">
            <p><strong>Started At:</strong></p>
            <p className="text-sm text-muted-foreground">
              {new Date(job.createdAt?.toDate?.() || job.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <p><strong>Status:</strong></p>
            <Badge variant={job.status === 'completed' ? 'success' : 'secondary'}>
              {job.status || 'processing'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Issues</CardDescription>
            <CardTitle className="text-2xl">{job.stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {job.stats?.critical || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High</CardDescription>
            <CardTitle className="text-2xl text-orange-500">
              {job.stats?.high || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Medium</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">
              {job.stats?.medium || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low</CardDescription>
            <CardTitle className="text-2xl text-blue-500">
              {job.stats?.low || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
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
            <CardTitle>Issue Count by Severity</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Vulnerability Details</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant={activeFilter === 'all' ? 'default' : 'ghost'} 
                onClick={() => setActiveFilter('all')}
              >
                All ({job.stats?.total || 0})
              </Button>
              <Button 
                variant={activeFilter === 'critical' ? 'default' : 'ghost'} 
                onClick={() => setActiveFilter('critical')}
              >
                Critical ({job.stats?.critical || 0})
              </Button>
              <Button 
                variant={activeFilter === 'high' ? 'default' : 'ghost'} 
                onClick={() => setActiveFilter('high')}
              >
                High ({job.stats?.high || 0})
              </Button>
              <Button 
                variant={activeFilter === 'medium' ? 'default' : 'ghost'} 
                onClick={() => setActiveFilter('medium')}
              >
                Medium ({job.stats?.medium || 0})
              </Button>
              <Button 
                variant={activeFilter === 'low' ? 'default' : 'ghost'} 
                onClick={() => setActiveFilter('low')}
              >
                Low ({job.stats?.low || 0})
              </Button>
            </div>
          </div>
          <CardDescription>
            Showing {filteredIssues.length} of {job.stats?.total || 0} vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIssues.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity || 'unclassified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {issue.type || 'XSS'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {issue.payload || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <a 
                        href={issue.data || issue.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {issue.data || issue.url || 'N/A'}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm">
                      {issue.evidence || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {activeFilter === 'all' 
                ? 'No vulnerabilities found' 
                : `No ${activeFilter} vulnerabilities found`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}