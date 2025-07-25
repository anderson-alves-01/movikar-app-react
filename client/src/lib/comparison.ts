import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Vehicle, ComparisonState } from '@/types';

interface ComparisonStore extends ComparisonState {
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (vehicleId: number) => void;
  clearComparison: () => void;
  toggleComparison: () => void;
  isVehicleInComparison: (vehicleId: number) => boolean;
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      vehicles: [],
      isOpen: false,
      
      addVehicle: (vehicle: Vehicle) => {
        const { vehicles } = get();
        if (vehicles.length >= 3) {
          return; // Limit to 3 vehicles for comparison
        }
        if (!vehicles.find(v => v.id === vehicle.id)) {
          set({ vehicles: [...vehicles, vehicle] });
        }
      },
      
      removeVehicle: (vehicleId: number) => {
        const { vehicles } = get();
        set({ vehicles: vehicles.filter(v => v.id !== vehicleId) });
      },
      
      clearComparison: () => {
        set({ vehicles: [], isOpen: false });
      },
      
      toggleComparison: () => {
        set(state => ({ isOpen: !state.isOpen }));
      },
      
      isVehicleInComparison: (vehicleId: number) => {
        const { vehicles } = get();
        return vehicles.some(v => v.id === vehicleId);
      },
    }),
    {
      name: 'vehicle-comparison',
    }
  )
);