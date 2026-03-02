import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  type Car = {
    id : Text;
    make : Text;
    model : Text;
    year : Nat;
    nickname : Text;
    notes : Text;
    createdAt : Int;
  };

  type Event = {
    id : Text;
    name : Text;
    date : Text;
    eventType : Text;
    location : Text;
    carId : Text;
    notes : Text;
    createdAt : Int;
  };

  type ChecklistItem = {
    id : Text;
    eventId : Text;
    category : Text;
    name : Text;
    checked : Bool;
    notes : Text;
  };

  type TireLogSession = {
    id : Text;
    eventId : Text;
    sessionName : Text;
    timestamp : Int;
    tempUnit : Text;
    targetPsiMin : Float;
    targetPsiMax : Float;
    flPsi : Float;
    flTemp : Float;
    frPsi : Float;
    frTemp : Float;
    rlPsi : Float;
    rlTemp : Float;
    rrPsi : Float;
    rrTemp : Float;
  };

  type LapNote = {
    id : Text;
    eventId : Text;
    sessionName : Text;
    lapNumber : Nat;
    lapTime : Text;
    notes : Text;
    timestamp : Int;
  };

  type WearEntry = {
    id : Text;
    carId : Text;
    wearType : Text;
    position : Text;
    percentRemaining : Float;
    lastChangedDate : Text;
    treadDepthMm : Float;
    brand : Text;
    installDate : Text;
    notes : Text;
    updatedAt : Int;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let cars = Map.empty<Principal, List.List<Car>>();
  let events = Map.empty<Principal, List.List<Event>>();
  let checklistItems = Map.empty<Principal, List.List<ChecklistItem>>();
  let tireLogSessions = Map.empty<Principal, List.List<TireLogSession>>();
  let lapNotes = Map.empty<Principal, List.List<LapNote>>();
  let wearEntries = Map.empty<Principal, List.List<WearEntry>>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Car CRUD
  public shared ({ caller }) func createCar(car : Car) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create cars");
    };
    let carList = switch (cars.get(caller)) {
      case (null) {
        let list = List.empty<Car>();
        list.add(car);
        list;
      };
      case (?cars) {
        cars.add(car);
        cars;
      };
    };
    cars.add(caller, carList);
  };

  public query ({ caller }) func getCars() : async [Car] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cars");
    };
    switch (cars.get(caller)) {
      case (null) { [] };
      case (?cars) { cars.toArray() };
    };
  };

  public shared ({ caller }) func updateCar(updatedCar : Car) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cars");
    };
    switch (cars.get(caller)) {
      case (null) { Runtime.trap("No cars found for user") };
      case (?carList) {
        let updatedList = carList.map<Car, Car>(
          func(car) {
            if (car.id == updatedCar.id) { updatedCar } else { car };
          }
        );
        cars.add(caller, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteCar(carId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete cars");
    };
    switch (cars.get(caller)) {
      case (null) { Runtime.trap("No cars found for user") };
      case (?carList) {
        let filteredList = carList.filter(func(car) { car.id != carId });
        cars.add(caller, filteredList);
      };
    };
  };

  // Event CRUD
  public shared ({ caller }) func createEvent(event : Event) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create events");
    };
    let eventList = switch (events.get(caller)) {
      case (null) {
        let list = List.empty<Event>();
        list.add(event);
        list;
      };
      case (?events) {
        events.add(event);
        events;
      };
    };
    events.add(caller, eventList);
  };

  public query ({ caller }) func getEvents() : async [Event] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access events");
    };
    switch (events.get(caller)) {
      case (null) { [] };
      case (?events) { events.toArray() };
    };
  };

  public shared ({ caller }) func updateEvent(updatedEvent : Event) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update events");
    };
    switch (events.get(caller)) {
      case (null) { Runtime.trap("No events found for user") };
      case (?eventList) {
        let updatedList = eventList.map<Event, Event>(
          func(event) {
            if (event.id == updatedEvent.id) { updatedEvent } else { event };
          }
        );
        events.add(caller, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteEvent(eventId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete events");
    };
    switch (events.get(caller)) {
      case (null) { Runtime.trap("No events found for user") };
      case (?eventList) {
        let filteredList = eventList.filter(func(event) { event.id != eventId });
        events.add(caller, filteredList);
      };
    };
  };

  // ChecklistItem CRUD
  public shared ({ caller }) func createChecklistItem(item : ChecklistItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checklist items");
    };
    let itemList = switch (checklistItems.get(caller)) {
      case (null) {
        let list = List.empty<ChecklistItem>();
        list.add(item);
        list;
      };
      case (?items) {
        items.add(item);
        items;
      };
    };
    checklistItems.add(caller, itemList);
  };

  public query ({ caller }) func getChecklistItemsForEvent(eventId : Text) : async [ChecklistItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access checklist items");
    };
    switch (checklistItems.get(caller)) {
      case (null) { [] };
      case (?items) {
        items.filter(func(item) { item.eventId == eventId }).toArray();
      };
    };
  };

  public shared ({ caller }) func updateChecklistItem(updatedItem : ChecklistItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update checklist items");
    };
    switch (checklistItems.get(caller)) {
      case (null) { Runtime.trap("No checklist items found for user") };
      case (?itemList) {
        let updatedList = itemList.map<ChecklistItem, ChecklistItem>(
          func(item) {
            if (item.id == updatedItem.id) { updatedItem } else { item };
          }
        );
        checklistItems.add(caller, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteChecklistItem(itemId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete checklist items");
    };
    switch (checklistItems.get(caller)) {
      case (null) { Runtime.trap("No checklist items found for user") };
      case (?itemList) {
        let filteredList = itemList.filter(func(item) { item.id != itemId });
        checklistItems.add(caller, filteredList);
      };
    };
  };

  public shared ({ caller }) func toggleChecklistItem(itemId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle checklist items");
    };
    switch (checklistItems.get(caller)) {
      case (null) { Runtime.trap("No checklist items found for user") };
      case (?itemList) {
        let updatedList = itemList.map<ChecklistItem, ChecklistItem>(
          func(item) {
            if (item.id == itemId) {
              { item with checked = not item.checked };
            } else { item };
          }
        );
        checklistItems.add(caller, updatedList);
      };
    };
  };

  // TireLogSession CRUD
  public shared ({ caller }) func createTireLogSession(session : TireLogSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tire log sessions");
    };
    let sessionList = switch (tireLogSessions.get(caller)) {
      case (null) {
        let list = List.empty<TireLogSession>();
        list.add(session);
        list;
      };
      case (?sessions) {
        sessions.add(session);
        sessions;
      };
    };
    tireLogSessions.add(caller, sessionList);
  };

  public query ({ caller }) func getTireLogSessionsForEvent(eventId : Text) : async [TireLogSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tire log sessions");
    };
    switch (tireLogSessions.get(caller)) {
      case (null) { [] };
      case (?sessions) {
        sessions.filter(func(session) { session.eventId == eventId }).toArray();
      };
    };
  };

  public shared ({ caller }) func updateTireLogSession(updatedSession : TireLogSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tire log sessions");
    };
    switch (tireLogSessions.get(caller)) {
      case (null) { Runtime.trap("No tire log sessions found for user") };
      case (?sessionList) {
        let updatedList = sessionList.map<TireLogSession, TireLogSession>(
          func(session) {
            if (session.id == updatedSession.id) { updatedSession } else { session };
          }
        );
        tireLogSessions.add(caller, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteTireLogSession(sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tire log sessions");
    };
    switch (tireLogSessions.get(caller)) {
      case (null) { Runtime.trap("No tire log sessions found for user") };
      case (?sessionList) {
        let filteredList = sessionList.filter(func(session) { session.id != sessionId });
        tireLogSessions.add(caller, filteredList);
      };
    };
  };

  // LapNote CRUD
  public shared ({ caller }) func createLapNote(note : LapNote) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create lap notes");
    };
    let noteList = switch (lapNotes.get(caller)) {
      case (null) {
        let list = List.empty<LapNote>();
        list.add(note);
        list;
      };
      case (?notes) {
        notes.add(note);
        notes;
      };
    };
    lapNotes.add(caller, noteList);
  };

  public query ({ caller }) func getLapNotesForEvent(eventId : Text) : async [LapNote] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access lap notes");
    };
    switch (lapNotes.get(caller)) {
      case (null) { [] };
      case (?notes) {
        notes.filter(func(note) { note.eventId == eventId }).toArray();
      };
    };
  };

  public shared ({ caller }) func updateLapNote(updatedNote : LapNote) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update lap notes");
    };
    switch (lapNotes.get(caller)) {
      case (null) { Runtime.trap("No lap notes found for user") };
      case (?noteList) {
        let updatedList = noteList.map<LapNote, LapNote>(
          func(note) {
            if (note.id == updatedNote.id) { updatedNote } else { note };
          }
        );
        lapNotes.add(caller, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteLapNote(noteId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete lap notes");
    };
    switch (lapNotes.get(caller)) {
      case (null) { Runtime.trap("No lap notes found for user") };
      case (?noteList) {
        let filteredList = noteList.filter(func(note) { note.id != noteId });
        lapNotes.add(caller, filteredList);
      };
    };
  };

  // WearEntry CRUD
  public shared ({ caller }) func createWearEntry(entry : WearEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create wear entries");
    };
    let entryList = switch (wearEntries.get(caller)) {
      case (null) {
        let list = List.empty<WearEntry>();
        list.add(entry);
        list;
      };
      case (?entries) {
        entries.add(entry);
        entries;
      };
    };
    wearEntries.add(caller, entryList);
  };

  public query ({ caller }) func getWearEntriesForCar(carId : Text) : async [WearEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access wear entries");
    };
    switch (wearEntries.get(caller)) {
      case (null) { [] };
      case (?entries) {
        entries.filter(func(entry) { entry.carId == carId }).toArray();
      };
    };
  };

  public shared ({ caller }) func updateWearEntry(updatedEntry : WearEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update wear entries");
    };
    switch (wearEntries.get(caller)) {
      case (null) { Runtime.trap("No wear entries found for user") };
      case (?entryList) {
        let updatedList = entryList.map<WearEntry, WearEntry>(
          func(entry) {
            if (entry.id == updatedEntry.id) { updatedEntry } else { entry };
          }
        );
        wearEntries.add(caller, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteWearEntry(entryId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete wear entries");
    };
    switch (wearEntries.get(caller)) {
      case (null) { Runtime.trap("No wear entries found for user") };
      case (?entryList) {
        let filteredList = entryList.filter(func(entry) { entry.id != entryId });
        wearEntries.add(caller, filteredList);
      };
    };
  };

  public shared ({ caller }) func initDefaultChecklist(eventId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initialize checklists");
    };

    // Check if checklist items already exist for this event
    let existingItems = switch (checklistItems.get(caller)) {
      case (null) { [] };
      case (?items) {
        items.filter(func(item) { item.eventId == eventId }).toArray();
      };
    };

    if (existingItems.size() > 0) {
      Runtime.trap("Checklist already exists for event");
    };

    let defaultItems = [
      // Fluids
      { id = "fluids1"; eventId; category = "Fluids"; name = "Engine Oil"; checked = false; notes = "" },
      {
        id = "fluids2";
        eventId;
        category = "Fluids";
        name = "Coolant Level";
        checked = false;
        notes = "";
      },
      {
        id = "fluids3";
        eventId;
        category = "Fluids";
        name = "Brake Fluid";
        checked = false;
        notes = "";
      },
      {
        id = "fluids4";
        eventId;
        category = "Fluids";
        name = "Power Steering Fluid";
        checked = false;
        notes = "";
      },
      // Brakes
      {
        id = "brakes1";
        eventId;
        category = "Brakes";
        name = "Brake Pad Thickness";
        checked = false;
        notes = "";
      },
      {
        id = "brakes2";
        eventId;
        category = "Brakes";
        name = "Rotor Condition";
        checked = false;
        notes = "";
      },
      {
        id = "brakes3";
        eventId;
        category = "Brakes";
        name = "Brake Lines";
        checked = false;
        notes = "";
      },
      {
        id = "brakes4";
        eventId;
        category = "Brakes";
        name = "Handbrake Function";
        checked = false;
        notes = "";
      },
      // Tires
      {
        id = "tires1";
        eventId;
        category = "Tires";
        name = "Tire Pressure (FL)";
        checked = false;
        notes = "";
      },
      {
        id = "tires2";
        eventId;
        category = "Tires";
        name = "Tire Pressure (FR)";
        checked = false;
        notes = "";
      },
      {
        id = "tires3";
        eventId;
        category = "Tires";
        name = "Tire Pressure (RL)";
        checked = false;
        notes = "";
      },
      {
        id = "tires4";
        eventId;
        category = "Tires";
        name = "Tire Pressure (RR)";
        checked = false;
        notes = "";
      },
      {
        id = "tires5";
        eventId;
        category = "Tires";
        name = "Tread Depth";
        checked = false;
        notes = "";
      },
      {
        id = "tires6";
        eventId;
        category = "Tires";
        name = "Sidewall Condition";
        checked = false;
        notes = "";
      },
      // Suspension
      {
        id = "suspension1";
        eventId;
        category = "Suspension";
        name = "Wheel Torque";
        checked = false;
        notes = "";
      },
      {
        id = "suspension2";
        eventId;
        category = "Suspension";
        name = "Shock Absorbers";
        checked = false;
        notes = "";
      },
      {
        id = "suspension3";
        eventId;
        category = "Suspension";
        name = "Sway Bar Links";
        checked = false;
        notes = "";
      },
      {
        id = "suspension4";
        eventId;
        category = "Suspension";
        name = "Control Arms";
        checked = false;
        notes = "";
      },
      // Safety Gear
      {
        id = "safety1";
        eventId;
        category = "Safety Gear";
        name = "Helmet";
        checked = false;
        notes = "";
      },
      {
        id = "safety2";
        eventId;
        category = "Safety Gear";
        name = "Harness/Seatbelt";
        checked = false;
        notes = "";
      },
      {
        id = "safety3";
        eventId;
        category = "Safety Gear";
        name = "Fire Extinguisher";
        checked = false;
        notes = "";
      },
      {
        id = "safety4";
        eventId;
        category = "Safety Gear";
        name = "Gloves";
        checked = false;
        notes = "";
      },
      // Engine
      {
        id = "engine1";
        eventId;
        category = "Engine";
        name = "Air Filter";
        checked = false;
        notes = "";
      },
      {
        id = "engine2";
        eventId;
        category = "Engine";
        name = "Spark Plugs";
        checked = false;
        notes = "";
      },
      {
        id = "engine3";
        eventId;
        category = "Engine";
        name = "Battery Terminals";
        checked = false;
        notes = "";
      },
      // Electrical
      {
        id = "electrical1";
        eventId;
        category = "Electrical";
        name = "Data Logger";
        checked = false;
        notes = "";
      },
      {
        id = "electrical2";
        eventId;
        category = "Electrical";
        name = "Camera Mount";
        checked = false;
        notes = "";
      },
      {
        id = "electrical3";
        eventId;
        category = "Electrical";
        name = "Timing System";
        checked = false;
        notes = "";
      },
    ];

    let newList = switch (checklistItems.get(caller)) {
      case (null) {
        List.fromArray<ChecklistItem>(defaultItems);
      };
      case (?existingList) {
        let combined = List.fromArray<ChecklistItem>(defaultItems);
        existingList.forEach(func(item) { combined.add(item) });
        combined;
      };
    };

    checklistItems.add(caller, newList);
  };
};

