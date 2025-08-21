import { BiChevronLeft } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  title?: string;
  href?: string;
  onClick?: () => void;
}
export const BackButton = ({ title, href, onClick }: BackButtonProps) => {
  const navigate = useNavigate();
  return (
    <>
      <div
        className="text-black flex items-center gap-1 cursor-pointer transition hover:opacity-80 hover:underline"
        onClick={() => (href ? navigate(href) : onClick ? onClick() : null)}
      >
        <BiChevronLeft className=" h-6 w-6" />
        <h1 className="text-black">{title}</h1>
      </div>
    </>
  );
};
