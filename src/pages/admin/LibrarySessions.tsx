import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LibraryCheckInDialog } from "@/components/admin/LibraryCheckInDialog";
import { QRScanner } from "@/components/admin/QRScanner";
import { QRInputDialog } from "@/components/admin/QRInputDialog";
import { 
  Users, 
  Search, 
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  ScanLine,
  Keyboard,
  Calendar,
  User,
  Timer
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface LibrarySession {
  id: string;
  student_id: string;
  check_in_time: string;
  check_out_time: string | null;
  session_status: string;
  purpose: string | null;
  profiles: {
    full_name: string;
    email: string;
  } | null;
  student_digital_ids: {
    student_number: string;
  } | null;
}

export const LibrarySessions = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState<LibrarySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrInputOpen, setQrInputOpen] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<any>(null);

  const fetchSessions = async () => {
    try {
      // First get sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('library_sessions')
        .select('*')
        .order('check_in_time', { ascending: false })
        .limit(100);

      if (sessionsError) throw sessionsError;

      // Then get profiles and digital IDs for each session
      const enrichedSessions = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const [profileResult, digitalIdResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', session.student_id)
              .single(),
            supabase
              .from('student_digital_ids')
              .select('student_number')
              .eq('student_id', session.student_id)
              .single()
          ]);

          return {
            ...session,
            profiles: profileResult.data,
            student_digital_ids: digitalIdResult.data
          };
        })
      );

      setSessions(enrichedSessions);
    } catch (error) {
      toast({
        title: "Error Loading Sessions",
        description: "Could not fetch library sessions from the database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Set up real-time subscription for session changes
    const channel = supabase
      .channel('library-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'library_sessions'
        },
        (payload) => {
          console.log('Library session change detected:', payload);
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredSessions = sessions.filter((session) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      session.profiles?.full_name?.toLowerCase().includes(searchTerm) ||
      session.profiles?.email?.toLowerCase().includes(searchTerm) ||
      session.student_digital_ids?.student_number?.toLowerCase().includes(searchTerm) ||
      session.purpose?.toLowerCase().includes(searchTerm)
    );
  });

  const activeSessions = filteredSessions.filter(session => session.session_status === 'active');
  const completedSessions = filteredSessions.filter(session => session.session_status === 'completed');

  const getSessionDuration = (session: LibrarySession) => {
    const checkIn = new Date(session.check_in_time);
    const checkOut = session.check_out_time ? new Date(session.check_out_time) : new Date();
    const duration = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)); // minutes
    
    if (duration < 60) {
      return `${duration} min`;
    } else {
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      return `${hours}h ${mins}m`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation userRole="admin" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="admin" />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Library Sessions</h1>
            <p className="text-muted-foreground">
              Track student check-ins and library usage
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => fetchSessions()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setQrScannerOpen(true)}
              className="flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" />
              Camera Scan
            </Button>
            <Button
              variant="outline"
              onClick={() => setQrInputOpen(true)}
              className="flex items-center gap-2"
            >
              <Keyboard className="w-4 h-4" />
              Scanner Device
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Currently In Library</p>
                  <p className="text-2xl font-bold text-green-600">{activeSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Today's Check-ins</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {sessions.filter(s => 
                      new Date(s.check_in_time).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold text-orange-600">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {completedSessions.length > 0 ? 
                      Math.round(completedSessions.reduce((sum, session) => {
                        const duration = (new Date(session.check_out_time!).getTime() - new Date(session.check_in_time).getTime()) / (1000 * 60);
                        return sum + duration;
                      }, 0) / completedSessions.length) + 'm' : '0m'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, email, or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Currently in Library ({activeSessions.length})
          </h2>
          
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
                <p className="text-muted-foreground">No students are currently checked into the library.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map((session) => (
                <Card key={session.id} className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {session.profiles?.full_name || session.profiles?.email || 'Unknown Student'}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                    <CardDescription>
                      Student #: {session.student_digital_ids?.student_number || 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>In for {formatDistanceToNow(new Date(session.check_in_time))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Since {format(new Date(session.check_in_time), 'h:mm a')}</span>
                      </div>
                      {session.purpose && (
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-xs">{session.purpose}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Recent Sessions
          </h2>
          
          {completedSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Sessions</h3>
                <p className="text-muted-foreground">No completed sessions to display.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedSessions.slice(0, 10).map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold">
                            {session.profiles?.full_name || session.profiles?.email || 'Unknown Student'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Student #: {session.student_digital_ids?.student_number || 'N/A'}
                          </p>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>
                              {format(new Date(session.check_in_time), 'MMM dd, h:mm a')} - 
                              {session.check_out_time && format(new Date(session.check_out_time), 'h:mm a')}
                            </span>
                            <Badge variant="outline">
                              {getSessionDuration(session)}
                            </Badge>
                          </div>
                          {session.purpose && (
                            <p className="text-xs mt-1">{session.purpose}</p>
                          )}
                        </div>
                      </div>
                      
                      <Badge variant="secondary">
                        Completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <LibraryCheckInDialog
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onSessionUpdated={fetchSessions}
        scannedStudent={scannedStudent}
      />

      <QRScanner
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        onScan={(studentData) => {
          setScannedStudent(studentData);
          setCheckInOpen(true);
        }}
      />

      <QRInputDialog
        open={qrInputOpen}
        onOpenChange={setQrInputOpen}
        onScan={(studentData) => {
          setScannedStudent(studentData);
          setCheckInOpen(true);
        }}
      />
    </div>
  );
};