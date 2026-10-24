import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        <div style={{ display: "flex", height: 18, width: 14 }}>
          <div style={{ background: "#f4f7fb", height: "100%", width: 3 }} />
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: 11 }}>
            <div style={{ background: "#f4f7fb", height: 3, width: "100%" }} />
            <div style={{ height: 4, width: "100%" }} />
            <div style={{ background: "#f4f7fb", height: 3, width: 8 }} />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
