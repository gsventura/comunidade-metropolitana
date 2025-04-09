"use client";

import { useState, useTransition } from "react";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // Não precisa mais do client aqui
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Database } from "@/lib/database.types"; // Não precisa mais aqui
import { login } from "../app/admin/login/actions"; // Usa caminho relativo

export function AuthForm() {
  // Removemos email, password, loading local. O erro pode vir da action.
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition(); // Hook para loading state
  // const supabase = createClientComponentClient<Database>(); // Não precisa mais

  // Removemos o handleSignIn client-side

  // A função que será chamada pelo formulário
  const handleSubmit = (formData: FormData) => {
    setError(null); // Limpa erros anteriores
    startTransition(async () => {
      const result = await login(formData); // Chama a server action
      if (result?.error) {
        setError(result.error); // Mostra o erro retornado pela action
      }
      // Não precisamos fazer router.push aqui, a action faz o redirect
    });
  };

  return (
    // Usamos a prop 'action' do form para chamar a Server Action diretamente
    // OU mantemos onSubmit para usar startTransition (melhor para feedback)
    <form onSubmit={(e) => {
        e.preventDefault(); // Previne o envio padrão se usarmos onSubmit
        handleSubmit(new FormData(e.currentTarget)); // Passa os dados do form
      }} className="space-y-4">
      {error && (
        <p className="rounded bg-red-100 p-3 text-center text-red-700">
          {error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email" // Adiciona o atributo name para FormData funcionar
          type="email"
          // value={email} // Controlado pelo form agora
          // onChange={(e) => setEmail(e.target.value)} // Controlado pelo form agora
          required
          placeholder="seu@email.com"
          disabled={isPending} // Desabilita durante a transição
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password" // Adiciona o atributo name para FormData funcionar
          type="password"
          // value={password} // Controlado pelo form agora
          // onChange={(e) => setPassword(e.target.value)} // Controlado pelo form agora
          required
          placeholder="********"
          disabled={isPending} // Desabilita durante a transição
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
} 