import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUser } from "@/data/mock-data";
import { User, CreditCard, Crown } from "lucide-react";

const creditHistory = [
  { id: 1, type: "Signup Bonus", credits: 20, date: "2025-03-15" },
  { id: 2, type: "Used - Code Tutor", credits: -5, date: "2025-03-16" },
  { id: 3, type: "Used - System Architect", credits: -8, date: "2025-04-01" },
  { id: 4, type: "Credit Pack - Starter", credits: 50, date: "2025-04-05" },
  { id: 5, type: "Used - Debug Helper", credits: -10, date: "2025-04-10" },
];

export default function Settings() {
  return (
    <AppShell>
      <div className="container max-w-3xl py-8">
        <h1 className="mb-8 font-heading text-3xl font-bold">Settings</h1>

        {/* Profile */}
        <Card className="mb-6 border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue={mockUser.name} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={mockUser.email} type="email" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="mb-6 border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5" /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div>
                <p className="font-semibold">{mockUser.plan} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {mockUser.plan === "Free" ? "20 credits on signup" : "Active subscription"}
                </p>
              </div>
              <Button variant="outline" size="sm">Upgrade</Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit History */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" /> Credit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/10 p-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="font-semibold">Current Balance: {mockUser.credits} Credits</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditHistory.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.type}</TableCell>
                    <TableCell className={h.credits > 0 ? "text-green-600" : "text-destructive"}>
                      {h.credits > 0 ? `+${h.credits}` : h.credits}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{h.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
