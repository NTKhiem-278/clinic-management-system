import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/doctors";
import Common "../types/common";
import DoctorsLib "../lib/doctors";

mixin (
  accessControlState : AccessControl.AccessControlState,
  doctors : Map.Map<Common.Id, Types.Doctor>,
  state : { var nextDoctorId : Nat },
) {
  public query ({ caller }) func listDoctors() : async [Types.Doctor] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới xem được danh sách bác sĩ");
    };
    DoctorsLib.listDoctors(doctors);
  };

  public query ({ caller }) func searchDoctors(term : Text) : async [Types.Doctor] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới tìm kiếm được bác sĩ");
    };
    DoctorsLib.searchDoctors(doctors, term);
  };

  public query ({ caller }) func getDoctor(id : Common.Id) : async ?Types.Doctor {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới xem được thông tin bác sĩ");
    };
    DoctorsLib.getDoctor(doctors, id);
  };

  public shared ({ caller }) func createDoctor(input : Types.DoctorInput) : async Types.Result<Types.Doctor, Types.DoctorError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return #err(#unauthorized);
    };
    DoctorsLib.createDoctor(doctors, state, input);
  };

  public shared ({ caller }) func updateDoctor(id : Common.Id, input : Types.DoctorInput) : async Types.Result<Types.Doctor, Types.DoctorError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return #err(#unauthorized);
    };
    DoctorsLib.updateDoctor(doctors, id, input);
  };
};
