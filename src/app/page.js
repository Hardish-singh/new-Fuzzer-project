import { Rocket, Zap, Shield, Code, Bug, Terminal, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Navigation */}
       <Navbar/>

        {/* Main Content */}
        <div className="flex flex-col items-center text-center gap-12">
          <div className="max-w-4xl space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Advanced <span className="text-primary">Fuzzing</span> Toolkit
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover hidden vulnerabilities with our cutting-edge fuzzing platform. 
              Automate security testing and find bugs before they become threats.
            </p>
          </div>

          <div className="flex gap-4">
            <Button asChild>
              <Link href="/dashboard">
                <Zap className="h-4 w-4 mr-2" />
                Start Fuzzing
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#features">
                <Code className="h-4 w-4 mr-2" />
                Explore Features
              </Link>
            </Button>
          </div>

          <div className="relative w-full max-w-4xl aspect-video rounded-xl border overflow-hidden shadow-lg bg-black">
      <div className="absolute inset-0 flex items-center justify-center">
        <Terminal className="h-32 w-32 text-white" />
      </div>
    </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powerful <span className="text-primary">Fuzzing</span> Capabilities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-8 w-8 text-primary" />,
                title: "Smart Mutation",
                description: "AI-powered input generation that evolves based on code coverage feedback"
              },
              {
                icon: <Shield className="h-8 w-8 text-primary" />,
                title: "Vulnerability Detection",
                description: "Automatically identifies SQLi, XSS, RCE and other critical vulnerabilities"
              },
              {
                icon: <Bug className="h-8 w-8 text-primary" />,
                title: "Crash Analysis",
                description: "Detailed crash reports with stack traces and exploitability assessment"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-background p-6 rounded-xl border hover:border-primary/50 transition-all shadow-sm">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto bg-muted p-8 rounded-xl border shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Find Vulnerabilities?</h2>
            {/* <p className="text-muted-foreground mb-6">Join thousands of security researchers using FuzzCraft to secure their applications.</p> */}
            <Button asChild>
              <Link href="/dashboard">
                <Rocket className="h-4 w-4 mr-2" />
                Launch FuzzWorld
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
     <Footer/>
    </div>
  );
}