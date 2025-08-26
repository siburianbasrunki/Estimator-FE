import React from "react";

export interface SkeletonProps {
  width?: string; 
  height?: string; 
  circle?: boolean; 
  className?: string; 
}

const Skeleton: React.FC<SkeletonProps> & {
  Line: React.FC<SkeletonProps>;
  Circle: React.FC<Omit<SkeletonProps, "circle">>;
} = ({ width = "w-full", height = "h-4", circle = false, className = "" }) => {
  return (
    <div
      className={`
        animate-pulse bg-gray-200
        ${circle ? "rounded-full" : "rounded-md"}
        ${width} ${height} ${className}
      `}
    />
  );
};

Skeleton.Line = (props) => <Skeleton {...props} circle={false} />;
Skeleton.Circle = ({ width = "w-10", height = "h-10", className = "" }) => (
  <Skeleton width={width} height={height} circle className={className} />
);

export default Skeleton;
