/**
 * Script to find the top 3 workplaces with the most completed shifts
 */
import { 
  fetchAllShifts, 
  fetchAllWorkplaces, 
  isCompletedShift, 
  createNameMap, 
  getTopItems,
  ShiftCount
} from './utils';

/**
 * Gets the top 3 workplaces with the most completed shifts
 */
async function getTopWorkplaces(): Promise<ShiftCount[]> {
  // Fetch all shifts and workplaces
  const [shifts, workplaces] = await Promise.all([
    fetchAllShifts(),
    fetchAllWorkplaces()
  ]);
  
  // Create a map of workplace IDs to names
  const workplaceMap = createNameMap(workplaces);
  
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
  
  // Get top 3 workplaces
  return getTopItems(workplaceCounts, 3);
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
