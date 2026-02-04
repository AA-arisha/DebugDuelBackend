import { Request, Response } from 'express';
import { executeCode, fetchRuntimeVersion } from '../utils/piston';

export const runCode = async (req: Request, res: Response) => {
  try {
    const { code, language, stdin } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    const version = await fetchRuntimeVersion(language);
    if (!version) {
      return res.status(400).json({ message: `Language "${language}" is not supported or runtime not available` });
    }

    const result = await executeCode(code, language, stdin || '', version).catch((e) => {
      console.error('Piston execute error:', e);
      return null;
    });

    if (!result || !result.run) return res.status(400).json({ message: 'Execution failed' });

    let output = '';
    if (result.compile?.stderr) output += `[COMPILE ERROR]\n${result.compile.stderr}\n\n`;
    if (result.run.stderr) output += `[STDERR]\n${result.run.stderr}\n\n`;
    output += `[STDOUT]\n${result.run.stdout || '(no output)'}\n`;
    if (result.run.code !== 0) output += `\n[Exit Code] ${result.run.code}`;

    return res.status(200).json({ output, exitCode: result.run.code, success: result.run.code === 0 });
  } catch (error: any) {
    console.error('Run code error:', error);
    return res.status(500).json({ message: 'Network or runtime error', output: `Network or runtime error: ${error?.message || String(error)}` });
  }
};