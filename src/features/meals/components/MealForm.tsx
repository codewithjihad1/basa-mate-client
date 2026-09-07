'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveBasa } from '@/hooks/useActiveBasa';
import { useActiveCycle } from '@/hooks/useActiveCycle';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { applyApiErrorToForm } from '@/lib/api/formErrors';
import { todayInputValue } from '@/lib/utils/date';
import { mealFormSchema, type MealFormInputValues, type MealFormValues } from '@/lib/validation/transactions';
import { useCreateMealMutation } from '@/store/api/endpoints/mealApi';
import type { BasaId, CycleId } from '@/types/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

/**
 * Daily meal entry (frontend-requirements §10.1).
 *
 * `POST /meals` takes the eater's **user id** in its `memberId` field, not the member
 * id (docs/API.md §IDs) — the "who ate" select is therefore keyed by `user.id`.
 * A plain MEMBER may only record their own meals, so the select is locked for them.
 */
export function MealForm() {
    const { basaId, members, mealTypes } = useActiveBasa();
    const { cycleId, isClosed } = useActiveCycle();
    const { canEditOthersMeals } = usePermissions();
    const { user } = useAuth();
    const [createMeal, { isLoading }] = useCreateMealMutation();

    const defaultEntries = useMemo(
        () => mealTypes.map((type) => ({ mealTypeId: type.id, quantity: '0' })),
        [mealTypes],
    );

    const form = useForm<MealFormInputValues, unknown, MealFormValues>({
        resolver: zodResolver(mealFormSchema),
        defaultValues: {
            memberId: user?.id ?? '',
            date: todayInputValue(),
            entries: defaultEntries,
        },
    });

    // Meal types arrive with the basa, which may resolve after the first render.
    useEffect(() => {
        if (defaultEntries.length > 0 && form.getValues('entries').length === 0) {
            form.setValue('entries', defaultEntries);
        }
    }, [defaultEntries, form]);

    useEffect(() => {
        if (user?.id && !form.getValues('memberId')) form.setValue('memberId', user.id);
    }, [user?.id, form]);

    // `useWatch` rather than `form.watch()`: the latter returns a fresh function each
    // render, which the React Compiler cannot memoize.
    const entries = useWatch({ control: form.control, name: 'entries' }) ?? [];
    const totalMeals = entries.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);

    const onSubmit = async (values: MealFormValues) => {
        try {
            await createMeal({
                basaId: basaId as BasaId,
                cycleId: cycleId as CycleId,
                memberId: values.memberId,
                date: values.date,
                // Zero-quantity rows are dropped: the server requires every entry to be > 0.
                entries: values.entries.filter((entry) => entry.quantity > 0),
            }).unwrap();

            toast.success('Meals saved');
            form.reset({ ...form.getValues(), entries: defaultEntries });
        } catch (error) {
            applyApiErrorToForm(error, form.setError);
        }
    };

    if (mealTypes.length === 0) {
        return (
            <EmptyState
                title="No meal types configured"
                description="Add meal types in basa settings before logging meals."
            />
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Log meals</CardTitle>
                <CardDescription>
                    {isClosed
                        ? 'This cycle is closed — meals can no longer be edited.'
                        : 'Enter how many of each meal were eaten.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="memberId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Who ate</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!canEditOthersMeals || isClosed}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a roommate" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {members.map((member) => (
                                                    <SelectItem key={member.id} value={member.userId}>
                                                        {member.user?.name ?? 'Unknown'}
                                                        {member.userId === user?.id ? ' (you)' : ''}
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
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" disabled={isClosed} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <fieldset className="space-y-3" disabled={isClosed}>
                            <legend className="text-sm font-medium">Meals</legend>
                            {mealTypes.map((mealType, index) => (
                                <FormField
                                    key={mealType.id}
                                    control={form.control}
                                    name={`entries.${index}.quantity`}
                                    render={({ field }) => {
                                        const quantity = Number(field.value) || 0;

                                        return (
                                            <FormItem className="flex-row items-center justify-between gap-4">
                                                <FormLabel className="font-normal">{mealType.name}</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        aria-label={`Decrease ${mealType.name} meals`}
                                                        disabled={quantity <= 0}
                                                        onClick={() => field.onChange(String(quantity - 1))}>
                                                        <Minus aria-hidden />
                                                    </Button>
                                                    <output
                                                        aria-live="polite"
                                                        className="w-8 text-center tabular font-medium"
                                                        aria-label={`${mealType.name} meals`}>
                                                        {quantity}
                                                    </output>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        aria-label={`Increase ${mealType.name} meals`}
                                                        disabled={quantity >= 1000}
                                                        onClick={() => field.onChange(String(quantity + 1))}>
                                                        <Plus aria-hidden />
                                                    </Button>
                                                    <FormMessage />
                                                </div>
                                            </FormItem>
                                        );
                                    }}
                                />
                            ))}
                        </fieldset>

                        {form.formState.errors.entries?.message ? (
                            <p role="alert" className="text-xs font-medium text-destructive">
                                {form.formState.errors.entries.message}
                            </p>
                        ) : null}

                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <p className="text-sm text-muted-foreground">
                                Total meals: <span className="tabular font-medium text-foreground">{totalMeals}</span>
                            </p>
                            <Button type="submit" loading={isLoading} disabled={isClosed} className="cursor-pointer">
                                Save meals
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
