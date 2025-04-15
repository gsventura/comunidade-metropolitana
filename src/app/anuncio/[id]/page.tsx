import { createClient } from '@/lib/supabase/server'; // Usar cliente do servidor
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation'; // Para redirecionar se anúncio não encontrado
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, MapPin, ArrowLeft } from 'lucide-react'; // Ícones
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp, faFacebookF, faInstagram, faTwitter, faLinkedinIn, faTiktok } from '@fortawesome/free-brands-svg-icons';
import ImageCarousel from './ImageCarousel';


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

  // Tratamento robusto para links de redes sociais (objeto ou string JSON) vindo de links_redes_sociais
  let redesSociaisLinks: { key: string, url: string }[] = [];
  let redesSociaisObj = anuncio.links_redes_sociais;
  if (typeof redesSociaisObj === 'string') {
    try {
      redesSociaisObj = JSON.parse(redesSociaisObj);
    } catch (e) {
      redesSociaisObj = {};
    }
  }
  if (redesSociaisObj && typeof redesSociaisObj === 'object') {
    const redesSociaisEntries = Object.entries(redesSociaisObj as Record<string, string>);
    redesSociaisLinks = redesSociaisEntries
      .filter((entry) => entry[1]) // Filtrar links vazios
      .map(([key, value]) => ({
        key: key.charAt(0).toUpperCase() + key.slice(1),
        url: value.startsWith('http') ? value : `https://${value}` // garantir protocolo
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
    <main className="w-full max-w-2xl mx-auto px-2 py-6 md:py-10">
      {/* Voltar */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="group hover:bg-zinc-100">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="text-base">Voltar</span>
          </Link>
        </Button>
      </div>
      {/* Carrossel de imagens */}
      <section className="w-full flex flex-col items-center mb-6">
        {anuncio.imagens && anuncio.imagens.length > 0 ? (
          <ImageCarousel images={anuncio.imagens} titulo={anuncio.titulo} />
        ) : (
          <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden shadow bg-zinc-100 flex items-center justify-center relative" style={{ minHeight: 180, maxHeight: 340 }}>
            <Image
              src="/default_ad.png"
              alt="Imagem padrão do anúncio"
              fill
              style={{ objectFit: "cover" }}
              className="bg-zinc-100"
            />
          </div>
        )}
      </section>
      {/* Título, categoria e anunciante */}
      <section className="flex flex-col items-center text-center mb-6 gap-2">
        <Badge variant="secondary" className="mb-1 text-xs px-3 py-1 rounded-full">{nomeCategoria}</Badge>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight break-words text-zinc-50">{anuncio.titulo}</h1>
        <span className="text-zinc-500 text-sm">Por {anuncio.nome_anunciante || 'Anunciante'}</span>
        {/* Botão WhatsApp destacado */}
        {anuncio.numero_whatsapp && (
          <a
            href={`https://wa.me/${anuncio.numero_whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full md:w-auto flex justify-center"
          >
            <Button
              type="button"
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white text-base font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5" /> Conversar no WhatsApp
            </Button>
          </a>
        )}
      </section>
      {/* Descrição */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-1 text-zinc-50">Descrição</h2>
        <p className="text-base text-zinc-200 whitespace-pre-line leading-relaxed">{anuncio.descricao}</p>
      </section>

      {/* Redes Sociais */}
      {redesSociaisLinks.length > 0 && (
        <section className="mb-4">
          <div className="flex flex-wrap justify-center gap-3">
            {redesSociaisLinks.map(link => {
              let icon;
              switch (link.key.toLowerCase()) {
                case 'facebook':
                  icon = <FontAwesomeIcon icon={faFacebookF} className="h-5 w-5 text-blue-600" />;
                  break;
                case 'instagram':
                  icon = <FontAwesomeIcon icon={faInstagram} className="h-5 w-5 text-pink-500" />;
                  break;
                case 'twitter':
                  icon = <FontAwesomeIcon icon={faTwitter} className="h-5 w-5 text-sky-400" />;
                  break;
                case 'linkedin':
                  icon = <FontAwesomeIcon icon={faLinkedinIn} className="h-5 w-5 text-blue-700" />;
                  break;
                case 'tiktok':
                  icon = <FontAwesomeIcon icon={faTiktok} className="h-5 w-5 text-black" />;
                  break;
                case 'website':
                  icon = <LinkIcon className="h-5 w-5 text-zinc-700" />;
                  break;
                default:
                  icon = <LinkIcon className="h-5 w-5 text-zinc-700" />;
              }
              return (
                <a
                  key={link.key}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 shadow-md transition-colors"
                  title={link.key}
                >
                  {icon}
                </a>
              );
            })}
          </div>
        </section>
      )}
      {/* Localização */}
      <section className="mb-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <MapPin className="h-5 w-5" />
          <span className="text-base">{endereco}</span>
        </div>
      </section>
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