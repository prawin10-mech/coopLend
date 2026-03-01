"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area,
    RadialBarChart, RadialBar
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7', '#f97316', '#3b82f6', '#ec4899', '#84cc16'];

const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}K`;
const fmtFull = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function DashboardCharts({ loans }: { loans: any[] }) {

    // 1. Top 10 villages by loan count
    const villageData = useMemo(() => {
        const map: Record<string, { village: string, loans: number, principal: number }> = {};
        loans.forEach(l => {
            const v = l.village || 'Unknown';
            if (!map[v]) map[v] = { village: v, loans: 0, principal: 0 };
            map[v].loans++;
            map[v].principal += l.totalPrincipalAmount || 0;
        });
        return Object.values(map).sort((a, b) => b.loans - a.loans).slice(0, 10);
    }, [loans]);

    // 2. Scheme breakdown (pie)
    const schemeData = useMemo(() => {
        const map: Record<string, number> = {};
        loans.forEach(l => {
            const s = l.scheme || 'Unknown';
            map[s] = (map[s] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [loans]);

    // 3. Gender split (donut-style radial)
    const genderData = useMemo(() => {
        const map: Record<string, number> = {};
        loans.forEach(l => { const g = l.gender || 'N/A'; map[g] = (map[g] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value, fill: name === 'F' ? '#ec4899' : name === 'M' ? '#3b82f6' : '#9ca3af' }));
    }, [loans]);

    // 4. Monthly disbursals area chart
    const monthlyData = useMemo(() => {
        const map: Record<string, { month: string, count: number, amount: number, ts: number }> = {};
        loans.forEach(l => {
            if (!l.disbursalDate) return;
            const d = new Date(l.disbursalDate);
            if (isNaN(d.getTime())) return;
            const key = format(d, 'MMM yy');
            if (!map[key]) map[key] = { month: key, count: 0, amount: 0, ts: d.getTime() };
            map[key].count++;
            map[key].amount += l.totalPrincipalAmount || 0;
        });
        return Object.values(map).sort((a, b) => a.ts - b.ts).slice(-18);
    }, [loans]);

    // 5. Caste category breakdown
    const casteData = useMemo(() => {
        const map: Record<string, number> = {};
        loans.forEach(l => { const c = l.casteCategory || 'Unknown'; map[c] = (map[c] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [loans]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="rounded-xl border bg-background px-3 py-2 shadow-lg text-xs">
                <p className="font-semibold text-foreground mb-1">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.dataKey} style={{ color: p.color }}>
                        {p.name}: <strong>{typeof p.value === 'number' && p.value > 999 ? fmtFull(p.value) : p.value}</strong>
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {/* 1. Top Villages by Loan Count */}
            <Card className="md:col-span-2 border shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top 10 Villages by Loan Count</CardTitle>
                    <CardDescription className="text-xs">Number of active loans per village</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={villageData} margin={{ top: 4, right: 8, left: 0, bottom: 32 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="village" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="loans" name="Loans" radius={[6, 6, 0, 0]}>
                                {villageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 2. Scheme Breakdown Pie */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Scheme Distribution</CardTitle>
                    <CardDescription className="text-xs">Loans grouped by scheme type</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={schemeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                                {schemeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: any) => [`${v} loans`, 'Count']} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 3. Monthly Disbursals Area Chart */}
            <Card className="md:col-span-2 border shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Monthly Disbursals</CardTitle>
                    <CardDescription className="text-xs">Loan amount disbursed per month</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="amount" name="Amount" stroke="#6366f1" strokeWidth={2} fill="url(#colorAmount)" dot={{ r: 3, fill: '#6366f1' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 4. Gender Split */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Gender Split</CardTitle>
                    <CardDescription className="text-xs">Borrower gender distribution</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                                label={({ name, value }) => `${name}: ${value}`} labelLine={true} fontSize={11}>
                                {genderData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip formatter={(v: any, name) => [`${v} loans`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 5. Caste Category */}
            <Card className="md:col-span-2 xl:col-span-3 border shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Caste Category Breakdown</CardTitle>
                    <CardDescription className="text-xs">Loan count by caste category</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={casteData} layout="vertical" margin={{ top: 0, right: 16, left: 32, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" tick={{ fontSize: 10 }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Loans" radius={[0, 6, 6, 0]}>
                                {casteData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
