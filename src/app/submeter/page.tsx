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

export default function SubmeterAnuncioPage() {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState<ImageData[]>([]);
  const router = useRouter();
  const supabase = createClient();

  // Debug: verificar configurações do Supabase
  useEffect(() => {
    console.log("Verificando conexão do Supabase...");
    console.log("URL do Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("ANON KEY definida:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Tentar acessar o storage para verificar conexão
    supabase.storage.listBuckets().then(({ data, error }) => {
      if (error) {
        console.error("Erro ao verificar Storage:", error);
      } else {
        console.log("Storage OK, buckets:", data?.map(b => b.name));
      }
    });
  }, [supabase]);

  // Buscar categorias ao montar o componente
  useEffect(() => {
    const fetchCategorias = async () => {
      setFormLoading(true);
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
      setFormLoading(false);
    };
    fetchCategorias();
  }, [supabase]);

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
    },
  });

  const handleCancel = () => {
    router.push('/');
  };

  // Função para upload de imagens ao Supabase
  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `anuncios/${fileName}`;

    try {
      console.log("Iniciando upload da imagem:", file.name, "Tamanho:", (file.size / 1024).toFixed(2), "KB");
      
      // Verificar se temos permissão para acessar o Storage
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error("Erro ao acessar o Storage:", bucketsError);
        throw new Error(`Não foi possível acessar o Storage: ${bucketsError.message}`);
      }
      
      console.log("Buckets disponíveis:", buckets?.map(b => b.name).join(", ") || "Nenhum");
      
      // Tentar upload
      let uploadResult;
      
      try {
        // Criar um FormData (método alternativo)
        const formData = new FormData();
        formData.append('file', file);
        
        // Tentar criar o bucket caso não exista
        if (!buckets?.some(b => b.name === 'anuncios')) {
          console.log("Tentando criar o bucket 'anuncios'...");
          const { error: createError } = await supabase.storage.createBucket('anuncios', {
            public: true
          });
          
          if (createError) {
            console.warn("Erro ao criar bucket:", createError);
          } else {
            console.log("Bucket criado com sucesso!");
          }
        }
        
        // Upload direto
        uploadResult = await supabase.storage
          .from('anuncios')
          .upload(filePath, file, {
            upsert: true,
            cacheControl: '3600',
          });
          
        if (uploadResult.error) {
          throw uploadResult.error;
        }
      } catch (uploadErr) {
        console.error("Erro específico no upload:", uploadErr);
        throw uploadErr;
      }

      // Obter URL pública da imagem
      const { data: urlData } = await supabase.storage
        .from('anuncios')
        .getPublicUrl(filePath);

      console.log("Upload concluído com sucesso:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error: any) {
      // Registrar informações detalhadas sobre o erro
      console.error('Erro no upload da imagem:', {
        message: error.message || 'Erro desconhecido',
        name: error.name || 'N/A',
        code: error.code || 'N/A',
        stack: error.stack || 'N/A'
      });
      
      setError(`Erro no upload: ${error.message || 'Ocorreu um erro desconhecido durante o upload da imagem'}`);
      return null;
    }
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Verificar conexão com o Supabase antes de prosseguir
      try {
        const { data: connectionTest, error: connectionError } = await supabase.from('categorias').select('count', { count: 'exact', head: true });
        
        if (connectionError) {
          throw new Error(`Erro de conexão com o banco de dados: ${connectionError.message}`);
        }
        
        console.log('Conexão com o Supabase OK.');
      } catch (connErr: any) {
        console.error('Falha na verificação de conexão:', connErr);
        throw new Error(`Não foi possível estabelecer conexão com o servidor. Por favor, tente novamente mais tarde. Detalhes: ${connErr.message}`);
      }

      // Convertendo categoriaId para número
      const categoriaIdNum = parseInt(values.categoriaId, 10);

      // Preparar objeto de redes sociais
      const redesSociais: Record<string, string> = {};
      
      if (values.instagram) redesSociais['instagram'] = `instagram.com/${values.instagram.replace(/^@/, '')}`;
      if (values.tiktok) redesSociais['tiktok'] = `tiktok.com/${values.tiktok.replace(/^@/, '')}`;
      if (values.facebook) redesSociais['facebook'] = `facebook.com/${values.facebook}`;
      if (values.website) redesSociais['website'] = values.website.startsWith('http') ? values.website : `https://${values.website}`;

      // Upload das imagens
      const imagesToUpload = images.filter(img => img.file);
      const totalImages = imagesToUpload.length;
      const uploadedImageUrls: string[] = [];

      // Para cada imagem, fazer upload e obter URL
      for (let i = 0; i < imagesToUpload.length; i++) {
        const imagem = imagesToUpload[i];
        if (imagem.file) {
          setUploadProgress(Math.round((i / totalImages) * 100));
          const imageUrl = await uploadImageToSupabase(imagem.file);
          if (imageUrl) {
            uploadedImageUrls.push(imageUrl);
          }
        }
      }

      setUploadProgress(100);

      // Inserir anúncio com imagens
      const { error: insertError } = await supabase
        .from('anuncios')
        .insert([
          {
            titulo: values.titulo,
            nome_anunciante: values.nomeAnunciante,
            descricao: values.descricao,
            categoria_id: categoriaIdNum,
            numero_whatsapp: values.numeroWhatsapp,
            links_redes_sociais: Object.keys(redesSociais).length > 0 ? redesSociais : null,
            imagens: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Anúncio submetido com sucesso! Aguardando aprovação.");
      form.reset();
      setImagePreviewUrls([]);
      setImages([]);
    } catch (err: any) {
      console.error("Erro ao submeter anúncio:", err);
      setError(err.message || "Ocorreu um erro ao submeter o anúncio. Tente novamente.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  // Função para lidar com a seleção de imagens
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Limitar a 3 imagens
    const maxImages = 3;
    const canAddCount = maxImages - images.length;
    
    if (canAddCount <= 0) {
      setError("Limite máximo de 3 imagens atingido.");
      return;
    }

    // Verificar os arquivos antes de adicionar
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    
    const validFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Arquivo "${file.name}" não é um formato de imagem válido. Use JPG, PNG ou WEBP.`);
        return;
      }
      
      if (file.size > maxSizeInBytes) {
        setError(`Arquivo "${file.name}" excede o tamanho máximo de 5MB.`);
        return;
      }
      
      if (validFiles.length < canAddCount) {
        validFiles.push(file);
      }
    });
    
    if (validFiles.length === 0) return;
    
    const selectedFiles = validFiles;
    
    // Criar URLs de preview
    const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);

    // Adicionar ao estado de imagens
    const newImages = selectedFiles.map(file => ({
      id: uuidv4(),
      file,
    }));

    setImages([...images, ...newImages]);
  };

  // Função para remover uma imagem
  const removeImage = (index: number) => {
    // Remover a preview da imagem
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
      const updatedPreviews = [...imagePreviewUrls];
      updatedPreviews.splice(index, 1);
      setImagePreviewUrls(updatedPreviews);
    }
    
    // Remover a imagem do estado
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  // Mostrar loading enquanto categorias carregam
  if (formLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
        <p>Carregando formulário...</p>
      </main>
    );
  }

  // Mostrar erro se categorias não carregarem
  if (error && categorias.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12">
        <p className="text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground">Não foi possível carregar o formulário de submissão.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">Submeter Novo Anúncio</h1>
      <div className="w-full max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Título */}
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-200">Título do Anúncio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Eletricista Profissional/Loja XYZ" className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500" {...field} />
                  </FormControl>
                  <FormDescription className="text-zinc-400">
                    Seja claro e conciso.
                  </FormDescription>
                  <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                </FormItem>
              )}
            />

            {/* Nome do Anunciante */}
            <FormField
              control={form.control}
              name="nomeAnunciante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-200">Seu Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500" {...field} />
                  </FormControl>
                  <FormDescription className="text-zinc-400">
                    Nome que aparecerá no anúncio como responsável.
                  </FormDescription>
                  <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-200">Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva seu serviço ou produto..."
                      className="resize-none border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-400">
                    Inclua informações relevantes como diferenciais, horários, etc.
                  </FormDescription>
                  <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                </FormItem>
              )}
            />

            {/* Upload de Imagens */}
            <div className="space-y-2">
              <FormLabel className="text-zinc-200">Imagens (máximo 3)</FormLabel>
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-zinc-500 transition-colors">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelection}
                  className="hidden"
                  disabled={imagePreviewUrls.length >= 3 || loading}
                />
                <label 
                  htmlFor="image-upload" 
                  className={`cursor-pointer flex flex-col items-center justify-center py-4 ${imagePreviewUrls.length >= 3 ? 'opacity-50' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="mt-2 text-sm text-zinc-400">
                    {imagePreviewUrls.length >= 3 
                      ? 'Limite máximo de imagens atingido' 
                      : 'Clique para selecionar imagens'}
                  </span>
                  <span className="mt-1 text-xs text-zinc-500">
                    Formatos aceitos: JPG, PNG, WEBP (máx 5MB cada)
                  </span>
                </label>
              </div>

              {/* Preview das imagens */}
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative border border-zinc-700 rounded-md overflow-hidden h-24">
                      <div className="relative w-full h-full">
                        <Image 
                          src={url} 
                          alt={`Imagem ${index + 1}`} 
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white hover:bg-opacity-80"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <FormDescription className="text-zinc-400">
                Adicione fotos representativas do seu anúncio para atrair mais clientes
              </FormDescription>
            </div>

            {/* Categoria */}
            <FormField
              control={form.control}
              name="categoriaId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-zinc-200">Categoria</FormLabel>
                  <div className="relative">
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <div className="flex items-center gap-1 overflow-hidden">
                            {field.value ? (
                              <SelectValue />
                            ) : (
                              <span className="text-zinc-400 font-normal truncate">
                                Selecione uma categoria
                              </span>
                            )}
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700 shadow-lg rounded-md">
                        <div className="max-h-[300px] overflow-y-auto p-1">
                          {categorias.length === 0 && !formLoading ? (
                            <SelectItem value="none" disabled className="text-zinc-400 py-2 px-2">
                              Nenhuma categoria encontrada
                            </SelectItem>
                          ) : (
                            categorias.map(cat => (
                              <SelectItem 
                                key={cat.id} 
                                value={String(cat.id)}
                                className="cursor-pointer text-zinc-100 py-2 px-2 mx-1 my-1 rounded-md hover:bg-zinc-700 focus:bg-zinc-700"
                              >
                                {cat.nome_categoria}
                              </SelectItem>
                            ))
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormDescription className="text-zinc-400">
                    Escolha a categoria que melhor descreve seu anúncio.
                  </FormDescription>
                  <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                </FormItem>
              )}
            />

            {/* Número WhatsApp */}
            <FormField
              control={form.control}
              name="numeroWhatsapp"
              render={({ field }) => {
                // Estado local para manter o valor formatado
                const [inputValue, setInputValue] = useState<string>('');
                
                // Função de formatação
                const formatPhoneNumber = (value: string) => {
                  const numbers = value.replace(/\D/g, '');
                  let formatted = '';
                  
                  if (numbers.length <= 2) {
                    formatted = numbers.length ? `(${numbers}` : '';
                  } else if (numbers.length <= 6) {
                    formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
                  } else if (numbers.length <= 10) {
                    formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
                  } else {
                    formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
                  }
                  
                  return formatted;
                };
                
                // Efeito para formatar o valor inicial ou quando ele mudar
                useEffect(() => {
                  if (field.value) {
                    setInputValue(formatPhoneNumber(field.value));
                  }
                }, [field.value]);
                
                return (
                  <FormItem>
                    <FormLabel className="text-zinc-200">Número de WhatsApp (com DDD)</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="Ex: (11) 99999-8888" 
                        className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                        value={inputValue}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setInputValue(formatted);
                          
                          // Passa apenas os números para o formulário
                          field.onChange(e.target.value.replace(/\D/g, ''));
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-400">
                      Seu contato principal para interessados.
                    </FormDescription>
                    <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                  </FormItem>
                );
              }}
            />

            {/* Redes Sociais */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-zinc-200">Redes Sociais (opcional)</h3>
              
              {/* Instagram */}
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200">Instagram</FormLabel>
                    <div className="flex items-center">
                      <span className="text-sm text-zinc-400 mr-1 bg-zinc-700 px-3 py-2 rounded-l-md border border-r-0 border-zinc-600">
                        instagram.com/
                      </span>
                      <FormControl>
                        <Input
                          placeholder="seu_perfil"
                          className="rounded-l-none border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                          {...field}
                          onChange={(e) => {
                            // Remove @ se o usuário digitou
                            field.onChange(e.target.value.replace(/^@/, ''));
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-zinc-400">
                      Digite apenas seu nome de usuário, sem "@"
                    </FormDescription>
                    <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                  </FormItem>
                )}
              />

              {/* TikTok */}
              <FormField
                control={form.control}
                name="tiktok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200">TikTok</FormLabel>
                    <div className="flex items-center">
                      <span className="text-sm text-zinc-400 mr-1 bg-zinc-700 px-3 py-2 rounded-l-md border border-r-0 border-zinc-600">
                        tiktok.com/
                      </span>
                      <FormControl>
                        <Input
                          placeholder="@seu_perfil"
                          className="rounded-l-none border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-zinc-400">
                      Digite seu nome de usuário com ou sem "@"
                    </FormDescription>
                    <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                  </FormItem>
                )}
              />

              {/* Facebook */}
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200">Facebook</FormLabel>
                    <div className="flex items-center">
                      <span className="text-sm text-zinc-400 mr-1 bg-zinc-700 px-3 py-2 rounded-l-md border border-r-0 border-zinc-600">
                        facebook.com/
                      </span>
                      <FormControl>
                        <Input
                          placeholder="sua_pagina"
                          className="rounded-l-none border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-zinc-400">
                      Digite o nome da sua página ou perfil
                    </FormDescription>
                    <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                  </FormItem>
                )}
              />

              {/* Website */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200">Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="www.seusite.com.br"
                        className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-400">
                      Digite o endereço completo do seu site
                    </FormDescription>
                    <FormMessage className="text-red-400 font-bold text-sm mt-1" />
                  </FormItem>
                )}
              />
            </div>

            {/* Progresso de Upload */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-zinc-700 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {/* Mensagens de Status */}
            {error && <p className="text-sm font-bold text-red-400">{error}</p>}
            {success && <p className="text-sm font-bold text-emerald-400">{success}</p>}

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md shadow-md hover:shadow-lg min-h-[52px] text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Submeter Anúncio
                  </>
                )}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="sm:flex-1 border-2 border-zinc-700 hover:border-red-400 text-zinc-200 hover:text-red-400 font-medium px-6 py-3 rounded-md min-h-[52px] text-base"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-900 border-2 border-zinc-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deseja cancelar o anúncio?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      Esta ação descartará todas as informações preenchidas neste formulário. 
                      Tem certeza que deseja voltar para a página inicial?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
                      Continuar editando
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancel}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Sim, cancelar anúncio
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
} 