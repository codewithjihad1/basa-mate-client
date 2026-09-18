"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
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
import {
  createCycleSchema,
  type CreateCycleInputValues,
  type CreateCycleValues,
} from "@/lib/validation/basa";
import { applyApiErrorToForm } from "@/lib/api/formErrors";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { todayInputValue } from "@/lib/utils/date";
import { useCreateCycleMutation } from "@/store/api/endpoints/cycleApi";
import type { BasaId } from "@/types/api";

const defaultValues = (): CreateCycleInputValues => ({ startDate: todayInputValue(), endDate: "" });

/** Controlled dialog for entering and creating a billing cycle. */
export function CreateCycleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { basaId } = useActiveBasa();
  const [createCycle, { isLoading }] = useCreateCycleMutation();
  const form = useForm<CreateCycleInputValues, unknown, CreateCycleValues>({
    resolver: zodResolver(createCycleSchema),
    defaultValues: defaultValues(),
  });

  const close = () => {
    form.reset(defaultValues());
    onOpenChange(false);
  };

  const onSubmit = async (values: CreateCycleValues) => {
    try {
      await createCycle({
        basaId: basaId as BasaId,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
      }).unwrap();
      toast.success("Billing cycle created");
      close();
    } catch (error) {
      applyApiErrorToForm(error, form.setError);
    }
  };

  const rootError = form.formState.errors.root?.serverError?.message;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a billing cycle</DialogTitle>
          <DialogDescription>
            Choose when this cycle begins. Leave the end date blank for a one-month cycle.
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
                  <FormDescription>Optional. Leave blank for one month.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Create cycle
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** Reusable trigger that includes its own create-cycle dialog. */
export function CreateCycleButton({ children, onClick, ...props }: Omit<ButtonProps, "asChild">) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(true);
        }}
      >
        <CalendarPlus aria-hidden />
        {children ?? "Create a cycle"}
      </Button>
      <CreateCycleDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
