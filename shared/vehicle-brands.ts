// Vehicle brands data
export const defaultBrands = [
  'Audi', 'BMW', 'Chevrolet', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai', 
  'Jeep', 'Kia', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Peugeot', 'Renault', 
  'Subaru', 'Suzuki', 'Toyota', 'Volkswagen', 'Volvo'
];

export interface VehicleBrand {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: Date;
}