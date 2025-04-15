'use client'; // Marcar como Client Component para usar hooks

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Importar Link
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { AnuncioCard, Anuncio } from '@/components/anuncios/AnuncioCard'; // Importar AnuncioCard e o tipo Anuncio
import { Input } from '@/components/ui/input'; // Para barra de pesquisa
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Para dropdown de categorias
import { Search, X, MapPin } from 'lucide-react'; // Ícones

// Tipo para categorias
type Categoria = {
  id: number;
  nome_categoria: string;
};

// Estendendo o tipo Anuncio para incluir localizacao_endereco
interface AnuncioEstendido extends Anuncio {
  localizacao_endereco?: string;
  numero_whatsapp?: string; // Adicionando campo para o botão do WhatsApp
}

export default function Home() {
  const [anuncios, setAnuncios] = useState<AnuncioEstendido[]>([]);
  const [anunciosFiltrados, setAnunciosFiltrados] = useState<AnuncioEstendido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroLocalizacao, setFiltroLocalizacao] = useState<string>('');
  const supabase = createClient();

  // Buscar anúncios
  useEffect(() => {
    const fetchAnuncios = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('anuncios')
        .select('id, titulo, descricao, imagens, categoria_id, categorias ( nome_categoria ), localizacao_endereco, numero_whatsapp, nome_anunciante')
        .eq('status', 'Aprovado') // Filtrar por status 'Aprovado'
        .order('created_at', { ascending: false }); // Ordenar pelos mais recentes

      if (error) {

        setError('Não foi possível carregar os anúncios.');
      } else {

        setAnuncios(data || []);
        setAnunciosFiltrados(data || []);
      }
      setLoading(false);
    };

    fetchAnuncios();
  }, [supabase]); // Adicionar supabase como dependência

  // Buscar categorias
  useEffect(() => {
    const fetchCategorias = async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome_categoria')
        .order('nome_categoria', { ascending: true });

      if (error) {

      } else {
        setCategorias(data || []);
      }
    };

    fetchCategorias();
  }, [supabase]);

  // Aplicar filtros quando os critérios mudarem
  useEffect(() => {
    let resultado = anuncios;

    // Filtrar por categoria
    if (filtroCategoria && filtroCategoria !== "todas") {
      resultado = resultado.filter(anuncio => 
        String(anuncio.categoria_id) === filtroCategoria
      );
    }

    // Filtrar por termo de busca
    if (termoBusca.trim()) {
      const termoLower = termoBusca.toLowerCase().trim();
      resultado = resultado.filter(anuncio => 
        anuncio.titulo.toLowerCase().includes(termoLower) || 
        anuncio.descricao.toLowerCase().includes(termoLower)
      );
    }

    // Filtrar por localização
    if (filtroLocalizacao.trim()) {
      const localizacaoLower = filtroLocalizacao.toLowerCase().trim();
      resultado = resultado.filter(anuncio => 
        anuncio.localizacao_endereco?.toLowerCase().includes(localizacaoLower)
      );
    }

    setAnunciosFiltrados(resultado);
  }, [anuncios, filtroCategoria, termoBusca, filtroLocalizacao]);

  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setFiltroCategoria('todas');
    setTermoBusca('');
    setFiltroLocalizacao('');
  };

  return (
    <main className="flex min-h-screen flex-col items-center pt-2 pb-12 md:pt-4 md:pb-24">
      <header className="w-full max-w-3xl mx-auto flex flex-col items-center text-center pt-4 pb-10 bg-background">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Comunidade Metropolitana</h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-6">Bem-vindo(a)! Publique e encontre anúncios da nossa comunidade de forma simples e organizada.</p>
        <div className="flex flex-row gap-4 items-center justify-center w-full mb-2">
          <Link href="/submeter" passHref legacyBehavior>
            <a>
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white hover:scale-105 transition-all duration-300 font-semibold px-8 py-2"
              >
                Submeter Anúncio
              </Button>
            </a>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground font-semibold px-6 py-2">Como Funciona?</Button>
            </AlertDialogTrigger>
            <AlertDialogContent style={{ backgroundColor: '#18181B' }} className="text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Como funciona?</AlertDialogTitle>
                <AlertDialogDescription>
                  Siga os passos abaixo para submeter um anúncio:
                </AlertDialogDescription>
                <div className="mt-2">
                  <ol className="list-decimal list-inside text-left space-y-1">
                    <li>Clique no botão <span className="font-semibold">Submeter Anúncio</span>.</li>
                    <li>Preencha todos os campos corretamente.</li>
                    <li>O anúncio será analisado pela liderança da igreja.</li>
                    <li>Se aprovado, será publicado para todos.</li>
                  </ol>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Seção de Filtros */}
      <div className="w-full max-w-6xl mb-8 bg-card rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Barra de Pesquisa */}
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Buscar anúncios..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="pl-10 w-full h-10 bg-zinc-800 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          
          {/* Filtro por Categoria */}
          <div className="w-full md:w-1/3">
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={String(categoria.id)}>
                    {categoria.nome_categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filtro por Localização */}
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Filtrar por localização..."
              value={filtroLocalizacao}
              onChange={(e) => setFiltroLocalizacao(e.target.value)}
              className="pl-10 w-full h-10 bg-zinc-800 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          
          {/* Botão Limpar Filtros */}
          <div className="w-full md:w-1/3">
            <Button 
              variant="outline" 
              onClick={limparFiltros}
              className="flex items-center justify-center space-x-1 w-full h-10 border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white"
              disabled={!filtroCategoria && !termoBusca && !filtroLocalizacao}
            >
              <X className="h-4 w-4" />
              <span>Limpar todos os filtros</span>
            </Button>
          </div>
        </div>
      </div>

      {loading && <p>Carregando anúncios...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          <div className="w-full max-w-6xl mb-4 flex justify-between items-center">
            <h2 className="text-xl font-medium">
              {anunciosFiltrados.length === 0 
                ? "Nenhum anúncio encontrado" 
                : `${anunciosFiltrados.length} anúncio${anunciosFiltrados.length !== 1 ? 's' : ''} encontrado${anunciosFiltrados.length !== 1 ? 's' : ''}`}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            {anunciosFiltrados.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-lg text-muted-foreground">Nenhum anúncio encontrado com os filtros aplicados.</p>
                <Button onClick={limparFiltros} variant="outline" className="mt-2 text-primary hover:bg-primary hover:text-white">
                  Limpar filtros e mostrar todos
                </Button>
              </div>
            ) : (
              anunciosFiltrados.map((anuncio) => (
                <AnuncioCard key={anuncio.id} anuncio={anuncio} />
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
