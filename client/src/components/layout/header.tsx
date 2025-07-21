import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Brain, Zap, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Header() {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-blue-800 shadow-lg sticky top-0 z-30 overflow-hidden">
      {/* Tech Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3b82f6,transparent)]"></div>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="1" fill="currentColor" opacity="0.3"/>
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
            </pattern>
            <linearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" className="text-blue-400"/>
          <rect width="100%" height="100%" fill="url(#techGradient)"/>
        </svg>
        {/* Animated tech elements */}
        <div className="absolute top-4 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-32 w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-4 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-6 right-1/4 w-1 h-1 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
        
        {/* Geometric tech elements */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
        </div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-40"></div>
        </div>
        <div className="absolute top-6 right-16 w-4 h-4 border border-cyan-400/30 rotate-45 opacity-50"></div>
        <div className="absolute bottom-4 left-16 w-3 h-3 border border-blue-400/40 rotate-12 opacity-60"></div>
      </div>
      
      <div className="relative px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                SmartyoZ
              </h1>
              <p className="text-xs text-cyan-200 -mt-1">AI-Powered Hiring Platform</p>
            </div>
          </div>



          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10 ring-2 ring-cyan-400/30">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-medium">
                        {getUserInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="text-cyan-100 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white">
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}