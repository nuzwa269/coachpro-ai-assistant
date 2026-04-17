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
      <div className="w-full space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold sm:text-2xl">Admin Panel</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">Manage users, payments, models, assistants, and plans.</p>
          </div>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto sm:grid sm:w-full sm:grid-cols-5">
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="models">AI Models</TabsTrigger>
              <TabsTrigger value="assistants">Assistants</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
            </TabsList>
          </div>

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
