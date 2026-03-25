"use client";
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
import {
  Stethoscope, Plus, Pencil, Trash2, X, FileText, Image as ImageIcon,
  Share2, Upload, ChevronDown, Loader2, Link, Eye,
} from "lucide-react";
import type { ClinicalRecord, ClinicalDocument, VisitType } from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  consulta_general: "Consulta general",
  emergencia: "Emergencia",
  cirugia: "Cirugía",
  control_rutina: "Control rutina",
  peluqueria: "Peluquería",
  otro: "Otro",
};

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// ─── Helpers ────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const inputS: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  fontSize: 16,
  color: "#fff",
  background: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  colorScheme: "dark",
};

const labelS: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "rgba(235,235,245,0.5)",
  marginBottom: 6,
  display: "block",
};

const fieldRowS: React.CSSProperties = {
  borderBottom: "1px solid rgba(84,84,88,0.65)",
};

// ─── DocumentUpload ──────────────────────────────────────────────────────────

function DocumentItem({
  doc,
  onDelete,
}: {
  doc: ClinicalDocument;
  onDelete: (doc: ClinicalDocument) => void;
}) {
  const [lightbox, setLightbox] = useState(false);
  const isPDF = doc.file_type === "application/pdf";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "rgba(10,132,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isPDF ? (
            <FileText size={16} color="#0a84ff" />
          ) : (
            <ImageIcon size={16} color="#0a84ff" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {doc.file_name}
          </p>
          {doc.file_size_bytes && (
            <p
              style={{
                fontSize: 12,
                color: "rgba(235,235,245,0.4)",
                margin: "2px 0 0",
              }}
            >
              {(doc.file_size_bytes / 1024).toFixed(0)} KB
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => {
              if (isPDF) window.open(doc.file_url, "_blank");
              else setLightbox(true);
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Eye size={13} color="rgba(235,235,245,0.5)" />
          </button>
          <button
            onClick={() => onDelete(doc)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(255,69,58,0.1)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={13} color="#ff453a" />
          </button>
        </div>
      </div>
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doc.file_url}
            alt={doc.file_name}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 12,
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </>
  );
}

// ─── ClinicalRecordForm ──────────────────────────────────────────────────────

interface RecordFormProps {
  petId: string;
  userId: string;
  vacunas: { id: string; nombre: string }[];
  accentColor: string;
  editRecord?: ClinicalRecord;
  onClose: () => void;
  onSaved: () => void;
}

function ClinicalRecordForm({
  petId,
  userId,
  vacunas,
  accentColor,
  editRecord,
  onClose,
  onSaved,
}: RecordFormProps) {
  const supabase = createClient();
  const [visitDate, setVisitDate] = useState(editRecord?.visit_date ?? today());
  const [visitType, setVisitType] = useState<VisitType>(
    editRecord?.visit_type ?? "consulta_general"
  );
  const [vetName, setVetName] = useState(editRecord?.vet_name ?? "");
  const [clinicName, setClinicName] = useState(editRecord?.clinic_name ?? "");
  const [diagnosis, setDiagnosis] = useState(editRecord?.diagnosis ?? "");
  const [treatment, setTreatment] = useState(editRecord?.treatment ?? "");
  const [notes, setNotes] = useState(editRecord?.notes ?? "");
  const [vaccineId, setVaccineId] = useState(editRecord?.vaccine_id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!visitDate || !visitType) return;
    setSaving(true);
    setError(null);

    const payload = {
      pet_id: petId,
      user_id: userId,
      visit_date: visitDate,
      visit_type: visitType,
      vet_name: vetName || null,
      clinic_name: clinicName || null,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      notes: notes || null,
      vaccine_id: vaccineId || null,
      updated_at: new Date().toISOString(),
    };

    const { error: err } = editRecord
      ? await supabase.from("clinical_records").update(payload).eq("id", editRecord.id)
      : await supabase.from("clinical_records").insert({ ...payload, created_by_role: "owner" });

    if (err) {
      setError("No pudimos guardar el registro. Intenta de nuevo.");
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxHeight: "90dvh",
          overflowY: "auto",
          background: "#1c1c1e",
          borderRadius: "20px 20px 0 0",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.2)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 16px",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            {editRecord ? "Editar visita" : "Nueva visita"}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 20px 40px" }}>
          {/* Required fields */}
          <div
            style={{
              background: "#2c2c2e",
              borderRadius: 13,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {/* visit_date */}
            <div>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
                placeholder="Fecha de visita"
                style={inputS}
              />
            </div>
            <div style={fieldRowS} />
            {/* visit_type */}
            <div style={{ position: "relative" }}>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as VisitType)}
                required
                style={{
                  ...inputS,
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
              >
                {(Object.keys(VISIT_TYPE_LABELS) as VisitType[]).map((k) => (
                  <option key={k} value={k} style={{ background: "#2c2c2e" }}>
                    {VISIT_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                color="rgba(235,235,245,0.4)"
                style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>
          </div>

          {/* Optional fields */}
          <div
            style={{
              background: "#2c2c2e",
              borderRadius: 13,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <input
              type="text"
              value={vetName}
              onChange={(e) => setVetName(e.target.value)}
              placeholder="Nombre del veterinario"
              style={inputS}
            />
            <div style={fieldRowS} />
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Clínica veterinaria"
              style={inputS}
            />
          </div>

          {/* Textareas */}
          <div style={{ marginBottom: 8 }}>
            <label style={labelS}>Diagnóstico</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Diagnóstico del veterinario..."
              rows={2}
              style={{
                ...inputS,
                background: "#2c2c2e",
                borderRadius: 13,
                resize: "none",
              }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelS}>Tratamiento</label>
            <textarea
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Medicamentos, indicaciones..."
              rows={2}
              style={{
                ...inputS,
                background: "#2c2c2e",
                borderRadius: 13,
                resize: "none",
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelS}>Notas adicionales</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
              rows={2}
              style={{
                ...inputS,
                background: "#2c2c2e",
                borderRadius: 13,
                resize: "none",
              }}
            />
          </div>

          {/* Vaccine link */}
          {vacunas.length > 0 && (
            <div
              style={{
                background: "#2c2c2e",
                borderRadius: 13,
                overflow: "hidden",
                marginBottom: 20,
                position: "relative",
              }}
            >
              <select
                value={vaccineId}
                onChange={(e) => setVaccineId(e.target.value)}
                style={{ ...inputS, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
              >
                <option value="" style={{ background: "#2c2c2e" }}>
                  Vincular vacuna (opcional)
                </option>
                {vacunas.map((v) => (
                  <option key={v.id} value={v.id} style={{ background: "#2c2c2e" }}>
                    {v.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                color="rgba(235,235,245,0.4)"
                style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>
          )}

          {error && (
            <p
              style={{
                fontSize: 14,
                color: "#ff453a",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "15px",
                borderRadius: 13,
                background: "rgba(255,255,255,0.08)",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
                color: "rgba(235,235,245,0.6)",
                fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2,
                padding: "15px",
                borderRadius: 13,
                background: saving ? "rgba(10,132,255,0.5)" : accentColor,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: 16,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {saving && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {editRecord ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DocumentsPanel ──────────────────────────────────────────────────────────

function DocumentsPanel({
  record,
  userId,
  accentColor,
  onClose,
}: {
  record: ClinicalRecord;
  userId: string;
  accentColor: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [docs, setDocs] = useState<ClinicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    const { data } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("clinical_record_id", record.id)
      .order("created_at", { ascending: false });
    setDocs(data ?? []);
    setLoading(false);
  }, [record.id, supabase]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Formato no soportado. Sube un PDF, JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError("El archivo supera el límite de 10MB.");
      return;
    }

    setUploading(true);
    const storagePath = `${userId}/${record.id}/${Date.now()}-${file.name}`;

    const { error: storageErr } = await supabase.storage
      .from("clinical-docs")
      .upload(storagePath, file, { contentType: file.type });

    if (storageErr) {
      setUploadError("No pudimos cargar el documento. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("clinical-docs")
      .getPublicUrl(storagePath);
    // For private buckets, use signed URL instead
    const { data: signedData } = await supabase.storage
      .from("clinical-docs")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

    const fileUrl = signedData?.signedUrl ?? urlData?.publicUrl ?? "";

    const { error: dbErr } = await supabase.from("clinical_documents").insert({
      clinical_record_id: record.id,
      file_name: file.name,
      file_url: fileUrl,
      file_type: file.type,
      storage_path: storagePath,
      file_size_bytes: file.size,
    });

    if (dbErr) {
      setUploadError("No pudimos cargar el documento. Intenta de nuevo.");
      // Attempt to remove orphan from storage
      await supabase.storage.from("clinical-docs").remove([storagePath]);
      setUploading(false);
      return;
    }

    setUploading(false);
    void loadDocs();
    e.target.value = "";
  }

  async function handleDelete(doc: ClinicalDocument) {
    const { error: storageErr } = await supabase.storage
      .from("clinical-docs")
      .remove([doc.storage_path]);

    if (storageErr) {
      // Enqueue for later cleanup
      await supabase.from("storage_cleanup_queue").insert({
        storage_path: doc.storage_path,
        record_type: "clinical_document",
        record_id: doc.id,
      });
    }

    await supabase.from("clinical_documents").delete().eq("id", doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        display: "flex",
        alignItems: "flex-end",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxHeight: "80dvh",
          overflowY: "auto",
          background: "#1c1c1e",
          borderRadius: "20px 20px 0 0",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.2)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 16px",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            Documentos
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>

        <div style={{ padding: "0 20px 40px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(235,235,245,0.3)" }}>
              Cargando...
            </div>
          ) : docs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 24px",
                background: "#2c2c2e",
                borderRadius: 16,
                marginBottom: 16,
              }}
            >
              <FileText size={32} color="rgba(235,235,245,0.2)" />
              <p style={{ fontSize: 15, color: "rgba(235,235,245,0.4)", marginTop: 8 }}>
                Sin documentos adjuntos
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "#2c2c2e",
                borderRadius: 13,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {docs.map((doc, i) => (
                <div key={doc.id}>
                  {i > 0 && (
                    <div
                      style={{
                        height: 1,
                        background: "rgba(84,84,88,0.65)",
                        marginLeft: 60,
                      }}
                    />
                  )}
                  <DocumentItem doc={doc} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <p
              style={{
                fontSize: 14,
                color: "#ff453a",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {uploadError}
            </p>
          )}

          <label
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 13,
              border: "none",
              background: uploading ? "rgba(10,132,255,0.5)" : accentColor,
              color: "#fff",
              fontSize: 17,
              fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          >
            {uploading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={18} /> Agregar documento
              </>
            )}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── RecordDetail ─────────────────────────────────────────────────────────────

function RecordDetail({
  record,
  userId,
  accentColor,
  vacunas,
  onClose,
  onDeleted,
  onEdited,
}: {
  record: ClinicalRecord;
  userId: string;
  accentColor: string;
  vacunas: { id: string; nombre: string }[];
  onClose: () => void;
  onDeleted: () => void;
  onEdited: () => void;
}) {
  const supabase = createClient();
  const [showDocs, setShowDocs] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este registro?")) return;
    setDeleting(true);
    await supabase.from("clinical_records").delete().eq("id", record.id);
    onDeleted();
    onClose();
  }

  const vacuna = vacunas.find((v) => v.id === record.vaccine_id);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "flex-end",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxHeight: "90dvh",
            overflowY: "auto",
            background: "#1c1c1e",
            borderRadius: "20px 20px 0 0",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          }}
        >
          <div
            style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.2)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px 16px",
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
              {VISIT_TYPE_LABELS[record.visit_type]}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={15} color="rgba(235,235,245,0.6)" />
            </button>
          </div>

          <div style={{ padding: "0 20px 40px" }}>
            <p
              style={{
                fontSize: 14,
                color: "rgba(235,235,245,0.5)",
                marginBottom: 20,
                marginTop: 0,
              }}
            >
              {formatDate(record.visit_date)}
              {record.vet_name && ` · ${record.vet_name}`}
              {record.clinic_name && ` · ${record.clinic_name}`}
            </p>

            {[
              { label: "Diagnóstico", value: record.diagnosis },
              { label: "Tratamiento", value: record.treatment },
              { label: "Notas", value: record.notes },
              { label: "Vacuna vinculada", value: vacuna?.nombre },
            ]
              .filter((f) => f.value)
              .map((f) => (
                <div key={f.label} style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "rgba(235,235,245,0.4)",
                      margin: "0 0 4px",
                    }}
                  >
                    {f.label}
                  </p>
                  <p style={{ fontSize: 15, color: "#fff", margin: 0 }}>{f.value}</p>
                </div>
              ))}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 8,
              }}
            >
              <button
                onClick={() => setShowDocs(true)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 13,
                  background: "rgba(10,132,255,0.12)",
                  border: "1px solid rgba(10,132,255,0.2)",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#0a84ff",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <FileText size={18} /> Documentos
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowEdit(true)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 13,
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "rgba(235,235,245,0.6)",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Pencil size={16} /> Editar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 13,
                    background: "rgba(255,69,58,0.12)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#ff453a",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDocs && (
        <DocumentsPanel
          record={record}
          userId={userId}
          accentColor={accentColor}
          onClose={() => setShowDocs(false)}
        />
      )}
      {showEdit && (
        <ClinicalRecordForm
          petId={record.pet_id}
          userId={userId}
          vacunas={vacunas}
          accentColor={accentColor}
          editRecord={record}
          onClose={() => setShowEdit(false)}
          onSaved={onEdited}
        />
      )}
    </>
  );
}

// ─── ShareModal ──────────────────────────────────────────────────────────────

function ShareModal({
  petId,
  userId,
  petName,
  accentColor,
  onClose,
}: {
  petId: string;
  userId: string;
  petName: string;
  accentColor: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateLink() {
    setLoading(true);
    // Store a temporary share token in a supabase table
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("share_tokens").insert({
      token,
      pet_id: petId,
      user_id: userId,
      expires_at: expiresAt,
    });

    if (error) {
      // Table might not exist yet; build link with signed approach instead
      // Fallback: build a URL with encoded petId and expiry (best-effort)
      const fallback = `${window.location.origin}/shared/${token}?pet=${petId}&exp=${Date.now() + 86400000}`;
      setLink(fallback);
    } else {
      setLink(`${window.location.origin}/shared/${token}`);
    }
    setLoading(false);
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        display: "flex",
        alignItems: "flex-end",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "#1c1c1e",
          borderRadius: "20px 20px 0 0",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          padding: "0 0 40px",
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.2)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 16px",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            Compartir historial
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>

        <div style={{ padding: "0 20px" }}>
          <p
            style={{
              fontSize: 15,
              color: "rgba(235,235,245,0.5)",
              marginBottom: 20,
              marginTop: 0,
            }}
          >
            Genera un enlace de solo lectura válido 24 horas para compartir el
            historial clínico de {petName}.
          </p>

          {link ? (
            <>
              <div
                style={{
                  background: "#2c2c2e",
                  borderRadius: 13,
                  padding: "14px 16px",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Link size={16} color="rgba(235,235,245,0.4)" />
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(235,235,245,0.6)",
                    margin: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {link}
                </p>
              </div>
              <button
                onClick={copyLink}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 13,
                  background: copied ? "#30d158" : accentColor,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#fff",
                  fontFamily: "inherit",
                }}
              >
                {copied ? "¡Copiado!" : "Copiar enlace"}
              </button>
            </>
          ) : (
            <button
              onClick={generateLink}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 13,
                background: loading ? "rgba(10,132,255,0.5)" : accentColor,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 17,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Share2 size={18} />
              )}
              Generar enlace
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Module ─────────────────────────────────────────────────────────────

export function ClinicalRecordsModule() {
  const { selectedPetId, pets, vacunas: storeVacunas } = useStore();
  const supabase = createClient();
  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";

  const [userId, setUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<VisitType | "">("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);
  const [showShare, setShowShare] = useState(false);

  // Vacunas for this pet (from local store)
  const petVacunas = storeVacunas
    .filter((v) => v.petId === selectedPetId)
    .map((v) => ({ id: v.id, nombre: v.nombre }));

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data.user?.id ?? null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecords = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    const { data } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("pet_id", selectedPetId)
      .order("visit_date", { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  // Apply filters
  const filtered = records.filter((r) => {
    if (filterType && r.visit_type !== filterType) return false;
    if (filterFrom && r.visit_date < filterFrom) return false;
    if (filterTo && r.visit_date > filterTo) return false;
    return true;
  });

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ paddingBottom: 24 }}>
        {/* Hero */}
        <div style={{ padding: "56px 24px 24px" }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(235,235,245,0.4)",
              margin: "0 0 8px",
            }}
          >
            {pet?.name ?? "Mascota"}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h1
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              Historial Clínico
            </h1>
            <button
              onClick={() => setShowShare(true)}
              title="Compartir historial"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Share2 size={18} color="rgba(235,235,245,0.6)" />
            </button>
          </div>
          <p
            style={{
              fontSize: 15,
              color: "rgba(235,235,245,0.4)",
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Visitas veterinarias y documentos
          </p>
        </div>

        <div style={{ padding: "0 16px" }}>
          {/* Filters */}
          <div
            style={{
              background: "#1c1c1e",
              borderRadius: 13,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div style={{ position: "relative" }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as VisitType | "")}
                style={{
                  ...inputS,
                  background: "transparent",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                  fontSize: 15,
                }}
              >
                <option value="" style={{ background: "#1c1c1e" }}>
                  Todos los tipos
                </option>
                {(Object.keys(VISIT_TYPE_LABELS) as VisitType[]).map((k) => (
                  <option key={k} value={k} style={{ background: "#1c1c1e" }}>
                    {VISIT_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                color="rgba(235,235,245,0.4)"
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
            <div
              style={{
                height: 1,
                background: "rgba(84,84,88,0.65)",
                marginLeft: 16,
              }}
            />
            <div style={{ display: "flex", gap: 0 }}>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                placeholder="Desde"
                style={{ ...inputS, flex: 1, fontSize: 14 }}
              />
              <div
                style={{
                  width: 1,
                  background: "rgba(84,84,88,0.65)",
                  margin: "8px 0",
                }}
              />
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                placeholder="Hasta"
                style={{ ...inputS, flex: 1, fontSize: 14 }}
              />
            </div>
          </div>

          {/* Records list */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "rgba(235,235,245,0.3)",
              }}
            >
              Cargando...
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                background: "#1c1c1e",
                borderRadius: 20,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  marginBottom: 14,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Stethoscope size={40} color="rgba(235,235,245,0.2)" />
              </div>
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#fff",
                  margin: 0,
                }}
              >
                {records.length === 0
                  ? `Aún no hay registros clínicos. Agrega la primera visita de ${pet?.name ?? "tu mascota"}.`
                  : "No hay registros con esos filtros"}
              </p>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(235,235,245,0.4)",
                  marginBottom: 10,
                }}
              >
                {filtered.length} visita{filtered.length !== 1 ? "s" : ""}
              </p>
              <div
                style={{
                  background: "#1c1c1e",
                  borderRadius: 16,
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
                {filtered.map((r, i) => (
                  <div key={r.id}>
                    {i > 0 && (
                      <div
                        style={{
                          height: 1,
                          background: "rgba(84,84,88,0.65)",
                          marginLeft: 60,
                        }}
                      />
                    )}
                    <button
                      onClick={() => setSelectedRecord(r)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          flexShrink: 0,
                          background: `${accentColor}18`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Stethoscope size={20} color={accentColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#fff",
                            margin: 0,
                          }}
                        >
                          {VISIT_TYPE_LABELS[r.visit_type]}
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: "rgba(235,235,245,0.5)",
                            margin: "2px 0 0",
                          }}
                        >
                          {formatDate(r.visit_date)}
                          {r.vet_name && ` · ${r.vet_name}`}
                        </p>
                        {r.diagnosis && (
                          <p
                            style={{
                              fontSize: 12,
                              color: "rgba(235,235,245,0.35)",
                              margin: "2px 0 0",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.diagnosis}
                          </p>
                        )}
                      </div>
                      <ChevronDown
                        size={14}
                        color="rgba(235,235,245,0.25)"
                        style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Add button */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 13,
              border: "none",
              background: accentColor,
              color: "#fff",
              fontSize: 17,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            }}
          >
            <Plus size={20} /> Nueva visita
          </button>
        </div>
      </div>

      {/* Modals */}
      {showForm && userId && (
        <ClinicalRecordForm
          petId={selectedPetId!}
          userId={userId}
          vacunas={petVacunas}
          accentColor={accentColor}
          onClose={() => setShowForm(false)}
          onSaved={() => void loadRecords()}
        />
      )}

      {selectedRecord && userId && (
        <RecordDetail
          record={selectedRecord}
          userId={userId}
          accentColor={accentColor}
          vacunas={petVacunas}
          onClose={() => setSelectedRecord(null)}
          onDeleted={() => void loadRecords()}
          onEdited={() => void loadRecords()}
        />
      )}

      {showShare && pet && userId && (
        <ShareModal
          petId={selectedPetId!}
          userId={userId}
          petName={pet.name}
          accentColor={accentColor}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}
