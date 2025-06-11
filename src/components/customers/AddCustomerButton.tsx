
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddCustomerDialog } from "./AddCustomerDialog";

export const AddCustomerButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un client
      </Button>
      <AddCustomerDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
