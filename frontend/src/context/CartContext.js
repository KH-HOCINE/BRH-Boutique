import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const exists = state.items.find(
        i => i.product === action.payload.product &&
             i.size    === action.payload.size &&
             i.color   === action.payload.color
      );
      if (exists) {
        return {
          ...state,
          items: state.items.map(i =>
            i === exists ? { ...i, quantity: i.quantity + action.payload.quantity } : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((_, idx) => idx !== action.payload) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map((item, idx) =>
          idx === action.payload.index ? { ...item, quantity: action.payload.quantity } : item
        ),
      };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] });

  const total    = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, dispatch, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
