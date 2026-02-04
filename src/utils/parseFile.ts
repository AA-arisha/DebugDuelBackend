// utils/parseFile.ts
import xlsx from 'xlsx';
import { Express } from 'express';
import { ParsedRow } from '../controllers/teams/uploadTeams';

/**
 * Safely converts a value to string, handling null/undefined/empty
 */
const safeString = (value: any): string | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  return String(value).trim();
};

/**
 * Parses an uploaded Excel/CSV file into an array of team rows
 */
export const parseFile = async (file: Express.Multer.File): Promise<ParsedRow[]> => {
  // Read the workbook
  const workbook = xlsx.read(file.buffer, { 
    type: 'buffer'
  });
  
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Parse to JSON - defval and raw options go here
  const rawData = xlsx.utils.sheet_to_json(sheet, {
    raw: false,        // Convert everything to strings
    defval: '',        // Empty cells become empty strings
    blankrows: false   // Skip completely empty rows
  });
  
  // Debug: Log the first row to see actual data
  if (rawData.length > 0) {
    console.log('📋 First row raw data:', JSON.stringify(rawData[0], null, 2));
  }

  // Parse and map data
  return (rawData as any[]).map((row, index) => {
    const parsed = {
      team_name: safeString(row.team_name),
      leader_name: safeString(row.leader_name),
      leader_email: safeString(row.leader_email),
      member1: safeString(row.member1),
      member1_email: safeString(row.member1_email),
      member2: safeString(row.member2),
      member2_email: safeString(row.member2_email),
    };

    // Debug: Log first parsed row
    if (index === 0) {
      console.log('📋 First parsed row:', JSON.stringify(parsed, null, 2));
    }

    return parsed;
  });
};