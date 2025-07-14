import { Bug, Radar, Terminal, ScanEye, Upload, FileText } from 'lucide-react';

export const Tools = [
  {
    name: 'FFUF',
    description: 'Fast web fuzzing tool for URL discovery.',
    icon: Bug,
    href: '/dashboard/ffuf',
  },
  {
    name: 'Dalfox',
    description: 'XSS scanner and parameter analysis.',
    icon: Radar,
    href: '/dashboard/dalfox',
  },
  {
    name: 'Wfuzz',
    description: 'Web application brute forcer.',
    icon: ScanEye,
    href: '/dashboard/wfuzz',
  },
  {
    name: 'Radamsa',
    description: 'File mutation fuzzer.',
    icon: FileText,
    href: '/dashboard/radamsa',
  },
  {
    name: 'ZFUZZ',
    description: 'Binary-level file fuzzer.',
    icon: Terminal,
    href: '/dashboard/zfuzz',
  },
  {
    name: 'AFL++',
    description: 'Coverage-guided binary fuzzer.',
    icon: Upload,
    href: '/dashboard/afl',
  },
];
