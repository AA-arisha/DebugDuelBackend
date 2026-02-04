import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
  isVisible?: boolean;
}
interface BuggyCode {
  language: string;
  code: string;
  explanation?: string;
}

export const createQuestion = async (req: Request, res: Response) => {
  const { roundId } = req.params;
  const { title, problemStatement, testCases = [], buggyCodes = [] } = req.body;

  // Validate required fields
  if (!title || !problemStatement) {
    return res.status(400).json({ error: 'Title and problemStatement are required' });
  }

  try {
    // Check if round exists
    const round = await prisma.round.findUnique({ where: { id: BigInt(roundId) } });
    if (!round) return res.status(404).json({ error: 'Round not found' });

    // Check if round is editable
    if (!isEditable(round)) return res.status(400).json({ error: 'Cannot add question to active round' });

    // Create question with test cases and buggy codes
    const question = await prisma.question.create({
      data: {
        roundId: BigInt(roundId),
        title,
        problemStatement,
        TestCases: {
          create: testCases.map ((tc : TestCase)=> ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            description: tc.description || '',
            isVisible: tc.isVisible !== undefined ? tc.isVisible : true,
          })),
        },
        BuggyCodes: {
          create: buggyCodes.map( (bc : BuggyCode) => ({
            language: bc.language || 'javascript', // default to JS if not provided
            code: bc.code,
          })),
        },
      },
      include: {
        TestCases: true,
        BuggyCodes: true,
      },
    });

    return res.status(201).json(question);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create question', details: err });
  }
};
