import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import AccountsLib "../lib/accounts";
import Types "../types/accounts";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  accounts : Map.Map<Principal, Types.UserAccount>,
  roles : Map.Map<Common.Id, Types.Role>,
  state : { var nextRoleId : Nat },
) {
  public query ({ caller }) func listAccounts() : async [Types.UserAccount] {
    if (not AccountsLib.isAdminCaller(accessControlState, caller)) {
      return [];
    };
    AccountsLib.listAccounts(accounts);
  };

  public query ({ caller }) func getAccount(principal : Principal) : async ?Types.UserAccount {
    if (not AccountsLib.isAdminCaller(accessControlState, caller)) {
      return null;
    };
    AccountsLib.getAccount(accounts, principal);
  };

  public shared ({ caller }) func upsertAccount(principal : Principal, displayName : Text, role : Types.RoleName) : async Types.Result<Types.UserAccount, Types.AccountError> {
    AccountsLib.upsertAccount(accessControlState, accounts, caller, principal, displayName, role);
  };

  public shared ({ caller }) func setAccountActive(principal : Principal, active : Bool) : async Types.Result<Types.UserAccount, Types.AccountError> {
    AccountsLib.setAccountActive(accessControlState, accounts, caller, principal, active);
  };

  public query ({ caller }) func listRoles() : async [Types.Role] {
    if (not AccountsLib.isAdminCaller(accessControlState, caller)) {
      return [];
    };
    AccountsLib.listRoles(roles);
  };

  public shared ({ caller }) func createRole(name : Types.RoleName, permissions : [Text]) : async Types.Result<Types.Role, Types.RoleError> {
    AccountsLib.createRole(accessControlState, roles, state, caller, name, permissions);
  };

  public shared ({ caller }) func addPermission(roleId : Common.Id, permission : Text) : async Types.Result<Types.Role, Types.RoleError> {
    AccountsLib.addPermission(accessControlState, roles, caller, roleId, permission);
  };

  public shared ({ caller }) func removePermission(roleId : Common.Id, permission : Text) : async Types.Result<Types.Role, Types.RoleError> {
    AccountsLib.removePermission(accessControlState, roles, caller, roleId, permission);
  };

  public query ({ caller }) func getPermissions(roleId : Common.Id) : async ?[Text] {
    if (not AccountsLib.isAdminCaller(accessControlState, caller)) {
      return null;
    };
    AccountsLib.getPermissions(roles, roleId);
  };
};
