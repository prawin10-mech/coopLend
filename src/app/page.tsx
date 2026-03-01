import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';
import DashboardCharts from '@/components/DashboardCharts';
import DueThisMonth from '@/components/DueThisMonth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, AlertCircle, Users, TrendingUp } from 'lucide-react';

export default async function Home() {
  await connectToDatabase();
  const loans = await Loan.find({});

  const totalLoans = loans.length;
  const totalOutstanding = loans.reduce((sum: number, loan: any) => sum + (loan.outstandingAmount || 0), 0);
  const totalPrincipal = loans.reduce((sum: number, loan: any) => sum + (loan.totalPrincipalAmount || 0), 0);
  const totalMembers = new Set(loans.map(l => l.memberName)).size;

  const totalRepaid = totalPrincipal - totalOutstanding;
  const repaymentRate = totalPrincipal > 0 ? ((totalRepaid / totalPrincipal) * 100).toFixed(0) : '0';

  const serializedLoans = JSON.parse(JSON.stringify(loans));

  return (
    <div className="flex flex-col space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">CoopLend Dashboard</h2>
        <p className="text-muted-foreground mt-1">Real-time loan performance and village analytics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Loans</CardTitle>
            <Landmark className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoans}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalOutstanding.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Repayment Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repaymentRate}%</div>
          </CardContent>
        </Card>
        {/* Due This Month — interactive client component */}
        <DueThisMonth />
      </div>

      <div className="grid grid-cols-1 col-span-2">
        <DashboardCharts loans={serializedLoans} />
      </div>
    </div>
  );
}

