"use client";

import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inviteMemberSchema,
  type InviteMemberInputValues,
  type InviteMemberValues,
} from "@/lib/validation/basa";
import { ROLE_LABELS } from "@/config/constants";
import { applyApiErrorToForm } from "@/lib/api/formErrors";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { useCreateInvitationMutation } from "@/store/api/endpoints/basaApi";
import type { BasaId } from "@/types/api";

/** Sends an email invitation (frontend-requirements §18). */
export function InviteMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { basaId } = useActiveBasa();
  const [createInvitation, { isLoading }] = useCreateInvitationMutation();

  const form = useForm<InviteMemberInputValues, unknown, InviteMemberValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "MEMBER", expiresInDays: "7" },
  });

  const onSubmit = async (values: InviteMemberValues) => {
    try {
      await createInvitation({ basaId: basaId as BasaId, ...values }).unwrap();
      toast.success(`Invitation sent to ${values.email}`);
      form.reset();
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
          <DialogTitle>Invite a roommate</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a link. The invitation only works for the address you
            enter here.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="roommate@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Members log their own meals. Managers can also record expenses and deposits.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresInDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires after</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={30} inputMode="numeric" {...field} />
                  </FormControl>
                  <FormDescription>Days, between 1 and 30.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
