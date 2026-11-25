export interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  categoria: 'sedan' | 'suv' | 'deportivo' | 'camioneta';
  transmision: 'Automático' | 'Manual';
  precioDia: number;
  imagen: string;
}


export interface CartItem extends Vehicle {
  dias: number;
}

export interface RentalOrder {
  code: string;
  createdAt: string;
  customer: { name: string; surname: string; email: string };
  delivery: { method: 'pickup' | 'home'; branch: string; street: string; apartment: string; region: string; commune: string; notes: string };
  items: CartItem[];
  total: number;
  status: 'approved' | 'rejected';
}

export type UserRole = 'cliente' | 'vendedor' | 'admin' | null;

export interface AuthResponse {
  token: string;
  nombre: string;
  apellido: string;
  correo: string;
  role: Exclude<UserRole, null>;
}
export type DeliveryDetails = RentalOrder['delivery'];
