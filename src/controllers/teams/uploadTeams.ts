import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../../prismaClient';
import { parseFile } from '../../utils/parseFile';
import validator from 'validator';

export type TeamMember = {
  name: string;
  email: string;
};

export type ParsedRow = {
  team_name?: string;
  leader_name?: string;
  leader_email?: string;
  member1?: string;
  member1_email?: string;
  member2?: string;
  member2_email?: string;
};

export type ValidRow = {
  rowNumber: number;
  finalTeamName: string;
  leaderName: string;
  leaderEmail: string;
  members: TeamMember[];
};

export type PreviewRow = {
  rowNumber: number;
  teamName?: string;
  leaderName?: string;
  leaderEmail?: string;
  members: TeamMember[];
  status: 'VALID' | 'INVALID' | 'RENAMED';
  message: string | null;
};

export type UploadSummary = {
  total: number;
  valid: number;
  renamed: number;
  invalid: number;
  created: number;
};

/**
 * Resolves team names deterministically, handling duplicates within the upload
 * and checking against existing teams in the database.
 * Returns a Map<baseName, finalName> for tracking renames.
 */
async function resolveTeamNames(
  baseNames: Array<{ rowNumber: number; baseName: string }>
): Promise<Map<number, { baseName: string; finalName: string; isRenamed: boolean }>> {
  // Fetch existing team names from database in one query
  const existingTeams = await prisma.team.findMany({
    select: { name: true }
  });
  const existingNames = new Set(existingTeams.map(t => t.name));

  // Track all resolved names to handle duplicates within the upload
  const usedNames = new Set<string>(existingNames);
  const result = new Map<
    number,
    { baseName: string; finalName: string; isRenamed: boolean }
  >();

  // Process each row and resolve names deterministically
  for (const { rowNumber, baseName } of baseNames) {
    let finalName = baseName;
    let counter = 1;
    let isRenamed = false;

    // Keep incrementing until we find an unused name
    while (usedNames.has(finalName)) {
      finalName = `${baseName}_${counter++}`;
      isRenamed = true;
    }

    usedNames.add(finalName);
    result.set(rowNumber, { baseName, finalName, isRenamed });
  }

  return result;
}

export const uploadTeams = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'File required' });

  try {
    // Step 1: Parse file
    const rows: ParsedRow[] = await parseFile(file);

    // Step 2: First-pass validation (no DB calls) + extract members
    type ValidationResult = {
      rowNumber: number;
      teamName?: string;
      leaderName?: string;
      leaderEmail?: string;
      members: TeamMember[];
      status: 'VALID' | 'INVALID';
      message: string | null;
      isValid: boolean;
    };

    const validationResults: ValidationResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const teamName = row.team_name?.trim();
      const leaderName = row.leader_name?.trim();
      const leaderEmail = row.leader_email?.trim();

      const members: TeamMember[] = [];
      let status: 'VALID' | 'INVALID' = 'VALID';
      let message: string | null = null;

      // Extract members
      if (row.member1 && row.member1_email) {
        members.push({ name: row.member1.trim(), email: row.member1_email.trim() });
      }
      if (row.member2 && row.member2_email) {
        members.push({ name: row.member2.trim(), email: row.member2_email.trim() });
      }

      // Validate required fields
      if (!teamName || !leaderName || !leaderEmail) {
        status = 'INVALID';
        message = 'Missing required fields';
      }
      // Validate email formats
      else if (!validator.isEmail(leaderEmail)) {
        status = 'INVALID';
        message = 'Invalid leader email';
      } else if (members.some(m => !validator.isEmail(m.email))) {
        status = 'INVALID';
        message = 'Invalid member email';
      }
      // Validate team size (leader + members ≤ 3)
      else if (members.length + 1 > 3) {
        status = 'INVALID';
        message = 'Team size exceeds 3 (max: leader + 2 members)';
      }

      validationResults.push({
        rowNumber,
        teamName,
        leaderName,
        leaderEmail,
        members,
        status,
        message,
        isValid: status === 'VALID'
      });
    }

    // Step 3: Check for duplicate emails in database (single query)
    const validIds = validationResults
      .filter(r => r.isValid)
      .map((r, idx) => idx);

    const allEmailsToCheck: string[] = [];

    for (const idx of validIds) {
      const r = validationResults[idx];
      if (r.isValid && r.leaderEmail) {
        allEmailsToCheck.push(r.leaderEmail);
        r.members.forEach(m => allEmailsToCheck.push(m.email));
      }
    }

    // Fetch all existing emails in one query
    let duplicateEmails = new Set<string>();
    if (allEmailsToCheck.length > 0) {
      const existingEmails = await prisma.user.findMany({
        where: { email: { in: allEmailsToCheck } },
        select: { email: true }
      });
      duplicateEmails = new Set(
        existingEmails.map(e => e.email).filter((email): email is string => email !== null)
      );
    }

    // Mark rows with duplicate emails as invalid
    for (const idx of validIds) {
      const r = validationResults[idx];
      const rowEmails = r.leaderEmail ? [r.leaderEmail, ...r.members.map(m => m.email)] : [];
      const hasDuplicate = rowEmails.some(email => duplicateEmails.has(email));

      if (hasDuplicate) {
        r.isValid = false;
        r.status = 'INVALID';
        r.message = `Email(s) already exist in database`;
      }
    }

    // Step 4: Resolve team names for valid rows
    const validRowsForNaming = validationResults
      .filter(r => r.isValid)
      .map(r => ({ rowNumber: r.rowNumber, baseName: r.teamName! }));

    const nameResolutions = await resolveTeamNames(validRowsForNaming);

    // Step 5: Build preview and final valid rows
    const preview: PreviewRow[] = [];
    const validRows: ValidRow[] = [];

    for (const result of validationResults) {
      if (result.isValid) {
        const nameResolve = nameResolutions.get(result.rowNumber)!;
        const status = nameResolve.isRenamed ? 'RENAMED' : 'VALID';
        const message = nameResolve.isRenamed
          ? `Team renamed to ${nameResolve.finalName}`
          : null;

        preview.push({
          rowNumber: result.rowNumber,
          teamName: nameResolve.finalName,
          leaderName: result.leaderName,
          leaderEmail: result.leaderEmail,
          members: result.members,
          status,
          message
        });

        validRows.push({
          rowNumber: result.rowNumber,
          finalTeamName: nameResolve.finalName,
          leaderName: result.leaderName!,
          leaderEmail: result.leaderEmail!,
          members: result.members
        });
      } else {
        preview.push({
          rowNumber: result.rowNumber,
          teamName: result.teamName,
          leaderName: result.leaderName,
          leaderEmail: result.leaderEmail,
          members: result.members,
          status: 'INVALID',
          message: result.message
        });
      }
    }

    // Step 6: Bulk insert teams and users in a single transaction
    let created = 0;
    if (validRows.length > 0) {
      await prisma.$transaction(async tx => {
        // Bulk create all teams
        const teamsToCreate = validRows.map(row => ({ name: row.finalTeamName }));
        await tx.team.createMany({
          data: teamsToCreate,
          skipDuplicates: true
        });

        // Fetch all created teams in one query and build a Map
        const createdTeams = await tx.team.findMany({
          where: {
            name: { in: validRows.map(r => r.finalTeamName) }
          },
          select: { id: true, name: true }
        });

        const teamMap = new Map(createdTeams.map(t => [t.name, t.id]));

        // Prepare all users to create (leaders + members)
        const usersToCreate: Array<{
          username?: string;
          fullName: string;
          email: string;
          password: string;
          role: Role;
          isLeader?: boolean;
          teamId: bigint;
        }> = [];

        for (const row of validRows) {
          const teamId = teamMap.get(row.finalTeamName);
          if (!teamId) continue; // Skip if team not found (shouldn't happen)

          const password = Math.random().toString(36).slice(-8);

          // Add leader
          usersToCreate.push({
            username: row.finalTeamName,
            fullName: row.leaderName,
            email: row.leaderEmail,
            password,
            role: Role.PARTICIPANT,
            isLeader: true,
            teamId
          });

          // Add members
          for (const member of row.members) {
            usersToCreate.push({
              fullName: member.name,
              email: member.email,
              password,
              role: Role.PARTICIPANT,
              teamId
            });
          }
        }

        // Bulk create all users
        if (usersToCreate.length > 0) {
          await tx.user.createMany({
            data: usersToCreate,
            skipDuplicates: true
          });
        }

        created = validRows.length;
      });
    }

    // Step 7: Return preview and summary
    const summary: UploadSummary = {
      total: rows.length,
      valid: validRows.filter(r => {
        const res = nameResolutions.get(r.rowNumber);
        return res && !res.isRenamed;
      }).length,
      renamed: validRows.filter(r => {
        const res = nameResolutions.get(r.rowNumber);
        return res && res.isRenamed;
      }).length,
      invalid: validationResults.filter(r => !r.isValid).length,
      created
    };

    res.json({ preview, summary });
  } catch (err: any) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};