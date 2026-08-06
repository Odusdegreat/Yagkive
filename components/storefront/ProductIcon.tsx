/* Simple schematic line-art per product. Uses currentColor so each
   card can tint its own icon. */

import type { SVGProps } from "react";
import type { ProductIconType } from "@/lib/products";

interface ProductIconProps {
  type: ProductIconType;
  className?: string;
}

export default function ProductIcon({ type, className }: ProductIconProps) {
  const common: SVGProps<SVGSVGElement> = {
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };
  switch (type) {
    case "jacket":
      return (
        <svg {...common}>
          <path d="M22 12 L28 8 H36 L42 12 L50 18 L46 26 L42 22 V52 H22 V22 L18 26 L14 18 Z" />
          <path d="M28 8 L32 16 L36 8" />
          <path d="M32 16 V50" strokeDasharray="2 3" />
        </svg>
      );
    case "vest":
      return (
        <svg {...common}>
          <path d="M24 12 L30 9 H34 L40 12 L38 20 V50 H26 V20 Z" />
          <path d="M30 9 L32 16 L34 9" />
          <path d="M26 26 H38 M26 34 H38 M26 42 H38" strokeDasharray="1.5 3" />
        </svg>
      );
    case "trouser":
      return (
        <svg {...common}>
          <path d="M20 10 H44 L45 24 L36 54 L32 30 L28 54 L19 24 Z" />
          <path d="M20 18 H44" strokeDasharray="1.5 3" />
        </svg>
      );
    case "cap":
      return (
        <svg {...common}>
          <path d="M16 34 C16 20 24 12 32 12 C40 12 48 20 48 34 Z" />
          <path d="M14 34 H50" />
          <path d="M32 12 V34" strokeDasharray="1.5 3" />
        </svg>
      );
    case "tote":
      return (
        <svg {...common}>
          <rect x="16" y="22" width="32" height="30" rx="1" />
          <path d="M24 22 V16 C24 11 28 8 32 8 C36 8 40 11 40 16 V22" />
          <path d="M16 32 H48" strokeDasharray="1.5 3" />
        </svg>
      );
    case "boot":
      return (
        <svg {...common}>
          <path d="M24 10 H36 V30 L48 38 C52 40 52 46 48 46 H16 C14 46 13 44 13 42 V32 L24 30 Z" />
          <path d="M24 18 H36 M24 24 H36" strokeDasharray="1.5 3" />
        </svg>
      );
    default:
      return null;
  }
}
