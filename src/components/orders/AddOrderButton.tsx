
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddOrderDialog } from "./AddOrderDialog";

export const AddOrderButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle commande
      </Button>
      <AddOrderDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
