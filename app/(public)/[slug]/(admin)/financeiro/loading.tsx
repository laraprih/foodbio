import { Skeleton } from '@/components/ui/Skeleton'

export default function FinanceiroLoading() {
  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>

      <Skeleton className="h-20 w-full rounded-[28px]" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[28px] border border-black/5 p-6 space-y-4">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      <div className="bg-white rounded-[28px] border border-black/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <Skeleton className="h-5 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between border-t border-gray-50 first:border-0">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-1.5 text-right">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
