// Arquivos com extensão .tsx são renderizados como Server Components por padrão no Next.js 13+
// Não precisamos da marcação 'use client' neste componente principal

import { EditarAnuncioClient } from './client';

// Conforme documentação do Next.js 15, params agora é uma Promise
export default async function EditarAnuncioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Extrair o ID do parâmetro usando await
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  // Renderizar o Client Component, passando o ID como prop
  return <EditarAnuncioClient id={id} />;
} 