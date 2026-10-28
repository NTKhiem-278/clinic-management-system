import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/records";
import Common "../types/common";
import AccountTypes "../types/accounts";
import RecordsLib "../lib/records";

mixin (
  accessControlState : AccessControl.AccessControlState,
  records : Map.Map<Common.Id, Types.MedicalRecord>,
  accounts : Map.Map<Principal, AccountTypes.UserAccount>,
  state : { var nextRecordId : Nat },
) {
  // Staff (admin or user role) may create and update medical records.
  func isStaff(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { false };
      case (?role) { role == #admin or role == #user };
    };
  };

  // Only clinical staff may read medical records: administrators, doctors and
  // receptionists. Patients (and any caller without a staff account) must not
  // read another patient's private medical data.
  func isClinicalStaff(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accounts.get(caller)) {
      case (null) { false };
      case (?account) {
        if (not account.active) { return false };
        switch (account.role) {
          case (#admin) { true };
          case (#doctor) { true };
          case (#receptionist) { true };
          case (#patient) { false };
        };
      };
    };
  };

  public query ({ caller }) func listRecords() : async [Types.MedicalRecord] {
    if (not isClinicalStaff(caller)) { return [] };
    RecordsLib.listRecords(records);
  };

  public query ({ caller }) func listRecordsByPatient(patientId : Common.Id) : async [Types.MedicalRecord] {
    if (not isClinicalStaff(caller)) { return [] };
    RecordsLib.listRecordsByPatient(records, patientId);
  };

  public query ({ caller }) func getRecord(id : Common.Id) : async ?Types.MedicalRecord {
    if (not isClinicalStaff(caller)) { return null };
    RecordsLib.getRecord(records, id);
  };

  public shared ({ caller }) func createRecord(patientId : Common.Id, doctorId : Common.Id, input : Types.MedicalRecordInput) : async Types.Result<Types.MedicalRecord, Types.MedicalRecordError> {
    if (not isStaff(caller)) { return #err(#unauthorized) };
    RecordsLib.createRecord(records, state, patientId, doctorId, input);
  };

  public shared ({ caller }) func updateRecord(id : Common.Id, input : Types.MedicalRecordInput) : async Types.Result<Types.MedicalRecord, Types.MedicalRecordError> {
    if (not isStaff(caller)) { return #err(#unauthorized) };
    RecordsLib.updateRecord(records, id, input);
  };
};
