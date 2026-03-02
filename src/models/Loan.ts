import mongoose from 'mongoose';

const RepaymentSchema = new mongoose.Schema({
    paymentDate: { type: Date, required: true },
    amountPaid: { type: Number, required: true },
    remarks: { type: String, default: '' }
}, { _id: true });

const LoanSchema = new mongoose.Schema({
    admissionNumber: { type: String },
    loanNumber: { type: String, required: true },
    memberName: { type: String, required: true },
    fatherSpouseName: { type: String },
    glNo: { type: String, index: true },
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
    annualDemands: { type: mongoose.Schema.Types.Mixed, default: {} },
    isClosed: { type: Boolean, default: false },
    repaymentHistory: [RepaymentSchema]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

LoanSchema.virtual('outstandingAmount').get(function () {
    const totalRepaid = this.repaymentHistory.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
    return this.totalPrincipalAmount - totalRepaid;
});

const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);

export default Loan;
