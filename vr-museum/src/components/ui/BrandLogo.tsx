type BrandLogoProps = {
  variant?: "dark" | "light";
  markOnly?: boolean;
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({ variant = "dark", markOnly = false, className = "", priority = false }: BrandLogoProps) {
  const src = markOnly
    ? variant === "light" ? "/brand/viswaroop-mark-light.svg" : "/brand/viswaroop-mark.svg"
    : `/brand/viswaroop-logo-${variant}.svg`;
  return <Image src={src} alt="ViswaRoop" width={markOnly ? 220 : 520} height={markOnly ? 75 : 230} className={className} priority={priority} />;
}
import Image from "next/image";
