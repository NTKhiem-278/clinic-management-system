import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type Id = Nat;
  type Timestamp = Int;

  type Gender = { #male; #female; #other };

  type Patient = {
    id : Id;
    fullName : Text;
    dateOfBirth : Text;
    gender : Gender;
    phone : Text;
    address : Text;
    notes : Text;
    createdAt : Timestamp;
  };

  type Doctor = {
    id : Id;
    fullName : Text;
    specialty : Text;
    phone : Text;
    email : Text;
    createdAt : Timestamp;
  };

  type AppointmentStatus = { #pending; #confirmed; #completed; #cancelled };

  type Appointment = {
    id : Id;
    patientId : Id;
    doctorId : Id;
    scheduledAt : Timestamp;
    reason : Text;
    status : AppointmentStatus;
    createdAt : Timestamp;
  };

  type MedicalRecord = {
    id : Id;
    appointmentId : Id;
    patientId : Id;
    doctorId : Id;
    symptoms : Text;
    diagnosis : Text;
    examinationResult : Text;
    testResults : Text;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type Prescription = {
    id : Id;
    medicalRecordId : Id;
    patientId : Id;
    doctorId : Id;
    notes : Text;
    createdAt : Timestamp;
  };

  type PrescriptionDetail = {
    id : Id;
    prescriptionId : Id;
    medicineId : Id;
    dosage : Text;
    quantity : Nat;
  };

  type Medicine = {
    id : Id;
    name : Text;
    unit : Text;
    unitPrice : Nat;
    stockQuantity : Nat;
    expiryDate : Text;
    createdAt : Timestamp;
  };

  type RoleName = { #admin; #doctor; #receptionist; #patient };

  type Role = {
    id : Id;
    name : RoleName;
    permissions : [Text];
  };

  type UserAccount = {
    principal : Principal;
    displayName : Text;
    role : RoleName;
    active : Bool;
    createdAt : Timestamp;
  };

  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    patients : Map.Map<Id, Patient>;
    doctors : Map.Map<Id, Doctor>;
    appointments : Map.Map<Id, Appointment>;
    records : Map.Map<Id, MedicalRecord>;
    prescriptions : Map.Map<Id, Prescription>;
    prescriptionDetails : Map.Map<Id, PrescriptionDetail>;
    medicines : Map.Map<Id, Medicine>;
    accounts : Map.Map<Principal, UserAccount>;
    roles : Map.Map<Id, Role>;
    counters : {
      var nextPatientId : Nat;
      var nextDoctorId : Nat;
      var nextAppointmentId : Nat;
      var nextRecordId : Nat;
      var nextPrescriptionId : Nat;
      var nextDetailId : Nat;
      var nextMedicineId : Nat;
      var nextRoleId : Nat;
    };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      patients = Map.empty();
      doctors = Map.empty();
      appointments = Map.empty();
      records = Map.empty();
      prescriptions = Map.empty();
      prescriptionDetails = Map.empty();
      medicines = Map.empty();
      accounts = Map.empty();
      roles = Map.empty();
      counters = {
        var nextPatientId = 0;
        var nextDoctorId = 0;
        var nextAppointmentId = 0;
        var nextRecordId = 0;
        var nextPrescriptionId = 0;
        var nextDetailId = 0;
        var nextMedicineId = 0;
        var nextRoleId = 0;
      };
    };
  };
};
