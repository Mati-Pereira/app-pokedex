import { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
}

export default function Grid({ children }: GridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-3 py-5 min-[480px]:grid-cols-2 min-[480px]:gap-5 sm:px-5 md:grid-cols-3 md:gap-7 md:px-8 md:py-8 xl:grid-cols-4 xl:gap-8">
      {children}
    </div>
  );
}

