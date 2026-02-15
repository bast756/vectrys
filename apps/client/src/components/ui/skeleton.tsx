import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.08] via-white/[0.03] to-white/[0.03] bg-[length:200%_100%]", className)}
      {...props}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3.5">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="w-16 h-8 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

function SkeletonChat({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: count }).map((_, i) => {
        const isRight = i % 3 === 1;
        return (
          <div key={i} className={cn("flex", isRight ? "justify-end" : "justify-start")}>
            <Skeleton className={cn("h-12 rounded-2xl", isRight ? "w-[60%]" : "w-[50%]")} />
          </div>
        );
      })}
    </div>
  );
}

function SkeletonWeather() {
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl gold-line p-8 flex flex-col items-center gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-8 mt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl flex items-center gap-3 px-3.5 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-5 w-14" />
        </div>
      ))}
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className="glass rounded-2xl gold-line p-8 flex flex-col items-center gap-3 mb-5">
      <Skeleton className="w-14 h-14 rounded-full" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-3 w-64" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonList, SkeletonChat, SkeletonWeather, SkeletonHero };
