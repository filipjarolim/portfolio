import type { Metadata } from "next";
import { ShotReel } from "@/components/shot-reel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Strakatá turistika",
};

const shots = [
  { src: "/work/strakata/home.jpg", label: "Home" },
  { src: "/work/strakata/route.jpg", label: "GPS route" },
  { src: "/work/strakata/results.jpg", label: "Results" },
  { src: "/work/strakata/profile.jpg", label: "Profile" },
];

export default function StrakataShots() {
  return <ShotReel shots={shots} />;
}
