import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";
import { z } from "zod";

const roleAssignmentSchema = z.object({
  user_id: z.string().uuid("Invalid User ID format"),
  role: z.enum(["admin", "store_owner", "shopper", "super_admin"])
});

export function RolesView() {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [roleUserId, setRoleUserId] = useState("");
  const [roleToAssign, setRoleToAssign] = useState<"admin" | "store_owner" | "shopper" | "super_admin">("shopper");

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("id, user_id, role");
    setAllUsers(data || []);
  };

  const assignRoleToUser = async () => {
    const result = roleAssignmentSchema.safeParse({ 
      user_id: roleUserId, 
      role: roleToAssign 
    });
    
    if (!result.success) {
      toast({ 
        title: "Validation Error", 
        description: result.error.issues[0].message, 
        variant: "destructive" 
      });
      return;
    }

    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", result.data.user_id)
      .eq("role", result.data.role)
      .maybeSingle();

    if (existingRole) {
      toast({ 
        title: "Role Already Exists", 
        description: "This user already has this role assigned", 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ 
        user_id: result.data.user_id, 
        role: result.data.role 
      });

    if (error) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Success", 
        description: `Role '${result.data.role}' assigned successfully` 
      });
      setRoleUserId("");
      loadAllUsers();
    }
  };

  const deleteUserRole = async (roleId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Role removed" });
      loadAllUsers();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="User ID (UUID)"
            value={roleUserId}
            onChange={(e) => setRoleUserId(e.target.value)}
          />
          <Select 
            value={roleToAssign} 
            onValueChange={(value: "admin" | "store_owner" | "shopper" | "super_admin") => setRoleToAssign(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shopper">Shopper</SelectItem>
              <SelectItem value="store_owner">Store Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={assignRoleToUser}>Assign Role</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No roles assigned</p>
          ) : (
            <div className="space-y-2">
              {allUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">User ID: {user.user_id}</p>
                      <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteUserRole(user.id)}
                    >
                      Remove Role
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
