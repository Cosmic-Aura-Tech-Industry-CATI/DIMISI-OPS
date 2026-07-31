import dimisiMark from "@/assets/dimisi-mark.png.asset.json";

export function LoadingScreen({ label = "Loading Dimisi" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-5 animate-in fade-in duration-300">
        <div className="relative grid h-14 w-14 place-items-center">
          <div className="absolute inset-0 rounded-2xl border border-border" />
          <div className="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent border-t-primary" />
          <img src={dimisiMark.url} alt="Dimisi" className="h-8 w-8 object-contain" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Preparing your workspace…</p>
        </div>
      </div>
    </div>
  );
}
