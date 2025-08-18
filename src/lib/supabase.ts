import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock data for development
export const mockData = {
  organizations: [
    { id: '1', name: 'Personnel', type: 'PERSONAL' },
    { id: '2', name: 'SCI Investissement', type: 'SCI' }
  ],
  properties: [
    {
      id: '1',
      label: 'Appartement 3 pièces - Rue de la Paix',
      type: 'APARTMENT',
      address: '12 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      surface: 65,
      organizationId: '1'
    },
    {
      id: '2',
      label: 'Studio - Avenue des Champs',
      type: 'STUDIO',
      address: '45 Avenue des Champs',
      city: 'Paris',
      postalCode: '75008',
      surface: 25,
      organizationId: '1'
    },
    {
      id: '3',
      label: 'Parking souterrain',
      type: 'PARKING',
      address: '12 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      surface: 12,
      organizationId: '1'
    },
    {
      id: '4',
      label: 'Appartement 2 pièces - SCI',
      type: 'APARTMENT',
      address: '78 Boulevard Voltaire',
      city: 'Paris',
      postalCode: '75011',
      surface: 45,
      organizationId: '2'
    }
  ],
  people: [
    {
      id: '1',
      kind: 'TENANT',
      firstName: 'Marie',
      lastName: 'Dubois',
      email: 'marie.dubois@email.com',
      phone: '0123456789',
      organizationId: '1'
    },
    {
      id: '2',
      kind: 'TENANT',
      firstName: 'Pierre',
      lastName: 'Martin',
      email: 'pierre.martin@email.com',
      phone: '0987654321',
      organizationId: '1'
    },
    {
      id: '3',
      kind: 'GUARANTOR',
      firstName: 'Jean',
      lastName: 'Dubois',
      email: 'jean.dubois@email.com',
      phone: '0123456788',
      organizationId: '1'
    }
  ],
  leases: [
    {
      id: '1',
      unitId: '1',
      tenantId: '1',
      startDate: '2024-01-01',
      rentHC: 1200,
      charges: 200,
      depositAmount: 1200,
      status: 'ACTIVE'
    },
    {
      id: '2',
      unitId: '2',
      tenantId: '2',
      startDate: '2024-02-01',
      rentHC: 800,
      charges: 100,
      depositAmount: 800,
      status: 'ACTIVE'
    }
  ],
  rentInvoices: [
    {
      id: '1',
      leaseId: '1',
      periodMonth: 12,
      periodYear: 2024,
      amountHC: 1200,
      charges: 200,
      total: 1400,
      status: 'PAID'
    },
    {
      id: '2',
      leaseId: '2',
      periodMonth: 12,
      periodYear: 2024,
      amountHC: 800,
      charges: 100,
      total: 900,
      status: 'DUE'
    }
  ],
  tickets: [
    {
      id: '1',
      unitId: '1',
      title: 'Fuite dans la salle de bain',
      description: 'Une fuite est apparue sous le lavabo',
      priority: 'HIGH',
      status: 'IN_PROGRESS'
    },
    {
      id: '2',
      unitId: '2',
      title: 'Problème de chauffage',
      description: 'Le radiateur ne chauffe plus',
      priority: 'MEDIUM',
      status: 'NEW'
    }
  ]
}