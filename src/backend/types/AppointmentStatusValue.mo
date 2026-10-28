import OQL "mo:caffeineai-oql";
import Types "../types/appointments";

module {
  public func _toRow(self : Types.AppointmentStatus) : OQL.Value {
    #text(
      switch (self) {
        case (#pending) { "pending" };
        case (#confirmed) { "confirmed" };
        case (#completed) { "completed" };
        case (#cancelled) { "cancelled" };
      }
    );
  };
};
