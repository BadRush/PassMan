"use client";

import { trpc } from "@/lib/trpc/client";

export default function Home() {
  const hello = trpc.hello.useQuery();

  return (
    <main className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-zinc-950 text-white">
      <h1 className="text-5xl font-extrabold mb-4 tracking-tight bg-linear-to-br from-white to-zinc-500 bg-clip-text text-transparent">
        PassMan
      </h1>
      <p className="text-zinc-400 max-w-lg mb-8 text-lg">
        Secure, self-hosted, web-based zero-knowledge password manager.
      </p>
      
      <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <h2 className="font-semibold text-zinc-300 mb-3">Backend Connection Status</h2>
        {hello.isLoading ? (
          <p className="text-blue-400 animate-pulse font-mono">Connecting to tRPC...</p>
        ) : hello.isError ? (
          <p className="text-red-400 font-mono">Error: {hello.error.message}</p>
        ) : (
          <div className="flex items-center space-x-2 text-green-400 font-mono bg-green-400/10 px-4 py-2 rounded-md border border-green-400/20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span>{hello.data.greeting}</span>
          </div>
        )}
      </div>
    </main>
  );
}
