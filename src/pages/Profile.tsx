
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save } from "lucide-react";

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

const Profile = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData(data);
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url);
      } else {
        // Create a profile if it doesn't exist
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: "",
              avatar_url: null,
            },
          ]);

        if (insertError) throw insertError;

        setProfileData({
          id: user.id,
          full_name: "",
          avatar_url: null,
          email: user.email || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: data.publicUrl,
          updated_at: new Date(),
        })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Avatar updated",
        description: "Your avatar has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-task-purple"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => navigate("/")}
      >
        Back to Dashboard
      </Button>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || undefined} alt={fullName || "Avatar"} />
              <AvatarFallback>
                {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <Label 
                htmlFor="avatar-upload" 
                className="cursor-pointer bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
              >
                {uploading ? "Uploading..." : "Change Avatar"}
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullname">Full Name</Label>
            <Input
              id="fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          {isEditing ? (
            <Button 
              onClick={updateProfile} 
              className="bg-gradient-to-r from-task-purple to-task-purple-dark hover:bg-task-purple-dark"
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" /> Save Profile
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;
