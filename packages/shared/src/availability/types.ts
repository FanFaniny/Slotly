export interface TimeInterval {
  startsAt: Date;
  endsAt: Date;
}

export interface AvailableSlot {
  startsAt: string;
  endsAt: string;
}

export interface WorkScheduleBlockInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AvailabilitySettings {
  bufferMin: number;
  minAdvanceHours: number;
  horizonDays: number;
}

export interface AvailabilityServiceInput {
  durationMin: number;
}

export interface ComputeAvailabilityInput {
  timezone: string;
  settings: AvailabilitySettings;
  service: AvailabilityServiceInput;
  scheduleBlocks: WorkScheduleBlockInput[];
  busyIntervals: TimeInterval[];
  rangeStart: Date;
  rangeEnd: Date;
}

export const SLOT_STEP_MIN = 15;
