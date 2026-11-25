import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createVehicle,
  deleteVehicle,
  deserializeVehicles,
  serializeVehicles,
  updateVehicle as updateVehicleData,
  vehicles as defaultVehicles,
} from '../data/vehicles';
import { apiFetch } from '../services/api';
import type { Vehicle } from '../types';
import { FleetContext } from './fleet-store';

const FLEET_KEY = 'bgs_flota';

interface BackendVehicle {
  id: number;
  marca: string;
  modelo: string;
  patente?: string;
  anio?: number;
  color?: string;
  kilometraje?: number;
  fechaIngreso?: string;
  categoriaId?: number;
  categoria?: string | { id?: number; nombre?: string };
  transmision?: string;
  precioArriendoDiario?: number;
  precioDiario?: number;
  precioDia?: number;
  disponible?: boolean;
  imagen?: string;
}

const DEFAULT_IMAGES: Record<Vehicle['categoria'], string> = {
  sedan: '/assets/img/camry.png',
  deportivo: '/assets/img/mustang.png',
  suv: '/assets/img/suburvan.png',
  camioneta: '/assets/img/ram.png',
};

const CATEGORY_TO_ID: Record<Vehicle['categoria'], number> = {
  sedan: 1,
  suv: 2,
  deportivo: 3,
  camioneta: 4,
};

function normalizeImagePath(image?: string, categoria: Vehicle['categoria'] = 'sedan') {
  if (!image) return DEFAULT_IMAGES[categoria];
  return image.startsWith('/') || image.startsWith('http') ? image : `/${image.replace(/^\.\//, '')}`;
}

function normalizeCategory(raw?: string | { id?: number; nombre?: string }): Vehicle['categoria'] {
  const value = (typeof raw === 'string' ? raw : raw?.nombre ?? '').toLowerCase();
  if (value.includes('suv')) return 'suv';
  if (value.includes('deport')) return 'deportivo';
  if (value.includes('camion') || value.includes('pickup')) return 'camioneta';
  return 'sedan';
}

function mapFromBackend(item: BackendVehicle): Vehicle {
  const categoria = normalizeCategory(item.categoria);
  return {
    id: item.id,
    marca: item.marca ?? 'Sin marca',
    modelo: item.modelo ?? 'Sin modelo',
    categoria,
    transmision: item.transmision === 'Manual' ? 'Manual' : 'Automático',
    precioDia: Number(item.precioArriendoDiario ?? item.precioDia ?? item.precioDiario ?? 50000),
    imagen: normalizeImagePath(item.imagen, categoria),
  };
}

function readFleet(): Vehicle[] {
  try {
    const parsed = deserializeVehicles(localStorage.getItem(FLEET_KEY), defaultVehicles);
    return parsed.map((vehicle) => ({
      ...vehicle,
      transmision: vehicle.transmision === 'Manual' ? 'Manual' : 'Automático',
      imagen: normalizeImagePath(vehicle.imagen, vehicle.categoria),
    }));
  } catch {
    return deserializeVehicles(null, defaultVehicles);
  }
}

export function FleetProvider({ children }: { children: ReactNode }) {
  const [fleet, setFleet] = useState<Vehicle[]>(readFleet);
  const rawBackendMap = useRef<Record<number, BackendVehicle>>({});

  useEffect(() => {
    let active = true;
    apiFetch<BackendVehicle[]>('/api/v1/vehiculos')
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          const map: Record<number, BackendVehicle> = {};
          data.forEach((item) => {
            map[item.id] = item;
          });
          rawBackendMap.current = map;
          setFleet(data.map(mapFromBackend));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(FLEET_KEY, serializeVehicles(fleet));
  }, [fleet]);

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    setFleet((current) => createVehicle(current, vehicle));
    const randomPlate = `BG${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().slice(0, 10);

    apiFetch<BackendVehicle>('/api/v1/vehiculos', {
      method: 'POST',
      body: JSON.stringify({
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        patente: randomPlate,
        anio: 2025,
        color: 'Negro',
        kilometraje: 0,
        fechaIngreso: today,
        categoriaId: CATEGORY_TO_ID[vehicle.categoria] ?? 1,
        precioArriendoDiario: vehicle.precioDia,
        disponible: true,
      }),
    })
      .then((created) => {
        if (created?.id) {
          rawBackendMap.current[created.id] = created;
          setFleet((current) =>
            current.map((v) =>
              v.marca === vehicle.marca && v.modelo === vehicle.modelo ? mapFromBackend(created) : v
            )
          );
        }
      })
      .catch(() => {});
  };

  const updateVehicle = (updated: Vehicle) => {
    setFleet((current) => updateVehicleData(current, updated));
    const original = rawBackendMap.current[updated.id];
    const today = new Date().toISOString().slice(0, 10);

    apiFetch<BackendVehicle>(`/api/v1/vehiculos/${updated.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        marca: updated.marca,
        modelo: updated.modelo,
        patente: original?.patente ?? `BG${String(updated.id).padStart(4, '0')}`,
        anio: original?.anio ?? 2024,
        color: original?.color ?? 'Negro',
        kilometraje: original?.kilometraje ?? 10000,
        fechaIngreso: original?.fechaIngreso ?? today,
        categoriaId: original?.categoriaId ?? CATEGORY_TO_ID[updated.categoria] ?? 1,
        precioArriendoDiario: updated.precioDia,
        disponible: original?.disponible ?? true,
      }),
    })
      .then((saved) => {
        if (saved?.id) rawBackendMap.current[saved.id] = saved;
      })
      .catch(() => {});
  };

  const removeVehicle = (id: number) => {
    setFleet((current) => deleteVehicle(current, id));
    delete rawBackendMap.current[id];
    apiFetch(`/api/v1/vehiculos/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  return (
    <FleetContext.Provider value={{ fleet, addVehicle, updateVehicle, removeVehicle }}>
      {children}
    </FleetContext.Provider>
  );
}