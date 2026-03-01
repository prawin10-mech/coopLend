const xlsx = require('xlsx');
const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = "mongodb+srv://craig_kelvin:craig_kelvin@cluster0.hputpgh.mongodb.net/loan_crm"; // Hardcoded for import script simplicity, matching the provided URI

const LoanSchema = new mongoose.Schema({
    admissionNumber: { type: String },
    loanNumber: { type: String, required: true },
    memberName: { type: String, required: true },
    fatherSpouseName: { type: String },
    glNo: { type: String },
    societyLoanNo: { type: String },
    ledgerFolioNumber: { type: String },
    contactNumber: { type: String },
    gender: { type: String },
    age: { type: Number },
    casteCategory: { type: String },
    village: { type: String },
    scheme: { type: String },
    aadhaarCardNo: { type: String },
    purposeDescription: { type: String },
    disbursalDate: { type: Date },
    dueDate: { type: Date },
    totalPrincipalAmount: { type: Number, required: true },
    roi: { type: Number },
    penalRoi: { type: Number },
    ioaRoi: { type: Number },
    repaymentHistory: [{
        paymentDate: { type: Date },
        amountPaid: { type: Number },
        remarks: { type: String }
    }]
}, { timestamps: true });

const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);

function cleanKey(key) {
    if (typeof key !== 'string') return key;
    // Strip all newlines and spaces, and convert to lowercase for bulletproof column matching
    return key.replace(/[\r\n\s]+/g, '').toLowerCase();
}

function parseCurrency(val) {
    if (!val && val !== 0) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

function parseDate(val) {
    if (!val) return null;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;

    // Try parsing dd-mm-yyyy or dd/mm/yyyy
    const parts = val.toString().split(/[-/]/);
    if (parts.length === 3) {
        const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
}

function normalizeVillage(val) {
    if (!val || typeof val !== 'string') return val;
    // Strip all spaces, dots, hyphens; lowercase for comparison
    const stripped = val.toLowerCase().replace(/[\s.\-_]+/g, '');
    // Map known variants to canonical names
    const map = {
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
    const canonical = map[stripped];
    if (canonical) return canonical;
    // If not in map, just return trimmed original
    return val.trim();
}

async function importData() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        let dataToImport = [];

        // Attempt to read data.xlsx
        if (fs.existsSync('./data.xlsx')) {
            console.log('Reading data.xlsx...');
            const workbook = xlsx.readFile('./data.xlsx');
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet, { raw: false }); // raw:false ensures dates might be read as formatted strings

            json.forEach(row => {
                let cleanRow = {};
                for (let key in row) {
                    let val = row[key];
                    // Remove newlines from strings entirely instead of replacing with space, per user request
                    if (typeof val === 'string') {
                        val = val.replace(/[\r\n]+/g, '').trim();
                    }
                    cleanRow[cleanKey(key)] = val;
                }

                // Filter out repeated header/title rows using the new aggressively stripped keys
                const lnraw = cleanRow['loannumber'] || cleanRow['loanno'] || cleanRow['accountno'];
                const mnraw = cleanRow['membername'] || cleanRow['name'] || cleanRow['borrowername'];
                const glraw = cleanRow['glno.'] || cleanRow['glno'];

                const lnstripped = typeof lnraw === 'string' ? lnraw.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
                const mnstripped = typeof mnraw === 'string' ? mnraw.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
                const glstripped = typeof glraw === 'string' ? glraw.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

                if (
                    lnstripped === 'loannumber' || lnstripped === 'loanno' || lnstripped === 'accountno' ||
                    mnstripped === 'membername' || mnstripped === 'name' || mnstripped === 'borrowername' ||
                    glstripped === 'glno'
                ) {
                    return; // Skip this row because it's a title/header
                }

                // Map columns using bulletproof stripped keys
                const loanNumber = lnraw || cleanRow['admissionnumber'] || `L-${Math.random().toString(36).substr(2, 9)}`;
                const memberName = mnraw || cleanRow['borrower'] || cleanRow['applicantname'] || "Unknown Member";

                const principal = cleanRow['outstandingamount(₹)'] || cleanRow['outstandingamount'] || cleanRow['totalprincipalamount'] || cleanRow['amount'];

                if (!principal && principal !== 0) return; // skip rows without any amount

                dataToImport.push({
                    admissionNumber: cleanRow['admissionnumber'] || cleanRow['admissionno'] || cleanRow['admissionno.'],
                    loanNumber: loanNumber,
                    memberName: memberName,
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
                    roi: parseCurrency(cleanRow['roi']),
                    penalRoi: parseCurrency(cleanRow['penalroi']),
                    ioaRoi: parseCurrency(cleanRow['ioaroi']),
                    dueDate: parseDate(cleanRow['duedate']),
                    totalPrincipalAmount: parseCurrency(principal),
                    repaymentHistory: []
                });
            });
        } else {
            console.error('No data.xlsx found! Aborting.');
            process.exit(1);
        }

        if (dataToImport.length > 0) {
            console.log(`Ready to import ${dataToImport.length} records. Cleaning old data...`);
            await Loan.deleteMany({});

            try {
                await Loan.collection.dropIndex("loanNumber_1");
                console.log("Dropped loanNumber unique index.");
            } catch (error) {
                // Ignore if index doesn't exist
            }

            console.log('Inserting new data...');
            await Loan.insertMany(dataToImport);
            console.log('Import successful!');
        } else {
            console.log('No valid records found to import.');
        }

    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        mongoose.disconnect();
    }
}

importData();
