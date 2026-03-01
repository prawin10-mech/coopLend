import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';

export async function GET(req, { params }) {
    await connectToDatabase();
    try {
        const { id } = await params;
        const loan = await Loan.findById(id);
        if (!loan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(loan);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    await connectToDatabase();
    try {
        const { id } = await params;
        const data = await req.json();
        const loan = await Loan.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!loan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(loan);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    await connectToDatabase();
    try {
        const { id } = await params;
        const loan = await Loan.findByIdAndDelete(id);
        if (!loan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
