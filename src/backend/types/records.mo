import Debug "mo:core/Debug";
import Common "common";

module {
  public type MedicalRecord = {
    id : Common.Id;
    appointmentId : Common.Id;
    patientId : Common.Id;
    doctorId : Common.Id;
    symptoms : Text;
    diagnosis : Text;
    examinationResult : Text;
    testResults : Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  public type MedicalRecordInput = {
    appointmentId : Common.Id;
    symptoms : Text;
    diagnosis : Text;
    examinationResult : Text;
    testResults : Text;
  };

  public type MedicalRecordError = {
    #notFound : Common.Id;
    #unauthorized;
    #invalidInput : Text;
  };

  public type Result<Ok, Err> = Common.Result<Ok, Err>;
};
