
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Profile = () => {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isGuest) {
      setProfileLoading(false);
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      // Update profile with new avatar URL
      await updateProfile();

      toast({
        title: 'Avatar updated',
        description: 'Your profile image has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Avatar upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
          email: user.email // Include email field in the update
        })
        .eq('id', user.id);
    
      if (error) throw error;
    
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      await updateProfile();
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const userInitials = fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : (
    user?.email ? user.email[0].toUpperCase() : 'U'
  );

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-task-purple"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 p-4">
      <div className="container max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-task-purple to-task-purple-dark bg-clip-text text-transparent">
            Profile Settings
          </h1>

          {isGuest ? (
            <Alert variant="destructive" className="mb-6">
              <User className="h-4 w-4 mr-2" />
              <AlertTitle>Guest Mode</AlertTitle>
              <AlertDescription className="mt-2">
                Profile settings are disabled in guest mode. Please create an account to access all features.
                <div className="mt-4">
                  <Button onClick={() => navigate('/auth')}>
                    Create Account
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={fullName || 'User'} />
                          ) : null}
                          <AvatarFallback className="text-lg bg-task-purple text-white">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0">
                          <Label htmlFor="avatar" className="cursor-pointer">
                            <div className="p-1.5 rounded-full bg-task-purple text-white shadow-md hover:bg-task-purple-dark transition-colors">
                              {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </div>
                          </Label>
                          <Input 
                            id="avatar" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={uploadAvatar} 
                            disabled={uploading}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        placeholder="Your name" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-gradient-to-r from-task-purple to-task-purple-dark hover:bg-task-purple-dark"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Email: {user?.email}</p>
                    <p>Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Go to Dashboard
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
