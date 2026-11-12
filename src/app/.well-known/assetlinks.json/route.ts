import { NextResponse } from "next/server";

// Android App Links: declara que la app com.elevate.paw es dueña de este dominio,
// para que los enlaces https://<dominio>/... abran la app en vez del navegador.
// Se sirve en https://<dominio>/.well-known/assetlinks.json
//
// Fingerprints SHA-256 de los keystores que firman la app:
//   - release (Play): el de la bóveda paw-release.keystore
//   - debug: ~/.android/debug.keystore (para probar el APK de debug)
// Si Play App Signing re-firma la app, hay que añadir también el SHA-256 que muestre
// Play Console → App signing → "App signing key certificate".

const SHA256_FINGERPRINTS = [
  // release
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
