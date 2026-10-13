import { ImageResponse } from "next/og";
import { fallbackProfile, linkedinIntro } from "@/content/selection";
import { getPortraitImage } from "@/lib/linkedin-portrait";

export const alt = `${fallbackProfile.name}, ${fallbackProfile.location}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const portrait = await getPortraitImage();
  const photo = `data:${portrait.contentType};base64,${portrait.base64}`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fff",
          color: "#000",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ fontSize: 22, letterSpacing: 6 }}>{fallbackProfile.location.toUpperCase()}</div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 0.9,
              marginTop: 28,
            }}
          >
            {fallbackProfile.name}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.35, marginTop: 32 }}>{linkedinIntro}</div>
        </div>
        {/* The circle crops the standing portrait toward the face. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={photo}
          width={360}
          height={360}
          style={{
            borderRadius: 180,
            height: 360,
            objectFit: "cover",
            objectPosition: "center 18%",
            width: 360,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
