"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  Camera,
  ImageIcon,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceBadge } from "./confidence-badge";
import { UnidadeSelector } from "./unidade-selector";
import { encomendaSchema, type EncomendaInput } from "@/lib/validations/encomenda";
import type { ScanLabelResponse } from "@/lib/validations/encomenda-scan";

interface Unidade {
  id: string;
  number: string;
  bloco: { name: string };
}

interface ScanResult extends ScanLabelResponse {
  matchedUnidadeId: string | null;
}

interface ScanEncomendaFlowProps {
  unidades: Unidade[];
}

type Step = 1 | 2 | 3 | 4;

const TIPO_LABELS: Record<string, string> = {
  envelope: "Envelope",
  caixa_pequena: "Caixa pequena",
  caixa_media: "Caixa média",
  caixa_grande: "Caixa grande",
  sacola: "Sacola",
  tubo: "Tubo",
  outro: "Outro",
};

function confidenceAverage(confidence: ScanLabelResponse["confidence"]): number {
  const scoreMap = { high: 1, medium: 0.6, low: 0.2 };
  const values = Object.values(confidence).map((v) => scoreMap[v] ?? 0.2);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Compress an image file to base64 JPEG at reduced quality
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_PX = 1600;
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        const ratio = Math.min(MAX_PX / width, MAX_PX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Erro ao carregar imagem")); };
    img.src = url;
  });
}

// Capture a frame from a video element as base64 JPEG
function captureVideoFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function ScanEncomendaFlow({ unidades }: ScanEncomendaFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [savedSummary, setSavedSummary] = useState<{
    destinatario: string | null;
    unidade: string;
    remetente: string | null;
    codigoRastreio: string | null;
  } | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Review form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EncomendaInput>({ resolver: zodResolver(encomendaSchema) });

  const selectedUnidadeId = watch("unidadeId") ?? "";

  // Stop camera stream on unmount or step change
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // ── STEP 1 actions ────────────────────��───────────────────────────

  async function startCamera() {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError(true);
      toast.error("Acesso à câmera negado. Você pode escolher uma foto da galeria.");
    }
  }

  function handleCapturePhoto() {
    if (!videoRef.current) return;
    const dataUrl = captureVideoFrame(videoRef.current);
    stopCamera();
    processImage(dataUrl);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. O tamanho máximo é 5MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Formato inválido. Envie uma imagem JPEG ou PNG.");
      return;
    }
    const compressed = await compressImage(file).catch(() => null);
    if (!compressed) {
      toast.error("Erro ao processar imagem. Tente novamente.");
      return;
    }
    processImage(compressed);
  }

  // ── Scan flow ─────────────────────────────────────────────────────

  async function processImage(dataUrl: string) {
    setCapturedImage(dataUrl);
    setStep(2);
    await runScan(dataUrl);
  }

  async function runScan(dataUrl: string) {
    try {
      const res = await fetch("/api/encomendas/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Erro desconhecido");
      }

      const data = (await res.json()) as ScanResult;
      setScanResult(data);

      // Pre-fill form
      reset({
        unidadeId: data.matchedUnidadeId ?? "",
        description: data.destinatario ?? "",
        remetente: data.remetente ?? "",
        transportadora: data.transportadora ?? "",
        codigoRastreio: data.codigoRastreio ?? "",
        wasScanned: true,
        scanConfidence: confidenceAverage(data.confidence),
      });

      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível ler a etiqueta. Tente novamente ou preencha manualmente.";
      toast.error(msg);
      setStep(1);
    }
  }

  // ── Step 3: Submit ────────────────────────────────────────────────

  async function onSubmit(data: EncomendaInput) {
    const res = await fetch("/api/encomendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      toast.error(body.error ?? "Erro ao registrar encomenda. Tente novamente.");
      return;
    }

    const selectedUnit = unidades.find((u) => u.id === data.unidadeId);
    setSavedSummary({
      destinatario: data.description ?? null,
      unidade: selectedUnit
        ? `${selectedUnit.bloco.name} — Unidade ${selectedUnit.number}`
        : "",
      remetente: data.remetente ?? null,
      codigoRastreio: data.codigoRastreio ?? null,
    });
    setStep(4);
    router.refresh();
  }

  // ── Reset ─────────────────────────────────────────────────────────

  function resetFlow() {
    stopCamera();
    setCapturedImage(null);
    setScanResult(null);
    setSavedSummary(null);
    setCameraError(false);
    reset();
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Progress bar ──────────────────────────────────────────────────

  const stepLabels = ["Capturar", "Processando", "Revisar", "Concluído"];
  const progressPercent = ((step - 1) / 3) * 100;

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/portaria/encomendas" className="hover:underline">
            Encomendas
          </Link>{" "}
          / Nova Encomenda
        </p>
        <h1 className="text-2xl font-bold mt-1">Registrar Encomenda</h1>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          {stepLabels.map((label, i) => (
            <span key={label} className={i + 1 === step ? "text-primary font-semibold" : ""}>
              {label}
            </span>
          ))}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── STEP 1: CAPTURE ────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {cameraActive ? (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-black aspect-video object-cover"
                />
                <Button onClick={handleCapturePhoto} className="w-full h-12 text-base">
                  <Camera className="h-5 w-5 mr-2" /> Capturar Foto
                </Button>
                <Button variant="outline" className="w-full" onClick={stopCamera}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={startCamera}
                  className="w-full h-14 text-base font-semibold"
                  disabled={cameraError}
                >
                  <Camera className="h-5 w-5 mr-2" /> Escanear Etiqueta
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" /> Escolher da Galeria
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="rounded-lg bg-muted/50 border px-4 py-3 flex gap-3">
                  <AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Dica: Para melhores resultados, fotografe a etiqueta de frente, com boa
                    iluminação e sem reflexos.
                  </p>
                </div>

                <div className="pt-1 text-center">
                  <Link
                    href="/portaria/encomendas"
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Preencher Manualmente
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: PROCESSING ─────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardContent className="pt-10 pb-12 flex flex-col items-center gap-5">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">Lendo etiqueta com IA...</p>
              <p className="text-sm text-muted-foreground">
                Extraindo destinatário, unidade e rastreio
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {["Destinatário", "Unidade", "Rastreio"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-medium animate-pulse"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 3: REVIEW ─────────────────────────────────────────── */}
      {step === 3 && scanResult && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {capturedImage && (
            <div className="flex gap-3 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Etiqueta capturada"
                className="h-16 w-16 object-cover rounded-lg border shrink-0"
              />
              <p className="text-sm text-muted-foreground">
                Foto capturada. Confira os dados extraídos e corrija o que for necessário.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-warning-500/30 bg-warning-50 px-4 py-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5 shrink-0" />
            <p className="text-xs text-warning-700">
              Confira os dados e corrija o que for necessário antes de confirmar.
            </p>
          </div>

          <Card>
            <CardContent className="pt-5 space-y-5">
              {/* Unidade — required */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Unidade *</Label>
                  <ConfidenceBadge level={scanResult.confidence.unidade} />
                </div>
                <UnidadeSelector
                  unidades={unidades}
                  value={selectedUnidadeId}
                  onChange={(id) => setValue("unidadeId", id, { shouldValidate: true })}
                  hasError={!!errors.unidadeId}
                />
                {errors.unidadeId && (
                  <p className="text-xs text-destructive">{errors.unidadeId.message}</p>
                )}
              </div>

              {/* Destinatário */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Destinatário</Label>
                  <ConfidenceBadge level={scanResult.confidence.destinatario} />
                </div>
                <Input
                  id="description"
                  placeholder="Nome do destinatário"
                  {...register("description")}
                />
              </div>

              {/* Remetente */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="remetente">Remetente</Label>
                  <ConfidenceBadge level={scanResult.confidence.remetente} />
                </div>
                <Input
                  id="remetente"
                  placeholder="Nome ou empresa remetente"
                  {...register("remetente")}
                />
              </div>

              {/* Transportadora */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="transportadora">Transportadora</Label>
                  <ConfidenceBadge level={scanResult.confidence.transportadora} />
                </div>
                <Input
                  id="transportadora"
                  placeholder="Ex: Correios, Jadlog, Loggi"
                  {...register("transportadora")}
                />
              </div>

              {/* Código de Rastreio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="codigoRastreio">Código de Rastreio</Label>
                  <ConfidenceBadge level={scanResult.confidence.codigoRastreio} />
                </div>
                <Input
                  id="codigoRastreio"
                  placeholder="Ex: BR123456789CD"
                  className="font-mono"
                  {...register("codigoRastreio")}
                />
              </div>

              {/* Tipo de Encomenda */}
              {scanResult.tipoEncomenda && (
                <div className="space-y-1.5">
                  <Label>Tipo de Encomenda</Label>
                  <Select
                    defaultValue={scanResult.tipoEncomenda}
                    onValueChange={(v) => setValue("description", watch("description") ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="obs">Observações</Label>
                <Textarea id="obs" placeholder="Informações adicionais (opcional)" rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Hidden fields */}
          <input type="hidden" {...register("wasScanned")} value="true" />
          <input type="hidden" {...register("scanConfidence")} />

          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              disabled={!selectedUnidadeId || isSubmitting}
              className="w-full h-12 text-base font-semibold"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registrando...</>
              ) : (
                "Confirmar e Registrar"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={resetFlow}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Tirar Outra Foto
            </Button>
          </div>
        </form>
      )}

      {/* ── STEP 4: SUCCESS ────────────────────────────────────────── */}
      {step === 4 && savedSummary && (
        <Card>
          <CardContent className="pt-10 pb-8 flex flex-col items-center gap-5 text-center">
            <CheckCircle2 className="h-16 w-16 text-success-500 animate-[scale-in_0.3s_ease]" />
            <div>
              <h2 className="text-xl font-bold">Encomenda Registrada!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                O morador será notificado por e-mail automaticamente.
              </p>
            </div>

            <div className="w-full rounded-lg border bg-muted/30 px-4 py-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Package className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Resumo</span>
              </div>
              {savedSummary.destinatario && (
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-24 shrink-0">Destinatário</span>
                  <span className="font-medium">{savedSummary.destinatario}</span>
                </div>
              )}
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-24 shrink-0">Unidade</span>
                <span className="font-medium">{savedSummary.unidade}</span>
              </div>
              {savedSummary.remetente && (
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-24 shrink-0">Remetente</span>
                  <span className="font-medium">{savedSummary.remetente}</span>
                </div>
              )}
              {savedSummary.codigoRastreio && (
                <div className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-24 shrink-0">Rastreio</span>
                  <span className="font-medium font-mono">{savedSummary.codigoRastreio}</span>
                </div>
              )}
            </div>

            <Button onClick={resetFlow} className="w-full h-12 text-base font-semibold mt-2">
              <RotateCcw className="h-4 w-4 mr-2" /> Registrar Outra Encomenda
            </Button>
            <Link
              href="/portaria/encomendas"
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Ver todas as encomendas
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
