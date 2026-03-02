const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://craig_kelvin:craig_kelvin@cluster0.hputpgh.mongodb.net/loan_crm';
const LoanSchema = new mongoose.Schema({ societyLoanNo: String }, { strict: false });
const Loan = mongoose.model('Loan', LoanSchema);

async function run() {
    await mongoose.connect(MONGODB_URI);
    const loans = await Loan.find({ societyLoanNo: { $exists: true, $ne: null } });
    let updated = 0;
    for (const loan of loans) {
        if (typeof loan.societyLoanNo === 'string') {
            const clean = loan.societyLoanNo.replace(/[\s\-]+/g, '').toUpperCase();
            if (clean !== loan.societyLoanNo) {
                loan.societyLoanNo = clean;
                await loan.save();
                updated++;
            }
        }
    }
    console.log('Updated ' + updated + ' existing DB records.');
    process.exit(0);
}
run().catch(console.error);
