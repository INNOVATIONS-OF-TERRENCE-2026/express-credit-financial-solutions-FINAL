import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { validateUploadFile, formatFileSize, getSupportedExtensions } from '@/lib/documentUtils';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedUploaderProps {
  bucket: string;
  /** Function returning the storage path for a given file. Receives (file, timestamp). */
  buildPath: (file: File, timestamp: number) => string;
  /** Called once after the storage upload succeeds. */
  onUploaded: (result: { path: string; bucket: string; file: File }) => void | Promise<void>;
  label?: string;
  helperText?: string;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
  accept?: string;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface FileItem {
  file: File;
  state: UploadState;
  progress: number;
  error?: string;
}

export function UnifiedUploader({
  bucket,
  buildPath,
  onUploaded,
  label = 'Drop a file here or tap to browse',
  helperText = 'PDF, JPG, PNG up to 20MB',
  className,
  multiple = false,
  disabled = false,
  accept,
}: UnifiedUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      const validation = validateUploadFile(file);
      if (!validation.valid) {
        setItems((prev) =>
          prev.map((it) => (it.file === file ? { ...it, state: 'error', error: validation.error } : it)),
        );
        return;
      }

      // Simulate progress while supabase-js does the upload (no native progress events).
      let pct = 5;
      setItems((prev) => prev.map((it) => (it.file === file ? { ...it, state: 'uploading', progress: pct } : it)));
      const ticker = setInterval(() => {
        pct = Math.min(90, pct + 7);
        setItems((prev) => prev.map((it) => (it.file === file ? { ...it, progress: pct } : it)));
      }, 250);

      try {
        const ts = Date.now();
        const path = buildPath(file, ts);
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        });
        clearInterval(ticker);
        if (error) throw error;

        setItems((prev) =>
          prev.map((it) => (it.file === file ? { ...it, state: 'success', progress: 100 } : it)),
        );
        await onUploaded({ path, bucket, file });
      } catch (err: any) {
        clearInterval(ticker);
        const msg = err?.message || 'Upload failed';
        setItems((prev) =>
          prev.map((it) => (it.file === file ? { ...it, state: 'error', error: msg } : it)),
        );
      }
    },
    [bucket, buildPath, onUploaded],
  );

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList).map<FileItem>((file) => ({ file, state: 'idle', progress: 0 }));
    setItems((prev) => (multiple ? [...prev, ...incoming] : incoming));
    incoming.forEach((it) => upload(it.file));
  };

  const removeItem = (file: File) => setItems((prev) => prev.filter((it) => it.file !== file));
  const retry = (file: File) => {
    setItems((prev) =>
      prev.map((it) => (it.file === file ? { ...it, state: 'idle', progress: 0, error: undefined } : it)),
    );
    upload(file);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'w-full min-h-[140px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all',
          'bg-card/50 backdrop-blur-sm hover:bg-card/70 active:scale-[0.99]',
          isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <div className="rounded-full p-3 bg-primary/10 mb-3">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground text-center">{label}</p>
        <p className="text-xs text-muted-foreground mt-1 text-center">{helperText}</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept ?? getSupportedExtensions()}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </button>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={`${it.file.name}-${it.file.size}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/60 backdrop-blur-sm p-3"
            >
              <div className="rounded-lg p-2 bg-muted shrink-0">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{it.file.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatFileSize(it.file.size)}</p>
                {it.state === 'uploading' && <Progress value={it.progress} className="mt-1.5 h-1" />}
                {it.state === 'error' && (
                  <p className="text-[11px] text-destructive mt-1 break-words">{it.error}</p>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {it.state === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {it.state === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {it.state === 'error' && (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => retry(it.file)}>
                      Retry
                    </Button>
                  </>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => removeItem(it.file)}
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
