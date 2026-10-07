"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isUuid } from "@/lib/agenda/form";
import { ALL_STATUSES } from "@/lib/services/status";

export type RecordFormState = { error: string | null; savedAt: number | null };

// Quem decide de verdade é o banco: só participantes criam registros,
// cada um com o próprio papel, e só enquanto o serviço permite.
export async function addRecord(
  _prevState: RecordFormState,
  formData: FormData,
): Promise<RecordFormState> {
  const serviceId = String(formData.get("service_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!isUuid(serviceId)) {
    return { error: "Serviço inválido.", savedAt: null };
  }
  if (content.length < 1 || content.length > 5000) {
    return {
      error: "Escreva o registro (até 5000 caracteres).",
      savedAt: null,
    };
  }

  const user = await getCurrentUser();
  const role = user?.profile?.role;
  if (!user || (role !== "client" && role !== "worker")) {
    return { error: "Você não pode registrar neste serviço.", savedAt: null };
  }

  const supabase = await createClient();

  // Processar upload de arquivo se existir
  const file = formData.get("file") as File;
  let filePath: string | null = null;

  if (file) {
    // Validar tipo e tamanho do arquivo (mesmas regras das policies)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { error: "Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.", savedAt: null };
    }
    if (file.size === 0) {
      return { error: "O arquivo está vazio.", savedAt: null };
    }
    if (file.size > 10485760) { // 10 MB
      return { error: "O arquivo é muito grande. Tamanho máximo: 10 MB.", savedAt: null };
    }

    // Fazer upload para o Storage
    const fileName = `${serviceId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("service-files")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro ao fazer upload do arquivo:", uploadError);
      return {
        error: "Não foi possível enviar o arquivo. Tente de novo.",
        savedAt: null,
      };
    }

    filePath = fileName;
  }

  // Criar o registro de serviço
  const { error: recordError } = await supabase.from("service_records").insert({
    service_id: serviceId,
    author_id: user.id,
    author_role: role,
    content,
  });

  if (recordError) {
    console.error("Erro ao salvar registro:", recordError.code);
    return {
      error:
        "Não foi possível salvar o registro. Confira se o serviço aceita novos registros e tente de novo.",
      savedAt: null,
    };
  }

  // Se houver arquivo, criar registro na tabela service_files
  if (filePath) {
    const caption = String(formData.get("caption") ?? "").trim();

    const { error: fileRecordError } = await supabase.from("service_files").insert({
      service_id: serviceId,
      uploaded_by: user.id,
      file_type: "photo",
      storage_path: filePath,
      original_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      caption: caption,
    });

    if (fileRecordError) {
      console.error("Erro ao salvar registro de arquivo:", fileRecordError);
      // Não falhamos todo o operation se o registro do arquivo falhar,
      // mas logar o erro. O arquivo já está no Storage.
      // Em um sistema de produção, talvez queiramos fazer rollback do upload,
      // mas por simplicidade vamos continuar e deixar o arquivo órfão para limpeza posterior.
    }
  }

  revalidatePath(`/servicos/${serviceId}`);
  return { error: null, savedAt: Date.now() };
}

// Mudança de status (só o profissional dono do serviço, e só transições
// válidas: o banco confere tudo).
export async function changeStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("service_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!isUuid(id) || !(ALL_STATUSES as string[]).includes(status)) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("change_service_status", {
    p_service_id: id,
    p_new_status: status,
  });

  if (error) {
    console.error("Erro ao mudar status:", error.message);
    redirect(`/servicos/${id}?erro=status`);
  }

  revalidatePath(`/servicos/${id}`);
  revalidatePath("/painel");
}
