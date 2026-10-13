"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
import { Stethoscope, Plus, Pencil, Trash2, FileText, Image as ImageIcon, Share2, Upload, Link as LinkIcon, Eye, ChevronRight, Check } from "lucide-react";
import { motion } from "motion/react";
import type { ClinicalRecord, ClinicalDocument, VisitType } from "@/types";
import { PageHeader, Button, Card, Row, Divider, Sheet, Input, Select, Textarea, EmptyState, Skeleton, SkeletonRow, Tag } from "@/components/ui";
import { showToast } from "@/components/ui/Toast";
import { fadeUp, stagger } from "@/lib/motion";

// ─── Constantes ──────────────────────────────────────────────────────────────

const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  consulta_general: "Consulta general",
  emergencia: "Emergencia",
  cirugia: "Cirugía",
  control_rutina: "Control de rutina",
  peluqueria: "Peluquería",
  otro: "Otro",
};

const VISIT_OPTIONS = (Object.keys(VISIT_TYPE_LABELS) as VisitType[]).map((k) => ({ value: k, label: VISIT_TYPE_LABELS[k] }));

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// ─── DocumentItem ────────────────────────────────────────────────────────────

function DocumentItem({ doc, onDelete }: { doc: ClinicalDocument; onDelete: (doc: ClinicalDocument) => void }) {
  const [lightbox, setLightbox] = useState(false);
  const isPDF = doc.file_type === "application/pdf";

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-info-container text-info">
          {isPDF ? <FileText size={18} /> : <ImageIcon size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-on">{doc.file_name}</p>
          {doc.file_size_bytes && <p className="text-[12px] text-on-variant">{(doc.file_size_bytes / 1024).toFixed(0)} KB</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="secondary"
            size="icon"
            aria-label={`Ver ${doc.file_name}`}
            onClick={() => {
              if (isPDF) window.open(doc.file_url, "_blank");
              else setLightbox(true);
            }}
          >
            <Eye size={18} />
          </Button>
          <Button variant="dangerTonal" size="icon" aria-label={`Eliminar ${doc.file_name}`} onClick={() => onDelete(doc)}>
            <Trash2 size={18} />
          </Button>
        </div>
      </div>
      {lightbox && (
        <div role="dialog" aria-label={doc.file_name} onClick={() => setLightbox(false)} className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(34,28,23,0.92)] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={doc.file_url} alt={doc.file_name} className="max-h-[90vh] max-w-[90vw] rounded-card object-contain" />
        </div>
      )}
    </>
  );
}

// ─── ClinicalRecordForm ──────────────────────────────────────────────────────

interface RecordFormProps {
  open: boolean;
  petId: string;
  userId: string;
  vacunas: { id: string; nombre: string }[];
  editRecord?: ClinicalRecord;
  onClose: () => void;
  onSaved: () => void;
}

function ClinicalRecordForm({ open, petId, userId, vacunas, editRecord, onClose, onSaved }: RecordFormProps) {
  const supabase = createClient();
  const [visitDate, setVisitDate] = useState(editRecord?.visit_date ?? today());
  const [visitType, setVisitType] = useState<VisitType>(editRecord?.visit_type ?? "consulta_general");
  const [vetName, setVetName] = useState(editRecord?.vet_name ?? "");
  const [clinicName, setClinicName] = useState(editRecord?.clinic_name ?? "");
  const [diagnosis, setDiagnosis] = useState(editRecord?.diagnosis ?? "");
  const [treatment, setTreatment] = useState(editRecord?.treatment ?? "");
  const [notes, setNotes] = useState(editRecord?.notes ?? "");
  const [vaccineId, setVaccineId] = useState(editRecord?.vaccine_id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setVisitDate(editRecord?.visit_date ?? today());
    setVisitType(editRecord?.visit_type ?? "consulta_general");
    setVetName(editRecord?.vet_name ?? "");
    setClinicName(editRecord?.clinic_name ?? "");
    setDiagnosis(editRecord?.diagnosis ?? "");
    setTreatment(editRecord?.treatment ?? "");
    setNotes(editRecord?.notes ?? "");
    setVaccineId(editRecord?.vaccine_id ?? "");
    setError(null);
  }, [open, editRecord]);

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

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={editRecord ? "Editar visita" : "Nueva visita"}>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3 pb-2">
        <Input label="Fecha de visita" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />
        <Select label="Tipo" value={visitType} onChange={(e) => setVisitType(e.target.value as VisitType)} options={VISIT_OPTIONS} required />
        <Input label="Veterinario (opcional)" value={vetName} onChange={(e) => setVetName(e.target.value)} />
        <Input label="Clínica (opcional)" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
        <Textarea label="Diagnóstico" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Lo que dijo el veterinario" rows={2} />
        <Textarea label="Tratamiento" value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Medicamentos, indicaciones" rows={2} />
        <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones" rows={2} />
        {vacunas.length > 0 && (
          <Select label="Vincular vacuna (opcional)" value={vaccineId} onChange={(e) => setVaccineId(e.target.value)} placeholder="Ninguna" options={vacunas.map((v) => ({ value: v.id, label: v.nombre }))} />
        )}
        {error && <p role="alert" className="text-[13px] font-semibold text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={saving} className="flex-[2]">{editRecord ? "Guardar" : "Agregar"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

// ─── DocumentsPanel ──────────────────────────────────────────────────────────

function DocumentsPanel({ open, record, userId, onClose }: { open: boolean; record: ClinicalRecord; userId: string; onClose: () => void }) {
  const supabase = createClient();
  const [docs, setDocs] = useState<ClinicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
    if (open) void loadDocs();
  }, [open, loadDocs]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Formato no soportado. Sube un PDF, JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError("El archivo supera el límite de 10 MB.");
      return;
    }

    setUploading(true);
    const storagePath = `${userId}/${record.id}/${Date.now()}-${file.name}`;

    const { error: storageErr } = await supabase.storage.from("clinical-docs").upload(storagePath, file, { contentType: file.type });

    if (storageErr) {
      setUploadError("No pudimos cargar el documento. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("clinical-docs").getPublicUrl(storagePath);
    // Bucket privado: URL firmada
    const { data: signedData } = await supabase.storage.from("clinical-docs").createSignedUrl(storagePath, 60 * 60 * 24 * 365);

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
      await supabase.storage.from("clinical-docs").remove([storagePath]);
      setUploading(false);
      return;
    }

    setUploading(false);
    void loadDocs();
    e.target.value = "";
  }

  async function handleDelete(doc: ClinicalDocument) {
    const { error: storageErr } = await supabase.storage.from("clinical-docs").remove([doc.storage_path]);

    if (storageErr) {
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
    <Sheet
      open={open}
      onClose={onClose}
      title="Documentos"
      subtitle={`${VISIT_TYPE_LABELS[record.visit_type]} · ${formatDate(record.visit_date)}`}
      footer={
        <>
          <Button loading={uploading} full size="lg" leading={<Upload size={18} />} onClick={() => fileRef.current?.click()}>
            {uploading ? "Subiendo…" : "Agregar documento"}
          </Button>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => void handleFileChange(e)} disabled={uploading} className="sr-only" aria-label="Elegir archivo" />
        </>
      }
    >
      {loading ? (
        <div className="rounded-card bg-surface-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState compact tone="neutral" icon={<FileText size={24} />} title="Sin documentos" description="Sube recetas, exámenes o fotos de esta visita." />
      ) : (
        <Card padded={false} tone="container" elevation={0} className="overflow-hidden">
          {docs.map((doc, i) => (
            <div key={doc.id}>
              {i > 0 && <Divider />}
              <DocumentItem doc={doc} onDelete={handleDelete} />
            </div>
          ))}
        </Card>
      )}
      {uploadError && <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">{uploadError}</p>}
    </Sheet>
  );
}

// ─── RecordDetail ────────────────────────────────────────────────────────────

function RecordDetail({ record, userId, vacunas, onClose, onDeleted, onEdited }: {
  record: ClinicalRecord;
  userId: string;
  vacunas: { id: string; nombre: string }[];
  onClose: () => void;
  onDeleted: () => void;
  onEdited: () => void;
}) {
  const supabase = createClient();
  const [showDocs, setShowDocs] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("clinical_records").delete().eq("id", record.id);
    setDeleting(false);
    onDeleted();
    onClose();
  }

  const vacuna = vacunas.find((v) => v.id === record.vaccine_id);
  const fields = [
    { label: "Diagnóstico", value: record.diagnosis },
    { label: "Tratamiento", value: record.treatment },
    { label: "Notas", value: record.notes },
    { label: "Vacuna vinculada", value: vacuna?.nombre },
  ].filter((f) => f.value);

  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title={VISIT_TYPE_LABELS[record.visit_type]}
        subtitle={[formatDate(record.visit_date), record.vet_name, record.clinic_name].filter(Boolean).join(" · ")}
        footer={
          <div className="flex flex-col gap-2">
            <Button variant="tonal" full onClick={() => setShowDocs(true)} leading={<FileText size={18} />}>Documentos</Button>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowEdit(true)} leading={<Pencil size={16} />}>Editar</Button>
              {confirmDelete ? (
                <Button variant="danger" className="flex-1" loading={deleting} onClick={() => void handleDelete()} leading={<Check size={16} />}>Confirmar</Button>
              ) : (
                <Button variant="dangerTonal" className="flex-1" onClick={() => setConfirmDelete(true)} leading={<Trash2 size={16} />}>Eliminar</Button>
              )}
            </div>
          </div>
        }
      >
        {fields.length === 0 ? (
          <p className="py-4 text-[14px] text-on-variant">Sin detalles adicionales.</p>
        ) : (
          <div className="flex flex-col gap-4 pb-2">
            {fields.map((f) => (
              <div key={f.label}>
                <p className="text-[12px] font-bold uppercase tracking-wide text-on-variant">{f.label}</p>
                <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-on">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <DocumentsPanel open={showDocs} record={record} userId={userId} onClose={() => setShowDocs(false)} />
      {showEdit && (
        <ClinicalRecordForm open={showEdit} petId={record.pet_id} userId={userId} vacunas={vacunas} editRecord={record} onClose={() => setShowEdit(false)} onSaved={onEdited} />
      )}
    </>
  );
}

// ─── ShareSheet ──────────────────────────────────────────────────────────────

function ShareSheet({ open, petId, userId, petName, onClose }: { open: boolean; petId: string; userId: string; petName: string; onClose: () => void }) {
  const supabase = createClient();
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateLink() {
    setLoading(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("share_tokens").insert({ token, pet_id: petId, user_id: userId, expires_at: expiresAt });

    if (error) {
      // La tabla puede no existir todavía: enlace de respaldo
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
      showToast("Enlace copiado", undefined, "success");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Compartir historial"
      subtitle={`Enlace de solo lectura, válido 24 horas, con el historial de ${petName}.`}
      footer={
        link ? (
          <Button full size="lg" onClick={copyLink} leading={copied ? <Check size={18} /> : <LinkIcon size={18} />}>{copied ? "Copiado" : "Copiar enlace"}</Button>
        ) : (
          <Button full size="lg" onClick={() => void generateLink()} loading={loading} leading={<Share2 size={18} />}>Generar enlace</Button>
        )
      }
    >
      {link && (
        <div className="flex items-center gap-2 rounded-control bg-surface-2 px-4 py-3">
          <LinkIcon size={16} className="shrink-0 text-on-variant" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-[13px] text-on-variant">{link}</p>
        </div>
      )}
    </Sheet>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function ClinicalRecordsSkeleton({ embedded }: { embedded?: boolean }) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-8" aria-busy="true">
      {!embedded && (
        <div className="flex items-end justify-between pt-[max(14px,env(safe-area-inset-top))] pb-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-44" />
          </div>
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      )}
      <Skeleton className="h-[120px] w-full rounded-card-lg" />
      <div className="rounded-card-lg bg-surface">
        <SkeletonRow trailing={false} />
        <SkeletonRow trailing={false} />
        <SkeletonRow trailing={false} />
      </div>
    </div>
  );
}

// ─── Módulo principal ────────────────────────────────────────────────────────

export function ClinicalRecordsModule({ embedded = false }: { embedded?: boolean }) {
  const { selectedPetId, pets, vacunas: storeVacunas } = useStore();
  const supabase = createClient();
  const pet = pets.find((p) => p.id === selectedPetId);

  const [userId, setUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<VisitType | "">("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);
  const [showShare, setShowShare] = useState(false);

  const petVacunas = storeVacunas.filter((v) => v.petId === selectedPetId).map((v) => ({ id: v.id, nombre: v.nombre }));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data.user?.id ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecords = useCallback(async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("pet_id", selectedPetId)
      .order("visit_date", { ascending: false });
    if (err) setError("No pudimos cargar el historial.");
    setRecords(data ?? []);
    setLoading(false);
  }, [selectedPetId, supabase]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const filtered = records.filter((r) => {
    if (filterType && r.visit_type !== filterType) return false;
    if (filterFrom && r.visit_date < filterFrom) return false;
    if (filterTo && r.visit_date > filterTo) return false;
    return true;
  });

  const shareButton = (
    <Button variant="secondary" size="icon" aria-label="Compartir historial" onClick={() => setShowShare(true)}>
      <Share2 size={20} />
    </Button>
  );

  return (
    <div className="pb-8">
      {!embedded && <PageHeader back backHref="/salud" eyebrow={pet?.name ?? "Mascota"} title="Historial clínico" actions={shareButton} />}

      {loading ? (
        <ClinicalRecordsSkeleton embedded />
      ) : (
        <div className="flex flex-col gap-4 px-4">
          {embedded && <div className="flex justify-end">{shareButton}</div>}

          <Card tone="container" elevation={0} className="flex flex-col gap-2">
            <Select aria-label="Tipo de visita" value={filterType} onChange={(e) => setFilterType(e.target.value as VisitType | "")} placeholder="Todos los tipos" options={VISIT_OPTIONS} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Desde" type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              <Input label="Hasta" type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
          </Card>

          {error ? (
            <EmptyState tone="danger" title="No pudimos cargar" description={error} action={<Button full onClick={() => void loadRecords()}>Reintentar</Button>} />
          ) : filtered.length === 0 ? (
            <EmptyState
              compact
              icon={<Stethoscope size={26} />}
              title={records.length === 0 ? "Sin visitas registradas" : "Nada con esos filtros"}
              description={records.length === 0 ? `Guarda cada visita de ${pet?.name ?? "tu mascota"} al veterinario con sus documentos.` : undefined}
              action={records.length === 0 ? <Button full onClick={() => setShowForm(true)} leading={<Plus size={18} />}>Nueva visita</Button> : undefined}
            />
          ) : (
            <>
              <p className="text-[13px] font-bold uppercase tracking-wide text-on-variant">
                {filtered.length} visita{filtered.length !== 1 ? "s" : ""}
              </p>
              <motion.div variants={stagger()} initial="hidden" animate="show">
                <Card padded={false} elevation={0} className="overflow-hidden">
                  {filtered.map((r, i) => (
                    <motion.div key={r.id} variants={fadeUp}>
                      {i > 0 && <Divider />}
                      <Row
                        icon={<Stethoscope size={20} />}
                        iconTone="primary"
                        title={VISIT_TYPE_LABELS[r.visit_type]}
                        subtitle={[formatDate(r.visit_date), r.vet_name, r.diagnosis].filter(Boolean).join(" · ")}
                        trailing={
                          <span className="flex items-center gap-2">
                            {r.visit_type === "emergencia" && <Tag tone="danger" size="xs">Urgencia</Tag>}
                            <ChevronRight size={18} className="text-on-variant" />
                          </span>
                        }
                        onClick={() => setSelectedRecord(r)}
                      />
                    </motion.div>
                  ))}
                </Card>
              </motion.div>
              <Button full size="lg" onClick={() => setShowForm(true)} leading={<Plus size={20} />}>Nueva visita</Button>
            </>
          )}
        </div>
      )}

      {userId && selectedPetId && (
        <ClinicalRecordForm open={showForm} petId={selectedPetId} userId={userId} vacunas={petVacunas} onClose={() => setShowForm(false)} onSaved={() => void loadRecords()} />
      )}

      {selectedRecord && userId && (
        <RecordDetail record={selectedRecord} userId={userId} vacunas={petVacunas} onClose={() => setSelectedRecord(null)} onDeleted={() => void loadRecords()} onEdited={() => void loadRecords()} />
      )}

      {pet && userId && selectedPetId && <ShareSheet open={showShare} petId={selectedPetId} userId={userId} petName={pet.name} onClose={() => setShowShare(false)} />}
    </div>
  );
}
