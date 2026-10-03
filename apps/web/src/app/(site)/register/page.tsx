import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export const metadata: Metadata = {
  title: "Crear cuenta | Portal Inmobiliario",
  description: "Crea tu cuenta para guardar propiedades y revisar tus consultas.",
};

export default function RegisterPage() {
  return (
    <AuthPageLayout title="Crear cuenta" description="Guarda propiedades y sigue tus consultas en un solo lugar.">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthPageLayout>
  );
}
