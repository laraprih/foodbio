import { Skeleton } from '@/components/ui/Skeleton'

export default function PDVLoading() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="flex-1 p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-12 w-80 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 space-y-3 shadow-sm">
              <Skeleton className="aspect-square w-full rounded-2xl" style={{ borderRadius: '16px' }} />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      <aside className="w-[400px] bg-white border-l border-gray-100 flex flex-col">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex-1 p-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-8 bg-gray-50 border-t border-gray-100 space-y-5">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        </div>
      </aside>
    </div>
  )
}
