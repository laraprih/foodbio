import { useCartStore, SelectedOption } from '@/store/cart-store';
import useSessionStore from '@/store/session-store';

export const useCart = () => {
  const { 
    items, 
    restaurantId, 
    restaurantSlug, 
    addItem, 
    removeItem, 
    updateQty, 
    clearCart 
  } = useCartStore();
  
  const { tenant } = useSessionStore();

  const isEmpty = items.length === 0;
  const count = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = items.reduce((acc, item) => acc + item.itemTotal, 0);
  
  // Placeholder logic for delivery fee
  const deliveryFee = 5.99; 
  const cartTotal = cartSubtotal + deliveryFee;

  const addToCart = (
    product: { id: string; name: string; price: number; imageUrl: string | null },
    options: SelectedOption[],
    resId: string,
    resSlug: string
  ) => {
    try {
      addItem(product, options, resId, resSlug);
      return { success: true };
    } catch (error: any) {
      if (error.message.includes("outro restaurante")) {
        return { needsConfirm: true, message: error.message };
      }
      throw error;
    }
  };

  return {
    items,
    total: cartTotal,
    count,
    isEmpty,
    restaurantId,
    restaurantSlug,
    addToCart,
    removeFromCart: removeItem,
    updateQuantity: updateQty,
    clearCart,
    cartSubtotal,
    deliveryFee,
  };
};
