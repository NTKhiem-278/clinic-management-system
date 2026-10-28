import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/accounts";
import Common "../types/common";

module {
  public type AccountError = Types.AccountError;
  public type RoleError = Types.RoleError;

  // Safe admin check: anonymous and unregistered callers are never admins.
  // AccessControl.isAdmin traps for an unregistered non-anonymous caller, so
  // guard on the anonymous case and treat any trap as "not an admin".
  public func isAdminCaller(accessControlState : AccessControl.AccessControlState, caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    AccessControl.isAdmin(accessControlState, caller);
  };

  public func listAccounts(accounts : Map.Map<Principal, Types.UserAccount>) : [Types.UserAccount] {
    accounts.values().toArray();
  };

  public func getAccount(accounts : Map.Map<Principal, Types.UserAccount>, principal : Principal) : ?Types.UserAccount {
    accounts.get(principal);
  };

  public func upsertAccount(
    accessControlState : AccessControl.AccessControlState,
    accounts : Map.Map<Principal, Types.UserAccount>,
    caller : Principal,
    principal : Principal,
    displayName : Text,
    role : Types.RoleName,
  ) : Types.Result<Types.UserAccount, Types.AccountError> {
    if (not isAdminCaller(accessControlState, caller)) {
      return #err(#unauthorized);
    };
    if (displayName.size() == 0) {
      return #err(#invalidInput("Display name must not be empty"));
    };
    if (principal.isAnonymous()) {
      return #err(#invalidInput("Cannot manage the anonymous principal"));
    };
    let account : Types.UserAccount = switch (accounts.get(principal)) {
      case (?existing) {
        { existing with displayName; role };
      };
      case null {
        {
          principal;
          displayName;
          role;
          active = true;
          createdAt = Time.now();
        };
      };
    };
    accounts.add(principal, account);
    // Keep the authorization role in sync so the signed-in user can act.
    AccessControl.assignRole(accessControlState, caller, principal, roleToUserRole(role));
    #ok(account);
  };

  public func setAccountActive(
    accessControlState : AccessControl.AccessControlState,
    accounts : Map.Map<Principal, Types.UserAccount>,
    caller : Principal,
    principal : Principal,
    active : Bool,
  ) : Types.Result<Types.UserAccount, Types.AccountError> {
    if (not isAdminCaller(accessControlState, caller)) {
      return #err(#unauthorized);
    };
    switch (accounts.get(principal)) {
      case (?existing) {
        let updated = { existing with active };
        accounts.add(principal, updated);
        #ok(updated);
      };
      case null {
        #err(#notFound(principal));
      };
    };
  };

  public func listRoles(roles : Map.Map<Common.Id, Types.Role>) : [Types.Role] {
    roles.values().toArray();
  };

  public func createRole(
    accessControlState : AccessControl.AccessControlState,
    roles : Map.Map<Common.Id, Types.Role>,
    state : { var nextRoleId : Nat },
    caller : Principal,
    name : Types.RoleName,
    permissions : [Text],
  ) : Types.Result<Types.Role, Types.RoleError> {
    if (not isAdminCaller(accessControlState, caller)) {
      return #err(#unauthorized);
    };
    let id = state.nextRoleId;
    state.nextRoleId := id + 1;
    let role : Types.Role = { id; name; permissions };
    roles.add(id, role);
    #ok(role);
  };

  public func addPermission(
    accessControlState : AccessControl.AccessControlState,
    roles : Map.Map<Common.Id, Types.Role>,
    caller : Principal,
    roleId : Common.Id,
    permission : Text,
  ) : Types.Result<Types.Role, Types.RoleError> {
    if (not isAdminCaller(accessControlState, caller)) {
      return #err(#unauthorized);
    };
    if (permission.size() == 0) {
      return #err(#invalidInput("Permission must not be empty"));
    };
    switch (roles.get(roleId)) {
      case (?role) {
        if (role.permissions.contains(permission)) {
          return #ok(role);
        };
        let updated = { role with permissions = role.permissions.concat([permission]) };
        roles.add(roleId, updated);
        #ok(updated);
      };
      case null {
        #err(#notFound(roleId));
      };
    };
  };

  public func removePermission(
    accessControlState : AccessControl.AccessControlState,
    roles : Map.Map<Common.Id, Types.Role>,
    caller : Principal,
    roleId : Common.Id,
    permission : Text,
  ) : Types.Result<Types.Role, Types.RoleError> {
    if (not isAdminCaller(accessControlState, caller)) {
      return #err(#unauthorized);
    };
    switch (roles.get(roleId)) {
      case (?role) {
        let updated = { role with permissions = role.permissions.filter(func p = p != permission) };
        roles.add(roleId, updated);
        #ok(updated);
      };
      case null {
        #err(#notFound(roleId));
      };
    };
  };

  public func getPermissions(roles : Map.Map<Common.Id, Types.Role>, roleId : Common.Id) : ?[Text] {
    switch (roles.get(roleId)) {
      case (?role) { ?role.permissions };
      case null { null };
    };
  };

  // Map the domain role to the authorization component's role.
  public func roleToUserRole(role : Types.RoleName) : AccessControl.UserRole {
    switch (role) {
      case (#admin) { #admin };
      case (#doctor) { #user };
      case (#receptionist) { #user };
      case (#patient) { #user };
    };
  };
};
