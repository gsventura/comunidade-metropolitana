"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Database } from "@/lib/database.types"; // Reutilizando o tipo

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Redireciona para a home ou login após logout
    router.push("/");
    router.refresh(); // Garante a atualização do estado
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Sair
    </Button>
  );
} 