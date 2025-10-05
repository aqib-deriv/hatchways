import axios from 'axios';

interface Shift {
  id: number;
  createdAt: string;
  startAt: string;
  endAt: string;
  jobType: string;
  workplaceId: number;
  workerId: number | null;
  cancelledAt: string | null;
}

interface Worker {
  id: number;
  name: string;
  status: number;
}

interface PaginatedResponse<T> {
  data: T[];
  links: { next?: string };
}

interface WorkerShiftCount {
  name: string;
  shifts: number;
}

/**
 * Fetches all shifts from the API
 * @returns Array of all shifts
 */
async function fetchAllShifts(): Promise<Shift[]> {
  const allShifts: Shift[] = [];
  let url = 'http://localhost:3000/shifts';
  
  while (url) {
    try {
      const response = await axios.get<PaginatedResponse<Shift>>(url);
      allShifts.push(...response.data.data);
      
      // Check if there's a next page
      url = response.data.links.next || '';
    } catch (error) {
      console.error('Error fetching shifts:', error);
      break;
    }
  }
  
  return allShifts;
}

/**
 * Fetches all workers from the API
 * @returns Array of all workers
 */
async function fetchAllWorkers(): Promise<Worker[]> {
  const allWorkers: Worker[] = [];
  let url = 'http://localhost:3000/workers';
  
  while (url) {
    try {
      const response = await axios.get<PaginatedResponse<Worker>>(url);
      allWorkers.push(...response.data.data);
      
      // Check if there's a next page
      url = response.data.links.next || '';
    } catch (error) {
      console.error('Error fetching workers:', error);
      break;
    }
  }
  
  return allWorkers;
}

/**
 * Determines if a shift is completed
 * A shift is considered completed if:
 * - It has a workerId (was claimed)
 * - It is not cancelled (cancelledAt is null)
 * - The end time is in the past
 */
function isCompletedShift(shift: Shift): boolean {
  return (
    shift.workerId !== null && 
    shift.cancelledAt === null &&
    new Date(shift.endAt) < new Date()
  );
}

/**
 * Gets the top 3 workers with the most completed shifts
 */
async function getTopWorkers(): Promise<WorkerShiftCount[]> {
  // Fetch all shifts and workers
  const [shifts, workers] = await Promise.all([
    fetchAllShifts(),
    fetchAllWorkers()
  ]);
  
  // Create a map of worker IDs to names
  const workerMap = new Map<number, string>();
  for (const worker of workers) {
    workerMap.set(worker.id, worker.name);
  }
  
  // Filter for completed shifts
  const completedShifts = shifts.filter(isCompletedShift);
  
  // Count shifts by worker
  const workerCounts = new Map<string, number>();
  
  for (const shift of completedShifts) {
    if (shift.workerId) {
      const workerName = workerMap.get(shift.workerId) || `Worker ${shift.workerId}`;
      workerCounts.set(
        workerName, 
        (workerCounts.get(workerName) || 0) + 1
      );
    }
  }
  
  // Convert to array, sort by count (descending), and take top 3
  const topWorkers = Array.from(workerCounts.entries())
    .map(([name, shifts]) => ({ name, shifts }))
    .sort((a, b) => b.shifts - a.shifts)
    .slice(0, 3);
  
  return topWorkers;
}

// Main execution
async function main() {
  try {
    const topWorkers = await getTopWorkers();
    console.log(JSON.stringify(topWorkers, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
