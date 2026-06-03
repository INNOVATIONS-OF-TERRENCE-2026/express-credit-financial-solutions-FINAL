import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCEPTED_PROOF_TYPES } from "@/lib/payments";
import { useToast } from "@/hooks/use-toast";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onSubmit: (file: File) => Promise<void>; }

export function ReplaceProofDialog({ open, onOpenChange, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const handle = async () => {
    if (!file) { toast({ title: "Please choose a file.", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      await onSubmit(file);
      toast({ title: "Replacement proof uploaded. Pending review." });
      setFile(null);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload replacement proof</DialogTitle>
          <DialogDescription>PNG, JPG, or PDF up to 8 MB. Status will return to Pending Review.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="replace-proof">Payment proof</Label>
          <Input id="replace-proof" type="file" accept={ACCEPTED_PROOF_TYPES.join(",")}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handle} disabled={submitting}>{submitting ? "Uploading…" : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}