import { ReactNode } from "react";

interface GridProps {
  children: ReactNode
}

export default function Grid({ children }: GridProps) {
  return (
    <div className="p-10 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-16">
      {children}
    </div>
  );
}

