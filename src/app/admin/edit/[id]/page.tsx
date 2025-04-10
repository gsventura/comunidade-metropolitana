// Arquivos com extensão .tsx são renderizados como Server Components por padrão no Next.js 13+
// Não precisamos da marcação 'use client' neste componente principal

import { EditarAnuncioClient } from './client';

// Este é o Server Component que recebe os params
export default async function EditarAnuncioPage({
  params,
}: {
  params: { id: string };
}) {
  // Extrair o ID do parâmetro
  const anuncioId = params.id;
  
  // Renderizar o Client Component, passando o ID como prop
  return <EditarAnuncioClient id={anuncioId} />;
} 