import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/appointments";
import Common "../types/common";
import AppointmentsLib "../lib/appointments";

mixin (
  accessControlState : AccessControl.AccessControlState,
  appointments : Map.Map<Common.Id, Types.Appointment>,
  state : { var nextAppointmentId : Nat },
) {
  // Signed-in callers only. Anonymous callers are rejected before any
  // role lookup, because getUserRole traps for unregistered principals.
  func requireSignedIn(caller : Principal) : Bool {
    not caller.isAnonymous();
  };

  public query ({ caller }) func listAppointments() : async [Types.Appointment] {
    if (not requireSignedIn(caller)) { return [] };
    AppointmentsLib.list(appointments, null, null);
  };

  public query ({ caller }) func listAppointmentsByPatient(patientId : Common.Id) : async [Types.Appointment] {
    if (not requireSignedIn(caller)) { return [] };
    AppointmentsLib.listByPatient(appointments, patientId);
  };

  public query ({ caller }) func listAppointmentsByDoctor(doctorId : Common.Id) : async [Types.Appointment] {
    if (not requireSignedIn(caller)) { return [] };
    AppointmentsLib.listByDoctor(appointments, doctorId);
  };

  public query ({ caller }) func getAppointment(id : Common.Id) : async ?Types.Appointment {
    if (not requireSignedIn(caller)) { return null };
    AppointmentsLib.get(appointments, id);
  };

  public shared ({ caller }) func createAppointment(input : Types.AppointmentInput) : async Types.Result<Types.Appointment, Types.AppointmentError> {
    if (not requireSignedIn(caller)) { return #err(#unauthorized) };
    AppointmentsLib.create(appointments, state, input);
  };

  public shared ({ caller }) func updateAppointmentStatus(id : Common.Id, status : Types.AppointmentStatus) : async Types.Result<Types.Appointment, Types.AppointmentError> {
    if (not requireSignedIn(caller)) { return #err(#unauthorized) };
    AppointmentsLib.updateStatus(appointments, id, status);
  };
};
