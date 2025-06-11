
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { EditStaffDialog } from "@/components/staff/EditStaffDialog";
import { StaffStatsDialog } from "@/components/staff/StaffStatsDialog";
import { Button } from "@/components/ui/button";
import { Edit, BarChart3 } from "lucide-react";

export const StaffManagement = () => {
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'gerant': return 'destructive';
      case 'superviseur': return 'default';
      case 'serveur': return 'secondary';
      case 'cuisinier': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion du Personnel</h1>
        <AddStaffDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste du Personnel</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date d'embauche</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.first_name} {member.last_name}
                  </TableCell>
                  <TableCell>{member.email || 'N/A'}</TableCell>
                  <TableCell>{member.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.hire_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? 'default' : 'secondary'}>
                      {member.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <EditStaffDialog staff={member} />
                      {member.role === 'serveur' && (
                        <StaffStatsDialog staffId={member.id} staffName={`${member.first_name} ${member.last_name}`} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
