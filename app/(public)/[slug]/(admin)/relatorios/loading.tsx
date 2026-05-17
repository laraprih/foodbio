import { Skeleton } from '@/components/ui/Skeleton'

export default function RelatoriosLoading() {
  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-36 rounded-2xl" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[28px] border border-black/5 p-6 space-y-4">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[28px] border border-black/5 p-6">
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="flex items-end gap-1.5 h-32">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ height: `${20 + Math.floor(Math.sin(i) * 40 + 40)}%` }}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-black/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <Skeleton className="h-5 w-44" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4 border-t border-gray-50 first:border-0">
            <Skeleton className="w-7 h-7 rounded-xl shrink-0" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
