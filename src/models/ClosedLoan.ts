import mongoose from 'mongoose';

const ClosedLoanSchema = new mongoose.Schema({
    glNo: { type: String, required: true, index: true },
    loanNo: { type: String, required: true },
    memberName: { type: String },
    demandYear: { type: Number, required: true, index: true },
    dueDate: { type: String },
    grandTotal: { type: Number, required: true },
    contactNumber: { type: String },
    rawData: { type: mongoose.Schema.Types.Mixed, default: {} } // Store full row for debugging
}, {
    timestamps: true
});

// Compound index for query performance on the frontend
ClosedLoanSchema.index({ glNo: 1, loanNo: 1, demandYear: 1 });

const ClosedLoan = mongoose.models.ClosedLoan || mongoose.model('ClosedLoan', ClosedLoanSchema);

export default ClosedLoan;
