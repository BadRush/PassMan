export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const CHARS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export const generatePassword = (options: PasswordOptions): string => {
  let charset = "";
  const required: string[] = [];

  if (options.uppercase) {
    charset += CHARS.uppercase;
    required.push(CHARS.uppercase);
  }
  if (options.lowercase) {
    charset += CHARS.lowercase;
    required.push(CHARS.lowercase);
  }
  if (options.numbers) {
    charset += CHARS.numbers;
    required.push(CHARS.numbers);
  }
  if (options.symbols) {
    charset += CHARS.symbols;
    required.push(CHARS.symbols);
  }

  if (!charset) {
    charset = CHARS.lowercase + CHARS.numbers;
  }

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);

  const password = Array.from(array, (val) => charset[val % charset.length]);

  // Ensure at least one char from each required set
  required.forEach((set, i) => {
    const randIdx = crypto.getRandomValues(new Uint32Array(1))[0];
    password[i] = set[randIdx % set.length];
  });

  // Shuffle using Fisher-Yates
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
};

export const DEFAULT_OPTIONS: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};
