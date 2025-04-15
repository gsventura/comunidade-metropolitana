'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Anuncio } from '@/components/anuncios/AnuncioCard'; // Apenas o tipo Anuncio
import { Button } from '@/components/ui/button';
import { approveAnuncio, rejectAnuncio, deleteAnuncio } from '../actions'; // Importar Server Actions
import { User } from '@supabase/supabase-js'; // Importar tipo User
import { Toaster, toast } from 'react-hot-toast'; // Importando react-hot-toast
import Link from 'next/link';
import { Trash2, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<'pendentes' | 'aprovados'>('pendentes');
  const supabase = createClient();

  // Função para buscar anúncios pendentes
  const fetchPendentes = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('anuncios')
      .select('*, categorias ( nome_categoria )') 
      .eq('status', 'Pendente')
      .order('created_at', { ascending: true }); 

    console.log('Supabase fetchPendentes error:', fetchError);
    console.log('Supabase fetchPendentes data:', data);

    if (fetchError) {
      console.error('Erro ao buscar anúncios pendentes:', fetchError);
      setError('Não foi possível carregar os anúncios pendentes.');
    } else {
      setAnuncios(data || []);
    }
    setLoading(false);
  };

  // Função para buscar anúncios aprovados
  const fetchAprovados = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('anuncios')
      .select('*, categorias ( nome_categoria )') 
      .eq('status', 'Aprovado')
      .order('created_at', { ascending: false }); // Mais recentes primeiro

    console.log('Supabase fetchAprovados error:', fetchError);
    console.log('Supabase fetchAprovados data:', data);

    if (fetchError) {
      console.error('Erro ao buscar anúncios aprovados:', fetchError);
      setError('Não foi possível carregar os anúncios aprovados.');
    } else {
      setAnuncios(data || []);
    }
    setLoading(false);
  };

  // Alternar entre visualização de pendentes e aprovados
  const alternarModoVisualizacao = () => {
    const novoModo = modoVisualizacao === 'pendentes' ? 'aprovados' : 'pendentes';
    setModoVisualizacao(novoModo);
    
    if (novoModo === 'pendentes') {
      fetchPendentes();
    } else {
      fetchAprovados();
    }
  };

  // Função para realizar logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Erro ao fazer logout: " + error.message);
      } else {
        toast.success("Logout realizado com sucesso!");
      }
    } catch (err) {
      console.error("Erro durante logout:", err);
      toast.error("Ocorreu um erro ao fazer logout.");
    }
  };

  useEffect(() => {
    // USAR LISTENER PARA REAGIR AO ESTADO DE AUTENTICAÇÃO
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Supabase auth event:', event);
      console.log('Supabase auth session:', session);
      setCurrentUser(session?.user ?? null); // Atualiza o estado do usuário

      if (session) {
        // Se temos uma sessão (seja no evento INITIAL_SESSION, SIGNED_IN, etc)
        setError(null); // Limpa erro de não autenticado, se houver
        
        // Buscar anúncios de acordo com o modo de visualização atual
        if (modoVisualizacao === 'pendentes') {
          fetchPendentes();
        } else {
          fetchAprovados();
        }
      } else {
        // Se não há sessão (SIGNED_OUT ou session null inicial)
        setError('Usuário não autenticado. Faça login para acessar.');
        setLoading(false);
        setAnuncios([]); // Limpa a lista de anúncios
      }
    });

    // Limpar o listener quando o componente desmontar
    return () => {
      authListener?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleApprove = async (id: string) => {
    // Marca apenas este anúncio específico como em processamento
    setPendingIds(prev => ({ ...prev, [id]: true }));
    
    const result = await approveAnuncio(id);
    
    if (!result.success) {
      setError(result.error || 'Falha ao aprovar.');
      toast.error(result.error || "Falha ao aprovar anúncio.");
    } else {
      setError(null);
      // Remove o anúncio da lista localmente sem precisar recarregar
      setAnuncios(prev => prev.filter(anuncio => anuncio.id !== id));
      toast.success("Anúncio aprovado com sucesso!");
    }
    
    // Remove o status de pendente deste anúncio específico
    setPendingIds(prev => ({ ...prev, [id]: false }));
  };

  const handleReject = async (id: string) => {
    // Marca apenas este anúncio específico como em processamento
    setPendingIds(prev => ({ ...prev, [id]: true }));
    
    const result = await rejectAnuncio(id);
    
    if (!result.success) {
      setError(result.error || 'Falha ao rejeitar.');
      toast.error(result.error || "Falha ao rejeitar anúncio.");
    } else {
      setError(null);
      // Remove o anúncio da lista localmente sem precisar recarregar
      setAnuncios(prev => prev.filter(anuncio => anuncio.id !== id));
      toast.success(modoVisualizacao === 'pendentes' ? "Anúncio rejeitado com sucesso!" : "Anúncio removido com sucesso!");
    }
    
    // Remove o status de pendente deste anúncio específico
    setPendingIds(prev => ({ ...prev, [id]: false }));
  };

  const handleDelete = async (id: string) => {
    // Marca apenas este anúncio específico como em processamento
    setPendingIds(prev => ({ ...prev, [id]: true }));
    
    const result = await deleteAnuncio(id);
    
    if (!result.success) {
      setError(result.error || 'Falha ao excluir anúncio.');
      toast.error(result.error || "Falha ao excluir anúncio.");
    } else {
      setError(null);
      // Remove o anúncio da lista localmente sem precisar recarregar
      setAnuncios(prev => prev.filter(anuncio => anuncio.id !== id));
      toast.success("Anúncio excluído com sucesso!");
    }
    
    // Remove o status de pendente deste anúncio específico
    setPendingIds(prev => ({ ...prev, [id]: false }));
  };

  return (
    <main className="flex min-h-screen flex-col p-12 md:p-24">
      {/* Componente Toaster para exibir as notificações toast */}
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Painel Administrativo - {modoVisualizacao === 'pendentes' ? 'Aprovação de Anúncios' : 'Anúncios Aprovados'}
        </h1>
        
        <div className="flex gap-2">
          {currentUser && (
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-1">
              <LogOut size={16} />
              <span>Sair</span>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/">Voltar à Página Inicial</Link>
          </Button>
          
          <Button variant="secondary" onClick={alternarModoVisualizacao}>
            {modoVisualizacao === 'pendentes' ? 'Ver Anúncios Aprovados' : 'Ver Anúncios Pendentes'}
          </Button>
        </div>
      </div>

      {/* Indicação de status de login */}
      <div className="mb-4 text-sm">
        {currentUser ? (
          <span className="text-green-600">Logado como: {currentUser.email}</span>
        ) : (
          <span className="text-red-600">Usuário não logado</span>
        )}
      </div>

      {loading && <p>Carregando anúncios {modoVisualizacao === 'pendentes' ? 'pendentes' : 'aprovados'}...</p>}
      {error && !loading && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && (
        <div className="space-y-6">
          {anuncios.length === 0 ? (
            <p>Nenhum anúncio {modoVisualizacao === 'pendentes' ? 'pendente' : 'aprovado'} no momento.</p>
          ) : (
            anuncios.map((anuncio) => {
               // Acessar nome_categoria corretamente
               let nomeCategoria: string | null = null;
               if (anuncio.categorias && Array.isArray(anuncio.categorias) && anuncio.categorias[0] && typeof anuncio.categorias[0].nome_categoria === 'string') {
                 nomeCategoria = anuncio.categorias[0].nome_categoria;
               } else if (anuncio.categorias && typeof anuncio.categorias === 'object' && anuncio.categorias !== null && 'nome_categoria' in anuncio.categorias) {
                 nomeCategoria = String(anuncio.categorias.nome_categoria);
               } else {
                 nomeCategoria = 'Sem Categoria';
               }
               // Verificar se este anúncio específico está em processamento
               const isProcessing = pendingIds[anuncio.id] || false;
               
               return (
                 <div key={anuncio.id} className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start bg-background">
                   <div className="flex-grow">
                     <h2 className="text-xl font-semibold mb-1">{anuncio.titulo}</h2>
                     <p className="text-sm text-muted-foreground mb-2">Categoria: {nomeCategoria}</p>
                     <p className="text-sm mb-3 line-clamp-3">{anuncio.descricao}</p>
                   </div>
                   <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0 pt-1">
                     {modoVisualizacao === 'pendentes' ? (
                       <>
                         <Button
                           onClick={() => handleApprove(anuncio.id)}
                           variant="default"
                           size="sm"
                           disabled={isProcessing}
                         >
                           {isProcessing ? 'Aprovando...' : 'Aprovar'}
                         </Button>
                         <Button
                           onClick={() => handleReject(anuncio.id)}
                           variant="destructive"
                           size="sm"
                           disabled={isProcessing}
                         >
                           {isProcessing ? 'Rejeitando...' : 'Rejeitar'}
                         </Button>
                       </>
                     ) : (
                       <div className="flex space-x-2">
                         <Button
                           onClick={() => handleDelete(anuncio.id)}
                           variant="ghost"
                           size="icon"
                           disabled={isProcessing}
                           title="Excluir anúncio"
                           className="h-9 w-9 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                         >
                           {isProcessing ? (
                             <span className="text-xs">...</span>
                           ) : (
                             <Trash2 className="h-5 w-5" />
                           )}
                         </Button>
                       </div>
                     )}
                     <Button 
                       variant="outline" 
                       size="sm" 
                       asChild
                       disabled={isProcessing}
                     >
                       <Link href={`/admin/edit/${anuncio.id}`}>
                         Editar
                       </Link>
                     </Button>
                   </div>
                 </div>
               );
            })
          )}
        </div>
      )}
    </main>
  );
} 