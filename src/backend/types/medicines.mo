import Debug "mo:core/Debug";
import Common "common";

module {
  public type Medicine = {
    id : Common.Id;
    name : Text;
    unit : Text;
    unitPrice : Nat;
    stockQuantity : Nat;
    expiryDate : Text;
    createdAt : Common.Timestamp;
  };

  public type MedicineInput = {
    name : Text;
    unit : Text;
    unitPrice : Nat;
    stockQuantity : Nat;
    expiryDate : Text;
  };

  public type MedicineError = {
    #notFound : Common.Id;
    #unauthorized;
    #invalidInput : Text;
  };

  public type Result<Ok, Err> = Common.Result<Ok, Err>;
};
