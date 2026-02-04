// controllers/team/uploadTeams.ts (WITH DEBUGGING)
import { Request, Response } from 'express';
import prisma from '../../prismaClient';
import { parseFile } from '../../utils/parseFile';
import { resolveTeamName } from '../../utils/teamNameResolver';
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

export const uploadTeams = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'File required' });

  try {
    // 1️⃣ Parse and type rows
    const rows: ParsedRow[] = await parseFile(file);
    console.log('📊 Parsed rows:', JSON.stringify(rows, null, 2));

    const preview: PreviewRow[] = [];
    const validRows: ValidRow[] = [];
    let validCount = 0, renamedCount = 0, invalidCount = 0;

    // 2️⃣ Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      const teamName = row.team_name?.trim();
      const leaderName = row.leader_name?.trim();
      const leaderEmail = row.leader_email?.trim();

      const members: TeamMember[] = [];
      
      // 🐛 DEBUG: Log raw values
      console.log(`\n🔍 Row ${rowNumber}:`, {
        member1: row.member1,
        member1_email: row.member1_email,
        member2: row.member2,
        member2_email: row.member2_email
      });

      if (row.member1 && row.member1_email) {
        const m1 = { name: row.member1.trim(), email: row.member1_email.trim() };
        members.push(m1);
        console.log(`✅ Added member 1:`, m1);
      } else {
        console.log(`❌ Member 1 missing: name=${row.member1}, email=${row.member1_email}`);
      }

      if (row.member2 && row.member2_email) {
        const m2 = { name: row.member2.trim(), email: row.member2_email.trim() };
        members.push(m2);
        console.log(`✅ Added member 2:`, m2);
      } else {
        console.log(`❌ Member 2 missing: name=${row.member2}, email=${row.member2_email}`);
      }

      console.log(`📝 Total members for row ${rowNumber}:`, members.length);

      let status: 'VALID' | 'INVALID' | 'RENAMED' = 'VALID';
      let message: string | null = null;

      // Validation
      if (!teamName || !leaderName || !leaderEmail) {
        status = 'INVALID';
        message = 'Missing required fields';
        invalidCount++;
      } else if (!validator.isEmail(leaderEmail)) {
        status = 'INVALID';
        message = 'Invalid leader email';
        invalidCount++;
      } else if (members.some((m) => !validator.isEmail(m.email))) {
        status = 'INVALID';
        message = 'Invalid member emails';
        invalidCount++;
      } else if (members.length + 1 > 3) {
        status = 'INVALID';
        message = 'Team size exceeds 3';
        invalidCount++;
      } else {
        // Check duplicates BEFORE marking as valid
        const allEmails = [leaderEmail, ...members.map(m => m.email)];
        const existingEmails = await prisma.user.findMany({
          where: { email: { in: allEmails } },
          select: { email: true }
        });

        if (existingEmails.length > 0) {
          status = 'INVALID';
          message = `Duplicate emails exist: ${existingEmails.map(e => e.email).join(', ')}`;
          invalidCount++;
          console.log(`❌ Row ${rowNumber} has duplicate emails:`, existingEmails);
        } else {
          // Resolve team name
          const finalTeamName = await resolveTeamName(teamName);
          if (finalTeamName !== teamName) {
            status = 'RENAMED';
            message = `Team renamed to ${finalTeamName}`;
            renamedCount++;
          } else {
            validCount++;
          }

          // Add to valid rows
          validRows.push({ finalTeamName, leaderName, leaderEmail, members });
          console.log(`✅ Row ${rowNumber} added to validRows with ${members.length} members`);
        }
      }

      preview.push({ rowNumber, teamName, leaderName, leaderEmail, members, status, message });
    }

    console.log(`\n📊 Summary BEFORE insertion:`, {
      total: rows.length,
      validCount,
      renamedCount,
      invalidCount,
      validRowsLength: validRows.length
    });

    // 3️⃣ Insert valid rows into DB transaction
    let created = 0;
    if (validRows.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const row of validRows) {
          console.log(`\n🔄 Processing team: ${row.finalTeamName}`);
          console.log(`   Leader: ${row.leaderName} (${row.leaderEmail})`);
          console.log(`   Members: ${row.members.length}`);

          const password = Math.random().toString(36).slice(-8);
          

          const team = await tx.team.create({ data: { name: row.finalTeamName } });
          console.log(`   ✅ Team created with ID: ${team.id}`);

          await tx.user.create({
            data: {
              username: row.finalTeamName,
              fullName: row.leaderName,
              email: row.leaderEmail,
              password: password,
              role: 'PARTICIPANT',
              isLeader: true,
              teamId: team.id
            }
          });
          console.log(`   ✅ Leader created`);

          // Create members
          for (let i = 0; i < row.members.length; i++) {
            const member = row.members[i];
            console.log(`   🔄 Creating member ${i + 1}: ${member.name} (${member.email})`);
            
            await tx.user.create({
              data: {
                fullName: member.name,
                email: member.email,
                password: password,
                role: 'PARTICIPANT',
                teamId: team.id
              }
            });
            console.log(`   ✅ Member ${i + 1} created`);
          }

          created++;
          console.log(`   ✅ Team ${row.finalTeamName} fully created with ${row.members.length} members`);
        }
      });
    }

    console.log(`\n🎉 Final created count: ${created}`);

    // 4️⃣ Send preview + summary
    const summary: UploadSummary = {
      total: rows.length,
      valid: validCount,
      renamed: renamedCount,
      invalid: invalidCount,
      created
    };

    res.json({ preview, summary });
  } catch (err: any) {
    console.error('❌ Upload failed:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};