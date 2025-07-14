'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tools } from '@/lib/constants';

export default function DashboardHome() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Fuzzer Dashboard</h1>
      <p className="text-muted-foreground">Select a tool to begin fuzzing or view historical job data.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Tools.map(({ name, description, icon: Icon, href }) => (
          <Link key={name} href={href}>
            <Card className="hover:shadow-lg transition cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{name}</CardTitle>
                {Icon && <Icon size={20} />}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}