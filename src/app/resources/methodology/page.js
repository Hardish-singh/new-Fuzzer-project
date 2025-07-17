import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Rocket, BarChart2, TestTube2, Cpu, Target, ShieldAlert, Database, GitBranch, FileSearch } from 'lucide-react';

export default function MethodologyPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-lg bg-blue-100">
          <BarChart2 className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuzzing Methodology</h1>
          <p className="text-lg text-muted-foreground">Learn best practices for effective fuzzing</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Fuzzing methodology provides a systematic approach to discovering vulnerabilities 
            by sending unexpected, malformed, or random data to a target application.
          </p>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <TestTube2 className="h-4 w-4" />
            <span>Scientific approach to vulnerability discovery</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                  1
                </span>
                Target Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Understand the attack surface by mapping all possible inputs and endpoints.
                Identify parameters, headers, and data formats the application accepts.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Target className="h-3 w-3 mr-1" /> Input Vectors
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <GitBranch className="h-3 w-3 mr-1" /> Code Paths
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Database className="h-3 w-3 mr-1" /> Protocols
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                  2
                </span>
                Fuzzer Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Choose the appropriate fuzzing technique based on the target:
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>Generation-based:</strong> Build inputs from scratch using models</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>Mutation-based:</strong> Modify existing valid inputs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>Grammar-based:</strong> Use formal grammar rules for structured inputs</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                  3
                </span>
                Test Case Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Develop comprehensive test cases covering:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Boundary Values</h4>
                    <p className="text-sm text-muted-foreground">Minimum/maximum values, edge cases</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Cpu className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Format Strings</h4>
                    <p className="text-sm text-muted-foreground">Unexpected format specifiers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileSearch className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Type Confusion</h4>
                    <p className="text-sm text-muted-foreground">Unexpected data types</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Database className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Overflows</h4>
                    <p className="text-sm text-muted-foreground">Buffer, integer, heap overflows</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                  4
                </span>
                Execution & Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Run fuzzing campaigns with proper instrumentation and monitoring:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Instrument targets with coverage guidance (AFL, libFuzzer)</li>
                <li>Monitor for crashes, hangs, memory leaks</li>
                <li>Track code coverage metrics to ensure thoroughness</li>
                <li>Implement automated triage for crash analysis</li>
                <li>Use parallelization for large-scale fuzzing</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                  5
                </span>
                Results Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Analyze findings and improve the process:
              </p>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Unique Crashes</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">Identify distinct vulnerabilities</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Code Coverage</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">Measure test thoroughness</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Execution Paths</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">Understand explored code paths</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                  6
                </span>
                Continuous Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Refine your fuzzing approach based on results:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-600">🔄</div>
                  <div>
                    <h4 className="font-medium text-blue-800">Feedback Loop</h4>
                    <p className="text-sm text-blue-700">
                      Use findings to improve seed corpus, dictionary, and mutation strategies.
                      Implement CI/CD integration for continuous fuzzing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/resources">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Link>
        </Button>
        <Button variant="default" asChild>
          <Link href="/dashboard">
            <Rocket className="h-4 w-4 mr-2" />
            Start Fuzzing
          </Link>
        </Button>
      </div>
    </div>
  );
}