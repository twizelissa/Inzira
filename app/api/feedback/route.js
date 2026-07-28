import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      rating,
      comment = '',
      interests = [],
      selectedPlace = '',
      budget = '',
      time = '',
      province = '',
      hgPref = ''
    } = data;

    // Path to Data/user_feedback.csv relative to project root or absolute
    // The workspace is c:\Users\Edisor\Documents\Inzira, and the next app is in web/
    // Let's resolve the path to the workspace Data folder
    // The next.js project folder is web/
    const csvDir = path.resolve(process.cwd(), '../Data');
    const csvPath = path.join(csvDir, 'user_feedback.csv');

    // Create the Data directory if it doesn't exist (though it should exist)
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    // Prepare headers if file is new
    const fileExists = fs.existsSync(csvPath);
    const headers = 'timestamp,rating,comment,interests,selected_place,budget,time,province,hg_pref\n';

    // Format fields for CSV safety (double quotes around fields, escape existing double quotes)
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      rating,
      escapeCsv(comment),
      escapeCsv(interests.join(';')),
      escapeCsv(selectedPlace),
      escapeCsv(budget),
      escapeCsv(time),
      escapeCsv(province),
      escapeCsv(hgPref)
    ].join(',') + '\n';

    // Write headers if file is new, then write row
    if (!fileExists) {
      fs.writeFileSync(csvPath, headers);
    }
    fs.appendFileSync(csvPath, row);

    return NextResponse.json({ success: true, message: 'Feedback saved successfully.' });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
