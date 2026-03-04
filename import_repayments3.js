const mongoose = require('mongoose');
const XLSX = require('./node_modules/xlsx');
const MONGODB_URI = 'mongodb+srv://craig_kelvin:craig_kelvin@cluster0.hputpgh.mongodb.net/loan_crm';

const LoanSchema = new mongoose.Schema({
    glNo: String,
    societyLoanNo: String,
    loanNumber: String,
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
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);

    console.log('Loading loans...');
    const loans = await Loan.find({ glNo: { $exists: true } });
    console.log(`Found ${loans.length} loans`);

    const loanMap = {};
    for (const l of loans) {
        const glKey = normalizeKey(l.glNo);
        // We compare against societyLoanNo first, but fallback to loanNumber if needed? The user said "society loan number". We will check societyLoanNo.
        // It's possible some loans don't have societyLoanNo but have loanNumber. We'll index both just in case, but prefer societyLoanNo
        const slKey = normalizeKey(l.societyLoanNo);
        const lnKey = normalizeKey(l.loanNumber);

        if (slKey) {
            loanMap[glKey + '|' + slKey] = l;
        }
        if (lnKey) {
            // Only add fallback if absent
            if (!loanMap[glKey + '|' + lnKey]) {
                loanMap[glKey + '|' + lnKey] = l;
            }
        }

        if (!l.annualDemands) l.annualDemands = {};
    }

    console.log('Clearing old ClosedLoans collection to prevent double imports (mixed data)...');
    await ClosedLoan.deleteMany({});

    console.log('Reading repayments.xls...');
    const wb = XLSX.readFile('repayments.xls');
    let matched = 0;
    let notFound = 0;
    const closedLoansMap = new Map();

    for (const sheetName of wb.SheetNames) {
        if (sheetName.toLowerCase() === 'sheet1') continue;

        const yearMatch = sheetName.match(/\b(20\d{2})\b/);
        if (!yearMatch) continue;
        const year = parseInt(yearMatch[1], 10);

        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });

        const dueDateKey = Object.keys(data[0] || {}).find(k => k.toLowerCase().replace(/[\s\n_]+/g, '').includes('duedate')) || '';

        for (const row of data) {
            const rawGlNo = String(row['GL NO'] || '').trim();
            const rawLoanNo = String(row['LOAN NO'] || '').trim();

            if (!rawGlNo || !rawLoanNo || rawGlNo === 'GL NO' || rawLoanNo.toUpperCase().replace(/\s/g, '') === 'TOTALDEMAND') continue;

            const glKey = normalizeKey(rawGlNo);
            const slKey = normalizeKey(rawLoanNo);
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

                // For closed loans, we clean up the loan no representation explicitly
                const cleanedGlNo = rawGlNo;
                const cleanedLoanNo = rawLoanNo.replace(/[\s\-]+/g, '').toUpperCase();

                // deduplicate closed loans using a Set/Map so we don't insert double info
                const closedKey = `${cleanedGlNo}|${cleanedLoanNo}|${year}`;
                if (!closedLoansMap.has(closedKey)) {
                    closedLoansMap.set(closedKey, {
                        glNo: cleanedGlNo,
                        loanNo: cleanedLoanNo,
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

    const closedLoansToInsert = Array.from(closedLoansMap.values());
    console.log(`Matched ${matched} demands across valid loans. Unique Unmatched demands to Closed Loans: ${closedLoansToInsert.length} (out of ${notFound} total unmatched rows)`);

    if (closedLoansToInsert.length > 0) {
        console.log(`Inserting ${closedLoansToInsert.length} distinct closed loans safely...`);
        // using ordered:false to ignore any random duplications if they occur
        await ClosedLoan.insertMany(closedLoansToInsert, { ordered: false });
    }

    let updatedCount = 0;
    const bulkOps = [];

    for (const loanDoc of Object.values(loanMap)) {
        if (loanDoc.isModified && (loanDoc.isModified('annualDemands') || loanDoc.isModified('contactNumber'))) {
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
        const BATCH_SIZE = 500;
        for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
            const batch = bulkOps.slice(i, i + BATCH_SIZE);
            await Loan.collection.bulkWrite(batch, { ordered: false });
        }
    }

    console.log(`Saved ${updatedCount} actual loan updates using bulkWrite. Process complete!`);
    mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
