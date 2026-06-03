import { redirect } from "next/navigation";

import { getCurrentUser, roleHome } from "@/lib/auth-helpers";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));
  return <RegisterForm />;
}
