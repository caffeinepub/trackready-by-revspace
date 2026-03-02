import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Car {
    id: string;
    model: string;
    nickname: string;
    make: string;
    createdAt: bigint;
    year: bigint;
    notes: string;
}
export interface ChecklistItem {
    id: string;
    eventId: string;
    checked: boolean;
    name: string;
    notes: string;
    category: string;
}
export interface Event {
    id: string;
    carId: string;
    date: string;
    name: string;
    createdAt: bigint;
    notes: string;
    location: string;
    eventType: string;
}
export interface WearEntry {
    id: string;
    carId: string;
    percentRemaining: number;
    installDate: string;
    updatedAt: bigint;
    treadDepthMm: number;
    notes: string;
    wearType: string;
    brand: string;
    position: string;
    lastChangedDate: string;
}
export interface LapNote {
    id: string;
    eventId: string;
    lapTime: string;
    sessionName: string;
    notes: string;
    timestamp: bigint;
    lapNumber: bigint;
}
export interface UserProfile {
    name: string;
}
export interface TireLogSession {
    id: string;
    targetPsiMax: number;
    targetPsiMin: number;
    flPsi: number;
    frPsi: number;
    eventId: string;
    sessionName: string;
    flTemp: number;
    rrTemp: number;
    tempUnit: string;
    frTemp: number;
    timestamp: bigint;
    rlPsi: number;
    rrPsi: number;
    rlTemp: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCar(car: Car): Promise<void>;
    createChecklistItem(item: ChecklistItem): Promise<void>;
    createEvent(event: Event): Promise<void>;
    createLapNote(note: LapNote): Promise<void>;
    createTireLogSession(session: TireLogSession): Promise<void>;
    createWearEntry(entry: WearEntry): Promise<void>;
    deleteCar(carId: string): Promise<void>;
    deleteChecklistItem(itemId: string): Promise<void>;
    deleteEvent(eventId: string): Promise<void>;
    deleteLapNote(noteId: string): Promise<void>;
    deleteTireLogSession(sessionId: string): Promise<void>;
    deleteWearEntry(entryId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCars(): Promise<Array<Car>>;
    getChecklistItemsForEvent(eventId: string): Promise<Array<ChecklistItem>>;
    getEvents(): Promise<Array<Event>>;
    getLapNotesForEvent(eventId: string): Promise<Array<LapNote>>;
    getTireLogSessionsForEvent(eventId: string): Promise<Array<TireLogSession>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWearEntriesForCar(carId: string): Promise<Array<WearEntry>>;
    initDefaultChecklist(eventId: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleChecklistItem(itemId: string): Promise<void>;
    updateCar(updatedCar: Car): Promise<void>;
    updateChecklistItem(updatedItem: ChecklistItem): Promise<void>;
    updateEvent(updatedEvent: Event): Promise<void>;
    updateLapNote(updatedNote: LapNote): Promise<void>;
    updateTireLogSession(updatedSession: TireLogSession): Promise<void>;
    updateWearEntry(updatedEntry: WearEntry): Promise<void>;
}
