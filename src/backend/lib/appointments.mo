import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Types "../types/appointments";
import Common "../types/common";

module {
  public type Appointment = Types.Appointment;
  public type AppointmentStatus = Types.AppointmentStatus;
  public type AppointmentInput = Types.AppointmentInput;
  public type AppointmentError = Types.AppointmentError;
  public type Result<Ok, Err> = Common.Result<Ok, Err>;

  // Valid status transitions:
  //   #pending   -> #confirmed | #cancelled
  //   #confirmed -> #completed | #cancelled
  //   #completed -> (terminal)
  //   #cancelled -> (terminal)
  public func isValidTransition(from : AppointmentStatus, to : AppointmentStatus) : Bool {
    switch (from, to) {
      case (#pending, #confirmed) { true };
      case (#pending, #cancelled) { true };
      case (#confirmed, #completed) { true };
      case (#confirmed, #cancelled) { true };
      case (_, _) { false };
    };
  };

  public func statusLabel(status : AppointmentStatus) : Text {
    switch (status) {
      case (#pending) { "pending" };
      case (#confirmed) { "confirmed" };
      case (#completed) { "completed" };
      case (#cancelled) { "cancelled" };
    };
  };

  public func create(
    appointments : Map.Map<Common.Id, Appointment>,
    state : { var nextAppointmentId : Nat },
    input : AppointmentInput,
  ) : Result<Appointment, AppointmentError> {
    if (input.reason.size() == 0) {
      return #err(#invalidInput("Lý do khám không được để trống"));
    };
    if (input.scheduledAt <= 0) {
      return #err(#invalidInput("Thời gian hẹn không hợp lệ"));
    };
    let id = state.nextAppointmentId;
    state.nextAppointmentId := id + 1;
    let appointment : Appointment = {
      id;
      patientId = input.patientId;
      doctorId = input.doctorId;
      scheduledAt = input.scheduledAt;
      reason = input.reason;
      status = #pending;
      createdAt = Time.now();
    };
    appointments.add(id, appointment);
    #ok(appointment);
  };

  public func get(
    appointments : Map.Map<Common.Id, Appointment>,
    id : Common.Id,
  ) : ?Appointment {
    appointments.get(id);
  };

  public func list(
    appointments : Map.Map<Common.Id, Appointment>,
    statusFilter : ?AppointmentStatus,
    dateFilter : ?Common.Timestamp,
  ) : [Appointment] {
    let all = appointments.values().toArray();
    all.filter(
      func(a) {
        let statusOk = switch (statusFilter) {
          case (?s) { a.status == s };
          case null { true };
        };
        let dateOk = switch (dateFilter) {
          case (?d) { a.scheduledAt == d };
          case null { true };
        };
        statusOk and dateOk;
      }
    );
  };

  public func listByPatient(
    appointments : Map.Map<Common.Id, Appointment>,
    patientId : Common.Id,
  ) : [Appointment] {
    appointments.values().toArray().filter(func(a) = a.patientId == patientId);
  };

  public func listByDoctor(
    appointments : Map.Map<Common.Id, Appointment>,
    doctorId : Common.Id,
  ) : [Appointment] {
    appointments.values().toArray().filter(func(a) = a.doctorId == doctorId);
  };

  public func updateStatus(
    appointments : Map.Map<Common.Id, Appointment>,
    id : Common.Id,
    status : AppointmentStatus,
  ) : Result<Appointment, AppointmentError> {
    switch (appointments.get(id)) {
      case (null) { #err(#notFound(id)) };
      case (?existing) {
        if (not isValidTransition(existing.status, status)) {
          return #err(
            #invalidStatusTransition(
              "Không thể chuyển trạng thái từ " # statusLabel(existing.status) # " sang " # statusLabel(status)
            )
          );
        };
        let updated : Appointment = {
          id = existing.id;
          patientId = existing.patientId;
          doctorId = existing.doctorId;
          scheduledAt = existing.scheduledAt;
          reason = existing.reason;
          status;
          createdAt = existing.createdAt;
        };
        appointments.add(id, updated);
        #ok(updated);
      };
    };
  };

  public func cancel(
    appointments : Map.Map<Common.Id, Appointment>,
    id : Common.Id,
  ) : Result<Appointment, AppointmentError> {
    updateStatus(appointments, id, #cancelled);
  };
};
