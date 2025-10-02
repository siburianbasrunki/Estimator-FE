import { BiChevronLeft } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface BackButtonProps {
  title?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export const BackButton = ({
  title,
  href,
  onClick,
  className = "",
}: BackButtonProps) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("app-scroll") || window;
    const handler = () => {
      const y =
        el instanceof Window ? window.scrollY : (el as HTMLElement).scrollTop;
      setScrolled(y > 0);
    };
    handler(); // set awal
    el.addEventListener("scroll", handler, { passive: true } as any);
    return () => el.removeEventListener("scroll", handler as any);
  }, []);

  return (
    <div
      className={[
        "text-black flex items-center gap-1 cursor-pointer transition hover:opacity-80 hover:underline",
        "w-fit p-4 rounded-lg",
        scrolled
          ? "bg-white/0 backdrop-blur-sm"
          : "bg-white/80 backdrop-blur-sm",
        className,
      ].join(" ")}
      onClick={() => (href ? navigate(href) : onClick ? onClick() : null)}
    >
      <BiChevronLeft className="h-6 w-6" />
      <h1 className="text-black">{title}</h1>
    </div>
  );
};
