import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';
import * as XLSX from 'xlsx';

function parseCurrency(val: any) {
    if (!val && val !== 0) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

function normalizeLoanKey(str: string | undefined): string {
    if (!str) return '';
    return String(str).replace(/[\s\-_.]+/g, '').toUpperCase();
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();

        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Load existing loans into memory
        const loans = await Loan.find({ glNo: { $exists: true }, societyLoanNo: { $exists: true } });
        const loanMap = new Map();
        loans.forEach(l => {
            const glKey = normalizeLoanKey(l.glNo);
            const slKey = normalizeLoanKey(l.societyLoanNo);
            const key = `${glKey}|${slKey}`;
            loanMap.set(key, l);
            if (!l.annualDemands) l.annualDemands = {};
        });

        let matched = 0;
        let notFound = 0;

        for (const sheetName of workbook.SheetNames) {
            if (sheetName.toLowerCase() === 'sheet1') continue;

            const yearMatch = sheetName.match(/\b(20\d{2})\b/);
            if (!yearMatch) continue;
            const year = parseInt(yearMatch[1], 10);

            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' }) as any[];

            if (data.length === 0) continue;

            const dueDateKey = Object.keys(data[0] || {}).find(k => k.toLowerCase().replace(/[\s\n_]+/g, '').includes('duedate')) || '';

            for (const row of data) {
                const glNo = String(row['GL NO'] || '').trim();
                const loanNo = String(row['LOAN NO'] || '').trim();

                if (!glNo || !loanNo || glNo === 'GL NO' || loanNo.toUpperCase() === 'TOTAL DEMAND') continue;

                const glKey = normalizeLoanKey(glNo);
                const slKey = normalizeLoanKey(loanNo);
                const key = `${glKey}|${slKey}`;

                const loanDoc = loanMap.get(key);
                if (loanDoc) {
                    const dueDate = dueDateKey ? String(row[dueDateKey] || '').trim() : '';
                    const grandTotal = parseCurrency(row['Grand Total\n'] || row['Grand Total'] || 0);

                    if (!loanDoc.annualDemands) loanDoc.annualDemands = {};
                    loanDoc.annualDemands[year] = { dueDate, grandTotal };

                    if (row['PHONE NUMBER']) {
                        loanDoc.contactNumber = String(row['PHONE NUMBER']).trim();
                    }

                    matched++;
                } else {
                    notFound++;
                }
            }
        }

        let updated = 0;
        for (const loanDoc of loanMap.values()) {
            if (loanDoc.isModified('annualDemands') || loanDoc.isModified('contactNumber')) {
                loanDoc.markModified('annualDemands');
                await loanDoc.save();
                updated++;
            }
        }

        return NextResponse.json({
            message: 'Repayments initialized directly on Loans successfully',
            matchedDemands: matched,
            unmatchedDemands: notFound,
            updatedLoans: updated
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 });
    }
}
