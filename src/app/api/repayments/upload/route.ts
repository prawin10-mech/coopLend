import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';
import ClosedLoan from '@/models/ClosedLoan';
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

        // Clear existing closed loans before new import
        await ClosedLoan.deleteMany({});

        let matched = 0;
        let notFound = 0;
        const closedLoansMap = new Map();

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
                const rawGlNo = String(row['GL NO'] || '');
                const rawLoanNo = String(row['LOAN NO'] || '');

                const glNo = rawGlNo.trim();
                const loanNo = rawLoanNo.replace(/[\s\-]+/g, '').toUpperCase(); // Critical: removes spaces and hyphens for search matching

                if (!glNo || !loanNo || glNo === 'GL NO' || loanNo === 'TOTALDEMAND') continue;

                const glKey = normalizeLoanKey(glNo);
                const slKey = normalizeLoanKey(loanNo);
                const key = `${glKey}|${slKey}`;

                const dueDate = dueDateKey ? String(row[dueDateKey] || '').trim() : '';
                const grandTotal = parseCurrency(row['Grand Total\n'] || row['Grand Total'] || 0);
                const phone = String(row['PHONE NUMBER'] || '').trim();
                const memberName = String(row['NAME OF THE MEMBER'] || row['BORROWER NAME'] || row['MEMBER NAME'] || row['NAME'] || '').trim();

                const loanDoc = loanMap.get(key);
                if (loanDoc) {
                    if (!loanDoc.annualDemands) loanDoc.annualDemands = {};
                    loanDoc.annualDemands[year] = { dueDate, grandTotal };

                    if (phone) {
                        loanDoc.contactNumber = phone;
                    }

                    matched++;
                } else {
                    notFound++;
                    // Deduplicate unmatched records by glNo, loanNo and year
                    const closedKey = `${glNo}|${loanNo}|${year}`;
                    if (!closedLoansMap.has(closedKey)) {
                        closedLoansMap.set(closedKey, {
                            glNo,
                            loanNo,
                            memberName,
                            demandYear: year,
                            dueDate,
                            grandTotal,
                            contactNumber: phone,
                            rawData: row
                        });
                    }
                }
            }
        }

        let updatedCount = 0;
        const bulkOps = [];

        for (const loanDoc of loanMap.values()) {
            if (loanDoc.isModified('annualDemands') || loanDoc.isModified('contactNumber')) {
                // Ensure manual modifications trigger
                bulkOps.push({
                    updateOne: {
                        filter: { _id: loanDoc._id },
                        update: {
                            $set: {
                                annualDemands: loanDoc.annualDemands,
                                contactNumber: loanDoc.contactNumber
                            }
                        }
                    }
                });
                updatedCount++;
            }
        }

        if (bulkOps.length > 0) {
            // Execute in batches to prevent hitting MongoDB request limits if massive
            const BATCH_SIZE = 500;
            for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
                const batch = bulkOps.slice(i, i + BATCH_SIZE);
                await Loan.collection.bulkWrite(batch, { ordered: false });
            }
        }

        const closedLoansToInsert = Array.from(closedLoansMap.values());
        if (closedLoansToInsert.length > 0) {
            await ClosedLoan.insertMany(closedLoansToInsert, { ordered: false });
        }

        return NextResponse.json({
            message: 'Repayments initialized directly on Loans successfully',
            matchedDemands: matched,
            unmatchedDemands: notFound,
            updatedLoans: updatedCount
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 });
    }
}
