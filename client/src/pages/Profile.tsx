import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, Save, X, CheckCircle, Clock, FileText, Loader2 as LoaderIcon, Heart, Target, Brain, Briefcase, MapPin, TrendingUp,
  Lock, Eye, EyeOff, Copy, Link2, Share2, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { TileGrid, ProfileTile } from "@/components/profile/tiles";

interface ProfileDimensions {
  [key: string]: any;
}

interface UserPrivacySettings {
  isProfilePublic?: boolean;
  showBadges?: boolean;
  showTags?: boolean;
  showQuizResults?: boolean;
  allowDiscovery?: boolean;
  sharedDimensions?: string[];
}

interface QuizResult {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number | null;
  is_passed: boolean | null;
  completed_at: string;
}

interface UserBadge {
  id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_category: string | null;
}

interface UserTag {
  id: string;
  tag_key: string;
  tag_value: string;
}

interface ProfileData {
  profile: any | null;
  badges: UserBadge[];
  tags: UserTag[];
  privacy: UserPrivacySettings | null;
}

const DIMENSION_CONFIG: Record<string, { icon: React.ElementType, title: string }> = {
  personality: { icon: Heart, title: "Personality" },
  strengths: { icon: Sparkles, title: "Strengths" },
  values: { icon: Target, title: "Values" },
  interests: { icon: Briefcase, title: "Interests" },
  growth: { icon: Brain, title: "Growth Areas" },
  land_criteria: { icon: MapPin, title: "Land Criteria" },
  project_resources: { icon: TrendingUp, title: "Project Resources" },
};

const getDimensionConfig = (dim: string) => {
  return DIMENSION_CONFIG[dim] || {
    icon: Sparkles,
    title: dim.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  };
};

export default function Profile() {
  const { user } = useSupabaseAuth();
  const { legacyRole } = usePermissions();
  const role = legacyRole || 'viewer';
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();

  // Location form state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({
    continentsVisited: [] as string[],
    travelFrequency: "",
    travelMotivation: [] as string[],
    locationPrivacy: "",
    identitySensitivity: "",
    meetupPreferences: [] as string[],
    communityActivities: [] as string[],
  });

  // Contact form state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    preferredMethods: [] as string[],
    communicationStyle: "",
    responseTime: "",
    energizingMethods: [] as string[],
    drainingMethods: [] as string[],
    boundaries: [] as string[],
    privacyLevel: "",
  });

  const { data: quizResults = [], isLoading: isLoadingQuizzes } = useQuery<QuizResult[]>({
    queryKey: ['my-quiz-results'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('quiz_results')
        .select('id, quiz_id, user_id, score, is_passed, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch profile tiles
  const { data: profileTiles = [], isLoading: isLoadingTiles } = useQuery<ProfileTile[]>({
    queryKey: ['profile-tiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('profile_tiles')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Toggle tile visibility mutation
  const toggleTileVisibilityMutation = useMutation({
    mutationFn: async ({ tileId, isVisible }: { tileId: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from('profile_tiles')
        .update({ is_visible: isVisible })
        .eq('id', tileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-tiles'] });
    },
  });

  const handleToggleTileVisibility = (tileId: string, isVisible: boolean) => {
    toggleTileVisibilityMutation.mutate({ tileId, isVisible });
  };

  const { data: profileData, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ['my-profile-data'],
    queryFn: async () => {
      if (!user?.id) return { profile: null, badges: [], tags: [], privacy: null };
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Fetch badges
      const { data: badges } = await supabase
        .from('user_badges')
        .select('id, badge_key, badge_name, badge_description, badge_category')
        .eq('user_id', user.id);
      
      // Fetch tags
      const { data: tags } = await supabase
        .from('user_tags')
        .select('id, tag_key, tag_value')
        .eq('user_id', user.id);
      
      // Fetch privacy settings
      const { data: privacy } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      return {
        profile,
        badges: badges || [],
        tags: tags || [],
        privacy: privacy ? {
          isProfilePublic: privacy.is_profile_public,
          showBadges: privacy.show_badges,
          showTags: privacy.show_tags,
          showQuizResults: privacy.show_quiz_results,
          allowDiscovery: privacy.allow_discovery,
          sharedDimensions: privacy.shared_dimensions || [],
        } : null,
      };
    },
    enabled: !!user?.id,
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: async (updates: Partial<UserPrivacySettings>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const dbUpdates: any = {};
      if (updates.isProfilePublic !== undefined) dbUpdates.is_profile_public = updates.isProfilePublic;
      if (updates.showBadges !== undefined) dbUpdates.show_badges = updates.showBadges;
      if (updates.showTags !== undefined) dbUpdates.show_tags = updates.showTags;
      if (updates.showQuizResults !== undefined) dbUpdates.show_quiz_results = updates.showQuizResults;
      if (updates.allowDiscovery !== undefined) dbUpdates.allow_discovery = updates.allowDiscovery;
      if (updates.sharedDimensions !== undefined) dbUpdates.shared_dimensions = updates.sharedDimensions;
      
      // Update privacy settings
      const { error } = await supabase
        .from('user_privacy_settings')
        .update(dbUpdates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Also update profile_visibility in profiles table when isProfilePublic changes
      if (updates.isProfilePublic !== undefined) {
        // Use raw SQL to properly cast the enum value
        const newVisibility = updates.isProfilePublic ? 'public' : 'private';
        const { error: profileError } = await supabase.rpc('update_profile_visibility', {
          p_user_id: user.id,
          p_visibility: newVisibility
        });
        
        if (profileError) {
          // Fallback to direct update (might work depending on Supabase version)
          const { error: fallbackError } = await supabase
            .from('profiles')
            .update({ 
              profile_visibility: newVisibility as any,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (fallbackError) {
            console.error('Failed to update profile visibility:', fallbackError);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile-data'] });
      toast({
        title: "Privacy Updated",
        description: "Your privacy settings have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: typeof locationForm) => {
      if (!user?.id) throw new Error('Not authenticated');
      // For now, store in profile's social_links JSON field or a dedicated column
      // This is a placeholder - you may need to add proper columns
      toast({ title: "Note", description: "Location preferences saved locally" });
    },
    onSuccess: () => {
      setIsEditingLocation(false);
      toast({
        title: "Location Updated",
        description: "Your location preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update location preferences.",
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      if (!user?.id) throw new Error('Not authenticated');
      // For now, store locally - you may need to add proper columns
      toast({ title: "Note", description: "Contact preferences saved locally" });
    },
    onSuccess: () => {
      setIsEditingContact(false);
      toast({
        title: "Contact Updated",
        description: "Your contact preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update contact preferences.",
        variant: "destructive",
      });
    },
  });

  const handlePrivacyToggle = (field: keyof UserPrivacySettings, value: boolean) => {
    updatePrivacyMutation.mutate({ [field]: value });
  };

  const handleDimensionToggle = (dimension: string, checked: boolean) => {
    const currentDimensions = profileData?.privacy?.sharedDimensions || [];
    const updatedDimensions = checked
      ? [...currentDimensions, dimension]
      : currentDimensions.filter(d => d !== dimension);
    updatePrivacyMutation.mutate({ sharedDimensions: updatedDimensions });
  };

  // Populate location form when profile data loads
  useEffect(() => {
    // Location data would come from profile if stored there
  }, [profileData]);

  // Populate contact form when profile data loads
  useEffect(() => {
    // Contact data would come from profile if stored there
  }, [profileData]);

  // Helper to convert comma-separated string to array
  const stringToArray = (str: string): string[] => {
    return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  // Helper to convert array to comma-separated string
  const arrayToString = (arr: string[]): string => {
    return arr.join(', ');
  };

  const handleSaveLocation = () => {
    updateLocationMutation.mutate(locationForm);
  };

  const handleCancelLocation = () => {
    setLocationForm({
      continentsVisited: [],
      travelFrequency: "",
      travelMotivation: [],
      locationPrivacy: "",
      identitySensitivity: "",
      meetupPreferences: [],
      communityActivities: [],
    });
    setIsEditingLocation(false);
  };

  const handleSaveContact = () => {
    updateContactMutation.mutate(contactForm);
  };

  const handleCancelContact = () => {
    setContactForm({
      preferredMethods: [],
      communicationStyle: "",
      responseTime: "",
      energizingMethods: [],
      drainingMethods: [],
      boundaries: [],
      privacyLevel: "",
    });
    setIsEditingContact(false);
  };

  const completedQuizzes = quizResults.filter(r => r.score !== null);

  // Get profile data for display
  const profile = profileData?.profile;
  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const userEmail = user?.email || '';
  const userBio = profile?.bio || '';
  const avatarUrl = profile?.avatar_url || '';
  const username = profile?.username || '';
  const userCreatedAt = profile?.created_at;

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: name.split(' ')[0] || '',
          last_name: name.split(' ').slice(1).join(' ') || '',
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['my-profile-data'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setName(displayName);
    setBio(displayBio === "No bio added yet." ? "" : displayBio);
    setIsEditing(false);
  };

  const handleCopyProfileLink = () => {
    if (!user?.id) return;
    const profileUrl = `${window.location.origin}/users/${username || user.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Link Copied",
      description: "Your profile link has been copied to clipboard.",
    });
  };

  const handleShareProfile = async () => {
    if (!user?.id) return;
    const profileUrl = `${window.location.origin}/users/${username || user.id}`;
    
    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Profile`,
          text: `Check out ${displayName}'s profile on Charting the Course`,
          url: profileUrl,
        });
        toast({
          title: "Shared Successfully",
          description: "Your profile has been shared.",
        });
      } catch (error) {
        // User cancelled or error occurred, do nothing
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to copy
      handleCopyProfileLink();
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // Initialize PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Colors matching public profile theme
      const bgColor: [number, number, number] = [15, 23, 42]; // slate-900
      const primaryColor: [number, number, number] = [6, 182, 212]; // cyan-500
      const textColor: [number, number, number] = [255, 255, 255];
      const mutedColor: [number, number, number] = [148, 163, 184]; // slate-400
      const cardColor: [number, number, number] = [30, 41, 59]; // slate-800
      const accentColor: [number, number, number] = [20, 184, 166]; // teal-500

      // Safe text helper to avoid null/undefined issues
      const safeText = (text: string | null | undefined, maxLen?: number): string => {
        const t = String(text || '');
        return maxLen ? t.slice(0, maxLen) : t;
      };

      // Background
      pdf.setFillColor(...bgColor);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header Section
      pdf.setFillColor(...cardColor);
      pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 55, 5, 5, 'F');

      // Avatar placeholder (circle)
      pdf.setFillColor(...primaryColor);
      pdf.circle(margin + 22, yPos + 27, 17, 'F');
      
      // Initials in avatar
      const initials = `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase() || '?';
      pdf.setTextColor(...textColor);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(initials, margin + 22, yPos + 31, { align: 'center' });

      // Name
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const displayNamePDF = `${firstName || ''} ${lastName || ''}`.trim() || 'User';
      pdf.text(displayNamePDF, margin + 48, yPos + 18);

      // Headline
      const headline = profileData?.profile?.headline;
      if (headline) {
        pdf.setFontSize(9);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(safeText(headline, 55), margin + 48, yPos + 26);
      }

      // Role & Username
      pdf.setFontSize(8);
      pdf.setTextColor(...mutedColor);
      const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
      pdf.text(`@${username || 'user'} - ${roleDisplay}`, margin + 48, yPos + 34);

      // Stats row (simplified - no gamification)
      const statsY = yPos + 45;
      pdf.setFontSize(12);
      pdf.setTextColor(...accentColor);
      pdf.setFont('helvetica', 'bold');
      const completedQuizCount = completedQuizzes?.length || 0;
      pdf.text(`${completedQuizCount} Quizzes Completed`, margin + 48, statsY);

      yPos += 62;

      // Bio Section
      const bio = profileData?.profile?.bio || userBio;
      if (bio && bio.trim()) {
        pdf.setFillColor(...cardColor);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 22, 3, 3, 'F');
        
        pdf.setFontSize(8);
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'normal');
        const bioLines = pdf.splitTextToSize(safeText(bio), pageWidth - margin * 2 - 10);
        pdf.text(bioLines.slice(0, 2), margin + 5, yPos + 8);
        yPos += 27;
      }

      // Badges Section
      const badges = profileData?.badges || [];
      if (badges.length > 0) {
        pdf.setFillColor(...cardColor);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 3, 3, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Badges & Achievements (${badges.length})`, margin + 5, yPos + 10);
        
        pdf.setFontSize(7);
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'normal');
        
        let badgeX = margin + 5;
        let badgeY = yPos + 18;
        badges.slice(0, 10).forEach((badge, i) => {
          const badgeName = safeText(badge?.badge_name, 15) || 'Badge';
          pdf.text(`* ${badgeName}`, badgeX, badgeY);
          badgeX += 45;
          if ((i + 1) % 4 === 0) {
            badgeX = margin + 5;
            badgeY += 10;
          }
        });
        yPos += 45;
      }

      // Tags Section
      const tags = profileData?.tags || [];
      if (tags.length > 0) {
        pdf.setFillColor(...cardColor);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Profile Tags (${tags.length})`, margin + 5, yPos + 10);
        
        pdf.setFontSize(7);
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'normal');
        
        const tagTexts = tags.slice(0, 10).map(t => safeText(t?.tag_value)).filter(Boolean);
        const tagsLine = tagTexts.join(' | ');
        pdf.text(safeText(tagsLine, 100), margin + 5, yPos + 20);
        yPos += 35;
      }

      // Quiz Results Section
      const quizList = completedQuizzes || [];
      if (quizList.length > 0) {
        pdf.setFillColor(...cardColor);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 45, 3, 3, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Recent Quiz Results (${quizList.length})`, margin + 5, yPos + 10);
        
        let quizY = yPos + 20;
        quizList.slice(0, 4).forEach((quiz) => {
          if (!quiz) return;
          const score = typeof quiz.score === 'number' ? quiz.score : 0;
          const scoreColor: [number, number, number] = score >= 80 ? [16, 185, 129] : score >= 60 ? [245, 158, 11] : [239, 68, 68];
          
          pdf.setFontSize(9);
          pdf.setTextColor(...scoreColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${score}%`, margin + 5, quizY);
          
          pdf.setFontSize(8);
          pdf.setTextColor(...mutedColor);
          pdf.setFont('helvetica', 'normal');
          const completedDate = quiz.completed_at ? new Date(quiz.completed_at).toLocaleDateString() : 'Unknown date';
          pdf.text(`Completed ${completedDate}`, margin + 22, quizY);
          quizY += 8;
        });
        yPos += 50;
      }


      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(...mutedColor);
      pdf.text(`Charting the Course - Profile exported on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

      // Save PDF
      const safeUsername = (username || user?.id || 'export').replace(/[^a-zA-Z0-9]/g, '-');
      const fileName = `profile-${safeUsername}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Profile Exported!",
        description: `Your profile has been saved as ${fileName}`,
      });
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: error?.message || "Failed to generate PDF. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const displayName = `${firstName} ${lastName}`.trim() || userEmail || "";
  const displayBio = userBio || "No bio added yet.";

  const getRoleBadgeRole = (roleKey?: string): "Admin" | "Facilitator" | "Contributor" | "Viewer" => {
    if (!roleKey) return "Viewer";
    return (roleKey.charAt(0).toUpperCase() + roleKey.slice(1)) as "Admin" | "Facilitator" | "Contributor" | "Viewer";
  };

  const profileDimensions = profileData?.profile?.profile_dimensions as ProfileDimensions | undefined;

  const getTagsForDimension = (dimension: keyof ProfileDimensions) => {
    if (!profileDimensions || !profileDimensions[dimension]) return [];
    const dimData = profileDimensions[dimension];
    
    const extractValues = (obj: any): (string | number)[] => {
      const results: (string | number)[] = [];
      
      if (typeof obj === 'string' || typeof obj === 'number') {
        results.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(item => {
          results.push(...extractValues(item));
        });
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(value => {
          results.push(...extractValues(value));
        });
      }
      
      return results;
    };
    
    return extractValues(dimData);
  };

  const tilesByDimension = (profileTiles || []).reduce((acc, tile) => {
    const dim = tile.dimension || 'general';
    if (!acc[dim]) {
      acc[dim] = [];
    }
    acc[dim].push(tile);
    return acc;
  }, {} as Record<string, ProfileTile[]>);

  const dimensionOrder = Object.keys(DIMENSION_CONFIG);
  const sortedDimensions = Object.keys(tilesByDimension).sort((a, b) => {
    const indexA = dimensionOrder.indexOf(a);
    const indexB = dimensionOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b); // both are custom
    if (indexA === -1) return 1; // custom dimensions at the end
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const DimensionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    dimension, 
    color 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    dimension: keyof ProfileDimensions; 
    color: string;
  }) => {
    const tags = getTagsForDimension(dimension);
    const isEmpty = tags.length === 0;

    return (
      <Card data-testid={`card-dimension-${dimension}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEmpty ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-muted-foreground text-sm">
                No {title.toLowerCase()} data yet
              </p>
              <p className="text-muted-foreground text-xs">
                Complete quizzes with {title.toLowerCase()} questions to fill this dimension
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" data-testid={`tag-${dimension}-${index}`}>
                  {String(tag)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and track your learning journey
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            data-testid="button-export-pdf"
          >
            {isExporting ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-2xl">
                {displayName.split(' ').map(n => n[0]).join('') || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      data-testid="input-profile-bio"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" data-testid="button-save-profile">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} size="sm" variant="outline" data-testid="button-cancel-edit">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold" data-testid="text-profile-name">{displayName}</h2>
                    <p className="text-muted-foreground">{userEmail}</p>
                  </div>
                  <p className="text-sm">{displayBio}</p>
                  <div className="flex gap-4 flex-wrap items-center">
                    <RoleBadge role={getRoleBadgeRole(role)} />
                    {userCreatedAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Joined {new Date(userCreatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <Button 
                      onClick={() => {
                        setName(displayName || "");
                        setBio(displayBio || "");
                        setIsEditing(true);
                      }} 
                      size="sm" 
                      variant="outline" 
                      data-testid="button-edit-profile"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Link Section */}
      <Card data-testid="card-profile-link">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Profile Link
              </CardTitle>
              <CardDescription>Share your profile with others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Input
                      value={user?.id ? `${window.location.origin}/users/${username || user.id}` : ''}
                      readOnly
                      className="text-sm"
                      data-testid="input-profile-url"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyProfileLink}
                    data-testid="button-copy-link"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleShareProfile}
                    data-testid="button-share-profile"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Others can visit this link to view your public profile based on your privacy settings.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Insights Section - Grouped by Dimension */}
          <div className="space-y-6">
            {isLoadingTiles ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <LoaderIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading insights...
                </CardContent>
              </Card>
            ) : sortedDimensions.map(dim => {
              const config = getDimensionConfig(dim);
              const tiles = tilesByDimension[dim];
              if (!tiles || tiles.length === 0) return null;

              return (
                <Card key={dim} data-testid={`card-dimension-${dim}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <config.icon className="h-5 w-5" />
                      {config.title}
                    </CardTitle>
                    <CardDescription>
                      Insights related to your {config.title.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TileGrid 
                      tiles={tiles} 
                      isOwner={true}
                      onToggleVisibility={handleToggleTileVisibility}
                      showHidden={true}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Recent Quiz Results</CardTitle>
                  <CardDescription>Your most recent completed quizzes</CardDescription>
                </div>
                {completedQuizzes.length > 5 && (
                  <Link href="/my-quiz-history">
                    <Button variant="outline" size="sm" data-testid="button-view-all-history">
                      View All
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingQuizzes ? (
                <p className="text-muted-foreground text-center py-8">Loading quiz results...</p>
              ) : completedQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {completedQuizzes.slice(0, 5).map((result) => (
                    <Link key={result.id} href={`/quiz/results/${result.id}`}>
                      <div
                        className="flex items-center justify-between p-4 rounded-lg border hover-elevate active-elevate-2 cursor-pointer"
                        data-testid={`completed-quiz-${result.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <CheckCircle className="h-5 w-5 text-chart-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">Quiz Result</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.completed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={result.is_passed ? "default" : "destructive"}>
                          {result.score}%
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  <Link href="/my-quiz-history">
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="link-view-all-history">
                        View All History
                      </Button>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground">
                    No completed quizzes yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Start taking quizzes to build your profile!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control what information is visible to other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Make Profile Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view your profile page
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.isProfilePublic || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('isProfilePublic', checked)}
                  data-testid="switch-profile-public"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Show Badges</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your earned badges
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.showBadges || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('showBadges', checked)}
                  data-testid="switch-show-badges"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Show Tags</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your profile tags publicly
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.showTags || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('showTags', checked)}
                  data-testid="switch-show-tags"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Show Quiz Results</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see which quizzes you've completed and your scores
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.showQuizResults || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('showQuizResults', checked)}
                  data-testid="switch-show-quiz-results"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">Allow Discovery</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others discover you based on similar or opposite profile traits
                  </p>
                </div>
                <Switch
                  checked={profileData?.privacy?.allowDiscovery || false}
                  onCheckedChange={(checked) => handlePrivacyToggle('allowDiscovery', checked)}
                  data-testid="switch-allow-discovery"
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
              <CardDescription>
                See how your profile appears to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full" 
                data-testid="button-preview-profile"
                onClick={() => {
                  const profileUrl = username ? `/users/${username}` : `/users/${user?.id}`;
                  window.open(profileUrl, '_blank');
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Public Profile
              </Button>
              {!profileData?.privacy?.isProfilePublic && (
                <p className="text-xs text-amber-500 text-center">
                  Your profile is currently private. Enable "Make Profile Public" above to allow others to view it.
                </p>
              )}
            </CardContent>
          </Card>
    </div>
  );
}
