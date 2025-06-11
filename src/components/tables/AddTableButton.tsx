
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTableDialog } from "./AddTableDialog";

export const AddTableButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une table
      </Button>
      <AddTableDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
