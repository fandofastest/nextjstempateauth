"use client";
import React from "react";
import Button from "@/components/ui/button/Button";
import AddRoleModal from "@/components/mycomponent/modal/AddRoleModal";

export default function RolesActions() {
  const [open, setOpen] = React.useState(false);
  const handleSuccess = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("roles:refresh"));
    }
  };
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Add Role</Button>
      <AddRoleModal isOpen={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} />
    </>
  );
}
