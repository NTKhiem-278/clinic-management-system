import Debug "mo:core/Debug";
import Common "common";

module {
  public type PrescriptionDetail = {
    id : Common.Id;
    prescriptionId : Common.Id;
    medicineId : Common.Id;
    dosage : Text;
    quantity : Nat;
  };

  public type Prescription = {
    id : Common.Id;
    medicalRecordId : Common.Id;
    patientId : Common.Id;
    doctorId : Common.Id;
    notes : Text;
    createdAt : Common.Timestamp;
  };

  public type PrescriptionView = {
    id : Common.Id;
    medicalRecordId : Common.Id;
    patientId : Common.Id;
    doctorId : Common.Id;
    notes : Text;
    createdAt : Common.Timestamp;
    details : [PrescriptionDetail];
  };

  public type PrescriptionError = {
    #notFound : Common.Id;
    #unauthorized;
    #invalidInput : Text;
  };

  public type Result<Ok, Err> = Common.Result<Ok, Err>;
};
