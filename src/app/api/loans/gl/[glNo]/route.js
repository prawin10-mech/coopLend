import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';
import ClosedLoan from '@/models/ClosedLoan';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        await connectToDatabase();
        const { glNo } = await params;
        const decodedGlNo = decodeURIComponent(glNo);

        const loans = await Loan.find({ glNo: decodedGlNo }).lean();
        const closedLoans = await ClosedLoan.find({ glNo: decodedGlNo }).lean();

        if (!loans || loans.length === 0) {
            return NextResponse.json({ error: 'No loans found for this GL number' }, { status: 404 });
        }

        // Compute totals
        const totalPrincipal = loans.reduce((sum, l) => sum + (l.totalPrincipalAmount || 0), 0);
        const totalRepaid = loans.reduce((sum, l) => {
            return sum + (l.repaymentHistory || []).reduce((s, p) => s + (p.amountPaid || 0), 0);
        }, 0);

        return NextResponse.json({
            glNo: decodedGlNo,
            loans,
            closedLoans,
            summary: {
                totalLoans: loans.length,
                totalPrincipal,
                totalRepaid,
                totalOutstanding: totalPrincipal - totalRepaid,
            }
        });
    } catch (error) {
        console.error('GL group fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch GL group' }, { status: 500 });
    }
}
