import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';

export async function GET() {
    await connectToDatabase();
    try {
        const loans = await Loan.find({}).sort({ dueDate: 1 });
        return NextResponse.json(loans);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    await connectToDatabase();
    try {
        const data = await req.json();
        const newLoan = await Loan.create(data);
        return NextResponse.json(newLoan, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
