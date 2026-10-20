/**
 * Transición de página: fundido cruzado en --duration-base.
 * Es animación CSS (.page-enter) y no de JS, para que el contenido que llega
 * renderizado del servidor se vea desde el primer pintado, sin esperar a
 * que hidrate (con motion el HTML llegaba con opacity: 0).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter min-h-dvh">{children}</div>;
}
