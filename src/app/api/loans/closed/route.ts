import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ClosedLoan from '@/models/ClosedLoan';

export async function GET() {
    try {
        await connectToDatabase();
        // Fetch all closed loans, sorting by year descending, then GL No
        const closedLoans = await ClosedLoan.find({}).sort({ demandYear: -1, glNo: 1 });
        return NextResponse.json(closedLoans);
    } catch (error: any) {
        console.error('Error fetching closed loans:', error);
        return NextResponse.json({ error: 'Failed to fetch closed loans' }, { status: 500 });
    }
}
