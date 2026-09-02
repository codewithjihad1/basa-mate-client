"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormSkeleton } from "@/components/common/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils/date";

/**
 * Profile details (frontend-requirements §21).
 *
 * The API has no `PATCH /auth/me` or avatar upload, so the fields are read-only
 * rather than presenting inputs that would silently do nothing. Password changes go
 * through the existing reset-by-email flow, which is the only route the API exposes.
 */
export function ProfileForm() {
  const { user, isResolving } = useAuth();

  if (isResolving || !user) {
    return (
      <Card>
        <CardContent className="pt-5">
          <FormSkeleton fields={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Your account details, shared across every basa you belong to.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-base">{initialsOf(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">
                Joined {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" value={user.name} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={user.email} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-timezone">Timezone</Label>
              <Input id="profile-timezone" value={user.timezone} readOnly />
            </div>

            <div className="space-y-2">
              <Label id="profile-verification-label">Email verification</Label>
              <div aria-labelledby="profile-verification-label">
                {user.emailVerifiedAt ? (
                  <Badge variant="success">Verified {formatDate(user.emailVerifiedAt)}</Badge>
                ) : (
                  <Badge variant="warning">Not verified</Badge>
                )}
              </div>
            </div>
          </div>

          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Editing your profile isn&apos;t available yet — the API has no endpoint for it.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>
            We&apos;ll email you a link to set a new password. The link is valid for 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/auth/forgot-password">Send me a reset link</a>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
