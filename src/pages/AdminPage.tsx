import { useState } from 'react';
import type { FormEvent } from 'react';
import { AdminFleetTable, AdminVehicleForm } from '../components/admin/AdminFleet';
import { validateVehicleInput } from '../data/vehicles';
import { useAuth } from '../hooks/useAuth';
import { useFleet } from '../hooks/useFleet';
import type { Vehicle } from '../types';

const blankForm = {
  marca: '',
  modelo: '',
  categoria: 'sedan' as Vehicle['categoria'],
  transmision: 'Automático' as Vehicle['transmision'],
  precioDia: 0,
  imagen: '/assets/img/camry.png',
};
type VehicleForm = Omit<Vehicle, 'id'>;

export function AdminPage() {
  const { fleet, addVehicle, updateVehicle, removeVehicle } = useFleet();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [form, setForm] = useState<VehicleForm>(blankForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) return;
    const validationErrors = validateVehicleInput(form);
    if (validationErrors.length) {
      setNotice(validationErrors.join(' '));
      return;
    }
    const vehicleData = { ...form, marca: form.marca.trim(), modelo: form.modelo.trim() };
    if (editingId === null) {
      addVehicle(vehicleData);
      setNotice('El vehículo se agregó a la flota.');
    } else {
      updateVehicle({ ...vehicleData, id: editingId });
      setNotice('Los cambios del vehículo se guardaron.');
    }
    setForm(blankForm);
    setEditingId(null);
  };

  const deleteVehicle = (vehicle: Vehicle) => {
    if (!isAdmin) return;
    if (window.confirm(`¿Eliminar ${vehicle.marca} ${vehicle.modelo} de la flota?`)) {
      removeVehicle(vehicle.id);
      if (editingId === vehicle.id) {
        setEditingId(null);
        setForm(blankForm);
      }
      setNotice('El vehículo fue eliminado de la flota.');
    }
  };

  const editVehicle = (vehicle: Vehicle) => {
    if (!isAdmin) return;
    setEditingId(vehicle.id);
    setForm({
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      categoria: vehicle.categoria,
      transmision: vehicle.transmision,
      precioDia: vehicle.precioDia,
      imagen: vehicle.imagen,
    });
    setNotice('');
  };

  const changeField = (field: keyof VehicleForm, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankForm);
    setNotice('');
  };

  return (
    <main className="container py-5 flex-grow-1">
      <header className="mb-4">
        <p className="eyebrow mb-2">GESTIÓN DE FLOTA</p>
        <h1 className="h2">
          {isAdmin ? 'Panel de Administración' : 'Panel de Vendedor'}
        </h1>
      </header>

      {!isAdmin && (
        <div className="alert alert-warning" role="status">
          Modo Vendedor: solo visualización de flota y órdenes.
        </div>
      )}

      {notice && (
        <div className="alert alert-info" role="status">
          {notice}
        </div>
      )}

      <div className="row g-4">
        {isAdmin && (
          <AdminVehicleForm
            form={form}
            editing={editingId !== null}
            onChange={changeField}
            onSubmit={submit}
            onCancel={cancelEdit}
          />
        )}
        <AdminFleetTable
          vehicles={fleet}
          onEdit={isAdmin ? editVehicle : () => {}}
          onDelete={isAdmin ? deleteVehicle : () => {}}
        />
      </div>
    </main>
  );
}