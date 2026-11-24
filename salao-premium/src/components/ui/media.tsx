import Image from "next/image";
import { Artwork } from "./artwork";

/**
 * Exibe a fotografia cadastrada no painel ou, se ainda não houver,
 * uma composição gráfica no lugar (nunca uma foto de banco de imagens
 * apresentada como se fosse do salão).
 */
export function Media({
  src,
  alt,
  seed,
  tone = "ink",
  sizes = "100vw",
  preload = false,
  className = "",
  imgClassName = "",
  label,
}: {
  src: string | null | undefined;
  alt: string;
  seed: string;
  tone?: "ink" | "cream" | "sand" | "accent";
  sizes?: string;
  preload?: boolean;
  className?: string;
  imgClassName?: string;
  label?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          quality={80}
          className={`object-cover ${imgClassName}`}
        />
      ) : (
        <Artwork seed={seed} tone={tone} label={label} className={imgClassName} />
      )}
    </div>
  );
}
