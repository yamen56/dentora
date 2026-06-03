import { redirect } from "next/navigation";

import { getCurrentUser, roleHome } from "@/lib/auth-helpers";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));
  return <LoginForm />;
}
