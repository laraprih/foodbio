import Image from 'next/image';
import Link from 'next/link';
import { images } from '@/lib/data';
import { ChevronLeft, Heart, Clock, Star, ShieldCheck, ChevronRight, Plus, Minus } from 'lucide-react';

export default function Details() {
  return (
    <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative bg-[#f5faed]">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between z-10 relative">
        <Link 
          href="/"
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Details</h1>
        <button 
          className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-[0_2px_10px_-4px_rgba(239,68,68,0.4)] active:scale-95 transition-transform"
        >
          <Heart className="w-5 h-5 fill-white text-white" />
        </button>
      </header>

      {/* Product Image Area */}
      <div className="flex flex-col items-center pt-2 pb-6 relative z-0">
        <div className="absolute top-0 right-0 left-0 h-[200px] bg-gradient-to-b from-[#e6f7cf] to-transparent opacity-60 z-[-1]" />
        
        <div className="w-[280px] h-[280px] relative drop-shadow-[0_25px_35px_rgba(0,0,0,0.15)] mb-8">
          <Image 
            src={images.bbqPizzaDetail} 
            alt="BBQ Chicken Pizza" 
            fill 
            className="object-contain rounded-full" 
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="flex space-x-2">
          <span className="w-6 h-2 bg-[#84cc16] rounded-full"></span>
          <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
          <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
        </div>
      </div>

      {/* Product Info Content */}
      <section className="px-6 pb-[120px] bg-gray-50 flex-1 rounded-t-[40px] pt-8 -mt-6 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="mb-5">
          <h2 className="text-[26px] leading-tight font-extrabold text-gray-900">BBQ Chicken Pizza</h2>
          <div className="flex items-center text-gray-400 text-xs mt-1">
            <span className="w-3 h-3 mr-1 inline-flex items-center justify-center rounded-full border border-gray-400">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2"><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>
            </span>
            <span className="font-medium">Kaligonj, Satkhira, Bangladesh</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50/80 border border-green-100 rounded-[14px]">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700">Delivered</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50/80 border border-blue-100 rounded-[14px]">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-700">Time 10 min</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-50/80 border border-yellow-100 rounded-[14px]">
            <Star className="w-4 h-4 text-yellow-600 fill-yellow-500" />
            <span className="text-xs font-bold text-yellow-700">4.5 Ratting</span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-500 text-[13px] leading-relaxed font-medium">
            BBQ Chicken Pizza is a flavorful twist on the classic Italian pizza, blending smoky barbecue sauce with juicy chicken and melted cheese for a rich, tangy, and slightly sweet taste... 
            <button className="text-gray-900 font-extrabold ml-1">See More...</button>
          </p>
        </div>

        <button className="w-full py-4 flex justify-between items-center text-gray-900 font-bold text-sm border-t border-b border-gray-200">
          <span className="text-[15px]">Customize</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </section>

      {/* Sticky Bottom Footer */}
      <footer className="absolute bottom-0 left-0 w-full bg-white p-6 pb-8 border-t border-gray-100 flex items-center justify-between z-50">
        <div className="flex flex-col">
          <span className="text-gray-400 text-[11px] font-semibold mb-0.5">Total amount</span>
          <span className="text-[26px] font-extrabold text-gray-900 leading-none">$40.00</span>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center space-x-4 mr-5">
            <button className="text-gray-400 font-bold text-xl active:scale-95 transition-transform"><Minus className="w-4 h-4" strokeWidth={3}/></button>
            <span className="text-gray-900 font-bold text-lg">1</span>
            <button className="w-[28px] h-[28px] bg-[#84cc16] rounded-full text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform">
              <Plus className="w-4 h-4 text-white" strokeWidth={3} />
            </button>
          </div>
          <button className="bg-zinc-900 text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-[0_4px_15px_-4px_rgba(0,0,0,0.5)] active:scale-95 transition-transform flex-1 whitespace-nowrap">
            Add to cart
          </button>
        </div>
      </footer>
    </main>
  );
}
