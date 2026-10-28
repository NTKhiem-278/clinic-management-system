import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/patients";
import Common "../types/common";
import PatientsLib "../lib/patients";

mixin (
  accessControlState : AccessControl.AccessControlState,
  patients : Map.Map<Common.Id, Types.Patient>,
  state : { var nextPatientId : Nat },
) {
  public query ({ caller }) func listPatients() : async [Types.Patient] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới xem được danh sách bệnh nhân");
    };
    PatientsLib.listPatients(patients);
  };

  public query ({ caller }) func searchPatients(term : Text) : async [Types.Patient] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới tìm kiếm được bệnh nhân");
    };
    PatientsLib.searchPatients(patients, term);
  };

  public query ({ caller }) func getPatient(id : Common.Id) : async ?Types.Patient {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới xem được thông tin bệnh nhân");
    };
    PatientsLib.getPatient(patients, id);
  };

  public shared ({ caller }) func createPatient(input : Types.PatientInput) : async Types.Result<Types.Patient, Types.PatientError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return #err(#unauthorized);
    };
    PatientsLib.createPatient(patients, state, input);
  };

  public shared ({ caller }) func updatePatient(id : Common.Id, input : Types.PatientInput) : async Types.Result<Types.Patient, Types.PatientError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return #err(#unauthorized);
    };
    PatientsLib.updatePatient(patients, id, input);
  };
};
