import OQL "mo:caffeineai-oql";
import Types "../types/accounts";

module {
  public func _toRow(self : Types.RoleName) : OQL.Value {
    #text(
      switch (self) {
        case (#admin) { "admin" };
        case (#doctor) { "doctor" };
        case (#receptionist) { "receptionist" };
        case (#patient) { "patient" };
      }
    );
  };
};
