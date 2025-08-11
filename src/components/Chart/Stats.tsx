import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  fontSizeTitle?: string;
}

const StatsCard = ({ title, value, icon, fontSizeTitle }: StatsCardProps) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow ">
      <div className="flex items-center justify-between ">
        <div className="flex flex-col gap-2">
          <p
            className={` font-medium text-gray-500 ${
              fontSizeTitle || "text-sm"
            }`}
          >
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-gray-50">{icon}</div>
      </div>
    </div>
  );
};

export default StatsCard;
