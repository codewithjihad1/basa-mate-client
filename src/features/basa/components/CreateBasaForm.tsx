'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_CURRENCY } from '@/config/constants';
import { applyApiErrorToForm } from '@/lib/api/formErrors';
import { createBasaSchema, type CreateBasaInputValues, type CreateBasaValues } from '@/lib/validation/basa';
import { useCreateBasaMutation } from '@/store/api/endpoints/basaApi';
import { useAppDispatch } from '@/store/hooks';
import { setActiveBasa } from '@/store/slices/workspaceSlice';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'INR'];

interface CreateBasaFormProps {
    /** Where to go after creating. Onboarding lands on the dashboard. */
    redirectTo?: string;
}

/**
 * Creating a basa makes the caller its OWNER and seeds the default meal types and
 * expense categories server-side, so the app is immediately usable afterwards.
 */
export function CreateBasaForm({ redirectTo = '/dashboard' }: CreateBasaFormProps) {
    const dispatch = useAppDispatch();
    const [createBasa, { isLoading }] = useCreateBasaMutation();

    // Typed input-in / output-out: `cycleStartDay` is a string in the input and a
    // number by the time `onSubmit` sees it (see `numericField`).
    const form = useForm<CreateBasaInputValues, unknown, CreateBasaValues>({
        resolver: zodResolver(createBasaSchema),
        defaultValues: { name: '', location: '', currency: DEFAULT_CURRENCY, cycleStartDay: '1' },
    });

    const onSubmit = async (values: CreateBasaValues) => {
        try {
            const basa = await createBasa(values).unwrap();
            dispatch(setActiveBasa(basa.id));
            toast.success(`${basa.name} is ready`);
            // A fresh document navigation reliably picks up the newly persisted active
            // basa before the dashboard guard runs.
            window.location.replace(redirectTo);
        } catch (error) {
            applyApiErrorToForm(error, form.setError);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Basa name</FormLabel>
                            <FormControl>
                                <Input placeholder="Mirpur Basa" {...field} />
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
                                <Input placeholder="Mirpur 10, Dhaka" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormDescription>Optional — helps when you&apos;re in more than one basa.</FormDescription>
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
                                            <SelectValue placeholder="Currency" />
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
                                {/* Capped at 28 server-side so every month has the day. */}
                                <FormDescription>Day of the month, 1–30.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" loading={isLoading}>
                    Create basa
                </Button>
            </form>
        </Form>
    );
}
