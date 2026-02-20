import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BudgetAnalyticsProps {
  department: string;
}

export function BudgetAnalytics({ department }: BudgetAnalyticsProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const { data: budgetData, isLoading } = trpc.budgets.analytics.useQuery(
    { department, year, period },
    { enabled: department !== "All" }
  );

  if (isLoading) {
    return (
      <Card className="bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Budget vs Spending Analysis</CardTitle>
          <CardDescription>Loading budget data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!budgetData || budgetData.length === 0) {
    return (
      <Card className="bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget vs Spending Analysis</CardTitle>
              <CardDescription>Track spending against allocated budgets</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Budget Data</AlertTitle>
            <AlertDescription>
              No budgets have been configured for {department} department in {year}. 
              Contact admin to set up department budgets.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalAllocated = budgetData.reduce((sum, item) => sum + item.allocatedAmount, 0);
  const totalSpent = budgetData.reduce((sum, item) => sum + item.actualSpending, 0);
  const overallPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const hasOverspend = budgetData.some(item => item.isOverBudget);

  return (
    <Card className="bg-card/95 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budget vs Spending Analysis</CardTitle>
            <CardDescription>
              {department} department - {year} {period} view
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Allocated</p>
            <p className="text-2xl font-bold">
              Rp {totalAllocated.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">
              Rp {totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Overall Usage</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{overallPercentage}%</p>
              {overallPercentage > 100 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        </div>

        {/* Overspend Warning */}
        {hasOverspend && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Budget Exceeded</AlertTitle>
            <AlertDescription>
              One or more periods have exceeded their allocated budget. Review spending details below.
            </AlertDescription>
          </Alert>
        )}

        {/* Metered Bar Charts */}
        <div className="space-y-4">
          {budgetData.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.periodLabel}</span>
                  {item.isOverBudget && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      Over Budget
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className={item.isOverBudget ? "text-red-600 font-semibold" : ""}>
                    Rp {item.actualSpending.toLocaleString()}
                  </span>
                  {" / "}
                  <span>Rp {item.allocatedAmount.toLocaleString()}</span>
                  {" "}
                  <span className={`font-semibold ${item.isOverBudget ? "text-red-600" : "text-green-600"}`}>
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={Math.min(item.percentage, 100)} 
                  className={`h-6 ${item.isOverBudget ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`}
                />
                {item.percentage > 100 && (
                  <div 
                    className="absolute top-0 left-0 h-6 bg-red-200 rounded-r-full opacity-50"
                    style={{ width: `${Math.min((item.percentage - 100) / item.percentage * 100, 50)}%`, marginLeft: '100%' }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Raw Data Table */}
        <div className="mt-6 border-t pt-4">
          <p className="text-sm font-medium mb-3">Detailed Breakdown</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Period</th>
                  <th className="text-right py-2">Allocated</th>
                  <th className="text-right py-2">Spent</th>
                  <th className="text-right py-2">Remaining</th>
                  <th className="text-right py-2">Usage %</th>
                </tr>
              </thead>
              <tbody>
                {budgetData.map((item) => {
                  const remaining = item.allocatedAmount - item.actualSpending;
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.periodLabel}</td>
                      <td className="text-right">Rp {item.allocatedAmount.toLocaleString()}</td>
                      <td className={`text-right ${item.isOverBudget ? "text-red-600 font-semibold" : ""}`}>
                        Rp {item.actualSpending.toLocaleString()}
                      </td>
                      <td className={`text-right ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
                        Rp {remaining.toLocaleString()}
                      </td>
                      <td className={`text-right font-semibold ${item.isOverBudget ? "text-red-600" : "text-green-600"}`}>
                        {item.percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
