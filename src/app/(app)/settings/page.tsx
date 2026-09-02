import { redirect } from "next/navigation";

/** `/settings` has no content of its own — profile is the default section. */
export default function SettingsIndexPage() {
  redirect("/settings/profile");
}
