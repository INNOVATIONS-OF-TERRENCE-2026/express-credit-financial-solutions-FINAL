import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Smartphone } from "lucide-react";
import { APPLE_PAY_PHONE } from "@/lib/payments";

interface Props { selected: boolean; onSelect: () => void; }

export function ApplePayCard({ selected, onSelect }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(APPLE_PAY_PHONE);
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <Card onClick={onSelect}
      className={`cursor-pointer transition-all border-2 ${selected ? "border-foreground shadow-lg bg-foreground/5" : "border-border hover:border-foreground/50"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Smartphone className="h-5 w-5" />
          </span>
          Apple Pay / Apple Cash
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Send To</p>
          <p className="text-2xl font-semibold tracking-wide">{APPLE_PAY_PHONE}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Send Apple Cash / Apple Pay payment to <strong className="text-foreground">{APPLE_PAY_PHONE}</strong>.
          Include your full name and portal email in the note. After sending, upload a screenshot of your confirmation below.
        </p>
        <p className="text-xs text-muted-foreground italic">
          Apple Pay / Apple Cash payments are verified by uploaded proof. Direct browser Apple Pay processing may be added later.
        </p>
        <Button type="button" variant="outline" className="w-full"
          onClick={(e) => { e.stopPropagation(); copy(); }}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied" : "Copy Phone Number"}
        </Button>
      </CardContent>
    </Card>
  );
}