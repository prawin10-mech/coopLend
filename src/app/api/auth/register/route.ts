import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

// Seed default admin if none exists
async function seedDefaultAdmin() {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
        const hashed = await bcrypt.hash('Admin@123', 12);
        await User.create({
            name: 'Super Admin',
            username: 'admin',
            password: hashed,
            role: 'admin',
        });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        await seedDefaultAdmin();

        const { name, username, password, role } = await req.json();

        if (!name || !username || !password) {
            return NextResponse.json({ error: 'Name, username, and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'An account with this username already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name.trim(),
            username: username.toLowerCase().trim(),
            password: hashedPassword,
            role: role === 'admin' ? 'admin' : 'user',
        });

        return NextResponse.json(
            { message: 'Account created successfully', userId: user._id },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Ensure admin is seeded on GET too (called once on first app load)
export async function GET() {
    try {
        await connectToDatabase();
        await seedDefaultAdmin();
        return NextResponse.json({ message: 'OK' });
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
