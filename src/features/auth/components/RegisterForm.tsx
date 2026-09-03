'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { applyApiErrorToForm } from '@/lib/api/formErrors';
import { registerSchema, type RegisterValues } from '@/lib/validation/auth';
import { useRegisterMutation } from '@/store/api/endpoints/authApi';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function RegisterForm() {
    const router = useRouter();
    const [registerUser, { isLoading }] = useRegisterMutation();

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    });

    const onSubmit = async (values: RegisterValues) => {
        try {
            const session = await registerUser({
                name: values.name,
                email: values.email,
                password: values.password,
            }).unwrap();

            toast.success('Account created');
            router.replace(session.user.emailVerifiedAt ? '/onboarding' : '/onboarding');
        } catch (error) {
            applyApiErrorToForm(error, form.setError);
        }
    };

    const rootError = form.formState.errors.root?.serverError?.message;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create your account</CardTitle>
                <CardDescription>One account works across every basa you join.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {rootError ? (
                            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {rootError}
                            </p>
                        ) : null}

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input autoComplete="name" placeholder="Enter Your Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" autoComplete="new-password" {...field} />
                                    </FormControl>
                                    <FormDescription>At least 8 characters.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm password</FormLabel>
                                    <FormControl>
                                        <Input type="password" autoComplete="new-password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" loading={isLoading}>
                            Create account
                        </Button>
                    </form>
                </Form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}
