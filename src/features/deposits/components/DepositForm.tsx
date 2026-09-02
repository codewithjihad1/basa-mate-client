"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  depositFormSchema,
  type DepositFormInputValues,
  type DepositFormValues,
} from "@/lib/validation/transactions";
import { PAYMENT_METHOD_LABELS } from "@/config/constants";
import { applyApiErrorToForm } from "@/lib/api/formErrors";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useActiveCycle } from "@/hooks/useActiveCycle";
import { useCreateDepositMutation } from "@/store/api/endpoints/depositApi";
import { todayInputValue } from "@/lib/utils/date";
import type { BasaId, CycleId, PaymentMethod } from "@/types/api";

/**
 * Records money paid into the basa fund (frontend-requirements §13).
 *
 * ⚠️ `POST /deposits` takes the **member id**, not the user id — the opposite of
 * `POST /meals` (docs/API.md §IDs). The roommate select is keyed by `member.id`.
 */
export function DepositForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { basaId, members } = useActiveBasa();
  const { cycleId } = useActiveCycle();
  const [createDeposit, { isLoading }] = useCreateDepositMutation();

  const form = useForm<DepositFormInputValues, unknown, DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      memberId: "",
      amount: "",
      transactionDate: todayInputValue(),
      paymentMethod: "CASH",
      reference: "",
      notes: "",
    },
  });

  const paymentMethod = useWatch({ control: form.control, name: "paymentMethod" });

  const onSubmit = async (values: DepositFormValues) => {
    try {
      await createDeposit({
        basaId: basaId as BasaId,
        cycleId: cycleId as CycleId,
        ...values,
      }).unwrap();

      toast.success("Deposit recorded");
      form.reset({ ...form.getValues(), amount: "", reference: "", notes: "" });
      onOpenChange(false);
    } catch (error) {
      applyApiErrorToForm(error, form.setError);
    }
  };

  const rootError = form.formState.errors.root?.serverError?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a deposit</DialogTitle>
          <DialogDescription>
            Money a roommate has paid into the fund for this cycle.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {rootError ? (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {rootError}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roommate</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Who deposited?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                name="transactionDate"
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
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
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

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    {isMobileWallet(paymentMethod)
                      ? "The transaction ID from the payment confirmation."
                      : "Optional — a cheque number or note to match against."}
                  </FormDescription>
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
                    <Textarea rows={2} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Record deposit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function isMobileWallet(method: PaymentMethod | undefined): boolean {
  return method === "BKASH" || method === "NAGAD";
}
