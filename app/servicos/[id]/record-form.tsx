"use client";

import { useActionState, useState } from "react";
import { addRecord, type RecordFormState } from "./actions";
import { createClient } from "@supabase/supabase-js";

const initialState: RecordFormState = { error: null, savedAt: null };

export function RecordForm({
  serviceId,
  role,
}: {
  serviceId: string;
  role: "client" | "worker";
}) {
  const [state, formAction, pending] = useActionState(addRecord, initialState);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initialize Supabase browser client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const placeholder =
    role === "client"
      ? "Conte o que aconteceu, como ficou o serviço ou o que você observou."
      : "Registre o problema identificado, o que foi feito, materiais e observações.";

  const handleSubmit = async (formData: FormData) => {
    // Se já temos um arquivo enviado, use o caminho armazenado
    // Caso contrário, envie o arquivo atual
    let fileToUpload = file;
    let filePathToUse = uploadedFilePath;

    if (!uploadedFilePath && file) {
      fileToUpload = file;
    } else if (uploadedFilePath) {
      // Arquivo já foi enviado anteriormente, não precisamos enviar novamente
      fileToUpload = null as unknown as File; // Define como null para não tentar enviar novamente
    }

    if (fileToUpload) {
      formData.append("file", fileToUpload);
      formData.append("caption", caption);
    }
    // Se já temos um caminho de arquivo enviado, não precisamos fazer nada especial aqui
    // pois o actions.ts verificará se há um arquivo no formData
    await formAction(formData);
  };

  const handleUploadPhoto = async () => {
    if (!file) return;

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      // Validar tipo e tamanho do arquivo (mesmas regras das policies)
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setUploadError("Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.");
        setUploadStatus('error');
        return;
      }
      if (file.size === 0) {
        setUploadError("O arquivo está vazio.");
        setUploadStatus('error');
        return;
      }
      if (file.size > 10485760) { // 10 MB
        setUploadError("O arquivo é muito grande. Tamanho máximo: 10 MB.");
        setUploadStatus('error');
        return;
      }

      // Fazer upload para o Storage usando o cliente do browser
      const fileName = `${serviceId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: uploadError, data } = await supabase.storage
        .from("service-files")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Erro ao fazer upload do arquivo:", uploadError);
        setUploadError("Não foi possível enviar o arquivo. Tente de novo.");
        setUploadStatus('error');
        return;
      }

      setUploadedFilePath(fileName);
      setUploadStatus('uploaded');
    } catch (err) {
      console.error("Erro inesperado durante upload:", err);
      setUploadError("Erro inesperado. Tente de novo.");
      setUploadStatus('error');
    }
  };

  const handleRemovePhoto = () => {
    // Se o arquivo estava sendo enviado ou já enviado, tentar remover do storage
    if (uploadedFilePath && uploadStatus !== 'idle') {
      // Nota: Em um sistema de produção, talvez queiramos remover o arquivo órfão do storage
      // Por simplicidade, vamos deixar para limpeza posterior (como no actions.ts atual)
      // Implementação real chamaria supabase.storage.from('service-files').remove([uploadedFilePath])
    }

    setFile(null);
    setCaption("");
    setPreviewUrl(null);
    setUploadStatus('idle');
    setUploadedFilePath(null);
    setUploadError(null);
  };

  return (
    // A chave muda depois de salvar: o campo volta vazio.
    <form
      key={state.savedAt ?? "novo"}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget as HTMLFormElement));
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="service_id" value={serviceId} />

      <label htmlFor="content" className="text-sm font-medium">
        Novo registro
      </label>
      <textarea
        id="content"
        name="content"
        rows={4}
        required
        maxLength={5000}
        placeholder={placeholder}
        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900"
      />

      {/* Upload de foto */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
        {file ? (
          <div className="relative space-y-3">
            {/* Pré-visualização ou ícone */}
            <div className="w-24 h-24 mx-auto relative">
              {file.type.startsWith("image/") ? (
                <img
                  src={previewUrl ?? URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-24 h-24 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-image.jpg"; // Fallback
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-lg">📄</span>
                </div>
              )}
              {/* Botão de remover (X no canto superior direito) */}
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center z-10"
                aria-label="Remover foto"
              >
                ×
              </button>
            </div>

            {/* Informações do arquivo */}
            <div className="space-y-2 text-center">
              <span className="block text-xs font-medium">{file.name}</span>
              {caption && (
                <span className="block text-xs text-gray-600 italic">
                  «{caption}»
                </span>
              )}
              <span className="block text-xs text-gray-500">
                {Math.round(file.size / 1024)} KB
              </span>
            </div>

            {/* Campo de legenda */}
            <div className="space-y-2">
              <label className="block text-xs font-medium mb-1">
                Legenda da foto (opcional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder="Descreva o que está na foto (ex: Vista frontal do prédio após o serviço)"
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Mensagens de validação */}
            {file && (
              <div className="space-y-1 text-xs flex items-center gap-2">
                {/* Validar tipo */}
                {!["image/jpeg", "image/png", "image/webp"].includes(file.type) && (
                  <span className="text-red-600">
                    ⚠️ Tipo não permitido. Use JPG, PNG ou WEBP.
                  </span>
                )}
                {/* Validar tamanho */}
                {file.size === 0 && (
                  <span className="text-red-600">
                    ⚠️ Arquivo vazio.
                  </span>
                )}
                {file.size > 10485760 && (
                  <span className="text-red-600">
                    ⚠️ Arquivo muito grande (máx: 10MB).
                  </span>
                )}
              </div>
            )}

            {/* Botão de enviar foto */}
            <button
              type="button"
              onClick={handleUploadPhoto}
              disabled={uploadStatus === 'uploading' || uploadStatus === 'uploaded'}
              className="w-full h-10 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {uploadStatus === 'uploading' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-3 w-3 border-2 border-gray-600 rounded-full"></span>
                  <span>Enviando...</span>
                </span>
              ) : uploadStatus === 'uploaded' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Foto enviada</span>
                </span>
              ) : uploadStatus === 'error' ? (
                <span className="text-red-600">
                  {uploadError || "Erro no envio"}
                </span>
              ) : (
                "Enviar foto"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="text-xs text-gray-500">
              Nenhum arquivo selecionado
            </span>
            <label htmlFor="fileUpload" className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
              Adicionar foto (JPG, PNG, WEBP até 10MB)
              <input
                id="fileUpload"
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files && target.files[0]) {
                    const selectedFile = target.files[0];
                    setFile(selectedFile);

                    // Criar URL de pré-visualização para imagens
                    if (selectedFile.type.startsWith("image/")) {
                      const url = URL.createObjectURL(selectedFile);
                      setPreviewUrl(url);
                    } else {
                      setPreviewUrl(null);
                    }

                    // Resetar estado de upload quando novo arquivo selecionado
                    setUploadStatus('idle');
                    setUploadedFilePath(null);
                    setUploadError(null);
                  } else {
                    setFile(null);
                    setPreviewUrl(null);
                    setUploadStatus('idle');
                    setUploadedFilePath(null);
                    setUploadError(null);
                  }
                }}
              />
            </label>
          </div>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {/* Botão de envio do registro */}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-base font-medium text-white flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white rounded-full"></span>
            <span>Salvando registro...</span>
          </>
        ) : (
          <span>Salvar registro</span>
        )}
      </button>
    </form>
  );
}