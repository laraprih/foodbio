import { Skeleton } from '@/components/ui/Skeleton'

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <Skeleton className="h-5 w-24" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <Skeleton className="h-3 flex-1 hidden sm:block" />
            </div>
          ))}
        </div>

        {/* Delivery type */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>

        {/* Address form */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl p-5 space-y-3">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>

        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  )
}
