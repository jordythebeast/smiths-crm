export type JobStatus = 'checked_in' | 'in_progress' | 'ready' | 'checked_out'
export type JobType = 'service' | 'buy_sell'

export interface Task {
  id: string
  job_id: string
  title: string
  due_date: string | null
  completed: boolean
  created_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Bike {
  id: string
  customer_id: string | null
  make: string
  model: string
  year: number | null
  registration: string | null
  color: string | null
  vin: string | null
  notes: string | null
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface Job {
  id: string
  job_number: number
  bike_id: string | null
  customer_id: string | null
  status: JobStatus
  job_type: JobType
  check_in_date: string
  check_out_date: string | null
  customer_description: string | null
  work_performed: string | null
  damage_notes: string | null
  estimated_cost: number | null
  parts_cost: number | null
  labour_cost: number | null
  tax_rate: number | null
  final_cost: number | null
  odometer_in: number | null
  odometer_out: number | null
  customer_acknowledged: boolean
  created_at: string
  updated_at: string
  bike?: Bike
  customer?: Customer
  photos?: JobPhoto[]
  tasks?: Task[]
}

export interface JobPhoto {
  id: string
  job_id: string
  storage_path: string
  public_url: string | null
  caption: string | null
  photo_type: 'check_in' | 'check_out' | 'damage' | 'work'
  created_at: string
}
