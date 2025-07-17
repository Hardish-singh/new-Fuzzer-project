import { Github, Terminal } from "lucide-react";


export default function Footer ()
{
    return (
        <footer className="py-8 border-t">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Terminal className="h-6 w-6 text-primary" />
            <span className="text-lg font-medium">FUZZWORLD</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Hardish-singh" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <span className="text-muted-foreground text-sm">
              Designed by <span className="text-primary">tracespectre</span> AKA <span className="text-primary">Hardish Singh</span>
            </span>
          </div>
        </div>
      </footer>
    );
}