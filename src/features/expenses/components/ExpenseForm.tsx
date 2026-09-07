"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AllocationEditor } from "./AllocationEditor";
import {
  expenseFormSchema,
  type ExpenseFormInputValues,
  type ExpenseFormValues,
} from "@/lib/validation/transactions";
import { ALLOCATION_METHOD_LABELS } from "@/config/constants";
import { applyApiErrorToForm } from "@/lib/api/formErrors";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
} from "@/store/api/endpoints/expenseApi";
import { todayInputValue } from "@/lib/utils/date";
import type { AllocationMethod, BasaId, CycleId, Expense, ExpenseType } from "@/types/api";

const NONE = "__none__";

interface ExpenseFormProps {
  /** `GROCERY` for the bazaar screen, `SHARED` for shared bills. */
  type: ExpenseType;
  /** When present the form edits instead of creating. */
  expense?: Expense;
  redirectTo: string;
}

/**
 * Creates or edits an expense (frontend-requirements §11, §12).
 *
 * One form covers all three types because the API is one endpoint; the allocation
 * editor only appears for `SHARED`, which is the only type the server splits.
 */
export function ExpenseForm({ type, expense, redirectTo }: ExpenseFormProps) {
  const router = useRouter();
  const { basaId, members, expenseCategories } = useActiveBasa();
  const { cycleId, isClosed } = useActiveCycle();
  const { canReviewExpenses } = usePermissions();

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();

  const defaultAllocations = useMemo(
    () =>
      members.map((member) => {
        const existing = expense?.allocations?.find(
          (allocation) => allocation.memberId === member.id,
        );
        return {
          memberId: member.id,
          included: existing !== undefined,
          amount: existing?.amount ?? "",
          percentage: existing?.percentage ?? "",
        };
      }),
    [members, expense],
  );

  const form = useForm<ExpenseFormInputValues, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      type,
      amount: expense?.amount ?? "",
      date: expense ? expense.date.slice(0, 10) : todayInputValue(),
      description: expense?.description ?? "",
      categoryId: expense?.categoryId ?? NONE,
      paidByMemberId: expense?.paidByMemberId ?? NONE,
      receiptUrl: expense?.receiptUrl ?? "",
      notes: expense?.notes ?? "",
      allocationMethod: type === "SHARED" ? (expense?.allocationMethod ?? "EQUAL") : undefined,
      allocations: defaultAllocations,
    },
  });

  // Members load with the basa, which can resolve after the first render.
  useEffect(() => {
    if (defaultAllocations.length > 0 && (form.getValues("allocations") ?? []).length === 0) {
      form.setValue("allocations", defaultAllocations);
    }
  }, [defaultAllocations, form]);

  const onSubmit = async (values: ExpenseFormValues) => {
    const included = (values.allocations ?? []).filter((allocation) => allocation.included);

    const payload = {
      type: values.type,
      amount: values.amount,
      date: values.date,
      description: values.description,
      // The selects use a sentinel for "none"; the API wants the field omitted.
      categoryId: values.categoryId === NONE ? undefined : values.categoryId,
      paidByMemberId: values.paidByMemberId === NONE ? undefined : values.paidByMemberId,
      receiptUrl: values.receiptUrl,
      notes: values.notes,
      ...(values.type === "SHARED"
        ? {
            allocationMethod: values.allocationMethod,
            allocations: included.map((allocation) => ({
              memberId: allocation.memberId,
              // EQUAL ignores per-entry values, but the server requires each entry to
              // carry an `amount` or a `percentage`, so send the even share.
              ...(values.allocationMethod === "PERCENTAGE"
                ? { percentage: allocation.percentage ?? 0 }
                : {
                    amount:
                      values.allocationMethod === "EQUAL"
                        ? values.amount / included.length
                        : (allocation.amount ?? 0),
                  }),
            })),
          }
        : {}),
    };

    try {
      if (expense) {
        await updateExpense({
          basaId: basaId as BasaId,
          cycleId: cycleId as CycleId,
          expenseId: expense.id,
          body: payload,
        }).unwrap();
        toast.success("Expense updated");
      } else {
        await createExpense({
          basaId: basaId as BasaId,
          cycleId: cycleId as CycleId,
          ...payload,
        }).unwrap();
        // A manager/owner's expense is APPROVED immediately; a member's needs the
        // owner or manager to review it first (docs/API.md §Expense approval workflow).
        toast.success(
          canReviewExpenses
            ? "Expense recorded"
            : "Expense recorded — pending owner or manager approval",
        );
      }
      router.push(redirectTo);
    } catch (error) {
      applyApiErrorToForm(error, form.setError);
    }
  };

  const rootError = form.formState.errors.root?.serverError?.message;
  const allocationError = form.formState.errors.allocations?.message;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {rootError}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    className="tabular"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === "SHARED" ? "Expense name" : "Description"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={type === "SHARED" ? "Gas bill" : "Weekly bazaar"}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? NONE}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>No category</SelectItem>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paidByMemberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid by</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? NONE}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Who paid?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>Not recorded</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.user?.name ?? "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {type === "SHARED" ? (
          <>
            <FormField
              control={form.control}
              name="allocationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How to split</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={(field.value as AllocationMethod | undefined) ?? "EQUAL"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ALLOCATION_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AllocationEditor />

            {allocationError ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {allocationError}
              </p>
            ) : null}
          </>
        ) : null}

        <FormField
          control={form.control}
          name="receiptUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receipt URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://…"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Optional link to a photo of the receipt.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => router.push(redirectTo)}>
            Cancel
          </Button>
          <Button type="submit" loading={isCreating || isUpdating} disabled={isClosed}>
            {expense ? "Save changes" : "Record expense"}
          </Button>
        </div>

        {!expense && !canReviewExpenses ? (
          <p className="text-sm text-muted-foreground">
            A member or manager will review this before it counts toward the settlement.
          </p>
        ) : null}

        {isClosed ? (
          <p className="text-sm text-muted-foreground">
            This cycle is closed, so expenses can&apos;t be added or edited.
          </p>
        ) : null}
      </form>
    </Form>
  );
}
