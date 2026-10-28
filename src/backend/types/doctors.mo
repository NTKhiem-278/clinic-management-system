import Debug "mo:core/Debug";
import Common "common";

module {
  public type Doctor = {
    id : Common.Id;
    fullName : Text;
    specialty : Text;
    phone : Text;
    email : Text;
    createdAt : Common.Timestamp;
  };

  public type DoctorInput = {
    fullName : Text;
    specialty : Text;
    phone : Text;
    email : Text;
  };

  public type DoctorError = {
    #notFound : Common.Id;
    #unauthorized;
    #invalidInput : Text;
  };

  public type Result<Ok, Err> = Common.Result<Ok, Err>;
};
