import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Rocket, Shield, Lock, EyeOff, AlertTriangle, Database, Code, Server, Users } from 'lucide-react';

export default function GuidelinesPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-lg bg-green-100">
          <Shield className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Research Guidelines</h1>
          <p className="text-lg text-muted-foreground">Ethical disclosure policies and testing protocols</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">About Responsible Disclosure</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            These guidelines establish the framework for ethical security research and vulnerability disclosure 
            to protect researchers, organizations, and end-users.
          </p>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Lock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Authorization Section */}
        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-green-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600">
                  1
                </span>
                Authorization & Legal Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                <li>Obtain written permission before testing any system or network</li>
                <li>Clearly define scope and rules of engagement in authorization documents</li>
                <li>Comply with all applicable laws including Computer Fraud and Abuse Act (CFAA), GDPR, and local regulations</li>
                <li>Respect all terms of service and acceptable use policies</li>
                <li>Testing of third-party integrations requires explicit authorization</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Testing Methodology Section */}
        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600">
                  2
                </span>
                Testing Methodology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Data Handling</h3>
                    <p className="text-muted-foreground text-sm">
                      Minimize access to sensitive data. If exposed, do not download more than necessary to demonstrate vulnerability.
                      Never exfiltrate, modify, or delete production data.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Safe Testing</h3>
                    <p className="text-muted-foreground text-sm">
                      Avoid tests that could cause degradation or denial of service. Use test accounts instead of real user accounts.
                      Never attempt brute force attacks without explicit permission.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vulnerability Disclosure Section */}
        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-purple-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-600">
                  3
                </span>
                Vulnerability Disclosure Protocol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <EyeOff className="h-4 w-4 text-purple-500" />
                    <h3 className="font-medium">Confidentiality</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Do not publicly disclose vulnerabilities before they are patched. Allow reasonable time (typically 90 days) for remediation.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <h3 className="font-medium">Coordination</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Submit findings through our secure channel. Include detailed reproduction steps, impact analysis, and suggested fixes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prohibited Activities Section */}
        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-600">
                  4
                </span>
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-50 mt-0.5 flex-shrink-0">
                    <span className="text-red-500 text-xs">✗</span>
                  </div>
                  <p className="text-muted-foreground">
                    Social engineering or phishing against employees or users
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-50 mt-0.5 flex-shrink-0">
                    <span className="text-red-500 text-xs">✗</span>
                  </div>
                  <p className="text-muted-foreground">
                    Physical attacks against infrastructure or personnel
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-50 mt-0.5 flex-shrink-0">
                    <span className="text-red-500 text-xs">✗</span>
                  </div>
                  <p className="text-muted-foreground">
                    Denial of service or resource exhaustion attacks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safe Harbor Section */}
        <div className="group relative">
          <div className="absolute -left-8 top-0 h-full w-1 bg-green-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600">
                  5
                </span>
                Safe Harbor Provisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm text-muted-foreground">
                <p>
                  We will not initiate legal action against security researchers who:
                </p>
                <ul>
                  <li>Make good faith efforts to avoid privacy violations and service disruption</li>
                  <li>Comply with these guidelines and all applicable laws</li>
                  <li>Provide timely vulnerability reports through approved channels</li>
                  <li>Do not exploit vulnerabilities beyond demonstration</li>
                </ul>
                <p className="text-sm italic">
                  Note: Safe harbor applies only to authorized testing. Unauthorized access may still violate laws.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12 p-6 bg-green-50 rounded-lg border border-green-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-600" />
              Ready to report a vulnerability?
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Use our secure disclosure form to submit findings responsibly.
            </p>
          </div>
          <Button variant="default" asChild>
            <a href="tracespectre.com">

              Submit Vulnerability Report
            </a>
            
          </Button>
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