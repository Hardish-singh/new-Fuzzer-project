'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tools } from '@/lib/constants';
import { Rocket, Zap, Shield, Clock, BarChart2, ChevronRight, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const resources = [
  {
    id: 'methodology',
    title: 'Fuzzing Methodology',
    description: 'Learn best practices for effective fuzzing',
    icon: BarChart2,
    color: 'blue',
    href: '/resources/methodology'
  },
  {
    id: 'guidelines',
    title: 'Security Guidelines',
    description: 'Responsible disclosure policies',
    icon: Shield,
    color: 'green',
    href: '/resources/guidelines'
  },
  {
    id: 'techniques',
    title: 'Advanced Techniques',
    description: 'Cutting-edge fuzzing approaches',
    icon: Rocket,
    color: 'purple',
    href: '/resources/techniques'
  }
];

export default function DashboardHome() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Fuzzing Toolkit</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Discover vulnerabilities and hidden endpoints with our powerful fuzzing tools. 
          Select a tool below to begin security testing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Tools.map(({ name, description, icon: Icon, href, category, complexity, tags }) => (
          <Link key={name} href={href} className="group">
            <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:border-primary/20 hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-${category}-100`}>
                      {Icon && <Icon className={`h-6 w-6 text-${category}-600`} />}
                    </div>
                    <CardTitle className="text-lg">{name}</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardDescription className="pt-2">{description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags?.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className={`text-xs capitalize border-${category}-200 text-${category}-800`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Fuzzing Type: <span className="font-medium">{category}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span>Security Level: <span className="font-medium">
                      {complexity === 'Advanced' ? 'High' : complexity === 'Intermediate' ? 'Medium' : 'Low'}
                    </span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span>Avg. Scan Time: <span className="font-medium">
                      {complexity === 'Advanced' ? '10-30 mins' : complexity === 'Intermediate' ? '5-15 mins' : '1-5 mins'}
                    </span></span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between items-center pt-0">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Learn more <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  {complexity}
                </Badge>
              </CardFooter>
            </Card>
          </Link>
        ))}
        
        {/* Additional Resources Card */}
        <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Rocket className="h-5 w-5" />
              <span>Fuzzing Resources</span>
            </CardTitle>
            <CardDescription>
              Learn about web application security testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.map((resource) => (
              <Link key={resource.id} href={resource.href} passHref>
                <div className={`flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-${resource.color}-50 cursor-pointer transition-colors border border-transparent hover:border-${resource.color}-200`}>
                  <resource.icon className={`h-5 w-5 text-${resource.color}-600`} />
                  <div>
                    <p className="font-medium">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" size="sm" asChild>
              <Link href="/resources">
                View All Resources
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}