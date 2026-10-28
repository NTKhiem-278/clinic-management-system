import Debug "mo:core/Debug";
import Principal "mo:core/Principal";
import Common "common";

module {
  public type RoleName = {
    #admin;
    #doctor;
    #receptionist;
    #patient;
  };

  public type Role = {
    id : Common.Id;
    name : RoleName;
    permissions : [Text];
  };

  public type UserAccount = {
    principal : Principal;
    displayName : Text;
    role : RoleName;
    active : Bool;
    createdAt : Common.Timestamp;
  };

  public type AccountError = {
    #notFound : Principal;
    #unauthorized;
    #invalidInput : Text;
  };

  public type RoleError = {
    #notFound : Common.Id;
    #unauthorized;
    #invalidInput : Text;
  };

  public type Result<Ok, Err> = Common.Result<Ok, Err>;
};
