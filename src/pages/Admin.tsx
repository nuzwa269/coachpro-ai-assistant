import { AppShell } from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { AdminPayments } from "@/components/admin/AdminPayments";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminModels } from "@/components/admin/AdminModels";
import { AdminAssistants } from "@/components/admin/AdminAssistants";
import { AdminPlans } from "@/components/admin/AdminPlans";

export default function Admin() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users, payments, models, assistants, and plans.</p>
          </div>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="models">AI Models</TabsTrigger>
            <TabsTrigger value="assistants">Assistants</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="payments"><AdminPayments /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="models"><AdminModels /></TabsContent>
          <TabsContent value="assistants"><AdminAssistants /></TabsContent>
          <TabsContent value="plans"><AdminPlans /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
