import { createClient } from '@/lib/supabase/server'; // Usar cliente do servidor
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation'; // Para redirecionar se anúncio não encontrado
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, MapPin, ArrowLeft } from 'lucide-react'; // Ícones
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';


// Definir interface apenas para generateMetadata, que ainda usa a estrutura síncrona
interface AnuncioPagePropsForMetadata {
  params: { 
    id: string; 
  };
}

// Página como Server Component (async)
export default async function AnuncioPage({ 
  params 
}: { 
  params: Promise<{ id: string }>; // params agora é uma Promise
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // Extrair o ID aguardando a Promise
  const resolvedParams = await params; 
  const id = resolvedParams.id;

  // Buscar o anúncio específico pelo ID junto com a categoria relacionada
  const { data: anuncio, error } = await supabase
    .from('anuncios')
    .select(`
      *,
      categorias:categoria_id(nome_categoria)
    `)
    .eq('id', id)
    .eq('status', 'Aprovado')
    .single();

  // Log mais detalhado para debug
  if (error) {
    console.error(`Erro ao buscar anúncio ${id}:`, JSON.stringify(error));
    notFound();
  }
  
  if (!anuncio) {
    console.error(`Anúncio ${id} não encontrado ou não aprovado`);
    notFound();
  }

  // Tratamento para o nome da categoria
  const nomeCategoria = anuncio.categorias?.nome_categoria || 'Sem Categoria';

  // Tratamento para links de redes sociais (assumindo um objeto JSON ou campos separados)
  // Exemplo se for um JSON na coluna 'redes_sociais' com chaves 'facebook', 'instagram' etc.
  let redesSociaisLinks: { key: string, url: string }[] = [];
  if (anuncio.redes_sociais && typeof anuncio.redes_sociais === 'object') {
    // Tratar os tipos corretamente
    const redesSociaisEntries = Object.entries(anuncio.redes_sociais as Record<string, string>);
    redesSociaisLinks = redesSociaisEntries
      .filter((entry) => entry[1]) // Filtrar links vazios
      .map(([key, value]) => ({ 
        key: key.charAt(0).toUpperCase() + key.slice(1), 
        url: value 
      }));
  }
  // Se os links forem colunas separadas (ex: link_facebook, link_instagram), adapte a lógica

  // Tratamento da localização (assumindo objeto com latitude, longitude, endereco)
  const endereco = 
    anuncio.localizacao && typeof anuncio.localizacao === 'object' && 'endereco' in anuncio.localizacao
      ? (anuncio.localizacao.endereco as string)
      : 'Localização não informada';
  // Poderíamos adicionar um mapa aqui usando latitude/longitude

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="flex flex-col space-y-8">
        {/* Botão Voltar */}
        <div>
          <Button variant="ghost" size="sm" asChild className="group mb-4 hover:bg-gray-100">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Voltar para Home
            </Link>
          </Button>
        </div>
        
        {/* Cabeçalho com Categoria e Título */}
        <div className="space-y-3">
          <Badge variant="secondary">{nomeCategoria}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">{anuncio.titulo}</h1>
          
          {/* Nome do Anunciante */}
          <div className="text-lg font-medium text-muted-foreground">
            Por: {anuncio.nome_anunciante || 'Sem Nome do Anunciante'}
          </div>
          
          {/* Botão WhatsApp */}
          {anuncio.numero_whatsapp && (
            <Button asChild variant="default" className="mt-2 bg-green-600 hover:bg-green-700 text-primary-foreground">
              <a href={`https://wa.me/${anuncio.numero_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faWhatsapp} className="mr-2 h-4 w-4" /> Conversar no WhatsApp
              </a>
            </Button>
          )}
        </div>
        
        {/* Seção de Imagens */}
        <div className="w-full">
          {anuncio.imagens && anuncio.imagens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anuncio.imagens.map((imgUrl: string, index: number) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={imgUrl}
                    alt={`Imagem ${index + 1} de ${anuncio.titulo}`}
                    fill
                    style={{ objectFit: "cover" }}
                    className="bg-gray-100"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
              <Image
                src="/default_ad.png"
                alt="Imagem padrão do anúncio"
                fill
                style={{ objectFit: "cover" }}
                className="bg-gray-100"
              />
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Descrição do Anúncio */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Descrição</h2>
          <p className="text-lg text-muted-foreground">
            {anuncio.descricao}
          </p>
        </div>
        
        <Separator />
        
        {/* Localização */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Localização</h2>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-5 w-5 flex-shrink-0" />
            <span>{endereco}</span>
          </div>
        </div>
        
        {/* Links Redes Sociais */}
        {redesSociaisLinks.length > 0 && (
          <>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold mb-2">Redes Sociais</h2>
              <div className="flex flex-wrap gap-2">
                {redesSociaisLinks.map(link => (
                  <Button key={link.key} variant="outline" size="sm" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="mr-2 h-4 w-4" /> {link.key}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Opcional: Gerar metadados dinâmicos para SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }>; // params agora é uma Promise aqui também
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // Extrair o ID aguardando a Promise
  const resolvedParams = await params;
  const id = resolvedParams.id; 

  // Usar a mesma consulta da função principal para consistência
  const { data: anuncio } = await supabase
    .from('anuncios')
    .select(`
      titulo, 
      descricao,
      categorias:categoria_id(nome_categoria)
    `)
    .eq('id', id)
    .eq('status', 'Aprovado')
    .single<{titulo: string, descricao: string, categorias?: {nome_categoria?: string}}>();

  if (!anuncio) {
    return {
      title: 'Anúncio não encontrado',
    }
  }

  // Obter o nome da categoria para incluir no título
  const nomeCategoria = anuncio.categorias?.nome_categoria || 'Sem Categoria';

  return {
    title: `${anuncio.titulo} | ${nomeCategoria} | Classificados IPMetropolitana`,
    description: anuncio.descricao.substring(0, 160), // Limita descrição para meta tag
    // openGraph: { // Opcional: Para previews em redes sociais
    //   title: anuncio.titulo,
    //   description: anuncio.descricao.substring(0, 160),
    //   images: anuncio.imagens?.[0] ? [{ url: anuncio.imagens[0] }] : [],
    // },
  }
} 