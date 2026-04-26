"use client";

import zxcvbn from "zxcvbn";
import { useMemo } from "react";

interface Props {
  password: string;
}

const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"];
const textColors = ["text-red-400", "text-orange-400", "text-yellow-400", "text-blue-400", "text-emerald-400"];

export function PasswordStrength({ password }: Props) {
  const result = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  if (!result || !password) return null;

  const score = result.score; // 0-4
  const crackTime = result.crack_times_display.offline_slow_hashing_1e4_per_second;

  return (
    <div className="mt-2 space-y-1.5">
      {/* Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : "bg-zinc-800"
            }`}
          />
        ))}
      </div>
      {/* Label */}
      <div className="flex justify-between items-center">
        <span className={`text-xs font-medium ${textColors[score]}`}>
          {labels[score]}
        </span>
        <span className="text-xs text-zinc-500">
          Crack time: ~{crackTime as string}
        </span>
      </div>
    </div>
  );
}
