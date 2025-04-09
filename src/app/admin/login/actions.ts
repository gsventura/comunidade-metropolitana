'use server';

import { createClient } from '@/lib/supabase/server'; // Usar o client do servidor
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function login(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validação básica - considere adicionar validação mais robusta (ex: Zod)
  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Erro na Server Action login:', error);
    // Retornar uma mensagem de erro genérica para o usuário
    // Você pode querer mapear erros específicos do Supabase para mensagens melhores
    if (error.message === 'Invalid login credentials') {
       return { error: 'Email ou senha inválidos.' };
    }
    return { error: 'Ocorreu um erro durante o login. Tente novamente.' };
  }

  // Revalida o path para garantir que o estado (ex: middleware) seja reavaliado
  // Revalidar o layout raiz é uma abordagem ampla que geralmente funciona bem após o login/logout
  revalidatePath('/', 'layout');

  // Redireciona para o dashboard APÓS o login ter sido processado no servidor
  redirect('/admin/dashboard');

  // O redirect interrompe a execução, então não há retorno explícito em caso de sucesso.
} 