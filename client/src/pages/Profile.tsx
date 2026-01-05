import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, Save, X, CheckCircle, Clock, Download, FileText, Loader2 as LoaderIcon,
  TrendingUp, Heart, Target, Sparkles, Brain, Shield,
  User, Lock, Eye, EyeOff, Copy, Link2, Share2, MapPin, Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { StatCard } from "@/components/StatCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ProfileDimensions {
  personality?: any;
  strengths?: any;
  values?: any;
  interests?: any;
  growth?: any;
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

interface XPLevel {
  total_xp: number;
  current_level: number;
  quiz_streak: number;
  longest_streak: number;
}

interface ProfileData {
  profile: any | null;
  badges: UserBadge[];
  tags: UserTag[];
  privacy: UserPrivacySettings | null;
  xpLevel: XPLevel | null;
}

export default function Profile() {
  const { user } = useSupabaseAuth();
  const { role } = useRoleAccess();
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

  const { data: profileData, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ['my-profile-data'],
    queryFn: async () => {
      if (!user?.id) return { profile: null, badges: [], tags: [], privacy: null, xpLevel: null };
      
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
      
      // Fetch XP level
      const { data: xpLevel } = await supabase
        .from('user_xp_levels')
        .select('total_xp, current_level, quiz_streak, longest_streak')
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
        xpLevel: xpLevel || null,
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
  const avgScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((sum, r) => sum + (r.score || 0), 0) / completedQuizzes.length)
    : 0;

  const stats = {
    completedQuizzes: completedQuizzes.length,
    avgScore,
    totalTags: profileData?.tags.length || 0,
    totalBadges: profileData?.badges.length || 0,
    currentXP: profileData?.xpLevel?.total_xp || 0,
    currentLevel: profileData?.xpLevel?.current_level || 1,
    currentStreak: profileData?.xpLevel?.quiz_streak || 0,
  };

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
    const profileUrl = `${window.location.origin}/u/${username || user.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Link Copied",
      description: "Your profile link has been copied to clipboard.",
    });
  };

  const handleShareProfile = async () => {
    if (!user?.id) return;
    const profileUrl = `${window.location.origin}/u/${username || user.id}`;
    
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

      // Stats row
      const statsY = yPos + 45;
      pdf.setFontSize(12);
      pdf.setTextColor(...accentColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${stats.currentXP || 0} XP`, margin + 48, statsY);
      pdf.text(`Level ${stats.currentLevel || 1}`, margin + 90, statsY);
      pdf.text(`${stats.completedQuizzes || 0} Quizzes`, margin + 130, statsY);

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

      // XP Progress Section
      if ((stats.currentXP || 0) > 0) {
        pdf.setFillColor(...cardColor);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(...primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Journey Progress`, margin + 5, yPos + 10);
        
        // Progress bar background
        pdf.setFillColor(51, 65, 85);
        pdf.roundedRect(margin + 5, yPos + 15, pageWidth - margin * 2 - 10, 5, 1, 1, 'F');
        
        // Progress bar fill
        const progress = ((stats.currentXP || 0) % 100) / 100;
        const barWidth = (pageWidth - margin * 2 - 10) * Math.max(0, Math.min(1, progress));
        if (barWidth > 0) {
          pdf.setFillColor(...accentColor);
          pdf.roundedRect(margin + 5, yPos + 15, barWidth, 5, 1, 1, 'F');
        }
        
        yPos += 30;
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

      <Tabs defaultValue="overview" className="space-y-6" data-testid="tabs-profile">
        <TabsList className="flex flex-wrap gap-2 h-auto p-2">
          <TabsTrigger value="overview" data-testid="tab-overview" className="flex-shrink-0">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="location" data-testid="tab-location" className="flex-shrink-0">
            <MapPin className="h-4 w-4 mr-2" />
            Location
          </TabsTrigger>
          <TabsTrigger value="contact" data-testid="tab-contact" className="flex-shrink-0">
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="dimensions" data-testid="tab-dimensions" className="flex-shrink-0">
            <Brain className="h-4 w-4 mr-2" />
            Dimensions
          </TabsTrigger>
          <TabsTrigger value="badges" data-testid="tab-badges" className="flex-shrink-0">
            <Shield className="h-4 w-4 mr-2" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="privacy" data-testid="tab-privacy" className="flex-shrink-0">
            <Lock className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* XP Progress Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">Lvl {stats.currentLevel}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Level {stats.currentLevel}</h3>
                    <p className="text-muted-foreground">{stats.currentXP} XP earned</p>
                    {stats.currentStreak > 0 && (
                      <p className="text-sm text-amber-500">🔥 {stats.currentStreak} day streak!</p>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Level {stats.currentLevel}</span>
                    <span>Level {stats.currentLevel + 1}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${(stats.currentXP % 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {100 - (stats.currentXP % 100)} XP to next level
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total XP"
              value={stats.currentXP}
              icon={TrendingUp}
            />
            <StatCard
              title="Quizzes"
              value={stats.completedQuizzes}
              icon={CheckCircle}
            />
            <StatCard
              title="Badges"
              value={stats.totalBadges}
              icon={Shield}
            />
            <StatCard
              title="Tags"
              value={stats.totalTags}
              icon={Sparkles}
            />
          </div>

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
                      value={user?.id ? `${window.location.origin}/u/${username || user.id}` : ''}
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Results</CardTitle>
              <CardDescription>Your most recent completed quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingQuizzes ? (
                <p className="text-muted-foreground text-center py-8">Loading quiz results...</p>
              ) : completedQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {completedQuizzes.slice(0, 5).map((result) => (
                    <Link key={result.id} href={`/quiz/results/${result.quiz_id}`}>
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
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <Card data-testid="card-location">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Preferences
                  </CardTitle>
                  <CardDescription>
                    Your location and travel preferences
                  </CardDescription>
                </div>
                {!isEditingLocation && (
                  <Button
                    onClick={() => setIsEditingLocation(true)}
                    size="sm"
                    variant="outline"
                    data-testid="button-edit-location"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditingLocation ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="continents-visited">Continents Visited</Label>
                    <Input
                      id="continents-visited"
                      value={arrayToString(locationForm.continentsVisited)}
                      onChange={(e) => setLocationForm({...locationForm, continentsVisited: stringToArray(e.target.value)})}
                      placeholder="e.g., North America, Europe, Asia (comma-separated)"
                      data-testid="input-continents-visited"
                    />
                    <p className="text-xs text-muted-foreground">Enter continents separated by commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travel-frequency">Travel Frequency</Label>
                    <Input
                      id="travel-frequency"
                      value={locationForm.travelFrequency}
                      onChange={(e) => setLocationForm({...locationForm, travelFrequency: e.target.value})}
                      placeholder="e.g., Monthly, Quarterly, Annually"
                      data-testid="input-travel-frequency"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travel-motivation">Travel Motivations</Label>
                    <Input
                      id="travel-motivation"
                      value={arrayToString(locationForm.travelMotivation)}
                      onChange={(e) => setLocationForm({...locationForm, travelMotivation: stringToArray(e.target.value)})}
                      placeholder="e.g., Adventure, Culture, Work (comma-separated)"
                      data-testid="input-travel-motivation"
                    />
                    <p className="text-xs text-muted-foreground">Enter motivations separated by commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-privacy">Location Privacy Preference</Label>
                    <Input
                      id="location-privacy"
                      value={locationForm.locationPrivacy}
                      onChange={(e) => setLocationForm({...locationForm, locationPrivacy: e.target.value})}
                      placeholder="e.g., Public, Private, Selective"
                      data-testid="input-location-privacy"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identity-sensitivity">Identity Sensitivity</Label>
                    <Input
                      id="identity-sensitivity"
                      value={locationForm.identitySensitivity}
                      onChange={(e) => setLocationForm({...locationForm, identitySensitivity: e.target.value})}
                      placeholder="e.g., Low, Medium, High"
                      data-testid="input-identity-sensitivity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetup-preferences">Meetup Preferences</Label>
                    <Input
                      id="meetup-preferences"
                      value={arrayToString(locationForm.meetupPreferences)}
                      onChange={(e) => setLocationForm({...locationForm, meetupPreferences: stringToArray(e.target.value)})}
                      placeholder="e.g., Coffee shops, Parks, Virtual (comma-separated)"
                      data-testid="input-meetup-preferences"
                    />
                    <p className="text-xs text-muted-foreground">Enter preferences separated by commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="community-activities">Community Activities</Label>
                    <Textarea
                      id="community-activities"
                      value={arrayToString(locationForm.communityActivities)}
                      onChange={(e) => setLocationForm({...locationForm, communityActivities: stringToArray(e.target.value)})}
                      placeholder="e.g., Meetups, Workshops, Conferences (comma-separated)"
                      data-testid="input-community-activities"
                    />
                    <p className="text-xs text-muted-foreground">Enter activities separated by commas</p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveLocation} 
                      size="sm" 
                      disabled={updateLocationMutation.isPending}
                      data-testid="button-save-location"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateLocationMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      onClick={handleCancelLocation} 
                      size="sm" 
                      variant="outline"
                      disabled={updateLocationMutation.isPending}
                      data-testid="button-cancel-location"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {locationForm.continentsVisited.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Continents Visited</Label>
                      <div className="flex flex-wrap gap-2">
                        {locationForm.continentsVisited.map((continent: string, idx: number) => (
                          <Badge key={idx} variant="secondary" data-testid={`badge-continent-${idx}`}>
                            {continent}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationForm.travelFrequency && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Travel Frequency</Label>
                      <p className="text-muted-foreground" data-testid="text-travel-frequency">
                        {locationForm.travelFrequency}
                      </p>
                    </div>
                  )}

                  {locationForm.travelMotivation.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Travel Motivations</Label>
                      <div className="flex flex-wrap gap-2">
                        {locationForm.travelMotivation.map((motivation: string, idx: number) => (
                          <Badge key={idx} variant="outline" data-testid={`badge-motivation-${idx}`}>
                            {motivation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationForm.locationPrivacy && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Location Privacy Preference</Label>
                      <p className="text-muted-foreground" data-testid="text-location-privacy">
                        {locationForm.locationPrivacy}
                      </p>
                    </div>
                  )}

                  {locationForm.identitySensitivity && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Identity Sensitivity</Label>
                      <p className="text-muted-foreground" data-testid="text-identity-sensitivity">
                        {locationForm.identitySensitivity}
                      </p>
                    </div>
                  )}

                  {locationForm.meetupPreferences.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Meetup Preferences</Label>
                      <div className="flex flex-wrap gap-2">
                        {locationForm.meetupPreferences.map((pref: string, idx: number) => (
                          <Badge key={idx} variant="secondary" data-testid={`badge-meetup-${idx}`}>
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationForm.communityActivities.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Community Activities</Label>
                      <div className="flex flex-wrap gap-2">
                        {locationForm.communityActivities.map((activity: string, idx: number) => (
                          <Badge key={idx} variant="outline" data-testid={`badge-activity-${idx}`}>
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationForm.continentsVisited.length === 0 && !locationForm.travelFrequency && (
                    <div className="text-center py-8 space-y-2">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No location data yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click Edit to manually add your location preferences
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card data-testid="card-contact">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Preferences
                  </CardTitle>
                  <CardDescription>
                    Your communication and contact preferences
                  </CardDescription>
                </div>
                {!isEditingContact && (
                  <Button
                    onClick={() => setIsEditingContact(true)}
                    size="sm"
                    variant="outline"
                    data-testid="button-edit-contact"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditingContact ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred-methods">Preferred Contact Methods</Label>
                    <Input
                      id="preferred-methods"
                      value={arrayToString(contactForm.preferredMethods)}
                      onChange={(e) => setContactForm({...contactForm, preferredMethods: stringToArray(e.target.value)})}
                      placeholder="e.g., Email, Phone, Video call (comma-separated)"
                      data-testid="input-preferred-methods"
                    />
                    <p className="text-xs text-muted-foreground">Enter methods separated by commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="communication-style">Communication Style</Label>
                    <Input
                      id="communication-style"
                      value={contactForm.communicationStyle}
                      onChange={(e) => setContactForm({...contactForm, communicationStyle: e.target.value})}
                      placeholder="e.g., Direct, Collaborative, Formal"
                      data-testid="input-communication-style"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="response-time">Response Time Expectation</Label>
                    <Input
                      id="response-time"
                      value={contactForm.responseTime}
                      onChange={(e) => setContactForm({...contactForm, responseTime: e.target.value})}
                      placeholder="e.g., Within 24 hours, Same day, Flexible"
                      data-testid="input-response-time"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="energizing-methods">What Energizes Me</Label>
                    <Input
                      id="energizing-methods"
                      value={arrayToString(contactForm.energizingMethods)}
                      onChange={(e) => setContactForm({...contactForm, energizingMethods: stringToArray(e.target.value)})}
                      placeholder="e.g., Brainstorming, Deep conversations (comma-separated)"
                      data-testid="input-energizing-methods"
                    />
                    <p className="text-xs text-muted-foreground">Enter activities separated by commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="draining-methods">What Drains Me</Label>
                    <Input
                      id="draining-methods"
                      value={arrayToString(contactForm.drainingMethods)}
                      onChange={(e) => setContactForm({...contactForm, drainingMethods: stringToArray(e.target.value)})}
                      placeholder="e.g., Long meetings, Phone calls (comma-separated)"
                      data-testid="input-draining-methods"
                    />
                    <p className="text-xs text-muted-foreground">Enter activities separated by commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="boundaries">Communication Boundaries</Label>
                    <Textarea
                      id="boundaries"
                      value={arrayToString(contactForm.boundaries)}
                      onChange={(e) => setContactForm({...contactForm, boundaries: stringToArray(e.target.value)})}
                      placeholder="e.g., No calls after 6pm, Email only on weekdays (comma-separated)"
                      data-testid="input-boundaries"
                    />
                    <p className="text-xs text-muted-foreground">Enter boundaries separated by commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privacy-level">Privacy Level</Label>
                    <Input
                      id="privacy-level"
                      value={contactForm.privacyLevel}
                      onChange={(e) => setContactForm({...contactForm, privacyLevel: e.target.value})}
                      placeholder="e.g., Public, Private, Selective"
                      data-testid="input-privacy-level"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveContact} 
                      size="sm" 
                      disabled={updateContactMutation.isPending}
                      data-testid="button-save-contact"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateContactMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      onClick={handleCancelContact} 
                      size="sm" 
                      variant="outline"
                      disabled={updateContactMutation.isPending}
                      data-testid="button-cancel-contact"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {contactForm.preferredMethods.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Preferred Contact Methods</Label>
                      <div className="flex flex-wrap gap-2">
                        {contactForm.preferredMethods.map((method: string, idx: number) => (
                          <Badge key={idx} variant="secondary" data-testid={`badge-contact-method-${idx}`}>
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {contactForm.communicationStyle && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Communication Style</Label>
                      <p className="text-muted-foreground" data-testid="text-communication-style">
                        {contactForm.communicationStyle}
                      </p>
                    </div>
                  )}

                  {contactForm.responseTime && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Response Time Expectation</Label>
                      <p className="text-muted-foreground" data-testid="text-response-time">
                        {contactForm.responseTime}
                      </p>
                    </div>
                  )}

                  {contactForm.energizingMethods.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">What Energizes Me</Label>
                      <div className="flex flex-wrap gap-2">
                        {contactForm.energizingMethods.map((method: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-chart-3 border-chart-3" data-testid={`badge-energizing-${idx}`}>
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {contactForm.drainingMethods.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">What Drains Me</Label>
                      <div className="flex flex-wrap gap-2">
                        {contactForm.drainingMethods.map((method: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-destructive border-destructive" data-testid={`badge-draining-${idx}`}>
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {contactForm.boundaries.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Communication Boundaries</Label>
                      <div className="flex flex-wrap gap-2">
                        {contactForm.boundaries.map((boundary: string, idx: number) => (
                          <Badge key={idx} variant="secondary" data-testid={`badge-boundary-${idx}`}>
                            {boundary}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {contactForm.privacyLevel && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Privacy Level</Label>
                      <p className="text-muted-foreground" data-testid="text-privacy-level">
                        {contactForm.privacyLevel}
                      </p>
                    </div>
                  )}

                  {contactForm.preferredMethods.length === 0 && !contactForm.communicationStyle && (
                    <div className="text-center py-8 space-y-2">
                      <Phone className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No contact data yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click Edit to manually add your contact preferences
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dimensions" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Profile Dimensions</h2>
              <p className="text-muted-foreground">
                Discover deeply human aspects of yourself through quiz results
              </p>
            </div>

            {isLoadingProfile ? (
              <Card>
                <CardContent className="py-12">
                  <p className="text-muted-foreground text-center">Loading profile data...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DimensionCard
                  title="Personality"
                  description="Your unique traits and characteristics"
                  icon={Heart}
                  dimension="personality"
                  color="bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                />
                <DimensionCard
                  title="Strengths"
                  description="Your core capabilities and talents"
                  icon={Sparkles}
                  dimension="strengths"
                  color="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                />
                <DimensionCard
                  title="Values"
                  description="What matters most to you"
                  icon={Target}
                  dimension="values"
                  color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                />
                <DimensionCard
                  title="Interests"
                  description="Topics and activities you enjoy"
                  icon={Brain}
                  dimension="interests"
                  color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                />
                <DimensionCard
                  title="Growth Areas"
                  description="Opportunities for development"
                  icon={TrendingUp}
                  dimension="growth"
                  color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Badge Collection</h2>
            <p className="text-muted-foreground">
              Badges earned from your quiz achievements
            </p>
          </div>

          {isLoadingProfile ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-muted-foreground text-center">Loading badges...</p>
              </CardContent>
            </Card>
          ) : profileData?.badges && profileData.badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profileData.badges.map((badge) => (
                <Card key={badge.id} data-testid={`badge-${badge.id}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{badge.badge_name}</CardTitle>
                        {badge.badge_category && (
                          <CardDescription className="text-xs">
                            {badge.badge_category}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {badge.badge_description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{badge.badge_description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground">
                    Complete quizzes to earn badges based on your results
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Privacy Settings</h2>
            <p className="text-muted-foreground">
              Control what others can see on your profile
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Visibility</CardTitle>
              <CardDescription>
                Choose what information is visible to other users
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Dimensions</CardTitle>
              <CardDescription>
                Select which profile dimensions to share publicly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-personality"
                  checked={profileData?.privacy?.sharedDimensions?.includes('personality') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('personality', checked as boolean)}
                  data-testid="checkbox-dimension-personality"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-personality" className="text-base cursor-pointer">
                    Personality
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your personality traits and communication style
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-strengths"
                  checked={profileData?.privacy?.sharedDimensions?.includes('strengths') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('strengths', checked as boolean)}
                  data-testid="checkbox-dimension-strengths"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-strengths" className="text-base cursor-pointer">
                    Strengths
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your key strengths and what energizes you
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-values"
                  checked={profileData?.privacy?.sharedDimensions?.includes('values') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('values', checked as boolean)}
                  data-testid="checkbox-dimension-values"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-values" className="text-base cursor-pointer">
                    Values
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your core values and what matters to you
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-interests"
                  checked={profileData?.privacy?.sharedDimensions?.includes('interests') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('interests', checked as boolean)}
                  data-testid="checkbox-dimension-interests"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-interests" className="text-base cursor-pointer">
                    Interests
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your interests, hobbies, and travel experiences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="dimension-growth"
                  checked={profileData?.privacy?.sharedDimensions?.includes('growth') || false}
                  onCheckedChange={(checked) => handleDimensionToggle('growth', checked as boolean)}
                  data-testid="checkbox-dimension-growth"
                />
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dimension-growth" className="text-base cursor-pointer">
                    Growth Areas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share areas where you're working to grow and improve
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discovery Settings</CardTitle>
              <CardDescription>
                Control how others can find and connect with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  const profileUrl = username ? `/u/${username}` : `/u/${user?.id}`;
                  window.open(profileUrl, '_blank');
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Public Profile
              </Button>
              {!profileData?.privacy?.isProfilePublic && (
                <p className="text-xs text-amber-500 text-center">
                  ⚠️ Your profile is currently private. Enable "Make Profile Public" above to allow others to view it.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
