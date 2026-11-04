"use client";
import { AlertCircle } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { SOSButton } from "@/components/layout/SOSButton";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg px-5 pt-[max(16px,env(safe-area-inset-top))]">
      <div className="flex justify-end">
        <SOSButton />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<AlertCircle size={26} />}
          title="Algo salió mal"
          description="No pudimos cargar esta pantalla. Tus datos están a salvo; vuelve a intentarlo."
          action={
            <Button full size="lg" onClick={reset}>
              Reintentar
            </Button>
          }
          secondary={error.digest ? <span className="text-label font-semibold text-text-secondary">Código {error.digest}</span> : undefined}
        />
      </div>
    </main>
  );
}
