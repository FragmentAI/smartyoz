import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'thinking' | 'complete' | 'error';
  actions?: ActionItem[];
}

interface ActionItem {
  id: string;
  type: 'job_created' | 'candidate_found' | 'interview_scheduled' | 'report_generated';
  title: string;
  data: any;
}

const EXAMPLE_PROMPTS = [
  "Create 2 Python developer jobs with senior level requirements",
  "Show me candidates scheduled for interviews tomorrow", 
  "Generate a hiring report for this month",
  "Find all candidates with React.js skills",
  "Schedule interviews for qualified Data Science candidates",
  "Create a bulk hiring drive for campus recruitment"
];

export default function SmartAssist() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm SmartAssist, your AI-powered hiring companion. I can help you with any task on the platform - from creating jobs and scheduling interviews to analyzing candidate data and generating reports. What would you like me to help you with today?",
      timestamp: new Date(),
      status: 'complete'
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processUserRequest = async (prompt: string) => {
    setIsProcessing(true);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
      status: 'complete'
    };

    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: "Let me process your request...",
      timestamp: new Date(),
      status: 'thinking'
    };

    setMessages(prev => [...prev, userMessage, thinkingMessage]);

    try {
      const response = await fetch('/api/smart-assist/process', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: result.message,
        timestamp: new Date(),
        status: 'complete',
        actions: result.actions || []
      };

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = assistantMessage;
        return newMessages;
      });

      if (result.actions && result.actions.length > 0) {
        toast({
          title: "Task Completed",
          description: `Successfully completed ${result.actions.length} action(s)`,
        });
      }
    } catch (error) {
      console.error('SmartAssist error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: "I encountered an error processing your request. Please try again or rephrase your request.",
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });

      toast({
        title: "Error",
        description: "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const prompt = inputValue.trim();
    setInputValue("");
    await processUserRequest(prompt);
  };

  const handleExampleClick = (prompt: string) => {
    if (isProcessing) return;
    setInputValue(prompt);
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'job_created': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'candidate_found': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'interview_scheduled': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'report_generated': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SmartAssist</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered hiring assistant for all your recruitment needs
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-400/30">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
          Online
        </Badge>
      </div>

      {/* Example Prompts */}
      {messages.length <= 1 && (
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Try these examples:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto p-3 text-xs"
                onClick={() => handleExampleClick(prompt)}
                disabled={isProcessing}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.type === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {message.status === 'thinking' ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.type === 'user'
                    ? "bg-blue-600 text-white ml-12"
                    : message.status === 'error'
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-card border"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Actions completed:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.actions.map((action) => (
                        <Badge
                          key={action.id}
                          variant="outline"
                          className={cn("text-xs", getActionBadgeColor(action.type))}
                        >
                          {action.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about hiring, jobs, candidates, or reports..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isProcessing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          SmartAssist can create jobs, schedule interviews, analyze data, and handle complex hiring workflows.
        </p>
      </div>
    </div>
  );
}