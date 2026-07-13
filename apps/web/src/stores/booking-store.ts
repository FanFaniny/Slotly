import { create } from "zustand";

export type BookingStep = 1 | 2 | 3;

interface BookingState {
  step: BookingStep;
  serviceId: string | null;
  selectedDate: string | null;
  selectedSlot: string | null;
  holdId: string | null;
  expiresAt: string | null;
  setStep: (step: BookingStep) => void;
  setService: (id: string) => void;
  setSlot: (
    date: string,
    slot: string,
    holdId: string,
    expiresAt: string,
  ) => void;
  reset: () => void;
}

const initialState = {
  step: 1 as BookingStep,
  serviceId: null,
  selectedDate: null,
  selectedSlot: null,
  holdId: null,
  expiresAt: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setService: (serviceId) =>
    set({ serviceId, step: 2, selectedDate: null, selectedSlot: null }),
  setSlot: (selectedDate, selectedSlot, holdId, expiresAt) =>
    set({
      selectedDate,
      selectedSlot,
      holdId,
      expiresAt,
      step: 3,
    }),
  reset: () => set(initialState),
}));
