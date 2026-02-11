// Default to the public Piston API (emkc) at /api/v2. Override with PISTON_BASE_URL if you host your own.
const PISTON_BASE_URL = (process.env.PISTON_BASE_URL || 'https://emkc.org/api/v2/piston').replace(/\/$/, '');
export const PISTON_EXECUTE_URL = `${PISTON_BASE_URL}/execute`;
export const PISTON_RUNTIMES_URL = `${PISTON_BASE_URL}/runtimes`;

export const languageMap: Record<string, string> = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'c++',
  java: 'java',
  c: 'c',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php'
};

export const fileNameMap: Record<string, string> = {
  javascript: 'main.js',
  python: 'main.py',
  cpp: 'main.cpp',
  java: 'Main.java',
  c: 'main.c',
  csharp: 'Main.cs',
  go: 'main.go',
  rust: 'main.rs',
  ruby: 'main.rb',
  php: 'main.php'
};

export interface PistonExecuteResponse {
  language: string;
  version: string;
  compile?: any;
  run: any;
  message?: string;
}

export const normalizeOutput = (output: string) => output.trim().replace(/\r\n/g, '\n');

export const  executeCode = async (
  code: string,
  language: string,
  stdin: string,
  version: string
): Promise<PistonExecuteResponse> => {
  const payload: any = {
    language: languageMap[language.toLowerCase()] || language,
    version,
    files: [
      { name: fileNameMap[language.toLowerCase()] || 'main.txt', content: code }
    ],
    stdin
  };

  const response = await fetch(PISTON_EXECUTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await response.json() as PistonExecuteResponse;
};

export const fetchRuntimeVersion = async (language: string) => {
  try {
    console.log("Fetching runtimes for language:", language);

    const rtRes = await fetch(PISTON_RUNTIMES_URL);
    console.log("Runtime fetch response ok:", rtRes.ok);

    if (!rtRes.ok) throw new Error(`Failed to fetch runtimes: ${rtRes.status}`);

    const runtimes = await rtRes.json() as { language: string; version: string }[];
    console.log("Runtimes returned:", runtimes.map(r => r.language));

    const runtimeLanguage = languageMap[language.toLowerCase()];
    console.log("Mapped language:", runtimeLanguage);

    const match = runtimes.find((r) => r.language === runtimeLanguage);
    console.log("Matched runtime:", match);

    if (match) return match.version;

  } catch (err) {
    console.error('Error fetching runtimes:', err);
  }

  return undefined;
};

