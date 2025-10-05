/**
 * Script to find the top 3 workers with the most completed shifts
 */
import { PrismaClient } from '@prisma/client';
import { 
  fetchAllShifts, 
  isCompletedShift, 
  getTopItems,
  ShiftCount
} from './utils';

const prisma = new PrismaClient();

/**
 * Gets the top 3 workers with the most completed shifts
 */
async function getTopWorkers(): Promise<ShiftCount[]> {
  try {
    // Fetch all shifts from API
    const shifts = await fetchAllShifts();
    
    // Fetch all workers directly from the database for accurate name mapping
    const dbWorkers = await prisma.worker.findMany();
    
    // Create a map of worker IDs to names
    const workerMap = new Map<number, string>();
    for (const worker of dbWorkers) {
      workerMap.set(worker.id, worker.name);
    }
    
    // Filter for completed shifts
    const completedShifts = shifts.filter(isCompletedShift);
    
    // Count shifts by worker
    const workerCounts = new Map<string, number>();
    
    for (const shift of completedShifts) {
      if (shift.workerId) {
        // Get worker name from our database map
        const workerName = workerMap.get(shift.workerId) || `Worker ${shift.workerId}`;
        
        workerCounts.set(
          workerName, 
          (workerCounts.get(workerName) || 0) + 1
        );
      }
    }
    
    // Get top 3 workers
    return getTopItems(workerCounts, 3);
  } finally {
    // Ensure database connection is closed
    await prisma.$disconnect();
  }
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
