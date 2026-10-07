import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/agenda/form";
import type { ServiceStatus } from "@/lib/services/status";

export type ServiceDetail = {
  id: string;
  number: number;
  serviceType: string;
  address: string;
  status: ServiceStatus;
  createdAt: string;
  completedAt: string | null;
};

type ServiceRow = {
  id: string;
  service_number: number;
  service_type: string;
  service_address: string;
  status: ServiceStatus;
  created_at: string;
  completed_at: string | null;
};

// O banco só devolve o serviço se a pessoa participa dele (RLS).
export async function getService(id: string): Promise<ServiceDetail | null> {
  if (!isUuid(id)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, service_number, service_type, service_address, status, created_at, completed_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar serviço:", error.code);
    return null;
  }
  if (!data) {
    return null;
  }

  const row = data as ServiceRow;
  return {
    id: row.id,
    number: row.service_number,
    serviceType: row.service_type,
    address: row.service_address,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export type ServiceFile = {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  caption: string;
  uploadUrl: string; // URL temporária assinada para download
};

export type ServiceRecord = {
  id: string;
  authorRole: "client" | "worker";
  content: string;
  createdAt: string;
  files: ServiceFile[];
};

type RecordRow = {
  id: string;
  author_role: "client" | "worker";
  content: string;
  created_at: string;
};

// Registros do serviço, do mais antigo para o mais novo.
export async function listRecords(serviceId: string): Promise<ServiceRecord[]> {
  const supabase = await createClient();
  const { data: recordsData, error: recordsError } = await supabase
    .from("service_records")
    .select("id, author_role, content, created_at")
    .eq("service_id", serviceId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (recordsError) {
    console.error("Erro ao listar registros:", recordsError.code);
    return [];
  }

  // Buscar arquivos anexados para todos os registros de uma vez
  const { data: filesData, error: filesError } = await supabase
    .from("service_files")
    .select("id, record_id, original_name, mime_type, file_size, storage_path, caption")
    .in(
      "record_id",
      (recordsData as RecordRow[]).map((r) => r.id)
    );

  if (filesError) {
    console.error("Erro ao listar arquivos anexados:", filesError.code);
    // Continuamos mesmo se falhar ao buscar arquivos - os registros ainda são úteis
  }

  // Agrupar arquivos por record_id
  const filesByRecordId: Record<string, ServiceFile[]> = {};
  if (filesData) {
    (filesData as any[]).forEach((file) => {
      const recordId = file.record_id;
      if (!filesByRecordId[recordId]) {
        filesByRecordId[recordId] = [];
      }
      filesByRecordId[recordId].push(file);
    });
  }

  return (recordsData as RecordRow[]).map((row) => {
    const recordFiles = filesByRecordId[row.id] || [];

    // Converter arquivos para o formato de serviço com URLs assinadas
    const serviceFiles: ServiceFile[] = recordFiles.map((file: any) => ({
      id: file.id,
      originalName: file.original_name,
      mimeType: file.mime_type,
      fileSize: file.file_size,
      caption: file.caption ?? "",
      // Nota: A URL assinada será gerada no componente frontend para evitar exposição da chave de serviço
      uploadUrl: "", // Será preenchida no frontend
    }));

    return {
      id: row.id,
      authorRole: row.author_role,
      content: row.content,
      createdAt: row.created_at,
      files: serviceFiles,
    };
  });
}

export type Counterpart = { name: string; role: "client" | "worker" };

type CounterpartRow = { o_name: string; o_role: "client" | "worker" };

// Nome da outra pessoa do serviço (cliente vê o profissional e vice-versa).
export async function getCounterpart(
  serviceId: string,
): Promise<Counterpart | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_service_counterpart", {
    p_service_id: serviceId,
  });

  if (error) {
    console.error("Erro ao buscar a outra parte do serviço:", error.code);
    return null;
  }

  const row = Array.isArray(data)
    ? (data[0] as CounterpartRow | undefined)
    : undefined;
  return row ? { name: row.o_name, role: row.o_role } : null;
}
