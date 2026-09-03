'use client';

import { cn } from '@/lib/utils/cn';
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import {
    Controller,
    FormProvider,
    useFormContext,
    type ControllerProps,
    type FieldPath,
    type FieldValues,
} from 'react-hook-form';
import { Label } from './label';

/**
 * React Hook Form bindings that wire label/description/error to the control with
 * the right `id`, `aria-describedby` and `aria-invalid`, so accessible form errors
 * come for free rather than per-form (frontend-requirements §25, §30).
 */

export const Form = FormProvider;

interface FormFieldContextValue {
    name: string;
}
const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

interface FormItemContextValue {
    id: string;
}
const FormItemContext = React.createContext<FormItemContextValue | null>(null);

/**
 * `TTransformedValues` is threaded through so a form whose Zod schema transforms its
 * input (our string-in/number-out numeric fields) still type-checks against the
 * `Control` that `useForm<Input, unknown, Output>` produces.
 */
export function FormField<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
    TTransformedValues extends FieldValues | undefined = undefined,
>(props: ControllerProps<TFieldValues, TName, TTransformedValues>) {
    return (
        <FormFieldContext.Provider value={{ name: props.name }}>
            <Controller {...props} />
        </FormFieldContext.Provider>
    );
}

export function useFormField() {
    const fieldContext = React.useContext(FormFieldContext);
    const itemContext = React.useContext(FormItemContext);
    const { getFieldState, formState } = useFormContext();

    if (!fieldContext) throw new Error('useFormField must be used within a <FormField>');
    if (!itemContext) throw new Error('useFormField must be used within a <FormItem>');

    const fieldState = getFieldState(fieldContext.name, formState);
    const { id } = itemContext;

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-control`,
        formDescriptionId: `${id}-description`,
        formMessageId: `${id}-message`,
        ...fieldState,
    };
}

export const FormItem = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
    ({ className, ...props }, ref) => {
        const id = React.useId();
        return (
            <FormItemContext.Provider value={{ id }}>
                <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props} />
            </FormItemContext.Provider>
        );
    },
);
FormItem.displayName = 'FormItem';

export const FormLabel = React.forwardRef<
    React.ComponentRef<typeof Label>,
    React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
    const { error, formItemId } = useFormField();
    return <Label ref={ref} htmlFor={formItemId} className={cn(error && 'text-destructive', className)} {...props} />;
});
FormLabel.displayName = 'FormLabel';

export const FormControl = React.forwardRef<
    React.ComponentRef<typeof Slot>,
    React.ComponentPropsWithoutRef<typeof Slot>
>((props, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
    return (
        <Slot
            ref={ref}
            id={formItemId}
            aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
            aria-invalid={!!error}
            {...props}
        />
    );
});
FormControl.displayName = 'FormControl';

export const FormDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<'p'>>(
    ({ className, ...props }, ref) => {
        const { formDescriptionId } = useFormField();
        return (
            <p ref={ref} id={formDescriptionId} className={cn('text-xs text-muted-foreground', className)} {...props} />
        );
    },
);
FormDescription.displayName = 'FormDescription';

/** Renders the field's validation error, whether it came from Zod or from the API. */
export const FormMessage = React.forwardRef<HTMLParagraphElement, React.ComponentProps<'p'>>(
    ({ className, children, ...props }, ref) => {
        const { error, formMessageId } = useFormField();
        const body = error ? String(error.message ?? '') : children;

        if (!body) return null;

        return (
            <p
                ref={ref}
                id={formMessageId}
                role="alert"
                className={cn('text-xs font-medium text-destructive', className)}
                {...props}>
                {body}
            </p>
        );
    },
);
FormMessage.displayName = 'FormMessage';
