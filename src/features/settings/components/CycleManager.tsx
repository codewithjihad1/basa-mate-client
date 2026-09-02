"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CycleStatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import {
  createCycleSchema,
  type CreateCycleInputValues,
  type CreateCycleValues,
} from "@/lib/validation/basa";
import { applyApiErrorToForm } from "@/lib/api/formErrors";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import { useCreateCycleMutation } from "@/store/api/endpoints/cycleApi";
import { formatDate, todayInputValue } from "@/lib/utils/date";
import type { BasaId } from "@/types/api";

/**
 * Creating and reviewing billing cycles (frontend-requirements §9).
 *
 * The server allows only one `ACTIVE` cycle per basa, so the create form is hidden
 * while one is open — the next cycle starts after the current one is closed.
 */
export function CycleManager() {
  const { basaId, basa } = useActiveBasa();
  const { cycles, isLoading } = useActiveCycle();
  const { canEditSettings } = usePermissions();
  const [createCycle, { isLoading: isCreating }] = useCreateCycleMutation();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CreateCycleInputValues, unknown, CreateCycleValues>({
    resolver: zodResolver(createCycleSchema),
    defaultValues: { startDate: todayInputValue(), endDate: "" },
  });

  const hasActiveCycle = cycles.some((cycle) => cycle.status === "ACTIVE");

  const onSubmit = async (values: CreateCycleValues) => {
    try {
      await createCycle({
        basaId: basaId as BasaId,
        startDate: values.startDate,
        // Omitted, the server defaults to one month minus a day after the start.
        endDate: values.endDate || undefined,
      }).unwrap();
      toast.success("Billing cycle created");
      form.reset({ startDate: todayInputValue(), endDate: "" });
      setShowForm(false);
    } catch (error) {
      applyApiErrorToForm(error, form.setError);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing cycles</CardTitle>
        <CardDescription>
          Everything — meals, expenses, deposits, settlement — belongs to a cycle.
          {basa ? ` This basa's cycles start on day ${basa.cycleStartDay}.` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {canEditSettings && !hasActiveCycle && !showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <CalendarPlus aria-hidden />
            Create a cycle
          </Button>
        ) : null}

        {canEditSettings && hasActiveCycle ? (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            There&apos;s already an active cycle. Close it from the settlement screen before starting
            the next one.
          </p>
        ) : null}

        {showForm ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 rounded-lg border border-border p-4"
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>Leave blank for one month.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isCreating}>
                  Create cycle
                </Button>
              </div>
            </form>
          </Form>
        ) : null}

        {isLoading ? (
          <TableSkeleton columns={5} rows={3} />
        ) : cycles.length === 0 ? (
          <EmptyState title="No billing cycles yet." className="border-0" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Period</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">Meals</TableHead>
                <TableHead scope="col" className="text-right">Expenses</TableHead>
                <TableHead scope="col" className="text-right">Deposits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
                  </TableCell>
                  <TableCell>
                    <CycleStatusBadge status={cycle.status} />
                  </TableCell>
                  <TableCell className="text-right tabular">{cycle._count?.meals ?? 0}</TableCell>
                  <TableCell className="text-right tabular">{cycle._count?.expenses ?? 0}</TableCell>
                  <TableCell className="text-right tabular">{cycle._count?.deposits ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
