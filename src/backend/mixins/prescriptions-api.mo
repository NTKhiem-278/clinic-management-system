import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/prescriptions";
import Common "../types/common";
import PrescriptionsLib "../lib/prescriptions";

mixin (
  accessControlState : AccessControl.AccessControlState,
  prescriptions : Map.Map<Common.Id, Types.Prescription>,
  details : Map.Map<Common.Id, Types.PrescriptionDetail>,
  state : { var nextPrescriptionId : Nat; var nextDetailId : Nat },
) {
  // Staff (admin or user role) may create and modify prescriptions.
  func isStaffCaller(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { false };
      case (?role) { role == #admin or role == #user };
    };
  };

  public query ({ caller }) func listPrescriptions() : async [Types.Prescription] {
    if (caller.isAnonymous()) { return [] };
    PrescriptionsLib.listPrescriptions(prescriptions);
  };

  public query ({ caller }) func getPrescription(id : Common.Id) : async ?Types.PrescriptionView {
    if (caller.isAnonymous()) { return null };
    PrescriptionsLib.getPrescription(prescriptions, details, id);
  };

  public shared ({ caller }) func createPrescription(medicalRecordId : Common.Id, patientId : Common.Id, doctorId : Common.Id, notes : Text) : async Types.Result<Types.Prescription, Types.PrescriptionError> {
    if (not isStaffCaller(caller)) { return #err(#unauthorized) };
    PrescriptionsLib.createPrescription(prescriptions, state, medicalRecordId, patientId, doctorId, notes);
  };

  public shared ({ caller }) func addDetail(prescriptionId : Common.Id, medicineId : Common.Id, dosage : Text, quantity : Nat) : async Types.Result<Types.PrescriptionDetail, Types.PrescriptionError> {
    if (not isStaffCaller(caller)) { return #err(#unauthorized) };
    PrescriptionsLib.addDetail(prescriptions, details, state, prescriptionId, medicineId, dosage, quantity);
  };

  public shared ({ caller }) func removeDetail(detailId : Common.Id) : async Types.Result<(), Types.PrescriptionError> {
    if (not isStaffCaller(caller)) { return #err(#unauthorized) };
    PrescriptionsLib.removeDetail(details, detailId);
  };

  public shared ({ caller }) func updateDosage(detailId : Common.Id, dosage : Text, quantity : Nat) : async Types.Result<Types.PrescriptionDetail, Types.PrescriptionError> {
    if (not isStaffCaller(caller)) { return #err(#unauthorized) };
    PrescriptionsLib.updateDosage(details, detailId, dosage, quantity);
  };

  public query ({ caller }) func calculateTotalItems(prescriptionId : Common.Id) : async Nat {
    if (caller.isAnonymous()) { return 0 };
    PrescriptionsLib.calculateTotalItems(details, prescriptionId);
  };
};
