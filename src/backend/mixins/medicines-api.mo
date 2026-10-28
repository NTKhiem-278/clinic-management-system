import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/medicines";
import Common "../types/common";
import MedicinesLib "../lib/medicines";

mixin (
  accessControlState : AccessControl.AccessControlState,
  medicines : Map.Map<Common.Id, Types.Medicine>,
  state : { var nextMedicineId : Nat },
) {
  public query ({ caller }) func listMedicines() : async [Types.Medicine] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới xem được danh sách thuốc");
    };
    MedicinesLib.listMedicines(medicines);
  };

  public query ({ caller }) func getMedicine(id : Common.Id) : async ?Types.Medicine {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới xem được thông tin thuốc");
    };
    MedicinesLib.getMedicine(medicines, id);
  };

  public shared ({ caller }) func createMedicine(input : Types.MedicineInput) : async Types.Result<Types.Medicine, Types.MedicineError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return #err(#unauthorized);
    };
    MedicinesLib.createMedicine(medicines, state, input);
  };

  public shared ({ caller }) func updateMedicine(id : Common.Id, input : Types.MedicineInput) : async Types.Result<Types.Medicine, Types.MedicineError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return #err(#unauthorized);
    };
    MedicinesLib.updateMedicine(medicines, id, input);
  };

  public query ({ caller }) func checkStock(id : Common.Id) : async ?Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới kiểm tra được tồn kho");
    };
    MedicinesLib.checkStock(medicines, id);
  };

  public query ({ caller }) func checkExpiry(id : Common.Id) : async ?Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Chỉ người dùng đã đăng nhập mới kiểm tra được hạn sử dụng");
    };
    MedicinesLib.checkExpiry(medicines, id);
  };
};
