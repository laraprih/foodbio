import { Skeleton } from '@/components/ui/Skeleton'

export default function CartLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <Skeleton className="h-5 w-24" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl p-5 space-y-3 mt-6">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  )
}
