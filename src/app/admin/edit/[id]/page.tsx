// Arquivos com extensão .tsx são renderizados como Server Components por padrão no Next.js 13+
// Não precisamos da marcação 'use client' neste componente principal

import { EditarAnuncioClient } from './client';

// Esta é a tipagem correta para páginas dinâmicas no Next.js App Router
type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// Este é o Server Component que recebe os params
export default function EditarAnuncioPage({ params }: Props) {
  // Extrair o ID do parâmetro
  const anuncioId = params.id;
  
  // Renderizar o Client Component, passando o ID como prop
  return <EditarAnuncioClient id={anuncioId} />;
} 