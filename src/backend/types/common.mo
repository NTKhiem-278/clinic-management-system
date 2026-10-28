import Debug "mo:core/Debug";

module {
  public type Id = Nat;
  public type Timestamp = Int;

  public type Gender = {
    #male;
    #female;
    #other;
  };

  public type Result<Ok, Err> = {
    #ok : Ok;
    #err : Err;
  };

  public type NotFound = {
    #notFound : Id;
  };

  public type Unauthorized = {
    #unauthorized;
  };

  public type ValidationError = {
    #invalidInput : Text;
  };
};
