import { Request, Response } from 'express';

const PISTON_EXECUTE_URL = 'https://emkc.org/api/v2/piston/execute';
const PISTON_RUNTIMES_URL = 'https://emkc.org/api/v2/piston/runtimes';

// Type definitions for Piston API
interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

interface PistonFile {
  name: string;
  content: string;
}

interface PistonExecutePayload {
  language: string;
  version?: string;
  files: PistonFile[];
  stdin?: string;  // Add stdin support
}

interface PistonCompileResult {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  output: string;
}

interface PistonRunResult {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  output: string;
}

interface PistonExecuteResponse {
  language: string;
  version: string;
  compile?: PistonCompileResult;
  run: PistonRunResult;
  message?: string;
}

// Map frontend language names to Piston API language names
const languageMap: Record<string, string> = {
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

// Map language to file names
const fileNameMap: Record<string, string> = {
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

export const runCode = async (req: Request, res: Response) => {
  try {
    const { code, language, stdin } = req.body;

    // Validate input
    if (!code || !language) {
      return res.status(400).json({
        message: 'Code and language are required'
      });
    }

    // Map language to Piston format
    const pistonLanguage = languageMap[language.toLowerCase()] || language;
    const fileName = fileNameMap[language.toLowerCase()] || 'main.txt';

    // First, fetch the runtime version
    let version: string | undefined;
    try {
      const rtRes = await fetch(PISTON_RUNTIMES_URL);
      if (rtRes.ok) {
        const runtimes = await rtRes.json() as PistonRuntime[];
        const match = runtimes.find((r) => r.language === pistonLanguage);
        if (match) {
          version = match.version;
        }
      }
    } catch (versionError) {
      console.error('Error fetching runtime version:', versionError);
    }

    // If no version found, return error
    if (!version) {
      return res.status(400).json({
        message: `Language "${pistonLanguage}" is not supported or runtime not available`,
        output: `Error: Language "${pistonLanguage}" is not supported`
      });
    }

    // Prepare payload for Piston API with version
    const payload: PistonExecutePayload = {
      language: pistonLanguage,
      version: version,
      files: [
        {
          name: fileName,
          content: code
        }
      ]
    };

    // Add stdin if provided
    if (stdin) {
      payload.stdin = stdin;
    }

    // Execute code
    const response = await fetch(PISTON_EXECUTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({})) as Partial<PistonExecuteResponse>;

    // Process the result
    if (response.ok && result && result.run) {
      let output = '';
      
      // Add compile errors if any
      if (result.compile?.stderr) {
        output += `[COMPILE ERROR]\n${result.compile.stderr}\n\n`;
      }
      
      // Add runtime errors if any
      if (result.run.stderr) {
        output += `[STDERR]\n${result.run.stderr}\n\n`;
      }
      
      // Add standard output
      output += `[STDOUT]\n${result.run.stdout || '(no output)'}\n`;
      
      // Add exit code if non-zero
      if (result.run.code !== 0) {
        output += `\n[Exit Code] ${result.run.code}`;
      }

      return res.status(200).json({
        output,
        exitCode: result.run.code,
        success: result.run.code === 0
      });
    } else {
      // Execution failed
      const errorMessage = result?.message || 'Execution failed. Please check your code and language.';
      return res.status(400).json({
        message: errorMessage,
        output: `Error: ${errorMessage}`
      });
    }
  } catch (error: any) {
    console.error('Run code error:', error);
    return res.status(500).json({
      message: 'Network or runtime error',
      output: `Network or runtime error: ${error?.message || String(error)}`
    });
  }
};