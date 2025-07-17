import { Rocket, Terminal } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export default function Navbar()
{
    return(
         <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Terminal className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FuzzWorld</span>
          </div>
          <Button asChild variant="secondary">
            <Link href="/dashboard">
              <Rocket className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
    )
}