import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge'; // Para exibir a categoria
import { Button } from '@/components/ui/button'; // Importar o Button

// Você pode escolher entre usar o FontAwesome ou o Lucide para o ícone:
// Opção 1: FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Tipo Anuncio atualizado para usar nome_categoria
export type Anuncio = {
  id: string;
  titulo: string;
  descricao: string;
  categoria_id: string; // Manter o ID se necessário para outras lógicas
  categorias: { 
    nome_categoria: string; // Corrigido para nome_categoria
  }[] | null; // Ajustado para array ou null
  imagens?: string[]; // Array de URLs das imagens
  // Adicione outros campos conforme necessário (ex: preco, localizacao resumida)
  status?: 'Pendente' | 'Aprovado' | 'Rejeitado'; // Adicionado para contexto futuro
  created_at?: string; // Adicionado para contexto futuro
  nome_anunciante?: string; // Campo para o nome do anunciante
  // Campos adicionados para a página de detalhes
  numero_whatsapp?: string;
  redes_sociais?: Record<string, string>; // Assumindo objeto JSON { facebook: "url", instagram: "url" }
  localizacao?: {               // Assumindo objeto JSON
      endereco?: string;
      latitude?: number;
      longitude?: number;
  };
  // Adicione outros campos do SRS/Banco de dados se necessário (ex: preco, data_publicacao)
};

interface AnuncioCardProps {
  anuncio: Anuncio;
}

export function AnuncioCard({ anuncio }: AnuncioCardProps) {
  const primeiraImagemUrl = anuncio.imagens && anuncio.imagens.length > 0 ? anuncio.imagens[0] : null;
  
  // Acessa nome_categoria com verificação extra detalhada
  console.log('Anuncio recebido:', JSON.stringify(anuncio, null, 2));
  
  // Tentar várias abordagens para pegar a categoria
  let nomeCategoria: string | null = null;
  
  // Tentativa 1: usando o padrão que esperamos
  if (anuncio.categorias && Array.isArray(anuncio.categorias) && anuncio.categorias[0] && typeof anuncio.categorias[0].nome_categoria === 'string') {
    nomeCategoria = anuncio.categorias[0].nome_categoria;
    console.log('Categoria encontrada pelo método 1:', nomeCategoria);
  } 
  // Tentativa 2: assumindo que categorias é um objeto e não um array
  else if (anuncio.categorias && typeof anuncio.categorias === 'object' && anuncio.categorias !== null && 'nome_categoria' in anuncio.categorias) {
    nomeCategoria = String(anuncio.categorias.nome_categoria);
    console.log('Categoria encontrada pelo método 2:', nomeCategoria);
  }
  // Tentativa 3: verificando se há outra estrutura
  else {
    console.log('Estrutura de categorias desconhecida:', anuncio.categorias);
    // Usar um valor padrão
    nomeCategoria = "CATEGORIA";
  }

  // Função para formatar o número do WhatsApp
  const formatarLinkWhatsApp = (numero?: string) => {
    if (!numero) return '';
    // Remove caracteres não numéricos
    return `https://wa.me/${numero.replace(/\D/g, '')}`;
  };

  // Prevenir que o clique no botão do WhatsApp navegue para a página de detalhes
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (anuncio.numero_whatsapp) {
      window.open(formatarLinkWhatsApp(anuncio.numero_whatsapp), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Link href={`/anuncio/${anuncio.id}`} passHref>
      <div className="flex flex-col h-full border rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden bg-card text-card-foreground">
        {/* Área da imagem */}
        <div className="p-3">
          <div className="relative w-full h-48 rounded-xl overflow-hidden">
            <Image
              src={primeiraImagemUrl || "/default_ad.png"}
              alt={`Imagem de ${anuncio.titulo}`}
              fill
              style={{ objectFit: "cover" }}
              className="transition-transform hover:scale-105 duration-300"
            />
            {/* Badge da categoria sobre a imagem */}
            {nomeCategoria && (
              <div className="absolute top-2 right-2 z-10">
                <Badge 
                  variant="outline" 
                  className="px-2.5 py-1 text-xs font-medium border border-white/50 bg-zinc-800/70 text-white shadow-sm"
                >
                  {nomeCategoria}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {/* Área do título e nome do anunciante */}
        <div className="px-6 pt-2">
          <h3 className="text-xl md:text-2xl font-bold line-clamp-1">{anuncio.titulo}</h3>
          {anuncio.nome_anunciante && (
            <div className="text-sm text-muted-foreground mt-1">
              Por: {anuncio.nome_anunciante}
            </div>
          )}
        </div>
        
        {/* Área da descrição */}
        <div className="px-6 py-4 flex-grow">
          <p className="text-muted-foreground text-sm line-clamp-2">
            {anuncio.descricao}
          </p>
        </div>
        
        {/* Área do botão */}
        <div className="px-6 pb-4 flex items-center">
          {anuncio.numero_whatsapp && (
            <Button 
              onClick={handleWhatsAppClick}
              variant="default" 
              className="w-full bg-green-600 hover:bg-green-700 text-white flex gap-2 items-center justify-center"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
              Contato WhatsApp
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
} 