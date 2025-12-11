import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export function UsersView() {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("id, user_id, role");
    setAllUsers(data || []);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No users found</p>
          ) : (
            <div className="space-y-2">
              {allUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <p className="font-medium">User ID: {user.user_id}</p>
                    <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
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
