import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Save, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Globe,
  Clock
} from "lucide-react";

export const Settings = () => {
  const [settings, setSettings] = useState({
    libraryName: "SmartLibrary",
    libraryCode: "SL001",
    maxBooksPerStudent: "5",
    borrowDurationDays: "14",
    finePerDay: "2",
    emailNotifications: true,
    smsNotifications: false,
    overdueReminders: true,
    autoRenewal: false,
    maintenanceMode: false
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="admin" />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Configure your library system preferences</p>
          </div>
          <Button className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Library Information</CardTitle>
                <CardDescription>Basic information about your library</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="libraryName">Library Name</Label>
                    <Input
                      id="libraryName"
                      value={settings.libraryName}
                      onChange={(e) => handleSettingChange('libraryName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="libraryCode">Library Code</Label>
                    <Input
                      id="libraryCode"
                      value={settings.libraryCode}
                      onChange={(e) => handleSettingChange('libraryCode', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Borrowing Rules</CardTitle>
                <CardDescription>Configure book borrowing policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxBooks">Max Books per Student</Label>
                    <Input
                      id="maxBooks"
                      type="number"
                      value={settings.maxBooksPerStudent}
                      onChange={(e) => handleSettingChange('maxBooksPerStudent', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="borrowDuration">Borrow Duration (Days)</Label>
                    <Input
                      id="borrowDuration"
                      type="number"
                      value={settings.borrowDurationDays}
                      onChange={(e) => handleSettingChange('borrowDurationDays', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finePerDay">Fine per Day (₹)</Label>
                    <Input
                      id="finePerDay"
                      type="number"
                      value={settings.finePerDay}
                      onChange={(e) => handleSettingChange('finePerDay', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Overdue Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminders for overdue books
                    </p>
                  </div>
                  <Switch
                    checked={settings.overdueReminders}
                    onCheckedChange={(checked) => handleSettingChange('overdueReminders', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage access and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto Renewal</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically renew books if no queue exists
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRenewal}
                    onCheckedChange={(checked) => handleSettingChange('autoRenewal', checked)}
                  />
                </div>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Change Admin Password
                  </Button>
                  <Button variant="outline" className="w-full">
                    Reset Student Passwords
                  </Button>
                  <Button variant="outline" className="w-full">
                    Download Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Put the system in maintenance mode
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                  />
                </div>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Database Maintenance
                  </Button>
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Clear Cache
                  </Button>
                  <Button variant="outline" className="w-full flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Check for Updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your library system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                        <div className="w-8 h-8 bg-background border rounded"></div>
                        <span className="text-xs">Light</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                        <div className="w-8 h-8 bg-foreground rounded"></div>
                        <span className="text-xs">Dark</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-background to-foreground rounded"></div>
                        <span className="text-xs">Auto</span>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {['blue', 'green', 'purple', 'orange', 'red', 'pink'].map((color) => (
                        <Button
                          key={color}
                          variant="outline"
                          className={`h-12 bg-${color}-500`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};