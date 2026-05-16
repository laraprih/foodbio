import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SelectedOption {
  optionId: string;
  name: string;
  price: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  selectedOptions: SelectedOption[];
  itemTotal: number;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantSlug: string | null;
  
  addItem: (
    product: { id: string; name: string; price: number; imageUrl: string | null },
    options: SelectedOption[],
    restaurantId: string,
    restaurantSlug: string
  ) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setRestaurant: (id: string, slug: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantSlug: null,

      addItem: (product, options, restaurantId, restaurantSlug) => {
        const { items, restaurantId: currentRestaurantId } = get();

        if (currentRestaurantId && currentRestaurantId !== restaurantId && items.length > 0) {
          throw new Error("Você já tem itens de outro restaurante no carrinho. Limpe o carrinho antes de continuar.");
        }

        const optionsPrice = options.reduce((acc, opt) => acc + opt.price, 0);
        const itemTotal = (product.price + optionsPrice);

        const existingItemIndex = items.findIndex(
          (item) =>
            item.productId === product.id &&
            JSON.stringify(item.selectedOptions) === JSON.stringify(options)
        );

        if (existingItemIndex > -1) {
          const newItems = [...items];
          newItems[existingItemIndex].quantity += 1;
          newItems[existingItemIndex].itemTotal = (product.price + optionsPrice) * newItems[existingItemIndex].quantity;
          set({ items: newItems, restaurantId, restaurantSlug });
        } else {
          const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
            selectedOptions: options,
            itemTotal: itemTotal,
          };
          set({ items: [...items, newItem], restaurantId, restaurantSlug });
        }
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.productId !== productId);
        set({ 
          items: newItems,
          restaurantId: newItems.length === 0 ? null : get().restaurantId,
          restaurantSlug: newItems.length === 0 ? null : get().restaurantSlug
        });
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }

        const newItems = get().items.map((item) => {
          if (item.productId === productId) {
            const optionsPrice = item.selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
            return {
              ...item,
              quantity: qty,
              itemTotal: (item.price + optionsPrice) * qty,
            };
          }
          return item;
        });

        set({ items: newItems });
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantSlug: null }),

      setRestaurant: (id, slug) => set({ restaurantId: id, restaurantSlug: slug }),
    }),
    {
      name: 'foodbio-cart-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantSlug: state.restaurantSlug,
      }),
      version: 1,
    }
  )
);

export const useCartItems = () => useCartStore((state) => state.items);
export const useCartTotal = () =>
  useCartStore((state) => state.items.reduce((acc, item) => acc + item.itemTotal, 0));
export const useCartCount = () =>
  useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));
export const useCartRestaurant = () => ({
  id: useCartStore((state) => state.restaurantId),
  slug: useCartStore((state) => state.restaurantSlug),
});
