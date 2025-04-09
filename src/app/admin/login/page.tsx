import { AuthForm } from "@/components/AuthForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded border p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Login Administrador
        </h1>
        <AuthForm />
      </div>
    </div>
  );
} 