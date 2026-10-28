import { RoleName } from "@/backend";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/components/DataStates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccounts,
  useAddPermission,
  useCallerRole,
  useCreateRole,
  usePermissions,
  useRemovePermission,
  useRoles,
  useSetAccountActive,
  useUpsertAccount,
} from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import { Principal } from "@icp-sdk/core/principal";
import {
  KeyRound,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";

/** Screen-specific copy that is not part of the shared language module. */
const copy = {
  editTitle: "Cập nhật tài khoản",
  listTitle: "Danh sách tài khoản",
  dialogHint:
    "Nhập principal của người dùng, tên hiển thị và vai trò được gán.",
  displayNamePlaceholder: "Ví dụ: Nguyễn Thị Lan",
  principalPlaceholder: "xxxxx-xxxxx-xxxxx-xxxxx-xxx",
  principalInvalid: "Principal không hợp lệ. Vui lòng kiểm tra lại.",
  activate: "Kích hoạt",
  deactivate: "Khóa tài khoản",
  adminBadge: "Quyền quản trị",
  saveError: "Không thể lưu tài khoản. Vui lòng kiểm tra lại thông tin.",
  toggleError: "Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.",
  forbiddenTitle: "Không có quyền truy cập",
  forbiddenBody:
    "Chỉ quản trị viên mới có thể quản lí tài khoản, vai trò và quyền.",
  addRole: "Thêm vai trò",
  roleName: "Tên vai trò",
  manage: "Quản lí quyền",
  roleDialogHint: "Chọn vai trò và thêm các quyền tương ứng.",
  permissionsEmpty: "Vai trò này chưa có quyền nào.",
  permissionPlaceholder: "Ví dụ: patients.read",
  addPermission: "Thêm quyền",
  removePermission: "Gỡ quyền",
  permissionError: "Không thể cập nhật quyền. Vui lòng thử lại.",
  createError: "Không thể tạo vai trò. Vui lòng thử lại.",
} as const;

const ROLE_OPTIONS: RoleName[] = [
  RoleName.admin,
  RoleName.doctor,
  RoleName.receptionist,
  RoleName.patient,
];

const ROLE_TONE: Record<
  RoleName,
  "pending" | "confirmed" | "completed" | "cancelled" | "neutral"
> = {
  [RoleName.admin]: "confirmed",
  [RoleName.doctor]: "completed",
  [RoleName.receptionist]: "pending",
  [RoleName.patient]: "neutral",
};

function roleLabel(role: RoleName): string {
  return vi.roles.names[role];
}

/* ------------------------------------------------------------------ */
/* Account editor dialog                                               */
/* ------------------------------------------------------------------ */

function AccountDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: { principal: Principal; displayName: string; role: RoleName } | null;
}) {
  const upsert = useUpsertAccount();
  const [principalText, setPrincipalText] = useState(
    editing ? editing.principal.toText() : "",
  );
  const [displayName, setDisplayName] = useState(editing?.displayName ?? "");
  const [role, setRole] = useState<RoleName>(editing?.role ?? RoleName.patient);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editing !== null;
  const trimmedName = displayName.trim();
  const trimmedPrincipal = principalText.trim();
  const canSubmit =
    trimmedName.length > 0 &&
    (isEditing || trimmedPrincipal.length > 0) &&
    !upsert.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!canSubmit) return;
    let target: Principal;
    if (isEditing) {
      target = editing.principal;
    } else {
      try {
        target = Principal.fromText(trimmedPrincipal);
      } catch {
        setFormError(copy.principalInvalid);
        return;
      }
    }
    upsert.mutate(
      { principal: target, displayName: trimmedName, role },
      {
        onSuccess: () => onOpenChange(false),
        onError: () => setFormError(copy.saveError),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="accounts.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? copy.editTitle : vi.accounts.add}
          </DialogTitle>
          <DialogDescription>{copy.dialogHint}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="account-principal">{vi.accounts.principal}</Label>
            <Input
              id="account-principal"
              data-ocid="accounts.principal_input"
              value={principalText}
              onChange={(event) => setPrincipalText(event.target.value)}
              placeholder={copy.principalPlaceholder}
              disabled={isEditing}
              className="font-mono text-xs"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-name">{vi.accounts.displayName}</Label>
            <Input
              id="account-name"
              data-ocid="accounts.display_name_input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={copy.displayNamePlaceholder}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-role">{vi.accounts.role}</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as RoleName)}
            >
              <SelectTrigger
                id="account-role"
                data-ocid="accounts.role_select"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {roleLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formError && (
            <p
              data-ocid="accounts.form_error"
              role="alert"
              className="text-sm text-destructive"
            >
              {formError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="accounts.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              {vi.common.cancel}
            </Button>
            <Button
              type="submit"
              data-ocid="accounts.submit_button"
              disabled={!canSubmit}
            >
              {upsert.isPending ? vi.common.loading : vi.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Role permissions panel                                              */
/* ------------------------------------------------------------------ */

function RolePermissions({ roleId }: { roleId: bigint }) {
  const { data, isLoading, isError, refetch } = usePermissions(roleId);
  const addPermission = useAddPermission();
  const removePermission = useRemovePermission();
  const [draft, setDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const permissions = data ?? [];
  const trimmed = draft.trim();
  const canAdd = trimmed.length > 0 && !addPermission.isPending;

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    if (!canAdd) return;
    const value = trimmed;
    setDraft("");
    addPermission.mutate(
      { roleId, permission: value },
      {
        onError: () => {
          setDraft((current) => (current === "" ? value : current));
          setActionError(copy.permissionError);
        },
      },
    );
  }

  function handleRemove(permission: string) {
    setActionError(null);
    removePermission.mutate(
      { roleId, permission },
      { onError: () => setActionError(copy.permissionError) },
    );
  }

  return (
    <div className="mt-3 rounded-md border border-border bg-background/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {vi.roles.permissions}
      </p>

      {isError ? (
        <div className="mt-2">
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void refetch()}
          />
        </div>
      ) : isLoading ? (
        <div className="mt-2">
          <TableSkeleton rows={2} cols={3} />
        </div>
      ) : permissions.length === 0 ? (
        <p
          data-ocid="roles.permissions_empty"
          className="mt-2 text-sm text-muted-foreground"
        >
          {copy.permissionsEmpty}
        </p>
      ) : (
        <ul
          data-ocid="roles.permissions_list"
          className="mt-2 flex flex-wrap gap-1.5"
        >
          {permissions.map((permission) => (
            <li
              key={permission}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-0.5 pl-2.5 pr-1 font-mono text-xs text-secondary-foreground"
            >
              {permission}
              <button
                type="button"
                data-ocid="roles.remove_permission_button"
                aria-label={`${copy.removePermission}: ${permission}`}
                onClick={() => handleRemove(permission)}
                disabled={removePermission.isPending}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-destructive/15 hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-3 flex items-center gap-2">
        <Input
          data-ocid="roles.permission_input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={copy.permissionPlaceholder}
          aria-label={copy.addPermission}
          className="h-9 font-mono text-xs"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          data-ocid="roles.add_permission_button"
          disabled={!canAdd}
        >
          <Plus className="size-4" aria-hidden="true" />
          {copy.addPermission}
        </Button>
      </form>

      {actionError && (
        <p
          data-ocid="roles.permission_error"
          role="alert"
          className="mt-2 text-sm text-destructive"
        >
          {actionError}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create role dialog                                                  */
/* ------------------------------------------------------------------ */

function CreateRoleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createRole = useCreateRole();
  const [name, setName] = useState<RoleName>(RoleName.receptionist);
  const [permissionDraft, setPermissionDraft] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  function addDraftPermission() {
    const value = permissionDraft.trim();
    if (value.length === 0) return;
    setPermissions((current) =>
      current.includes(value) ? current : [...current, value],
    );
    setPermissionDraft("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (createRole.isPending) return;
    createRole.mutate(
      { name, permissions },
      {
        onSuccess: () => {
          setName(RoleName.receptionist);
          setPermissions([]);
          setPermissionDraft("");
          onOpenChange(false);
        },
        onError: () => setFormError(copy.createError),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="roles.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{copy.addRole}</DialogTitle>
          <DialogDescription>{copy.roleDialogHint}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">{copy.roleName}</Label>
            <Select
              value={name}
              onValueChange={(value) => setName(value as RoleName)}
            >
              <SelectTrigger
                id="role-name"
                data-ocid="roles.name_select"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {roleLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-permission">{vi.roles.permissions}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="role-permission"
                data-ocid="roles.new_permission_input"
                value={permissionDraft}
                onChange={(event) => setPermissionDraft(event.target.value)}
                placeholder={copy.permissionPlaceholder}
                className="font-mono text-xs"
                autoComplete="off"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-ocid="roles.new_permission_add_button"
                onClick={addDraftPermission}
                disabled={permissionDraft.trim().length === 0}
              >
                <Plus className="size-4" aria-hidden="true" />
                {vi.common.add}
              </Button>
            </div>
            {permissions.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 pt-1">
                {permissions.map((permission) => (
                  <li
                    key={permission}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-0.5 pl-2.5 pr-1 font-mono text-xs text-secondary-foreground"
                  >
                    {permission}
                    <button
                      type="button"
                      aria-label={`${vi.common.delete}: ${permission}`}
                      onClick={() =>
                        setPermissions((current) =>
                          current.filter((item) => item !== permission),
                        )
                      }
                      className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-destructive/15 hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formError && (
            <p
              data-ocid="roles.form_error"
              role="alert"
              className="text-sm text-destructive"
            >
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="roles.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              {vi.common.cancel}
            </Button>
            <Button
              type="submit"
              data-ocid="roles.submit_button"
              disabled={createRole.isPending}
            >
              {createRole.isPending ? vi.common.loading : vi.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function AccountsPage() {
  const callerRole = useCallerRole();
  const accounts = useAccounts();
  const roles = useRoles();
  const setActive = useSetAccountActive();

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{
    principal: Principal;
    displayName: string;
    role: RoleName;
  } | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<bigint | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = callerRole.data === "admin";

  function openCreate() {
    setEditing(null);
    setAccountDialogOpen(true);
  }

  function openEdit(account: {
    principal: Principal;
    displayName: string;
    role: RoleName;
  }) {
    setEditing(account);
    setAccountDialogOpen(true);
  }

  function toggleActive(principal: Principal, active: boolean) {
    setActionError(null);
    setActive.mutate(
      { principal, active },
      { onError: () => setActionError(copy.toggleError) },
    );
  }

  if (callerRole.isLoading) {
    return (
      <>
        <PageHeader title={vi.accounts.title} subtitle={vi.accounts.subtitle} />
        <LoadingState label={vi.common.loading} />
      </>
    );
  }

  if (callerRole.isError) {
    return (
      <>
        <PageHeader title={vi.accounts.title} subtitle={vi.accounts.subtitle} />
        <section className="rounded-lg border border-border bg-card shadow-subtle">
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void callerRole.refetch()}
          />
        </section>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <PageHeader title={vi.accounts.title} subtitle={vi.accounts.subtitle} />
        <section className="rounded-lg border border-border bg-card shadow-subtle">
          <div
            data-ocid="accounts.forbidden_state"
            className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning">
              <ShieldAlert className="size-6" aria-hidden="true" />
            </span>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {copy.forbiddenTitle}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {copy.forbiddenBody}
            </p>
          </div>
        </section>
      </>
    );
  }

  const accountList = accounts.data ?? [];
  const roleList = roles.data ?? [];

  return (
    <>
      <PageHeader
        title={vi.accounts.title}
        subtitle={vi.accounts.subtitle}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {copy.adminBadge}
          </span>
        }
        actions={
          <Button
            type="button"
            data-ocid="accounts.open_modal_button"
            onClick={openCreate}
          >
            <UserPlus className="size-4" aria-hidden="true" />
            {vi.accounts.add}
          </Button>
        }
      />

      {actionError && (
        <p
          data-ocid="accounts.action_error"
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {actionError}
        </p>
      )}

      {/* Accounts */}
      <section className="rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {copy.listTitle}
          </h2>
          <span className="text-xs text-muted-foreground">
            {accountList.length} {vi.common.results}
          </span>
        </div>

        {accounts.isError ? (
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void accounts.refetch()}
          />
        ) : accounts.isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : accountList.length === 0 ? (
          <EmptyState
            title={vi.common.emptyTitle}
            body={vi.accounts.empty}
            action={
              <Button
                type="button"
                variant="outline"
                data-ocid="accounts.empty_add_button"
                onClick={openCreate}
              >
                <UserPlus className="size-4" aria-hidden="true" />
                {vi.accounts.add}
              </Button>
            }
          />
        ) : (
          <ul data-ocid="accounts.list" className="divide-y divide-border">
            {accountList.map((account, index) => (
              <li
                key={account.principal.toText()}
                data-ocid={`accounts.item.${index + 1}`}
                className="chart-stripe flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">
                      {account.displayName}
                    </p>
                    <StatusBadge
                      label={roleLabel(account.role)}
                      tone={ROLE_TONE[account.role]}
                    />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {account.principal.toText()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge
                    label={
                      account.active ? vi.accounts.active : vi.accounts.locked
                    }
                    tone={account.active ? "completed" : "cancelled"}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-ocid={`accounts.edit_button.${index + 1}`}
                    onClick={() =>
                      openEdit({
                        principal: account.principal,
                        displayName: account.displayName,
                        role: account.role,
                      })
                    }
                  >
                    {vi.common.edit}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={account.active ? "destructive" : "outline"}
                    data-ocid={`accounts.toggle_button.${index + 1}`}
                    disabled={setActive.isPending}
                    onClick={() =>
                      toggleActive(account.principal, !account.active)
                    }
                  >
                    {account.active ? copy.deactivate : copy.activate}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Roles and permissions */}
      <section className="rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {vi.roles.title}
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-ocid="roles.open_modal_button"
            onClick={() => setRoleDialogOpen(true)}
          >
            <Plus className="size-4" aria-hidden="true" />
            {copy.addRole}
          </Button>
        </div>

        {roles.isError ? (
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void roles.refetch()}
          />
        ) : roles.isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : roleList.length === 0 ? (
          <EmptyState title={vi.common.emptyTitle} body={vi.roles.empty} />
        ) : (
          <ul data-ocid="roles.list" className="divide-y divide-border">
            {roleList.map((role, index) => {
              const expanded = selectedRoleId === role.id;
              return (
                <li
                  key={role.id.toString()}
                  data-ocid={`roles.item.${index + 1}`}
                  className="px-4 py-3 md:px-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <KeyRound className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {roleLabel(role.name)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {role.permissions.length} {vi.roles.permissions}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-ocid={`roles.manage_button.${index + 1}`}
                      aria-expanded={expanded}
                      onClick={() =>
                        setSelectedRoleId(expanded ? null : role.id)
                      }
                    >
                      {expanded ? vi.common.close : copy.manage}
                    </Button>
                  </div>
                  {expanded && <RolePermissions roleId={role.id} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        editing={editing}
      />
      <CreateRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />
    </>
  );
}
