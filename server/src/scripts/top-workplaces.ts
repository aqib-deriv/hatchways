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

interface Workplace {
  id: number;
  name: string;
  status: number;
  location: string;
}

interface PaginatedResponse<T> {
  data: T[];
  links: { next?: string };
}

interface WorkplaceShiftCount {
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
 * Fetches all workplaces from the API
 * @returns Array of all workplaces
 */
async function fetchAllWorkplaces(): Promise<Workplace[]> {
  const allWorkplaces: Workplace[] = [];
  let url = 'http://localhost:3000/workplaces';
  
  while (url) {
    try {
      const response = await axios.get<PaginatedResponse<Workplace>>(url);
      allWorkplaces.push(...response.data.data);
      
      // Check if there's a next page
      url = response.data.links.next || '';
    } catch (error) {
      console.error('Error fetching workplaces:', error);
      break;
    }
  }
  
  return allWorkplaces;
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
 * Gets the top 3 workplaces with the most completed shifts
 */
async function getTopWorkplaces(): Promise<WorkplaceShiftCount[]> {
  // Fetch all shifts and workplaces
  const [shifts, workplaces] = await Promise.all([
    fetchAllShifts(),
    fetchAllWorkplaces()
  ]);
  
  // Create a map of workplace IDs to names
  const workplaceMap = new Map<number, string>();
  for (const workplace of workplaces) {
    workplaceMap.set(workplace.id, workplace.name);
  }
  
  // Filter for completed shifts
  const completedShifts = shifts.filter(isCompletedShift);
  
  // Count shifts by workplace
  const workplaceCounts = new Map<string, number>();
  
  for (const shift of completedShifts) {
    const workplaceName = workplaceMap.get(shift.workplaceId) || `Workplace ${shift.workplaceId}`;
    workplaceCounts.set(
      workplaceName, 
      (workplaceCounts.get(workplaceName) || 0) + 1
    );
  }
  
  // Convert to array, sort by count (descending), and take top 3
  const topWorkplaces = Array.from(workplaceCounts.entries())
    .map(([name, shifts]) => ({ name, shifts }))
    .sort((a, b) => b.shifts - a.shifts)
    .slice(0, 3);
  
  return topWorkplaces;
}

// Main execution
async function main() {
  try {
    const topWorkplaces = await getTopWorkplaces();
    console.log(JSON.stringify(topWorkplaces, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
