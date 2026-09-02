"use client";

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
  createJoinRequestSchema,
  type CreateJoinRequestInputValues,
  type CreateJoinRequestValues,
} from "@/lib/validation/basa";
import { applyApiErrorToForm } from "@/lib/api/formErrors";
import { useCreateJoinRequestMutation } from "@/store/api/endpoints/joinRequestApi";

/**
 * Submits a join request using a basa's human-readable join code (docs/API_new.md
 * "Join Requests"). The owner/manager must approve before membership is granted.
 */
export function JoinRequestForm() {
  const router = useRouter();
  const [createJoinRequest, { isLoading }] = useCreateJoinRequestMutation();

  const form = useForm<CreateJoinRequestInputValues, unknown, CreateJoinRequestValues>({
    resolver: zodResolver(createJoinRequestSchema),
    defaultValues: { joinCode: "", note: "" },
  });

  const onSubmit = async (values: CreateJoinRequestValues) => {
    try {
      await createJoinRequest({ joinCode: values.joinCode, note: values.note }).unwrap();
      toast.success("Join request submitted — the owner will review it shortly");
      form.reset();
      router.replace("/join-requests");
    } catch (error) {
      applyApiErrorToForm(error, form.setError);
    }
  };

  const rootError = form.formState.errors.root?.serverError?.message;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {rootError}
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="joinCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Join code</FormLabel>
              <FormControl>
                <Input
                  placeholder="BM-A7K9"
                  aria-describedby={field.name}
                  className="uppercase"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Ask the basa owner or manager for their join code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="A quick message to the owner, e.g. 'I'm a friend of Sam'."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" loading={isLoading}>
          Request to join
        </Button>
      </form>
    </Form>
  );
}
