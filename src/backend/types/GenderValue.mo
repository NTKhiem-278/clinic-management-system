import OQL "mo:caffeineai-oql";
import Types "../types/common";

module {
  public func _toRow(self : Types.Gender) : OQL.Value {
    #text(
      switch (self) {
        case (#male) { "male" };
        case (#female) { "female" };
        case (#other) { "other" };
      }
    );
  };
};
