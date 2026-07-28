import type { CSSProperties, DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        alt?: string;
        "auto-rotate"?: boolean;
        "interaction-prompt"?: "auto" | "when-focused" | "none";
        loading?: "auto" | "lazy" | "eager";
        reveal?: "auto" | "interaction" | "manual";
        "camera-orbit"?: string;
        poster?: string;
        "camera-controls"?: boolean;
        "touch-action"?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "shadow-intensity"?: string;
        slot?: string;
        onLoad?: () => void;
        onError?: () => void;
        onProgress?: (event: CustomEvent<{ totalProgress: number }>) => void;
        style?: CSSProperties;
      };
    }
  }
}
