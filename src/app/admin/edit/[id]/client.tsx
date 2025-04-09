'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { getAnuncioDetails, updateAndApproveAnuncio } from '../../actions';
import { Toaster, toast } from 'react-hot-toast';
import Link from 'next/link';

// Tipo para os dados de uma imagem
interface ImageData {
  id?: string;
  url?: string;
  file?: File;
}

// Esquema de validação com Zod
const formSchema = z.object({
  titulo: z.string().min(5, { message: "Título deve ter pelo menos 5 caracteres." }).max(100, { message: "Título não pode ter mais de 100 caracteres." }),
  nomeAnunciante: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }).max(100, { message: "Nome não pode ter mais de 100 caracteres." }),
  descricao: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres." }).max(1000, { message: "Descrição não pode ter mais de 1000 caracteres." }),
  categoriaId: z.string({ required_error: "Selecione uma categoria." }),
  numeroWhatsapp: z.string().regex(/^\d{10,11}$/, { message: "Número de WhatsApp inválido (use apenas números, DDD + número)." }),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
});

// Definir tipo para o formulário
type FormValues = z.infer<typeof formSchema>;

// Tipo para categorias
type Categoria = {
  id: number; 
  nome_categoria: string;
};

// Componente cliente que contém toda a lógica
export function EditarAnuncioClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [anuncioCarregado, setAnuncioCarregado] = useState(false);
  // Novo estado para armazenar os dados do anúncio
  const [anuncioData, setAnuncioData] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();
  const anuncioId = id;
  
  // Definição do formulário usando useForm
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      nomeAnunciante: "",
      descricao: "",
      categoriaId: "",
      numeroWhatsapp: "",
      instagram: "",
      tiktok: "",
      facebook: "",
      website: "",
    }
  });

  // Debug log para verificar se o ID está sendo recebido corretamente
  console.log('ID do anúncio no cliente:', anuncioId);

  // Buscar categorias ao montar o componente
  useEffect(() => {
    const fetchCategorias = async () => {
      const { data, error: fetchError } = await supabase
        .from('categorias')
        .select('id, nome_categoria')
        .order('nome_categoria', { ascending: true });

      if (fetchError) {
        console.error("Erro ao buscar categorias:", fetchError);
        setError("Não foi possível carregar as categorias.");
      } else {
        setCategorias(data || []);
      }
    };
    
    fetchCategorias();
  }, [supabase]);

  // Buscar dados do anúncio
  useEffect(() => {
    const fetchAnuncio = async () => {
      setFormLoading(true);
      
      try {
        const { data, error } = await getAnuncioDetails(anuncioId);
        
        if (error) {
          console.error("Erro ao buscar detalhes do anúncio:", error);
          setError(error);
          setFormLoading(false);
          return;
        }
        
        // Log detalhado para debug
        console.log("==== DADOS DO ANÚNCIO RECEBIDOS ====");
        console.log(JSON.stringify(data, null, 2));
        console.log("=====================================");
        
        if (!data) {
          setError("Não foi possível carregar os dados do anúncio.");
          setFormLoading(false);
          return;
        }
        
        // Configurar imagens existentes se houver
        if (data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0) {
          const existingImages = data.imagens.map((url: string) => ({ url }));
          setImages(existingImages);
          setImagePreviewUrls(data.imagens);
        }
        
        // Armazenar os dados para processamento no outro useEffect
        setAnuncioData(data);
        setAnuncioCarregado(true);
        setFormLoading(false);
      } catch (err) {
        console.error("Erro ao processar dados do anúncio:", err);
        setError("Ocorreu um erro ao carregar os dados do anúncio. Tente novamente.");
        setFormLoading(false);
      }
    };
    
    fetchAnuncio();
  }, [anuncioId]);

  // useEffect separado para preencher o formulário quando anuncioData é atualizado
  useEffect(() => {
    if (anuncioData) {
      console.log("Preenchendo formulário com dados:", anuncioData);
      
      // Garantir que todos os campos necessários estejam presentes
      const anuncio = {
        titulo: anuncioData.titulo || "",
        nomeAnunciante: anuncioData.nome_anunciante || "",
        descricao: anuncioData.descricao || "",
        categoriaId: anuncioData.categoria_id !== null && anuncioData.categoria_id !== undefined 
          ? String(anuncioData.categoria_id) 
          : "",
        numeroWhatsapp: anuncioData.numero_whatsapp || "",
        redesSociais: anuncioData.links_redes_sociais || {},
      };
      
      // Debug do categoriaId específico
      console.log("Tipo do categoriaId original:", typeof anuncioData.categoria_id);
      console.log("Valor do categoriaId original:", anuncioData.categoria_id);
      console.log("categoriaId convertido para string:", anuncio.categoriaId);
      console.log("Tipo do categoriaId convertido:", typeof anuncio.categoriaId);
      
      // Extrair redes sociais do anúncio
      const redesSociais = anuncio.redesSociais;
      console.log("Redes sociais encontradas:", redesSociais);
      
      // Extrair o username do Instagram (remover instagram.com/)
      const instagram = redesSociais?.instagram 
        ? redesSociais.instagram.replace('instagram.com/', '').replace('https://', '').replace('http://', '') 
        : '';

      // Extrair o username do TikTok (remover tiktok.com/)
      const tiktok = redesSociais?.tiktok
        ? redesSociais.tiktok.replace('tiktok.com/', '').replace('https://', '').replace('http://', '')
        : '';
        
      // Extrair o username do Facebook (remover facebook.com/)
      const facebook = redesSociais?.facebook
        ? redesSociais.facebook.replace('facebook.com/', '').replace('https://', '').replace('http://', '')
        : '';
        
      // Website (manter completo, mas garantir formato adequado)
      const website = anuncioData.website || (redesSociais?.website 
        ? redesSociais.website.replace('https://', '').replace('http://', '') 
        : '');
      
      console.log("Valores processados para o formulário:", {
        titulo: anuncio.titulo,
        nomeAnunciante: anuncio.nomeAnunciante,
        descricao: anuncio.descricao,
        categoriaId: anuncio.categoriaId,
        numeroWhatsapp: anuncio.numeroWhatsapp,
        instagram,
        tiktok,
        facebook,
        website
      });
      
      // Preencher campos um por um
      form.setValue('titulo', anuncio.titulo);
      form.setValue('nomeAnunciante', anuncio.nomeAnunciante);
      form.setValue('descricao', anuncio.descricao);
      form.setValue('categoriaId', anuncio.categoriaId);
      form.setValue('numeroWhatsapp', anuncio.numeroWhatsapp);
      form.setValue('instagram', instagram);
      form.setValue('tiktok', tiktok);
      form.setValue('facebook', facebook);
      form.setValue('website', website);
    }
  }, [anuncioData, form]);

  const handleCancel = () => {
    router.push('/admin/dashboard');
  };

  // Função para upload de imagens ao Supabase
  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `anuncios/${fileName}`;

    try {
      console.log("Iniciando upload da imagem:", file.name, "Tamanho:", (file.size / 1024).toFixed(2), "KB");
      
      // Upload para o Supabase
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('anuncios')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });
        
      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        throw uploadError;
      }

      // Obter URL pública da imagem
      const { data: urlData } = await supabase.storage
        .from('anuncios')
        .getPublicUrl(filePath);

      console.log("Upload concluído com sucesso:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Erro no upload da imagem:', error);
      setError(`Erro no upload: ${error.message || 'Ocorreu um erro desconhecido'}`);
      return null;
    }
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convertendo categoriaId para número
      const categoriaIdNum = parseInt(values.categoriaId, 10);
      console.log('ID da categoria convertido:', categoriaIdNum);
      
      if (isNaN(categoriaIdNum)) {
        throw new Error('Categoria inválida, selecione uma categoria válida');
      }

      // Preparar objeto de redes sociais
      const redesSociais: Record<string, string> = {};
      
      if (values.instagram) redesSociais['instagram'] = `instagram.com/${values.instagram.replace(/^@/, '')}`;
      if (values.tiktok) redesSociais['tiktok'] = `tiktok.com/${values.tiktok.replace(/^@/, '')}`;
      if (values.facebook) redesSociais['facebook'] = `facebook.com/${values.facebook}`;
      if (values.website) redesSociais['website'] = values.website.startsWith('http') ? values.website : `https://${values.website}`;

      // Upload de novas imagens, se houver
      const imagensUrls: string[] = [];
      
      // Processar imagens existentes (que já têm URL)
      images.forEach(img => {
        if (img.url) {
          imagensUrls.push(img.url);
        }
      });
      
      // Processar novas imagens (com arquivos)
      for (const img of images) {
        if (img.file) {
          const imageUrl = await uploadImageToSupabase(img.file);
          if (imageUrl) {
            imagensUrls.push(imageUrl);
          }
        }
      }

      // Log de dados que serão enviados
      console.log('Dados a serem enviados para atualização:', {
        id: anuncioId,
        titulo: values.titulo,
        nomeAnunciante: values.nomeAnunciante,
        descricao: values.descricao,
        categoriaId: categoriaIdNum,
        numeroWhatsapp: values.numeroWhatsapp,
        redesSociais: redesSociais,
        imagens: imagensUrls
      });

      // Atualizar o anúncio
      const result = await updateAndApproveAnuncio(anuncioId, {
        titulo: values.titulo,
        nomeAnunciante: values.nomeAnunciante,
        descricao: values.descricao,
        categoriaId: categoriaIdNum,
        numeroWhatsapp: values.numeroWhatsapp,
        redesSociais: Object.keys(redesSociais).length > 0 ? redesSociais : {},
        imagens: imagensUrls
      });

      console.log('Resultado da atualização:', result);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar anúncio');
      }

      setSuccess('Anúncio atualizado e aprovado com sucesso!');
      toast.success('Anúncio atualizado e aprovado com sucesso!');
      
      // Redirecionar para o dashboard após sucesso
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao atualizar anúncio:', error);
      setError(error.message || 'Ocorreu um erro ao processar o anúncio');
      toast.error(error.message || 'Ocorreu um erro ao processar o anúncio');
    } finally {
      setLoading(false);
    }
  }

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Limitar o número total de imagens (existentes + novas) a 5
    const totalImages = images.length + e.target.files.length;
    if (totalImages > 5) {
      toast.error('Máximo de 5 imagens permitidas');
      return;
    }
    
    // Processar novos arquivos
    const newImageFiles = Array.from(e.target.files);
    
    // Verificar tamanho dos arquivos (máximo 5MB)
    const invalidFiles = newImageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Algumas imagens são muito grandes (máximo 5MB)');
      return;
    }
    
    // Criar URLs temporárias para visualização
    const newImageUrls = newImageFiles.map(file => URL.createObjectURL(file));
    
    // Atualizar o estado
    setImagePreviewUrls(prev => [...prev, ...newImageUrls]);
    setImages(prev => [...prev, ...newImageFiles.map(file => ({ file }))]);
    
    // Limpar input de arquivo
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    // Remover do estado
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Remover URL de visualização se existir
    if (imagePreviewUrls[index]) {
      // Se é uma URL temporária criada por URL.createObjectURL
      if (imagePreviewUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrls[index]);
      }
      setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-12 md:p-24">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Editar Anúncio</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
            Cancelar
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Diálogo de confirmação para cancelar */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar edição?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja cancelar? Todas as alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Sim, Cancelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        
      {/* Alerta de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
        
      {/* Alerta de sucesso */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{success}</span>
        </div>
      )}
        
      {formLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Carregando dados do anúncio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Informações do Anúncio</h2>
              
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Título */}
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Anúncio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Bolos caseiros para festas" {...field} />
                      </FormControl>
                      <FormDescription>
                        Um título claro e objetivo para seu produto ou serviço.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Nome do Anunciante */}
                <FormField
                  control={form.control}
                  name="nomeAnunciante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Anunciante</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Maria Silva" {...field} />
                      </FormControl>
                      <FormDescription>
                        Seu nome ou o nome da sua empresa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Categoria */}
                <FormField
                  control={form.control}
                  name="categoriaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((categoria) => {
                            // Debug para categoria
                            console.log(`Categoria ${categoria.id}: ${categoria.nome_categoria}, toString: ${categoria.id.toString()}`);
                            return (
                              <SelectItem 
                                key={categoria.id} 
                                value={categoria.id.toString()}
                              >
                                {categoria.nome_categoria}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Escolha a categoria que melhor descreve seu produto ou serviço.
                      </FormDescription>
                      <FormMessage />
                      {/* Debug: mostrar categoriaId selecionado */}
                      <div className="text-xs text-gray-500 mt-1">
                        Valor atual: {field.value || "Nenhum"} 
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Descrição */}
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva seu produto ou serviço em detalhes..." 
                          className="h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Forneça detalhes importantes sobre o que você oferece.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Número de WhatsApp */}
                <FormField
                  control={form.control}
                  name="numeroWhatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de WhatsApp</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 11999999999" 
                          {...field} 
                          onChange={(e) => {
                            // Permitir apenas números
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Apenas números, com DDD, sem o +55 (ex: 11999999999).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Instagram */}
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: seu_perfil" 
                          {...field} 
                          onChange={(e) => {
                            // Remover o @ se o usuário digitar
                            const value = e.target.value.replace(/^@/, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Apenas seu nome de usuário, sem o @ ou URL completa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* TikTok */}
                <FormField
                  control={form.control}
                  name="tiktok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TikTok (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: seu_perfil" 
                          {...field} 
                          onChange={(e) => {
                            // Remover o @ se o usuário digitar
                            const value = e.target.value.replace(/^@/, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Apenas seu nome de usuário, sem o @ ou URL completa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Facebook */}
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: seuPerfil" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Apenas seu nome de usuário, sem URL completa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: www.seusite.com.br" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        URL completa do seu site.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Fotos */}
                <div className="space-y-3">
                  <div>
                    <FormLabel>Fotos</FormLabel>
                    <FormDescription className="mt-0">
                      Adicione até 5 fotos de seus produtos ou serviços (máximo 5MB cada).
                    </FormDescription>
                  </div>
                  
                  {/* Preview de imagens */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-4">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square relative overflow-hidden rounded-md border">
                            <Image
                              src={url}
                              alt={`Imagem ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                              aria-label="Remover imagem"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Input de imagens */}
                  {imagePreviewUrls.length < 5 && (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/20">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-bold">Clique para adicionar</span> ou arraste as imagens
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)
                          </p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          multiple
                          onChange={handleImageSelection}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !anuncioCarregado}
                    className="min-w-[150px]"
                  >
                    {loading ? 'Atualizando...' : 'Atualizar e Aprovar'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </main>
  );
} 