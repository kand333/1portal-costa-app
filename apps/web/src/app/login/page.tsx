import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export const metadata: Metadata = {
  title: "Ingresar | Portal Inmobiliario",
  description: "Ingresa para guardar propiedades y revisar tus consultas.",
};

export default function LoginPage() {
  return (
    <AuthPageLayout title="Ingresar" description="Guarda propiedades y revisa tus consultas.">
      {/* useSearchParams (?next=) needs a Suspense boundary so the page can be prerendered. */}
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthPageLayout>
  );
}
