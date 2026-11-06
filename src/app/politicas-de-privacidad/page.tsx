import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Paw recopila, usa y protege tu información y la de tus mascotas.",
};

const UPDATED = "5 de noviembre de 2026";
const CONTACT = "info@elevateapp.co";

type Section = { title: string; intro?: string; items?: React.ReactNode[]; body?: React.ReactNode[] };

const SECTIONS: Section[] = [
  {
    title: "1. Información que recopilamos",
    intro: "Podemos recopilar los siguientes tipos de información:",
    items: [
      <><strong>Datos de cuenta:</strong> nombre, correo electrónico, teléfono y foto o avatar de perfil. Si inicias sesión con Google, recibimos tu nombre, correo y foto de esa cuenta.</>,
      <><strong>Datos de tus mascotas:</strong> nombre, especie, raza, sexo, fecha de nacimiento, peso, fotos, videos, historial clínico, vacunas, medicamentos, alimentación, higiene, actividad, citas y gastos que registres.</>,
      <><strong>Ubicación:</strong> con tu permiso, tu ubicación aproximada o precisa para mostrar negocios y servicios cercanos, reportar o alertar sobre mascotas perdidas en tu zona y registrar paseos.</>,
      <><strong>Conversaciones con el asistente:</strong> los mensajes que envías al asistente de cuidado de mascotas.</>,
      <><strong>Información técnica:</strong> tipo de dispositivo, sistema operativo, navegador, dirección IP, versión de la aplicación y el identificador para enviarte notificaciones push.</>,
      <><strong>Información de uso:</strong> cómo interactúas con la aplicación, como reservas, eventos y funciones que utilizas.</>,
    ],
  },
  {
    title: "2. Uso de la información",
    intro: "Usamos la información para:",
    items: [
      "Prestar las funciones de la aplicación: perfiles de mascotas, recordatorios de cuidados, citas, reservas y eventos.",
      "Enviarte notificaciones y recordatorios relacionados con tus mascotas.",
      "Mostrarte negocios y servicios cercanos y difundir alertas de mascotas perdidas a usuarios de la zona.",
      "Responder tus preguntas a través del asistente.",
      "Mejorar la funcionalidad, seguridad y experiencia de la aplicación.",
      "Prestar soporte técnico y cumplir obligaciones legales aplicables.",
    ],
  },
  {
    title: "3. Compartición de información",
    intro: "No vendemos tu información personal. Solo la compartimos en estos casos:",
    items: [
      <><strong>Contigo y con quien tú decidas:</strong> por ejemplo, al compartir el historial de una mascota mediante un enlace temporal, al invitar a otra persona a cuidar una mascota o al reservar con un negocio.</>,
      <><strong>Reportes de mascotas perdidas:</strong> la información que publiques en un reporte (foto, descripción, zona y datos de contacto que elijas) será visible para otros usuarios.</>,
      <><strong>Proveedores de servicios:</strong> que nos ayudan a operar la aplicación, como alojamiento y base de datos, envío de notificaciones, mapas y el proveedor de inteligencia artificial que procesa los mensajes del asistente.</>,
      <><strong>Requerimientos legales:</strong> cuando la ley o una autoridad competente lo solicite.</>,
    ],
    body: ["Todos los proveedores externos están obligados a proteger tu información conforme a esta política y la normativa vigente."],
  },
  {
    title: "4. Seguridad de la información",
    body: [
      "Implementamos medidas de seguridad técnicas y organizativas razonables, como cifrado en tránsito y controles de acceso por usuario, para proteger tus datos frente a pérdida, acceso no autorizado o divulgación indebida.",
      "Sin embargo, ningún sistema es completamente seguro, por lo que no podemos garantizar la seguridad absoluta de la información transmitida o almacenada.",
    ],
  },
  {
    title: "5. Conservación de datos",
    body: [
      "Conservamos tus datos mientras tengas una cuenta activa o mientras sea necesario para prestarte el servicio. Puedes eliminar tu cuenta en cualquier momento desde Ajustes; al hacerlo se eliminan tu perfil, tus mascotas y los archivos asociados, salvo lo que debamos conservar por obligación legal.",
    ],
  },
  {
    title: "6. Derechos del usuario",
    intro: "Tienes derecho a:",
    items: [
      "Acceder, corregir o eliminar tus datos personales.",
      "Retirar tu consentimiento en cualquier momento, incluidos los permisos de ubicación, cámara y notificaciones desde tu dispositivo.",
      "Solicitar la portabilidad o limitación del tratamiento de tus datos.",
    ],
    body: [
      <>Para ejercer estos derechos, escríbenos a <a className="text-primary-text underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</>,
    ],
  },
  {
    title: "7. Menores de edad",
    body: ["La aplicación no está dirigida a menores de 13 años y no recopilamos a sabiendas información de ellos. Si crees que un menor nos ha proporcionado datos, contáctanos para eliminarlos."],
  },
  {
    title: "8. Cambios a esta política",
    body: ["Podemos modificar esta política en cualquier momento. Las actualizaciones se publicarán en esta página e indicarán la fecha de la última revisión."],
  },
  {
    title: "9. Contacto",
    body: [
      <>Si tienes preguntas o comentarios sobre esta política, escríbenos a <a className="text-primary-text underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</>,
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="eyebrow">Paw</p>
          <h1 className="mt-1 text-display text-text">Política de privacidad</h1>
          <p className="mt-2 text-small text-text-secondary">Última actualización: {UPDATED}</p>
        </header>

        <Card className="space-y-6 p-5 md:p-8">
          <p className="text-body text-text">
            Esta política describe cómo recopilamos, usamos, almacenamos y protegemos la información personal de quienes usan
            Paw, nuestra aplicación para el cuidado de mascotas (en adelante, “la Aplicación”).
          </p>

          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-2">
              <h2 className="text-subtitle text-text">{s.title}</h2>
              {s.intro && <p className="text-body text-text">{s.intro}</p>}
              {s.items && (
                <ul className="list-disc space-y-1.5 pl-5 text-body text-text">
                  {s.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {s.body?.map((p, i) => (
                <p key={i} className="text-body text-text">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </Card>
      </div>
    </main>
  );
}
