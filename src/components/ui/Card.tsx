import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl p-4 bg-[#111111] border border-[#1F1F1F]",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-[11px] font-semibold uppercase tracking-widest",
        className
      )}
      style={{ color: "#8e8e98" }}
    >
      {children}
    </h3>
  );
}

// Info cell: label on top, value below — matches the "Estilo / Vinyasa" card from images
export function InfoCell({
  label,
  value,
  className,
  onClick,
}: {
  label: string;
  value: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn("rounded-xl p-3 flex flex-col gap-1 bg-[#1A1A1A] border border-[#1F1F1F]", onClick && "cursor-pointer active:opacity-70 transition-opacity", className)}
    >
      <span className="text-[11px] font-medium" style={{ color: "#8e8e98" }}>
        {label}
      </span>
      <span className="text-[15px] font-semibold text-white leading-tight">
        {value}
      </span>
    </div>
  );
}
