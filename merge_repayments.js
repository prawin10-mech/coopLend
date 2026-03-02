const mongoose = require('mongoose');
const XLSX = require('./node_modules/xlsx');
const MONGODB_URI = 'mongodb+srv://craig_kelvin:craig_kelvin@cluster0.hputpgh.mongodb.net/loan_crm';

const LoanSchema = new mongoose.Schema({
    glNo: String,
    societyLoanNo: String,
    annualDemands: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { strict: false });
const Loan = mongoose.model('Loan', LoanSchema);

function parseCurrency(val) {
    if (!val && val !== 0) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

function yearFromSheetName(name) {
    const m = name.match(/\b(20\d{2})\b/);
    return m ? parseInt(m[1]) : null;
}

function normalizeKey(str) {
    if (!str) return '';
    return String(str).replace(/[\s\-_.]+/g, '').toUpperCase();
}

async function run() {
    console.log('Connecting...');
    await mongoose.connect(MONGODB_URI);

    console.log('Loading loans...');
    const loans = await Loan.find({ glNo: { $exists: true }, societyLoanNo: { $exists: true } });
    console.log(`Found ${loans.length} loans`);

    // Index by glNoKey + societyLoanNoKey
    const loanMap = {};
    for (const l of loans) {
        const glKey = normalizeKey(l.glNo);
        const slKey = normalizeKey(l.societyLoanNo);
        const key = glKey + '|' + slKey;
        loanMap[key] = l;
        // Initialize annualDemands if missing
        if (!l.annualDemands) l.annualDemands = {};
    }

    console.log('Reading repayments.xls...');
    const wb = XLSX.readFile('repayments.xls');
    let matched = 0;
    let notFound = 0;

    for (const sheetName of wb.SheetNames) {
        if (sheetName.toLowerCase() === 'sheet1') continue; // skip summary sheet, process annual sheets

        const year = yearFromSheetName(sheetName);
        if (!year) continue;

        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });

        const dueDateKey = Object.keys(data[0] || {}).find(k => k.toLowerCase().replace(/[\s\n_]+/g, '').includes('duedate')) || '';

        for (const row of data) {
            const glNo = String(row['GL NO'] || '').trim();
            const loanNo = String(row['LOAN NO'] || '').trim();

            if (!glNo || !loanNo || glNo === 'GL NO' || loanNo.toUpperCase() === 'TOTAL DEMAND') continue;

            const glKey = normalizeKey(glNo);
            const slKey = normalizeKey(loanNo);
            const key = glKey + '|' + slKey;

            const loanDoc = loanMap[key];
            if (loanDoc) {
                const dueDate = dueDateKey ? String(row[dueDateKey] || '').trim() : '';
                const grandTotal = parseCurrency(row['Grand Total\n'] || row['Grand Total'] || 0);

                // Add the demand for this year
                loanDoc.annualDemands[year] = { dueDate, grandTotal };

                // Set phone if available
                if (row['PHONE NUMBER']) {
                    loanDoc.contactNumber = String(row['PHONE NUMBER']).trim();
                }
                matched++;
            } else {
                notFound++;
            }
        }
    }

    console.log(`Matched ${matched} demands to loans. Unmatched: ${notFound}`);

    let updated = 0;
    for (const l of loans) {
        l.markModified('annualDemands');
        await l.save();
        updated++;
    }

    console.log(`Saved ${updated} loan records.`);
    process.exit(0);
}

run().catch(console.error);
