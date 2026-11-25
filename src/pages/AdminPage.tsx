import { useState } from 'react';
import type { FormEvent } from 'react';
import { AdminFleetTable, AdminVehicleForm } from '../components/admin/AdminFleet';
import { validateVehicleInput } from '../data/vehicles';
import { useAuth } from '../hooks/useAuth';
import { useFleet } from '../hooks/useFleet';
import type { RentalOrder, Vehicle } from '../types';

const blankForm = {
  marca: '',
  modelo: '',
  categoria: 'sedan' as Vehicle['categoria'],
  transmision: 'Automático' as Vehicle['transmision'],
  precioDia: 0,
  imagen: '/assets/img/camry.png',
};
type VehicleForm = Omit<Vehicle, 'id'>;

function readOrders(): RentalOrder[] {
  try {
    return JSON.parse(localStorage.getItem('bgs_ordenes') || '[]') as RentalOrder[];
  } catch {
    return [];
  }
}

function formatOrderItems(items: RentalOrder['items']) {
  return items
    .map((item) => {
      const rec = item as unknown as Record<string, unknown>;
      const nested = rec.vehicle as Record<string, unknown> | undefined;
      const marca = (rec.marca ?? nested?.marca ?? '') as string;
      const modelo = (rec.modelo ?? nested?.modelo ?? '') as string;
      const days = (rec.days ?? rec.dias ?? rec.cantidad ?? 1) as number;
      const label = `${marca} ${modelo}`.trim() || 'Vehículo';
      return `${label} (${days}d)`;
    })
    .join(', ');
}

export function AdminPage() {
  const { fleet, addVehicle, updateVehicle, removeVehicle } = useFleet();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [form, setForm] = useState<VehicleForm>(blankForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [orders] = useState<RentalOrder[]>(readOrders);

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
    setNotice('Edición cancelada.');
  };

  return (
    <main className="container py-5 flex-grow-1">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <p className="eyebrow mb-2">GESTIÓN DE FLOTA</p>
          <h1 className="h2 mb-0">
            {isAdmin ? 'Panel de control' : 'Panel de Vendedor'}
          </h1>
        </div>
        <span className="badge text-bg-secondary">{fleet.length} vehículos</span>
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

      <section className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Órdenes registradas</h2>
          <span className="badge text-bg-dark">{orders.length} órdenes</span>
        </div>
        {orders.length === 0 ? (
          <p className="text-white-50 mb-0">Aún no hay órdenes registradas.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Detalle</th>
                  <th>Entrega</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.code}>
                    <td>{order.code}</td>
                    <td>
                      {order.customer.name} {order.customer.surname}
                      <div className="small text-white-50">{order.customer.email}</div>
                    </td>
                    <td>{formatOrderItems(order.items)}</td>
                    <td>
                      {order.delivery.method === 'pickup' ? 'Retiro' : 'Despacho'} ({order.delivery.branch})
                    </td>
                    <td>${order.total.toLocaleString('es-CL')}</td>
                    <td>
                      <span className="badge text-bg-success">Aprobada</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}