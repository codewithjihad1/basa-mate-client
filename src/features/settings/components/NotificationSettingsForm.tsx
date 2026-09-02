"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const PREFERENCES = [
  { key: "mealReminders", label: "Meal reminders", description: "A nudge if you haven't logged today's meals." },
  { key: "settlementAlerts", label: "Settlement alerts", description: "When a settlement is generated or finalized." },
  { key: "invitations", label: "Invitations", description: "When you're invited to a basa." },
  { key: "expenses", label: "Expense activity", description: "When bazaar or shared expenses are recorded." },
] as const;

/**
 * Notification preferences (frontend-requirements §21).
 *
 * The API has no endpoint for storing these, so the toggles are local to this
 * session and clearly labelled as such — better than persisting a preference the
 * backend will never act on.
 */
export function NotificationSettingsForm() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    mealReminders: true,
    settlementAlerts: true,
    invitations: true,
    expenses: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
        <CardDescription>Choose what BasaMate tells you about.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-4">
          {PREFERENCES.map((preference) => (
            <li key={preference.key} className="flex items-start gap-3">
              <Checkbox
                id={preference.key}
                checked={enabled[preference.key]}
                onCheckedChange={(checked) =>
                  setEnabled((current) => ({ ...current, [preference.key]: checked === true }))
                }
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor={preference.key} className="font-medium">
                  {preference.label}
                </Label>
                <p className="text-xs text-muted-foreground">{preference.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          These preferences aren&apos;t saved yet — the API has no endpoint for notification
          settings, so they reset when you reload.
        </p>
      </CardContent>
    </Card>
  );
}
