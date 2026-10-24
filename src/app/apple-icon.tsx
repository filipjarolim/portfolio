import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#121820",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", height: 96, width: 74 }}>
          <div style={{ background: "#f4f7fb", height: "100%", width: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: 58 }}>
            <div style={{ background: "#f4f7fb", height: 16, width: "100%" }} />
            <div style={{ height: 20, width: "100%" }} />
            <div style={{ background: "#f4f7fb", height: 16, width: 40 }} />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
