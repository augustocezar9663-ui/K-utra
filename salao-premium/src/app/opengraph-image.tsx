import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/data/public";

export const alt = "Agendamento online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const s = await getSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#05070c",
          color: "#ffffff",
          padding: "72px 80px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, color: "#5B8CFF", fontSize: 22, letterSpacing: 8 }}>
          <div style={{ width: 60, height: 1, background: "#5B8CFF" }} />
          {s.name.toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1, fontWeight: 300 }}>
          <span>SEU ESTILO.</span>
          <span style={{ color: "#5B8CFF", fontStyle: "italic" }}>Sua identidade.</span>
          <span>MEU CUIDADO.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#bbbbbb", fontFamily: "sans-serif", letterSpacing: 4 }}>
          <span>AGENDAMENTO ONLINE</span>
          <span>{s.tagline.toUpperCase()}</span>
        </div>
      </div>
    ),
    size,
  );
}
