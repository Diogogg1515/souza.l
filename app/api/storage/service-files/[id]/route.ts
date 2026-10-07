import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const fileId = params.id;

    // Buscar o registro do arquivo para verificar se existe e obter o caminho
    const { data: fileData, error: fileError } = await supabase
      .from("service_files")
      .select("storage_path, service_id")
      .eq("id", fileId)
      .single();

    if (fileError || !fileData) {
      return new NextResponse("Arquivo não encontrado", { status: 404 });
    }

    // Gerar URL assinada válida por 1 hora
    const { data: urlData } = await supabase.storage
      .from("service-files")
      .createSignedUrl(fileData.storage_path, 3600);

    if (urlData?.signedUrl) {
      // Redirecionar para a URL assinada do Storage
      return NextResponse.redirect(urlData.signedUrl);
    } else {
      return new NextResponse("Erro ao gerar URL do arquivo", { status: 500 });
    }
  } catch (error) {
    console.error("Erro ao servir arquivo:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}