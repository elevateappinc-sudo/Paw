"use client";
import { AlertCircle } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { SOSButton } from "@/components/layout/SOSButton";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-5 pt-[max(14px,env(safe-area-inset-top))]">
      <div className="flex justify-end">
        <SOSButton />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          tone="danger"
          icon={<AlertCircle size={26} />}
          title="Algo salió mal"
          description="No pudimos cargar esta pantalla. Tus datos están a salvo; vuelve a intentarlo."
          action={
            <Button full size="lg" onClick={reset}>
              Reintentar
            </Button>
          }
          secondary={error.digest ? <span className="text-[12px] font-semibold text-on-variant">Código {error.digest}</span> : undefined}
        />
      </div>
    </main>
  );
}
