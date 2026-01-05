import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  version: string;
  files: PistonFile[];
  stdin?: string;
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
  compile?: any;
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

// Helper function to normalize output (trim whitespace)
const normalizeOutput = (output: string): string => {
  return output.trim().replace(/\r\n/g, '\n');
};

// Helper function to execute code with Piston API
const executeCode = async (
  code: string,
  language: string,
  stdin: string,
  version: string
): Promise<PistonExecuteResponse> => {
  const pistonLanguage = languageMap[language.toLowerCase()] || language;
  const fileName = fileNameMap[language.toLowerCase()] || 'main.txt';

  const payload: PistonExecutePayload = {
    language: pistonLanguage,
    version: version,
    files: [
      {
        name: fileName,
        content: code
      }
    ],
    stdin: stdin
  };

  const response = await fetch(PISTON_EXECUTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await response.json() as PistonExecuteResponse;
};

export const submitCode = async (req: Request, res: Response) => {
  try {
    const { code, language, problemId } = req.body;

    // Validate input
    if (!code || !language || !problemId) {
      return res.status(400).json({
        message: 'Code, language, and problemId are required'
      });
    }

    // Fetch the problem with test cases from database
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testcases: true // Include related test cases
      }
    });
    
    if (!problem) {
      return res.status(404).json({
        message: 'Problem not found'
      });
    }

    if (!problem.testcases || problem.testcases.length === 0) {
      return res.status(400).json({
        message: 'No test cases available for this problem'
      });
    }

    // Get runtime version for the language
    const pistonLanguage = languageMap[language.toLowerCase()] || language;
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

    if (!version) {
      return res.status(400).json({
        message: `Language "${pistonLanguage}" is not supported or runtime not available`
      });
    }

    // Run code against all test cases
    const totalTests = problem.testcases.length;
    let passedTests = 0;

    for (let i = 0; i < problem.testcases.length; i++) {
      const testCase = problem.testcases[i];
      
      try {
        // Execute the code with test case input
        const result = await executeCode(
          code,
          language,
          testCase.input,
          version
        );

        // Check for compilation or runtime errors
        if (result.run.code !== 0) {
          return res.status(200).json({
            success: false,
            failedTest: i + 1,
            totalTests,
            passedTests,
            error: 'Runtime Error',
            stderr: result.run.stderr,
            testCaseDescription: testCase.description,
            message: `Test case ${i + 1} failed with runtime error`
          });
        }

        // Normalize and compare output
        const actualOutput = normalizeOutput(result.run.stdout);
        const expectedOutput = normalizeOutput(testCase.expected);

        if (actualOutput !== expectedOutput) {
          return res.status(200).json({
            success: false,
            failedTest: i + 1,
            totalTests,
            passedTests,
            expected: expectedOutput,
            actual: actualOutput,
            input: testCase.input,
            testCaseDescription: testCase.description,
            message: `Test case ${i + 1} failed: Output mismatch`
          });
        }

        // Test case passed
        passedTests++;

      } catch (executeError: any) {
        console.error(`Error executing test case ${i + 1}:`, executeError);
        return res.status(500).json({
          success: false,
          failedTest: i + 1,
          totalTests,
          passedTests,
          message: `Test case ${i + 1} execution failed: ${executeError.message}`
        });
      }
    }

    // All test cases passed!
    return res.status(200).json({
      success: true,
      passedTests,
      totalTests,
      message: 'All test cases passed! Solution accepted.'
    });

  } catch (error: any) {
    console.error('Submit code error:', error);
    return res.status(500).json({
      message: 'Submission failed',
      error: error?.message || String(error)
    });
  }
};