import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0369a1",
          color: "white",
          display: "flex",
          fontFamily: "sans-serif",
          fontSize: 180,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        SP
      </div>
    ),
    { ...size },
  );
}
