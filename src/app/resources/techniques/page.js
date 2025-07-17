import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Rocket, Search, Code, Network, Shield, Lock, Bug, Fingerprint, Database } from 'lucide-react';

export default function TechniquesPage() {
  const techniques = [
    {
      icon: <Search className="h-5 w-5 text-blue-500" />,
      title: "Reconnaissance",
      description: "Information gathering about the target system",
      items: [
        "DNS enumeration and subdomain discovery",
        "Port scanning (with rate limiting)",
        "Web application fingerprinting",
        "Public document/metadata analysis",
        "API endpoint discovery"
      ]
    },
    {
      icon: <Code className="h-5 w-5 text-purple-500" />,
      title: "Input Validation Testing",
      description: "Testing for injection vulnerabilities",
      items: [
        "SQL injection testing (use time-based techniques)",
        "Cross-site scripting (XSS) testing",
        "Command injection testing",
        "Server-side template injection",
        "XML external entity (XXE) injection"
      ]
    },
    {
      icon: <Lock className="h-5 w-5 text-green-500" />,
      title: "Authentication Testing",
      description: "Testing authentication mechanisms",
      items: [
        "Credential stuffing (with test accounts only)",
        "Multi-factor authentication bypass testing",
        "Session management testing",
        "Password policy evaluation",
        "OAuth/SSO implementation testing"
      ]
    },
    {
      icon: <Database className="h-5 w-5 text-orange-500" />,
      title: "Data Exposure Testing",
      description: "Testing for sensitive data leaks",
      items: [
        "API data over-exposure testing",
        "Insecure direct object references (IDOR)",
        "Mass assignment testing",
        "Debug mode detection",
        "Error message analysis"
      ]
    },
    {
      icon: <Network className="h-5 w-5 text-red-500" />,
      title: "Infrastructure Testing",
      description: "Testing underlying infrastructure",
      items: [
        "TLS/SSL configuration testing",
        "HTTP header security analysis",
        "CORS and CSRF testing",
        "Subdomain takeover testing",
        "Cloud storage misconfiguration testing"
      ]
    },
    {
      icon: <Fingerprint className="h-5 w-5 text-yellow-500" />,
      title: "Business Logic Testing",
      description: "Testing application-specific workflows",
      items: [
        "Price manipulation testing",
        "Workflow bypass testing",
        "Race condition testing",
        "Negative testing of business rules",
        "Privilege escalation testing"
      ]
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-lg bg-blue-100">
          <Bug className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Testing Techniques</h1>
          <p className="text-lg text-muted-foreground">Methodologies for responsible vulnerability discovery</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Testing Methodology Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Ethical Considerations
              </h3>
              <ul className="text-muted-foreground space-y-2 list-disc pl-5">
                <li>Always obtain proper authorization</li>
                <li>Limit testing to approved scope</li>
                <li>Avoid production data whenever possible</li>
                <li>Never attempt denial of service attacks</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-500" />
                Recommended Approach
              </h3>
              <ol className="text-muted-foreground space-y-2 list-decimal pl-5">
                <li>Reconnaissance and mapping</li>
                <li>Automated scanning (with caution)</li>
                <li>Manual verification of findings</li>
                <li>Impact assessment</li>
                <li>Documentation and reporting</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {techniques.map((tech, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow group">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <span className="p-2 rounded-lg bg-opacity-20" style={{ backgroundColor: tech.icon.props.className.includes('blue') ? 'rgba(59, 130, 246, 0.1)' : 
                                                                        tech.icon.props.className.includes('purple') ? 'rgba(168, 85, 247, 0.1)' :
                                                                        tech.icon.props.className.includes('green') ? 'rgba(34, 197, 94, 0.1)' :
                                                                        tech.icon.props.className.includes('orange') ? 'rgba(249, 115, 22, 0.1)' :
                                                                        tech.icon.props.className.includes('red') ? 'rgba(239, 68, 68, 0.1)' :
                                                                        'rgba(234, 179, 8, 0.1)' }}>
                  {tech.icon}
                </span>
                <div>
                  <div>{tech.title}</div>
                  <div className="text-sm font-normal text-muted-foreground">{tech.description}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground list-disc pl-5">
                {tech.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-600" />
              Ready to apply these techniques?
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Start testing with our guided security assessment tools.
            </p>
          </div>
          <Button variant="default" asChild>
            <Link href="/dashboard">
              Launch Security Tools
              <Rocket className="h-4 w-4 ml-2" />
            </Link>
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
        <Button variant="secondary" asChild>
          <Link href="/guidelines">
            <Shield className="h-4 w-4 mr-2" />
            Review Security Guidelines
          </Link>
        </Button>
      </div>
    </div>
  );
}