import Image from 'next/image';
import Link from 'next/link';
import { images } from '@/lib/data';
import { ArrowLeft, MoreVertical, Minus, Plus, Trash2 } from 'lucide-react';

export default function Cart() {
  return (
    <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative bg-[#fcfcfc]">
      
      {/* iOS Status Bar Mock (optional, but matching design closely) */}
      <div className="flex justify-between items-center px-8 pt-4 pb-2">
        <span className="text-[13px] font-bold tracking-tight">9:41</span>
        <div className="flex items-center space-x-1.5 opacity-80">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21L22 4C22 4 19 2 12 2C5 2 2 4 2 4L12 21Z" />
          </svg>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21H21V1C21 1 1 21 1 21Z" />
          </svg>
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 6H20V18H17V6ZM4 10H7V18H4V10ZM10.5 3H13.5V18H10.5V3Z" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 relative z-10 bg-[#fcfcfc]">
        <Link 
          href="/"
          className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-black/5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-gray-800" strokeWidth={2.5} />
        </Link>
        <h1 className="text-[17px] font-bold text-gray-900">My Cart</h1>
        <button className="w-[42px] h-[42px] flex items-center justify-end text-gray-800">
          <MoreVertical className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </header>

      {/* Cart Content Area */}
      <div className="px-6 flex-1 pb-48 pt-2">
        {/* Cart Stats & Select All */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-[17px] font-extrabold text-gray-900">8 items</span>
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                id="selectAll" 
                defaultChecked
                className="peer appearance-none w-[22px] h-[22px] bg-black rounded cursor-pointer checked:bg-black transition-colors border-none ring-0 outline-none"
              />
              <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <label htmlFor="selectAll" className="text-sm font-semibold text-gray-800 cursor-pointer">Select all</label>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="space-y-4">
          
          {/* Item 1 */}
          <div className="bg-white rounded-[28px] p-3.5 flex items-center gap-3.5 relative shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] border border-black/5">
            <div className="relative flex items-center justify-center shrink-0">
              <input type="checkbox" defaultChecked className="peer appearance-none w-[20px] h-[20px] bg-black rounded-[6px] cursor-pointer checked:bg-black transition-colors" />
              <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <div className="w-[84px] h-[84px] bg-[#fcf9f2] rounded-[22px] overflow-hidden shrink-0 relative border border-black/[0.02]">
              <Image src={images.cartBbqPizza1} alt="BBQ Pizza" fill className="object-cover scale-[1.05]" referrerPolicy="no-referrer" />
            </div>
            
            <div className="flex-1 py-1 pr-2">
              <h3 className="text-[15px] font-bold text-gray-900 leading-tight">BBQ Pizza</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5 mb-2.5">8 Inci</p>
              
              <div className="flex justify-between items-center">
                <span className="text-[15px] font-extrabold text-gray-900">$40.00</span>
                <div className="flex items-center gap-3.5 bg-gray-50/80 border border-gray-100 rounded-full px-2.5 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                  <button className="text-gray-400 hover:text-gray-600 active:scale-95 transition-all"><Minus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                  <span className="text-[13px] font-extrabold text-gray-900 w-3 text-center">1</span>
                  <button className="w-[22px] h-[22px] bg-[#bef264] rounded-full flex items-center justify-center text-zinc-800 shadow-sm active:scale-95 transition-all">
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
            
            <button className="absolute top-[18px] right-[18px] text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 className="w-[15px] h-[15px]" strokeWidth={2.5} />
            </button>
          </div>

          {/* Item 2 */}
          <div className="bg-white rounded-[28px] p-3.5 flex items-center gap-3.5 relative shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] border border-black/5">
            <div className="relative flex items-center justify-center shrink-0">
              <input type="checkbox" defaultChecked className="peer appearance-none w-[20px] h-[20px] bg-black rounded-[6px] cursor-pointer checked:bg-black transition-colors" />
              <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <div className="w-[84px] h-[84px] bg-[#221010] rounded-[22px] overflow-hidden shrink-0 relative border border-black/[0.02]">
              <Image src={images.cartBbqPizza2} alt="BBQ Pizza" fill className="object-cover scale-[1.1] translate-y-1" referrerPolicy="no-referrer" />
            </div>
            
            <div className="flex-1 py-1 pr-2">
              <h3 className="text-[15px] font-bold text-gray-900 leading-tight">BBQ Pizza</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5 mb-2.5">80 g</p>
              
              <div className="flex justify-between items-center">
                <span className="text-[15px] font-extrabold text-gray-900">$20.00</span>
                <div className="flex items-center gap-3.5 bg-gray-50/80 border border-gray-100 rounded-full px-2.5 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                  <button className="text-gray-400 hover:text-gray-600 active:scale-95 transition-all"><Minus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                  <span className="text-[13px] font-extrabold text-gray-900 w-3 text-center">1</span>
                  <button className="w-[22px] h-[22px] bg-[#bef264] rounded-full flex items-center justify-center text-zinc-800 shadow-sm active:scale-95 transition-all">
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
            
            <button className="absolute top-[18px] right-[18px] text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 className="w-[15px] h-[15px]" strokeWidth={2.5} />
            </button>
          </div>

          {/* Item 3 */}
          <div className="bg-white rounded-[28px] p-3.5 flex items-center gap-3.5 relative shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] border border-black/5">
            <div className="relative flex items-center justify-center shrink-0">
              <input type="checkbox" defaultChecked className="peer appearance-none w-[20px] h-[20px] bg-black rounded-[6px] cursor-pointer checked:bg-black transition-colors" />
              <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <div className="w-[84px] h-[84px] bg-[#221010] rounded-[22px] overflow-hidden shrink-0 relative border border-black/[0.02]">
              <Image src={images.cartNoodles} alt="Noodies" fill className="object-cover scale-[1.05]" referrerPolicy="no-referrer" />
            </div>
            
            <div className="flex-1 py-1 pr-2">
              <h3 className="text-[15px] font-bold text-gray-900 leading-tight">Noodies</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5 mb-2.5">80 g</p>
              
              <div className="flex justify-between items-center">
                <span className="text-[15px] font-extrabold text-gray-900">$30.00</span>
                <div className="flex items-center gap-3.5 bg-gray-50/80 border border-gray-100 rounded-full px-2.5 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                  <button className="text-gray-400 hover:text-gray-600 active:scale-95 transition-all"><Minus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                  <span className="text-[13px] font-extrabold text-gray-900 w-3 text-center">1</span>
                  <button className="w-[22px] h-[22px] bg-[#bef264] rounded-full flex items-center justify-center text-zinc-800 shadow-sm active:scale-95 transition-all">
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
            
            <button className="absolute top-[18px] right-[18px] text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 className="w-[15px] h-[15px]" strokeWidth={2.5} />
            </button>
          </div>

        </div>
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[40px] px-8 pt-6 pb-6 shadow-[0_-15px_30px_rgba(0,0,0,0.04)] z-50">
        <div className="space-y-2.5 mb-7 px-1">
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-gray-500 font-semibold">Subtotal:</span>
            <span className="font-extrabold text-gray-900">$1,000</span>
          </div>
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-gray-500 font-semibold">Delivery:</span>
            <span className="font-extrabold text-gray-900">$10.00</span>
          </div>
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-gray-500 font-semibold">Discount:</span>
            <span className="font-extrabold text-[#9acc28]">-$30.00</span>
          </div>
        </div>
        
        <button className="w-full py-4 bg-[#1a1a1a] text-white rounded-[20px] text-[15px] font-bold shadow-[0_8px_20px_-8px_rgba(26,26,26,0.6)] active:scale-95 transition-transform flex items-center justify-center">
          Checkout
        </button>
      </div>

    </main>
  );
}
