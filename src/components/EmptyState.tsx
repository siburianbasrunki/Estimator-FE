import React from "react";
import { IoDocumentOutline } from "react-icons/io5";
import type { IconType } from "react-icons/lib";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: IconType;
  imageSrc?: string;

  primaryAction?: {
    label: string;
    onClick: () => void;
    color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
  };

  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  size?: "sm" | "md" | "lg";

  className?: string;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Tidak ada data",
  description = "Data belum tersedia ",
  icon: Icon = IoDocumentOutline,
  imageSrc,
  size = "md",
  className = "",
}) => {
  const sizes = {
    sm: "p-6 gap-4",
    md: "p-8 gap-5",
    lg: "p-10 gap-6",
  }[size];

  return (
    <div
      className={[
        "w-full rounded-xl border border-gray-200 bg-white",
        "flex items-center justify-center",
        sizes,
        className,
      ].join(" ")}
    >
      <div className="flex flex-col items-center text-center max-w-xl">
        <div className="mb-4">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Empty Illustration"
              className="w-40 h-40 object-contain opacity-90"
            />
          ) : (
            <div className="mask mask-squircle bg-blue-50 p-5">
              <Icon className="w-12 h-12 text-blue-600" />
            </div>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{description}</p>

       
      </div>
    </div>
  );
};

export default EmptyState;
