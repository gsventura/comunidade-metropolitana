// Arquivos com extensão .tsx são renderizados como Server Components por padrão no Next.js 13+
// Não precisamos da marcação 'use client' neste componente principal

import { EditarAnuncioClient } from './client';

// Definir o tipo Params como uma Promise conforme recomendado para Next.js 15
type Params = Promise<{ id: string }>;

// Este é o Server Component que recebe os params
export default async function EditarAnuncioPage({ params }: { params: Params }) {
  // Extrair o ID do parâmetro, aguardando a resolução da Promise
  const { id } = await params;
  
  // Renderizar o Client Component, passando o ID como prop
  return <EditarAnuncioClient id={id} />;
} 