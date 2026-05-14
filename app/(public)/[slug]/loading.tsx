import { Skeleton } from '@/components/ui/Skeleton'

export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar skeleton */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <Skeleton className="h-4 w-32 hidden sm:block" />
            <div className="hidden md:block flex-1 max-w-lg mx-auto">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton className="w-11 h-11 rounded-xl ml-auto" />
          </div>
        </div>
      </header>

      {/* Info strip skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="md:hidden mb-4">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">
        <div className="lg:flex lg:gap-8">
          {/* Desktop sidebar skeleton */}
          <aside className="hidden lg:block w-52 xl:w-56 shrink-0">
            <div className="sticky top-24 space-y-2">
              <Skeleton className="h-3 w-20 mb-3" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Category bar (mobile) + layout toggle */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex gap-2 overflow-hidden flex-1 lg:hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
                ))}
              </div>
              <Skeleton className="h-9 w-20 rounded-xl hidden sm:block shrink-0" />
            </div>

            {/* Product grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <Skeleton className="w-full aspect-square" style={{ borderRadius: 0 }} />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-8 w-8 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
