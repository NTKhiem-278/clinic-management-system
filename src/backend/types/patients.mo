import Debug "mo:core/Debug";
import Common "common";

module {
  public type Patient = {
    id : Common.Id;
    fullName : Text;
    dateOfBirth : Text;
    gender : Common.Gender;
    phone : Text;
    address : Text;
    notes : Text;
    createdAt : Common.Timestamp;
  };

  public type PatientInput = {
    fullName : Text;
    dateOfBirth : Text;
    gender : Common.Gender;
    phone : Text;
    address : Text;
    notes : Text;
  };

  public type PatientError = {
    #notFound : Common.Id;
    #unauthorized;
    #invalidInput : Text;
  };

  public type Result<Ok, Err> = Common.Result<Ok, Err>;
};
