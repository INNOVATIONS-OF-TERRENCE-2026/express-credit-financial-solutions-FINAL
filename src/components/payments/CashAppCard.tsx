import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, ExternalLink } from "lucide-react";
import { CASH_APP_CASHTAG, CASH_APP_URL } from "@/lib/payments";
import cashAppQr from "@/assets/cashapp-qr.png.asset.json";

interface Props {
  selected: boolean;
  onSelect: () => void;
}

export function CashAppCard({ selected, onSelect }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CASH_APP_CASHTAG);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <Card
      onClick={onSelect}
      className={`cursor-pointer transition-all border-2 ${
        selected
          ? "border-green-500 shadow-lg shadow-green-500/20 bg-green-500/5"
          : "border-border hover:border-green-500/50"
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-500 text-white font-bold text-lg">$</span>
            Cash App
          </span>
          <span className="text-sm font-normal text-green-400">{CASH_APP_CASHTAG}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center rounded-lg bg-black p-3">
          <img src={cashAppQr.url} alt="Cash App QR code for $Kingyt" className="h-44 w-44 rounded-md object-contain" loading="lazy" />
        </div>
        <p className="text-sm text-muted-foreground">
          Send your payment to <strong className="text-foreground">$Kingyt</strong> using Cash App.
          Please include your full name and portal email in the note. After sending, upload a screenshot of your confirmation below.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="button" className="bg-green-500 hover:bg-green-600 text-white flex-1"
            onClick={(e) => { e.stopPropagation(); window.open(CASH_APP_URL, "_blank", "noopener,noreferrer"); }}>
            <ExternalLink className="h-4 w-4 mr-2" /> Pay With Cash App
          </Button>
          <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); copy(); }}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy Cashtag"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}