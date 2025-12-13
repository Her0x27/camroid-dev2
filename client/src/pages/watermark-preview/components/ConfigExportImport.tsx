import { memo, useState, useRef, useCallback } from "react";
import { Download, Upload, FileJson, Copy, Link, FileText, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { watermarkPreviewConfigSchema, reticlePreviewConfigSchema, type WatermarkPreviewConfig, type ReticlePreviewConfig } from "@shared/schema";

interface ConfigData {
  version: number;
  watermark: WatermarkPreviewConfig;
  reticle: ReticlePreviewConfig;
}

interface ConfigExportImportProps {
  watermarkConfig: WatermarkPreviewConfig;
  reticleConfig: ReticlePreviewConfig;
  onImport: (watermark: WatermarkPreviewConfig, reticle: ReticlePreviewConfig) => void;
}

type ImportMode = null | "file" | "text" | "url";

export const ConfigExportImport = memo(function ConfigExportImport({
  watermarkConfig,
  reticleConfig,
  onImport,
}: ConfigExportImportProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>(null);
  const [importText, setImportText] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createConfigData = useCallback((): ConfigData => ({
    version: 1,
    watermark: watermarkConfig,
    reticle: reticleConfig,
  }), [watermarkConfig, reticleConfig]);

  const validateAndParseConfig = useCallback((data: unknown): { watermark: WatermarkPreviewConfig; reticle: ReticlePreviewConfig } | null => {
    try {
      if (!data || typeof data !== "object") {
        throw new Error("Неверный формат данных");
      }

      const configData = data as Record<string, unknown>;
      
      let watermark: WatermarkPreviewConfig;
      let reticle: ReticlePreviewConfig;

      if ("watermark" in configData && "reticle" in configData) {
        watermark = watermarkPreviewConfigSchema.parse(configData.watermark);
        reticle = reticlePreviewConfigSchema.parse(configData.reticle);
      } else if ("positionX" in configData && "backgroundColor" in configData) {
        watermark = watermarkPreviewConfigSchema.parse(configData);
        reticle = reticleConfig;
      } else if ("shape" in configData && "color" in configData) {
        watermark = watermarkConfig;
        reticle = reticlePreviewConfigSchema.parse(configData);
      } else {
        throw new Error("Не удалось определить тип конфигурации");
      }

      return { watermark, reticle };
    } catch (error) {
      if (error instanceof Error) {
        setImportError(error.message);
      } else {
        setImportError("Ошибка валидации конфигурации");
      }
      return null;
    }
  }, [watermarkConfig, reticleConfig]);

  const handleExportToFile = useCallback(() => {
    const data = createConfigData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watermark-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
  }, [createConfigData]);

  const handleCopyToClipboard = useCallback(async () => {
    const data = createConfigData();
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setImportError("Не удалось скопировать в буфер обмена");
    }
  }, [createConfigData]);

  const handleImportFromFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        const result = validateAndParseConfig(data);
        if (result) {
          onImport(result.watermark, result.reticle);
          setImportSuccess(true);
          setTimeout(() => {
            setImportSuccess(false);
            setShowImportDialog(false);
            setImportMode(null);
          }, 1500);
        }
      } catch {
        setImportError("Ошибка чтения файла. Проверьте формат JSON.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setImportError("Ошибка чтения файла");
      setIsLoading(false);
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [validateAndParseConfig, onImport]);

  const handleImportFromText = useCallback(() => {
    setImportError(null);
    try {
      const data = JSON.parse(importText);
      const result = validateAndParseConfig(data);
      if (result) {
        onImport(result.watermark, result.reticle);
        setImportSuccess(true);
        setImportText("");
        setTimeout(() => {
          setImportSuccess(false);
          setShowImportDialog(false);
          setImportMode(null);
        }, 1500);
      }
    } catch {
      setImportError("Ошибка парсинга JSON. Проверьте формат.");
    }
  }, [importText, validateAndParseConfig, onImport]);

  const handleImportFromUrl = useCallback(async () => {
    if (!importUrl.trim()) {
      setImportError("Введите URL");
      return;
    }

    setImportError(null);
    setIsLoading(true);

    try {
      const response = await fetch(importUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const result = validateAndParseConfig(data);
      if (result) {
        onImport(result.watermark, result.reticle);
        setImportSuccess(true);
        setImportUrl("");
        setTimeout(() => {
          setImportSuccess(false);
          setShowImportDialog(false);
          setImportMode(null);
        }, 1500);
      }
    } catch (error) {
      if (error instanceof Error) {
        setImportError(`Ошибка загрузки: ${error.message}`);
      } else {
        setImportError("Ошибка загрузки конфигурации");
      }
    } finally {
      setIsLoading(false);
    }
  }, [importUrl, validateAndParseConfig, onImport]);

  const handleCloseImportDialog = useCallback(() => {
    setShowImportDialog(false);
    setImportMode(null);
    setImportText("");
    setImportUrl("");
    setImportError(null);
    setImportSuccess(false);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
          onClick={() => setShowImportDialog(true)}
        >
          <Upload className="h-4 w-4 mr-1" />
          Импорт
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
          onClick={() => setShowExportDialog(true)}
        >
          <Download className="h-4 w-4 mr-1" />
          Экспорт
        </Button>
      </div>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Экспорт конфигурации</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={handleExportToFile}
            >
              <FileJson className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">Скачать как файл</div>
                <div className="text-xs text-muted-foreground">Сохранить JSON файл на устройство</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={handleCopyToClipboard}
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-primary" />
              )}
              <div className="text-left">
                <div className="font-medium">{copied ? "Скопировано!" : "Копировать как текст"}</div>
                <div className="text-xs text-muted-foreground">Скопировать JSON в буфер обмена</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {importMode === null ? "Импорт конфигурации" : 
               importMode === "file" ? "Импорт из файла" :
               importMode === "text" ? "Импорт из текста" : "Импорт по URL"}
            </DialogTitle>
          </DialogHeader>

          {importSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium">Конфигурация успешно импортирована</p>
            </div>
          ) : importMode === null ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => setImportMode("file")}
              >
                <FileJson className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Из файла</div>
                  <div className="text-xs text-muted-foreground">Загрузить JSON файл с устройства</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => setImportMode("text")}
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Вставить текст</div>
                  <div className="text-xs text-muted-foreground">Вставить JSON из буфера обмена</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => setImportMode("url")}
              >
                <Link className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Загрузить по URL</div>
                  <div className="text-xs text-muted-foreground">Загрузить конфигурацию по ссылке</div>
                </div>
              </Button>
            </div>
          ) : importMode === "file" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Выберите JSON файл</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFromFile}
                  disabled={isLoading}
                />
              </div>
              {importError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {importError}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportMode(null)} className="flex-1">
                  <X className="h-4 w-4 mr-1" />
                  Назад
                </Button>
              </div>
            </div>
          ) : importMode === "text" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Вставьте JSON конфигурацию</Label>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version": 1, "watermark": {...}, "reticle": {...}}'
                  className="min-h-[150px] font-mono text-xs"
                />
              </div>
              {importError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {importError}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportMode(null)} className="flex-1">
                  <X className="h-4 w-4 mr-1" />
                  Назад
                </Button>
                <Button onClick={handleImportFromText} className="flex-1" disabled={!importText.trim()}>
                  <Upload className="h-4 w-4 mr-1" />
                  Импорт
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URL конфигурации</Label>
                <Input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://example.com/config.json"
                  disabled={isLoading}
                />
              </div>
              {importError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {importError}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportMode(null)} className="flex-1" disabled={isLoading}>
                  <X className="h-4 w-4 mr-1" />
                  Назад
                </Button>
                <Button onClick={handleImportFromUrl} className="flex-1" disabled={isLoading || !importUrl.trim()}>
                  {isLoading ? (
                    <>Загрузка...</>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      Загрузить
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFromFile}
      />
    </>
  );
});
