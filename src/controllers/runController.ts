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

    if (!result || !result.run) {
      return res.status(400).json({
        output: '⚠️ Execution failed.',
      });
    }

    const hasError =
      result.compile?.stderr ||
      result.run?.stderr ||
      result.run?.code !== 0;

    const output = hasError
      ? '⚠️ Execution failed. Please review your code and try again.'
      : (result.run.stdout || '(no output)');

    return res.status(200).json({
      output,
    });

  } catch (error: any) {
    console.error('Run code error:', error);
    return res.status(500).json({ message: 'Network or runtime error', output: `Network or runtime error: ${error?.message || String(error)}` });
  }
};