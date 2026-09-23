"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Occupation, Role } from "@prisma/client";
import { KeyRound, MoreHorizontal, Pencil, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteUserAction,
  resetUserPasswordAction,
  setUserDisabledAction,
  updateUserAction,
} from "@/actions/admin/users";
import { runAction } from "@/lib/run-action";
import { OCCUPATIONS, OCCUPATION_LABELS, occupationLabel } from "@/lib/constants";
import { formatDate, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/hooks/use-language";
import type { AdminUserRow } from "@/types";

const NO_OCCUPATION = "__none__";

export function UserTable({ users, currentAdminId }: { users: AdminUserRow[]; currentAdminId: string }) {
  const router = useRouter();
  const { language } = useLanguage();
  const hindi = language === "hi";

  const [editing, setEditing] = React.useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = React.useState<AdminUserRow | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Controlled fields of the edit dialog.
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    occupation: NO_OCCUPATION as string,
    role: Role.USER as Role,
  });

  function openEdit(user: AdminUserRow) {
    setForm({
      name: user.name ?? "",
      phone: user.phone ?? "",
      occupation: user.occupation ?? NO_OCCUPATION,
      role: user.role,
    });
    setEditing(user);
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    const result = await runAction(() =>
      updateUserAction({
        id: editing.id,
        name: form.name,
        phone: form.phone,
        occupation: form.occupation === NO_OCCUPATION ? null : (form.occupation as Occupation),
        role: form.role,
      }),
    );
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? (hindi ? "उपयोगकर्ता अद्यतन किया गया।" : "User updated."));
    setEditing(null);
    router.refresh();
  }

  async function toggleDisabled(user: AdminUserRow) {
    setBusy(true);
    const result = await runAction(() => setUserDisabledAction(user.id, !user.disabled));
    setBusy(false);
    if (!result.ok) toast.error(result.error);
    else {
      toast.success(result.message ?? (hindi ? "अद्यतन सफल।" : "Updated."));
      router.refresh();
    }
  }

  async function sendReset(user: AdminUserRow) {
    setBusy(true);
    const result = await runAction(() => resetUserPasswordAction(user.id));
    setBusy(false);
    if (!result.ok) toast.error(result.error);
    else toast.success(result.message ?? (hindi ? "पासवर्ड रीसेट लिंक भेजा गया।" : "Reset link sent."));
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const result = await runAction(() => deleteUserAction(deleting.id));
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? (hindi ? "उपयोगकर्ता को हटा दिया गया।" : "User deleted."));
    setDeleting(null);
    router.refresh();
  }

  if (users.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {hindi ? "कोई उपयोगकर्ता इस फ़िल्टर से मेल नहीं खाता।" : "No users match these filters."}
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{hindi ? "उपयोगकर्ता" : "User"}</TableHead>
            <TableHead>{hindi ? "फ़ोन" : "Phone"}</TableHead>
            <TableHead>{hindi ? "ट्रेड / व्यवसाय" : "Occupation"}</TableHead>
            <TableHead>{hindi ? "भूमिका" : "Role"}</TableHead>
            <TableHead>{hindi ? "टेस्ट" : "Tests"}</TableHead>
            <TableHead>{hindi ? "स्थिति" : "Status"}</TableHead>
            <TableHead>{hindi ? "शामिल हुए" : "Joined"}</TableHead>
            <TableHead className="text-right">{hindi ? "कार्रवाई" : "Actions"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name ?? (hindi ? "अनाम" : "Unnamed")}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">{user.phone ?? "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{occupationLabel(user.occupation)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.role === "ADMIN" ? "warning" : "outline"}>
                  {user.role === "ADMIN" ? (hindi ? "एडमिन" : "Admin") : (hindi ? "शिक्षार्थी" : "Learner")}
                </Badge>
              </TableCell>
              <TableCell className="tabular-nums">{user.testsTaken}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={user.disabled ? "destructive" : "success"}>
                    {user.disabled ? (hindi ? "निष्क्रिय" : "Disabled") : (hindi ? "सक्रिय" : "Active")}
                  </Badge>
                  {!user.emailVerified ? <Badge variant="warning">{hindi ? "अपुष्ट" : "Unverified"}</Badge> : null}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(user.createdAt)}
                <br />
                {user.lastLoginAt
                  ? `${hindi ? "अंतिम बार देखा" : "last seen"} ${formatDate(user.lastLoginAt)}`
                  : (hindi ? "कभी लॉगिन नहीं किया" : "never signed in")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${user.email}`}
                    title={hindi ? "संपादित करें" : "Edit details"}
                    onClick={() => openEdit(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${user.email}`}
                    title={hindi ? "हटाएं" : "Delete user"}
                    disabled={user.id === currentAdminId}
                    onClick={() => setDeleting(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.email}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEdit(user)}>
                        <Pencil /> {hindi ? "विवरण संपादित करें" : "Edit details"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => sendReset(user)}>
                        <KeyRound /> {hindi ? "पासवर्ड रीसेट लिंक भेजें" : "Send password reset"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={user.id === currentAdminId}
                        onSelect={() => toggleDisabled(user)}
                      >
                        {user.disabled ? <ShieldCheck /> : <ShieldOff />}
                        {user.disabled
                          ? (hindi ? "खाता सक्रिय करें" : "Enable account")
                          : (hindi ? "खाता निष्क्रिय करें" : "Disable account")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={user.id === currentAdminId}
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setDeleting(user)}
                      >
                        <Trash2 /> {hindi ? "उपयोगकर्ता हटाएं" : "Delete user"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hindi ? "उपयोगकर्ता विवरण संपादित करें" : "Edit user"}</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{hindi ? "पूरा नाम" : "Full name"}</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">{hindi ? "मोबाइल नंबर" : "Mobile number"}</Label>
              <Input
                id="edit-phone"
                value={form.phone}
                onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-occupation">{hindi ? "व्यवसाय / ट्रेड" : "Occupation"}</Label>
                <Select
                  value={form.occupation}
                  onValueChange={(value) => setForm((f) => ({ ...f, occupation: value }))}
                >
                  <SelectTrigger id="edit-occupation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_OCCUPATION}>{hindi ? "चयनित नहीं" : "Not set"}</SelectItem>
                    {OCCUPATIONS.map((occupation) => (
                      <SelectItem key={occupation} value={occupation}>
                        {OCCUPATION_LABELS[occupation]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">{hindi ? "भूमिका" : "Role"}</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm((f) => ({ ...f, role: value as Role }))}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.USER}>{hindi ? "शिक्षार्थी (Learner)" : "Learner"}</SelectItem>
                    <SelectItem value={Role.ADMIN}>{hindi ? "प्रशासक (Administrator)" : "Administrator"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {hindi ? "रद्द करें" : "Cancel"}
            </Button>
            <Button onClick={saveEdit} loading={busy}>
              {hindi ? "परिवर्तन सहेजें" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hindi ? "क्या आप इस उपयोगकर्ता को हटाना चाहते हैं?" : "Delete this user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hindi
                ? `${deleting?.email} को स्थायी रूप से हटा दिया जाएगा, जिसमें उनके सभी टेस्ट प्रयास, बुकमार्क और गतिविधि इतिहास शामिल हैं। इसे वापस नहीं लाया जा सकता।`
                : `${deleting?.email} will be permanently removed, along with their test attempts, bookmarks and activity history. This cannot be undone. Consider disabling the account instead.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{hindi ? "रद्द करें" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {busy
                ? (hindi ? "हटाया जा रहा है…" : "Deleting…")
                : (hindi ? "स्थायी रूप से हटाएं" : "Delete permanently")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
