import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await connectToDatabase();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const loans = await Loan.find({
            dueDate: { $gte: startOfMonth, $lte: endOfMonth }
        }).lean();

        const totalPrincipal = loans.reduce((s, l) => s + (l.totalPrincipalAmount || 0), 0);

        return NextResponse.json({
            count: loans.length,
            totalPrincipal,
            month: now.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
            loans
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch due loans' }, { status: 500 });
    }
}
