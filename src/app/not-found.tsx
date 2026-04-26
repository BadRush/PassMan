import Link from "next/link";
import { ShieldAlert, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl inline-block">
            <ShieldAlert className="w-16 h-16 text-blue-500 mx-auto" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-zinc-300 mb-2">Page Not Found</h2>
        <p className="text-zinc-500 mb-8">
          The secure vault location you're looking for doesn't exist or you don't have access to it.
        </p>

        <Link 
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 transition-colors w-full sm:w-auto"
        >
          <Home className="w-4 h-4" />
          Return to Safety
        </Link>
      </div>
    </div>
  );
}
