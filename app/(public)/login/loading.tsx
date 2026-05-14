import { Skeleton } from '@/components/ui/Skeleton'

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-[var(--color-lime-primary)] rounded-3xl p-8 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-2xl bg-white/20" />
            <Skeleton className="h-6 w-32 bg-white/20" />
            <Skeleton className="h-4 w-48 bg-white/20" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl bg-white/20" />
            <Skeleton className="h-12 w-full rounded-xl bg-white/20" />
            <Skeleton className="h-12 w-full rounded-xl bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}
