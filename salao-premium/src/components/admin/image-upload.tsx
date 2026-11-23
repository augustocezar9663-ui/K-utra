"use client";

import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

const MAX = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Envia a imagem para o bucket público "media" do Supabase Storage
 * (somente admins têm permissão de escrita — ver 0004_storage.sql) e
 * grava a URL pública num input oculto do formulário.
 */
export function ImageUpload({
  name,
  defaultValue,
  folder,
  label = "Imagem",
  aspect = "aspect-[4/3]",
}: {
  name: string;
  defaultValue?: string | null;
  folder: string;
  label?: string;
  aspect?: string;
}) {
  const id = useId();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Use JPG, PNG, WEBP ou AVIF.");
    if (file.size > MAX) return setError("A imagem deve ter no máximo 8 MB.");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const sb = getBrowserClient();
      const { error: upErr } = await sb.storage.from("media").upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = sb.storage.from("media").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (e) {
      setError(`Falha no envio: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="field-label">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className={`relative ${aspect} w-full overflow-hidden border border-dashed border-line bg-cream`}>
        {url ? (
          <Image src={url} alt="" fill sizes="400px" className="object-cover" />
        ) : (
          <label htmlFor={id} className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 text-stone hover:text-ink">
            <ImagePlus className="h-6 w-6" strokeWidth={1.25} />
            <span className="text-xs">Clique para enviar</span>
          </label>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs">
        <label htmlFor={id} className="cursor-pointer underline-offset-4 hover:underline">
          {url ? "Trocar imagem" : "Selecionar arquivo"}
        </label>
        {url ? (
          <button type="button" onClick={() => setUrl("")} className="flex items-center gap-1 text-[#a4473b] hover:underline">
            <Trash2 className="h-3 w-3" /> Remover
          </button>
        ) : null}
      </div>
      <input id={id} type="file" accept={TYPES.join(",")} className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      {error ? <p className="mt-1.5 text-xs text-[#a4473b]">{error}</p> : null}
    </div>
  );
}
