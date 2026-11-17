import { NextResponse } from "next/server";

// Android App Links: declara que la app com.elevate.paw es dueña de este dominio,
// para que los enlaces https://<dominio>/... abran la app en vez del navegador.
// Se sirve en https://<dominio>/.well-known/assetlinks.json
//
// Fingerprints SHA-256 de todos los certificados que pueden firmar la app.
// Hacen falta los tres: cada uno corresponde a una forma distinta de instalarla.
//   - Play App Signing: Google RE-FIRMA el AAB con SU propia clave antes de distribuirlo,
//     así que este es el certificado que ve el dispositivo en una instalación desde la
//     tienda. Sin él, los App Links no verifican y el login con Google no vuelve a la app.
//     Se obtiene en Play Console → Protegida con Play → Firma de aplicaciones →
//     "Clave de firma de aplicación" → Huella digital SHA-256.
//   - upload (release): la bóveda paw-release.keystore. Es con la que se firma el AAB que
//     se SUBE a Play, y también los APK release instalados directamente (sideload).
//   - debug: ~/.android/debug.keystore, para probar el APK de debug.

const SHA256_FINGERPRINTS = [
  // Play App Signing (el que usa Google al distribuir desde la tienda)
  "2E:15:CF:1D:E8:95:2B:E4:60:43:94:16:A7:4D:C9:51:0D:B9:35:B8:2B:CF:E1:2B:0F:AD:85:25:5D:52:B2:5D",
  // upload / release (bóveda)
  "8B:76:4C:D2:F3:45:99:2F:7D:4D:09:B9:59:03:CC:EF:1D:FF:87:4D:38:92:DE:2A:0F:88:4D:EC:09:BE:7C:0C",
  // debug
  "63:30:82:DF:66:AF:4D:59:F6:68:1C:30:0A:CE:5F:9D:68:28:F1:52:BE:B3:24:FE:47:BA:26:E4:ED:6A:B0:10",
];

export const dynamic = "force-static";

export function GET() {
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.elevate.paw",
        sha256_cert_fingerprints: SHA256_FINGERPRINTS,
      },
    },
  ];
  return NextResponse.json(body, {
    headers: { "Content-Type": "application/json" },
  });
}
