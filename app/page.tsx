'use client';

import Image from 'next/image';
import Link from 'next/link';
import { images } from '@/lib/data';
import { Search, SlidersHorizontal, MapPin, Bell, Plus, Home as HomeIcon, ShoppingBag, Heart, User } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-24 bg-gray-100 relative">
      {/* Header Section */}
      <header className="bg-zinc-900 pt-12 pb-8 px-6 rounded-b-[40px]">
        <div className="flex items-center justify-between mb-8">
          {/* User Profile */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
            <Image 
              src={images.profile}
              alt="User Profile" 
              width={40} 
              height={40} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Delivery Location */}
          <div className="text-center flex-1 px-2">
            <p className="text-[11px] text-zinc-400 font-medium mb-0.5">Delivery location</p>
            <div className="flex items-center justify-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-lime-primary)]" />
              <span className="text-sm text-white font-semibold line-clamp-1">Kaligonj, Satkhira, Bangladesh</span>
            </div>
          </div>
          
          {/* Notification Bell */}
          <button className="relative w-10 h-10 shrink-0 flex items-center justify-center bg-zinc-800 rounded-full">
            <Bell className="h-5 w-5 text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-zinc-900 rounded-full"></span>
          </button>
        </div>

        {/* Hero Card */}
        <section className="relative bg-zinc-800/60 rounded-3xl p-6 overflow-hidden border border-white/5 h-[160px] flex items-center">
          <div className="relative z-10 w-2/3">
            <h2 className="text-2xl font-bold text-white leading-tight">
              <span className="text-[var(--color-lime-primary)]">30%</span> EXTRA<br />DISCOUNT
            </h2>
            <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed opacity-80">
              Enjoy your first ride with an<br />exclusive offer!
            </p>
          </div>
          {/* Hero Image */}
          <div className="absolute top-0 right-[-10%] h-full w-[60%] pointer-events-none">
            <Image 
              src={images.heroBurger} 
              alt="Special Offer" 
              width={200}
              height={200}
              className="object-contain h-full w-full opacity-90 scale-[1.3] translate-y-3"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>

        {/* Search Bar */}
        <div className="mt-8 flex gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </span>
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-white rounded-[20px] py-4 pl-12 pr-4 text-sm border-none focus:ring-2 focus:ring-[var(--color-lime-primary)]/50 text-zinc-800 shadow-sm outline-none"
            />
          </div>
          <button className="bg-white p-4 rounded-[20px] shadow-sm flex items-center justify-center shrink-0">
            <SlidersHorizontal className="h-5 w-5 text-zinc-800" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-6 py-6 border-t-[8px] border-gray-100 bg-gray-50 flex-1">
        
        {/* Categories Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-800 text-[17px]">Categories</h3>
            <button className="text-[13px] font-semibold text-[var(--color-lime-primary)] hover:opacity-80">See all</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
            {[
              { id: 'all', label: 'All', icon: null, active: true },
              { id: 'pizza', label: 'Pizza', icon: images.pizzaCat, active: false },
              { id: 'pasta', label: 'Pasta', icon: images.pastaCat, active: false },
              { id: 'noodles', label: 'Noodles', icon: images.noodlesCat, active: false },
              { id: 'burger', label: 'Burger', icon: images.burgerCat, active: false }
            ].map((cat) => (
              <div key={cat.id} className="flex flex-col items-center gap-2 cursor-pointer shrink-0">
                <div className={`w-[66px] h-[66px] rounded-[22px] flex items-center justify-center transition-colors ${cat.active ? 'bg-[var(--color-lime-primary)] shadow-lg shadow-[#D4FF00]/30' : 'bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-black/5'}`}>
                  {cat.icon ? (
                    <Image src={cat.icon} alt={cat.label} width={38} height={38} className="object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xs font-bold text-black mt-1">All</span>
                  )}
                </div>
                <span className={`text-[12px] font-semibold ${cat.active ? 'text-[var(--color-lime-primary)] drop-shadow-sm' : 'text-zinc-500'}`}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <section className="grid grid-cols-2 gap-4 pb-6">
          
          {/* Card 1 */}
          <Link href="/details" className="bg-white rounded-[28px] p-3 block border border-black/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] relative group cursor-pointer hover:shadow-md transition-shadow">
            <div className="mb-3 aspect-square rounded-[24px] overflow-hidden bg-[var(--color-app-bg)] relative">
              <Image src={images.bbqPizza} alt="BBQ Pizza" fill className="object-cover scale-[1.05]" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-1.5 px-2 pb-1">
              <h4 className="font-bold text-zinc-900 text-[15px]">BBQ Pizza</h4>
              <p className="text-[11px] text-zinc-400 font-medium">7-8 inci</p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-extrabold text-zinc-900 text-[17px]">$40</span>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    // Add to cart logic
                  }}
                  className="bg-[var(--color-lime-primary)] w-8 h-8 rounded-[10px] shadow-sm flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                >
                  <Plus className="h-4 w-4 text-black stroke-[3]" />
                </button>
              </div>
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/details" className="bg-white rounded-[28px] p-3 block border border-black/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] relative group cursor-pointer hover:shadow-md transition-shadow">
            <div className="mb-3 aspect-square rounded-[24px] overflow-hidden bg-[var(--color-app-bg)] relative">
              <Image src={images.pastaItem} alt="Pasta" fill className="object-cover scale-[1.3] translate-y-2 translate-x-1" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-1.5 px-2 pb-1">
              <h4 className="font-bold text-zinc-900 text-[15px]">Pasta</h4>
              <p className="text-[11px] text-zinc-400 font-medium">80-100g</p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-extrabold text-zinc-900 text-[17px]">$20</span>
                <button 
                  onClick={(e) => e.preventDefault()}
                  className="bg-[var(--color-lime-primary)] w-8 h-8 rounded-[10px] shadow-sm flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                >
                  <Plus className="h-4 w-4 text-black stroke-[3]" />
                </button>
              </div>
            </div>
          </Link>
          
           {/* Card 3 (Duplicate for scrolling) */}
           <div className="bg-white rounded-[28px] p-3 block border border-black/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] relative group opacity-50">
            <div className="mb-3 aspect-square rounded-[24px] overflow-hidden bg-zinc-100 relative">
              <Image src={images.bbqPizza} alt="BBQ Pizza" fill className="object-cover scale-[1.05]" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-1.5 px-2 pb-1">
              <h4 className="font-bold text-zinc-900 text-[15px]">BBQ Pizza</h4>
              <p className="text-[11px] text-zinc-400 font-medium">7-8 inci</p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-extrabold text-zinc-900 text-[17px]">$40</span>
                <button className="bg-[var(--color-lime-primary)] w-8 h-8 rounded-[10px] shadow-sm flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4 text-black stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
          
           {/* Card 4 (Duplicate for scrolling) */}
           <div className="bg-white rounded-[28px] p-3 block border border-black/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] relative group opacity-50">
            <div className="mb-3 aspect-square rounded-[24px] overflow-hidden bg-zinc-100 relative">
              <Image src={images.bbqPizzaDetail} alt="BBQ Pizza" fill className="object-cover scale-[1.1]" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-1.5 px-2 pb-1">
              <h4 className="font-bold text-zinc-900 text-[15px]">BBQ Pizza</h4>
              <p className="text-[11px] text-zinc-400 font-medium">7-8 inci</p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-extrabold text-zinc-900 text-[17px]">$40</span>
                <button className="bg-[var(--color-lime-primary)] w-8 h-8 rounded-[10px] shadow-sm flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4 text-black stroke-[3]" />
                </button>
              </div>
            </div>
          </div>

        </section>
      </div>

      {/* Floating Bottom Navigation */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[88%] bg-zinc-900 rounded-full py-4 px-8 flex items-center justify-between shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] z-50">
        <Link href="/" className="text-[var(--color-lime-primary)] flex flex-col items-center group">
          <HomeIcon className="h-[22px] w-[22px] fill-current group-hover:scale-110 transition-transform" />
        </Link>
        <Link href="/cart" className="text-zinc-500 hover:text-zinc-300 transition-colors flex flex-col items-center group">
          <ShoppingBag className="h-[22px] w-[22px] group-hover:scale-110 transition-transform" />
        </Link>
        <button className="text-zinc-500 hover:text-zinc-300 transition-colors flex flex-col items-center group">
          <Heart className="h-[22px] w-[22px] group-hover:scale-110 transition-transform" />
        </button>
        <button className="text-zinc-500 hover:text-zinc-300 transition-colors flex flex-col items-center group">
          <User className="h-[22px] w-[22px] group-hover:scale-110 transition-transform" />
        </button>
      </nav>
    </main>
  );
}
