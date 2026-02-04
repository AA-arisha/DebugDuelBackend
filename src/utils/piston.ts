export const PISTON_EXECUTE_URL = 'https://emkc.org/api/v2/piston/execute';
export const PISTON_RUNTIMES_URL = 'https://emkc.org/api/v2/piston/runtimes';

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

export const executeCode = async (
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
    const rtRes = await fetch(PISTON_RUNTIMES_URL);
    if (rtRes.ok) {
      const runtimes = await rtRes.json() as { language: string; version: string }[];
      const match = runtimes.find((r) => r.language === languageMap[language.toLowerCase()]);
      if (match) return match.version;
    }
  } catch (err) {
    console.error('Error fetching runtimes:', err);
  }
  return undefined;
};
