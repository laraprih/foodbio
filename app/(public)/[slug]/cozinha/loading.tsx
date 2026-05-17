import { Skeleton } from '@/components/ui/Skeleton'

export default function CozinhaLoading() {
  return (
    <div className="flex flex-col h-screen bg-zinc-100">
      <div className="bg-zinc-900 px-8 py-6 flex items-center justify-between shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44 bg-zinc-700" />
          <Skeleton className="h-3 w-56 bg-zinc-700" />
        </div>
        <Skeleton className="w-12 h-12 rounded-2xl bg-zinc-700" />
      </div>
      <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="h-4 w-6 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
