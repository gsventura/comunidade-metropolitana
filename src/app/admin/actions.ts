'use server'; // Marcar todas as funções exportadas neste arquivo como Server Actions

import { createClient } from '@/lib/supabase/server'; // Importar cliente Supabase do lado do servidor
import { revalidatePath } from 'next/cache'; // Para revalidar os dados da página
import { cookies } from 'next/headers'; // Necessário para o createClient do servidor

// Função para aprovar um anúncio
export async function approveAnuncio(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies(); // Obter e AWAIT o cookie store aqui
  const supabase = createClient(cookieStore); // Passar o cookie store resolvido

  console.log(`Server Action: Aprovar anúncio ${id}`);

  // Verificar permissões (embora a rota já esteja protegida, é uma boa prática)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.app_metadata?.is_admin) {
      console.warn('Tentativa de aprovação sem permissão por usuário:', user?.id);
      return { success: false, error: 'Permissão negada.' };
  }

  const { error } = await supabase
    .from('anuncios')
    .update({ status: 'Aprovado' }) // Atualizar status para 'Aprovado'
    .eq('id', id); // Onde o id corresponde

  if (error) {
    console.error('Erro ao aprovar anúncio:', error);
    return { success: false, error: 'Erro ao aprovar o anúncio.' };
  }

  // Revalidar o path do dashboard para atualizar a lista de pendentes
  revalidatePath('/admin/dashboard');
  // Opcionalmente, revalidar a página inicial também, pois o anúncio aparecerá lá
  revalidatePath('/');

  console.log(`Anúncio ${id} aprovado com sucesso.`);
  return { success: true };
}

// Função para rejeitar um anúncio
export async function rejectAnuncio(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies(); // Obter e AWAIT o cookie store aqui
  const supabase = createClient(cookieStore); // Passar o cookie store resolvido

  console.log(`Server Action: Rejeitar anúncio ${id}`);

  const { data: { user } } = await supabase.auth.getUser();
   if (!user || !user.app_metadata?.is_admin) {
      console.warn('Tentativa de rejeição sem permissão por usuário:', user?.id);
      return { success: false, error: 'Permissão negada.' };
  }

  const { error } = await supabase
    .from('anuncios')
    .update({ status: 'Rejeitado' }) // Atualizar status para 'Rejeitado'
    .eq('id', id);

  if (error) {
    console.error('Erro ao rejeitar anúncio:', error);
    return { success: false, error: 'Erro ao rejeitar o anúncio.' };
  }

  // Revalidar apenas o path do dashboard, pois o anúncio não irá para a home
  revalidatePath('/admin/dashboard');

  console.log(`Anúncio ${id} rejeitado com sucesso.`);
  return { success: true };
}

// Função para excluir um anúncio completamente
export async function deleteAnuncio(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies(); // Obter e AWAIT o cookie store aqui
  const supabase = createClient(cookieStore); // Passar o cookie store resolvido

  console.log(`Server Action: Excluir anúncio ${id}`);

  // Verificar permissões
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.app_metadata?.is_admin) {
    console.warn('Tentativa de exclusão sem permissão por usuário:', user?.id);
    return { success: false, error: 'Permissão negada.' };
  }

  // Executar a exclusão do anúncio
  const { error } = await supabase
    .from('anuncios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir anúncio:', error);
    return { success: false, error: 'Erro ao excluir o anúncio.' };
  }

  // Revalidar o path do dashboard para atualizar a lista
  revalidatePath('/admin/dashboard');
  // Opcionalmente, revalidar a página inicial também
  revalidatePath('/');

  console.log(`Anúncio ${id} excluído com sucesso.`);
  return { success: true };
}

// Função para editar um anúncio e aprová-lo ao mesmo tempo
export async function updateAndApproveAnuncio(
  id: string, 
  data: {
    titulo: string;
    nomeAnunciante: string;
    descricao: string;
    categoriaId: number;
    numeroWhatsapp: string;
    redesSociais?: Record<string, string>;
    imagens?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  console.log(`Server Action: Atualizar e aprovar anúncio ${id}`);
  console.log('Dados recebidos:', JSON.stringify(data, null, 2));

  try {
    // Verificar permissões
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.app_metadata?.is_admin) {
      console.warn('Tentativa de edição sem permissão por usuário:', user?.id);
      return { success: false, error: 'Permissão negada.' };
    }

    // Garantir que os dados estejam no formato correto
    const dadosProcessados = {
      titulo: data.titulo,
      nome_anunciante: data.nomeAnunciante,
      descricao: data.descricao,
      categoria_id: typeof data.categoriaId === 'number' ? data.categoriaId : parseInt(String(data.categoriaId), 10),
      numero_whatsapp: data.numeroWhatsapp,
      links_redes_sociais: data.redesSociais || {},
      imagens: Array.isArray(data.imagens) ? data.imagens : [],
      status: 'Aprovado',
      updated_at: new Date().toISOString()
    };

    console.log('Dados processados para atualização:', dadosProcessados);

    // Atualizar o anúncio com os novos dados e status Aprovado
    const { error } = await supabase
      .from('anuncios')
      .update(dadosProcessados)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar anúncio:', error);
      return { success: false, error: `Erro ao atualizar o anúncio: ${error.message}` };
    }

    // Revalidar o path do dashboard e a página inicial
    revalidatePath('/admin/dashboard');
    revalidatePath('/');

    console.log(`Anúncio ${id} atualizado e aprovado com sucesso.`);
    return { success: true };
  } catch (err: unknown) {
    console.error('Erro na operação de atualização:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: `Erro interno: ${errorMessage}` };
  }
}

// Função para buscar os detalhes de um anúncio específico
export async function getAnuncioDetails(id: string): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  console.log(`Server Action: Buscar detalhes do anúncio ${id}`);

  // Verificar permissões
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.app_metadata?.is_admin) {
    console.warn('Tentativa de acesso sem permissão por usuário:', user?.id);
    return { error: 'Permissão negada.' };
  }

  // Consulta detalhada para obter todos os campos necessários
  const { data, error } = await supabase
    .from('anuncios')
    .select('*, categorias ( id, nome_categoria )')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar detalhes do anúncio:', error);
    return { error: 'Erro ao buscar detalhes do anúncio.' };
  }

  // Log detalhado dos dados recuperados
  console.log('Dados do anúncio recuperados:');
  console.log(JSON.stringify(data, null, 2));

  // Verificar a presença de campos essenciais
  if (!data) {
    return { error: 'Anúncio não encontrado ou sem dados.' };
  }

  // Garantir que todos os campos necessários existam, mesmo que vazios
  const anuncioProcessado = {
    ...data,
    titulo: data.titulo || '',
    nomeAnunciante: data.nome_anunciante || '',
    descricao: data.descricao || '',
    categoriaId: data.categoria_id || null,
    numeroWhatsapp: data.numero_whatsapp || '',
    redesSociais: data.links_redes_sociais || {},
    imagens: data.imagens || []
  };

  return { data: anuncioProcessado };
}

// Poderíamos adicionar uma ação de Edição aqui também no futuro 