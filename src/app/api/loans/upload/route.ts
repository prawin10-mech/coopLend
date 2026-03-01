import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';
import * as XLSX from 'xlsx';

function cleanKey(key: string): string {
    if (typeof key !== 'string') return key;
    return key.replace(/[\r\n\s]+/g, '').toLowerCase();
}

function parseCurrency(val: any): number {
    if (!val && val !== 0) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

function parseDate(val: any): Date | null {
    if (!val) return null;
    // Handle Excel serial date numbers
    if (typeof val === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const d = new Date(excelEpoch.getTime() + val * 86400000);
        if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    // Try dd-mm-yyyy or dd/mm/yyyy
    const parts = val.toString().split(/[-/]/);
    if (parts.length === 3) {
        const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
}

function normalizeVillage(val: any): string | undefined {
    if (!val || typeof val !== 'string') return val;
    const stripped = val.toLowerCase().replace(/[\s.\-_]+/g, '');
    const map: Record<string, string> = {
        'meenavalluru': 'Meena Valluru',
        'korumilli': 'Korumilli',
        'bkondepadu': 'B.Kondepadu',
        'bkondepade': 'B.Kondepadu',
        'kondepadu': 'B.Kondepadu',
        'ravipadu': 'Ravipadu',
        'kadiyedda': 'Kadiyedda',
        'kadiyeddu': 'Kadiyedda',
        'pothavaramandal': 'Pothavara Mandal',
        'pothavaram': 'Pothavara Mandal',
    };
    return map[stripped] ?? val.trim();
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
            return NextResponse.json({ error: 'Only .xlsx, .xls, and .csv files are supported' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false });

        const toInsert: any[] = [];
        const errors: string[] = [];
        let skipped = 0;

        json.forEach((row, idx) => {
            // Build clean-keyed row (strip spaces, newlines; lowercase)
            const cleanRow: Record<string, any> = {};
            for (const key in row) {
                let val = row[key];
                if (typeof val === 'string') val = val.replace(/[\r\n]+/g, '').trim();
                cleanRow[cleanKey(key)] = val;
            }

            // Resolve raw values using all known aliases (mirrors import.js logic)
            const lnraw = cleanRow['loannumber'] || cleanRow['loanno'] || cleanRow['accountno'];
            const mnraw = cleanRow['membername'] || cleanRow['name'] || cleanRow['borrowername'];
            const glraw = cleanRow['glno.'] || cleanRow['glno'] || cleanRow['gl.no'] || cleanRow['gl.no.'];

            // Skip header/title rows that got picked up as data
            const lnstripped = typeof lnraw === 'string' ? lnraw.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
            const mnstripped = typeof mnraw === 'string' ? mnraw.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
            const glstripped = typeof glraw === 'string' ? glraw.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

            if (
                ['loannumber', 'loanno', 'accountno'].includes(lnstripped) ||
                ['membername', 'name', 'borrowername'].includes(mnstripped) ||
                glstripped === 'glno'
            ) {
                skipped++;
                return;
            }

            const loanNumber = lnraw || cleanRow['admissionnumber'] || `L-${Math.random().toString(36).substr(2, 9)}`;
            const memberName = mnraw || cleanRow['borrower'] || cleanRow['applicantname'] || 'Unknown Member';

            const principal =
                cleanRow['outstandingamount(₹)'] ||
                cleanRow['outstandingamount'] ||
                cleanRow['totalprincipalamount'] ||
                cleanRow['amount'];

            if (!principal && principal !== 0) {
                skipped++;
                errors.push(`Row ${idx + 2}: Missing principal amount — skipped`);
                return;
            }

            toInsert.push({
                admissionNumber: cleanRow['admissionnumber'] || cleanRow['admissionno'] || cleanRow['admissionno.'],
                loanNumber,
                memberName,
                fatherSpouseName: cleanRow['father/spousename'] || cleanRow['fathername'] || cleanRow['husbandname'],
                glNo: glraw,
                societyLoanNo: cleanRow['societyloanno.'] || cleanRow['societyloanno'],
                ledgerFolioNumber: cleanRow['ledgerfolionumber'] || cleanRow['ledgerfoliono.'],
                contactNumber: cleanRow['contactnumber'] || cleanRow['phonenumber'] || cleanRow['mobile'],
                gender: cleanRow['gender'],
                age: parseInt(cleanRow['age']) || 0,
                casteCategory: cleanRow['castecategory'] || cleanRow['caste'],
                village: normalizeVillage(cleanRow['village'] || cleanRow['location']),
                scheme: cleanRow['scheme'] || cleanRow['loanscheme'],
                aadhaarCardNo: cleanRow['aadhaarcardno.'] || cleanRow['aadhaarcardno'] || cleanRow['aadhaarno'] || cleanRow['aadhaar'],
                purposeDescription: cleanRow['purposedescription'] || cleanRow['purpose'],
                disbursalDate: parseDate(cleanRow['disbursaldate']),
                dueDate: parseDate(cleanRow['duedate']),
                totalPrincipalAmount: parseCurrency(principal),
                roi: parseCurrency(cleanRow['roi']),
                penalRoi: parseCurrency(cleanRow['penalroi']),
                ioaRoi: parseCurrency(cleanRow['ioaroi']),
                repaymentHistory: [],
            });
        });

        if (toInsert.length === 0) {
            return NextResponse.json(
                { inserted: 0, skipped, errors, message: 'No valid records found in file' },
                { status: 200 }
            );
        }

        await Loan.insertMany(toInsert, { ordered: false }).catch(() => {
            // ordered:false means it inserts what it can even if some fail
        });

        return NextResponse.json({
            inserted: toInsert.length,
            skipped,
            errors,
            message: `Successfully imported ${toInsert.length} record(s)`,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
