"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSkeleton } from "@/components/common/LoadingSkeleton";
import {
  createBasaSchema,
  type CreateBasaInputValues,
  type CreateBasaValues,
} from "@/lib/validation/basa";
import { applyApiErrorToForm } from "@/lib/api/formErrors";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { usePermissions } from "@/hooks/usePermissions";
import { useUpdateBasaMutation } from "@/store/api/endpoints/basaApi";
import { DEFAULT_CURRENCY } from "@/config/constants";
import type { BasaId } from "@/types/api";

const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR"];

/** Basa name, location, currency and cycle configuration (frontend-requirements §21). */
export function BasaSettingsForm() {
  const { basa, basaId, isLoading } = useActiveBasa();
  const { canEditSettings } = usePermissions();
  const [updateBasa, { isLoading: isSaving }] = useUpdateBasaMutation();

  const form = useForm<CreateBasaInputValues, unknown, CreateBasaValues>({
    resolver: zodResolver(createBasaSchema),
    defaultValues: { name: "", location: "", currency: DEFAULT_CURRENCY, cycleStartDay: "1" },
  });

  // The basa resolves asynchronously, so seed the form once it arrives.
  useEffect(() => {
    if (!basa) return;
    form.reset({
      name: basa.name,
      location: basa.location ?? "",
      currency: basa.currency,
      cycleStartDay: String(basa.cycleStartDay),
    });
  }, [basa, form]);

  const onSubmit = async (values: CreateBasaValues) => {
    try {
      await updateBasa({ basaId: basaId as BasaId, body: values }).unwrap();
      toast.success("Basa settings saved");
    } catch (error) {
      applyApiErrorToForm(error, form.setError);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Basa details</CardTitle>
        <CardDescription>
          Currency applies everywhere money is shown. The cycle start day is used when creating new
          billing cycles.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <FormSkeleton fields={4} />
        ) : (
          <Form {...form}>
            <fieldset disabled={!canEditSettings}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Basa name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((code) => (
                              <SelectItem key={code} value={code}>
                                {code}
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
                    name="cycleStartDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cycle starts on</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={28} inputMode="numeric" {...field} />
                        </FormControl>
                        <FormDescription>Day of the month, 1–28.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {canEditSettings ? (
                  <div className="flex justify-end border-t border-border pt-4">
                    <Button type="submit" loading={isSaving}>
                      Save changes
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Only owners and managers can change basa settings.
                  </p>
                )}
              </form>
            </fieldset>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
