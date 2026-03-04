const mongoose = require('mongoose');
const XLSX = require('./node_modules/xlsx');
const MONGODB_URI = 'mongodb+srv://craig_kelvin:craig_kelvin@cluster0.hputpgh.mongodb.net/loan_crm';

const LoanSchema = new mongoose.Schema({
    glNo: String,
    societyLoanNo: String,
    annualDemands: { type: mongoose.Schema.Types.Mixed, default: {} },
    contactNumber: String
}, { strict: false });
const Loan = mongoose.model('Loan', LoanSchema);

const ClosedLoanSchema = new mongoose.Schema({
    glNo: { type: String, required: true },
    loanNo: { type: String, required: true },
    demandYear: { type: Number, required: true },
    dueDate: { type: String },
    grandTotal: { type: Number, required: true },
    contactNumber: { type: String },
    rawData: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
const ClosedLoan = mongoose.model('ClosedLoan', ClosedLoanSchema);

function parseCurrency(val) {
    if (!val && val !== 0) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
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

    const loanMap = {};
    for (const l of loans) {
        const glKey = normalizeKey(l.glNo);
        const slKey = normalizeKey(l.societyLoanNo);
        const key = glKey + '|' + slKey;
        loanMap[key] = l;
        if (!l.annualDemands) l.annualDemands = {};
    }

    console.log('Clearing old ClosedLoans...');
    await ClosedLoan.deleteMany({});

    console.log('Reading repayments.xls...');
    const wb = XLSX.readFile('repayments.xls');
    let matched = 0;
    let notFound = 0;
    const closedLoansToInsert = [];

    for (const sheetName of wb.SheetNames) {
        if (sheetName.toLowerCase() === 'sheet1') continue;

        const yearMatch = sheetName.match(/\b(20\d{2})\b/);
        if (!yearMatch) continue;
        const year = parseInt(yearMatch[1], 10);

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

            const dueDate = dueDateKey ? String(row[dueDateKey] || '').trim() : '';
            const grandTotal = parseCurrency(row['Grand Total\n'] || row['Grand Total'] || 0);
            const phone = String(row['PHONE NUMBER'] || '').trim();

            const loanDoc = loanMap[key];
            if (loanDoc) {
                loanDoc.annualDemands[year] = { dueDate, grandTotal };
                if (phone) loanDoc.contactNumber = phone;
                matched++;
            } else {
                notFound++;
                closedLoansToInsert.push({
                    glNo,
                    loanNo,
                    demandYear: year,
                    dueDate,
                    grandTotal,
                    contactNumber: phone,
                    rawData: row
                });
            }
        }
    }

    console.log(`Matched ${matched} demands. Unmatched: ${notFound}`);

    if (closedLoansToInsert.length > 0) {
        console.log(`Inserting ${closedLoansToInsert.length} closed loans...`);
        await ClosedLoan.insertMany(closedLoansToInsert);
    }

    let updated = 0;
    for (const l of loans) {
        l.markModified('annualDemands');
        await l.save();
        updated++;
    }

    console.log(`Saved ${updated} loan records. Process complete!`);
    process.exit(0);
}

run().catch(console.error);
