import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Profile from "@/pages/Profile";
import MyQuizHistory from "@/pages/MyQuizHistory";
import NotificationPreferences from "@/pages/settings/NotificationPreferences";

// Member-owned surface outside the Explore/Ecosystem modes.
// Panels stay mounted so unsaved profile edits survive tab switches.
export default function MePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-foreground pb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Member surface
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.04em]">Me</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your public identity, notification preferences, and quiz history in one place.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="quiz-history">Quiz history</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" forceMount>
          <Profile />
        </TabsContent>
        <TabsContent value="notifications" forceMount>
          <NotificationPreferences />
        </TabsContent>
        <TabsContent value="quiz-history" forceMount>
          <MyQuizHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
