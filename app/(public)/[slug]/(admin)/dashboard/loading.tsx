import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="w-10 h-10 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center space-y-2">
            <Skeleton className="h-6 w-8 mx-auto" />
            <Skeleton className="h-2.5 w-14 mx-auto" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
