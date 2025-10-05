/**
 * Shared utility functions and types for scripts
 */
import axios from 'axios';

/**
 * Common interfaces used across scripts
 */
export interface Shift {
  id: number;
  createdAt: string;
  startAt: string;
  endAt: string;
  jobType: string;
  workplaceId: number;
  workerId: number | null;
  cancelledAt: string | null;
}

export interface Workplace {
  id: number;
  name: string;
  status: number;
  location: string;
}

export interface Worker {
  id: number;
  name: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: { next?: string };
}

export interface ShiftCount {
  name: string;
  shifts: number;
}

/**
 * Base URL for API requests
 */
export const API_BASE_URL = 'http://localhost:3000';

/**
 * Determines if a shift is completed
 * A shift is considered completed if:
 * - It has a workerId (was claimed)
 * - It is not cancelled (cancelledAt is null)
 * - The end time is in the past
 * 
 * @param shift The shift to check
 * @returns boolean indicating if the shift is completed
 */
export function isCompletedShift(shift: Shift): boolean {
  return (
    shift.workerId !== null && 
    shift.cancelledAt === null &&
    new Date(shift.endAt) < new Date()
  );
}

/**
 * Generic function to fetch all items from a paginated API endpoint
 * 
 * @param endpoint The API endpoint to fetch from
 * @returns Promise resolving to an array of items
 */
export async function fetchAllItems<T>(endpoint: string): Promise<T[]> {
  const allItems: T[] = [];
  let url = `${API_BASE_URL}${endpoint}`;
  
  while (url) {
    try {
      const response = await axios.get<PaginatedResponse<T>>(url);
      allItems.push(...response.data.data);
      
      // Check if there's a next page
      url = response.data.links.next || '';
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      break;
    }
  }
  
  return allItems;
}

/**
 * Fetches all shifts from the API
 * 
 * @returns Promise resolving to an array of all shifts
 */
export async function fetchAllShifts(): Promise<Shift[]> {
  return fetchAllItems<Shift>('/shifts');
}

/**
 * Fetches all workplaces from the API
 * 
 * @returns Promise resolving to an array of all workplaces
 */
export async function fetchAllWorkplaces(): Promise<Workplace[]> {
  return fetchAllItems<Workplace>('/workplaces');
}

/**
 * Fetches all workers from the API
 * 
 * @returns Promise resolving to an array of all workers
 */
export async function fetchAllWorkers(): Promise<Worker[]> {
  return fetchAllItems<Worker>('/workers');
}

/**
 * Creates a map of IDs to names from an array of items
 * 
 * @param items Array of items with id and name properties
 * @returns Map of IDs to names
 */
export function createNameMap<T extends { id: number; name: string }>(items: T[]): Map<number, string> {
  const nameMap = new Map<number, string>();
  for (const item of items) {
    nameMap.set(item.id, item.name);
  }
  return nameMap;
}

/**
 * Gets the top N items with the most shifts
 * 
 * @param shiftCounts Map of names to shift counts
 * @param limit Number of top items to return
 * @returns Array of top items sorted by shift count
 */
export function getTopItems(shiftCounts: Map<string, number>, limit: number): ShiftCount[] {
  return Array.from(shiftCounts.entries())
    .map(([name, shifts]) => ({ name, shifts }))
    .sort((a, b) => b.shifts - a.shifts)
    .slice(0, limit);
}
