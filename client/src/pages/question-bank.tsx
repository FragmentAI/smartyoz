import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Brain, Code, FileQuestion, Import, Sparkles, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  testRound: number;
  tags: string[];
}

interface Job {
  id: number;
  title: string;
}

export default function QuestionBank() {
  const [activeTab, setActiveTab] = useState("aptitude");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'medium' as const,
    category: '',
    testRound: 1,
    tags: '',
    driveSessionId: '',
    jobId: 'all'
  });
  const [aiForm, setAiForm] = useState({
    count: 5,
    difficulty: 'medium' as const,
    jobId: 'general',
    topics: ''
  });

  const queryClient = useQueryClient();

  // Fetch jobs for dropdown
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['/api/aptitude-questions/all'],
  });

  // Filter questions by round
  const aptitudeQuestions = questions.filter(q => q.testRound === 1);
  const technicalQuestions = questions.filter(q => q.testRound === 2);

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/aptitude-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aptitude-questions/all'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Question created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create question", variant: "destructive" });
    },
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/aptitude-questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aptitude-questions/all'] });
      setEditingQuestion(null);
      resetForm();
      toast({ title: "Question updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update question", variant: "destructive" });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/aptitude-questions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete question');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aptitude-questions/all'] });
      toast({ title: "Question deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete question", variant: "destructive" });
    },
  });

  // Generate AI questions mutation
  const generateAIMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/aptitude-questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate questions');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/aptitude-questions/all'] });
      setIsAIDialogOpen(false);
      resetAiForm();
      toast({ 
        title: "AI questions generated successfully", 
        description: `Generated ${data.count} questions using AI`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate questions", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      difficulty: 'medium',
      category: '',
      testRound: activeTab === 'aptitude' ? 1 : 2,
      tags: '',
      driveSessionId: '',
      jobId: 'all'
    });
  };

  const resetAiForm = () => {
    setAiForm({
      count: 5,
      difficulty: 'medium',
      jobId: 'general',
      topics: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionForm.question.trim() || questionForm.options.some(opt => !opt.trim())) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const data = {
      ...questionForm,
      testRound: activeTab === 'aptitude' ? 1 : 2,
      category: activeTab === 'aptitude' ? 'aptitude' : 'technical',
      tags: questionForm.tags ? questionForm.tags.split(',').map(t => t.trim()) : [],
      jobId: questionForm.jobId && questionForm.jobId !== 'all' ? parseInt(questionForm.jobId) : null,
      driveSessionId: null // Will be set when creating drive sessions
    };

    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (aiForm.count <= 0 || aiForm.count > 20) {
      toast({ title: "Please enter a valid count (1-20)", variant: "destructive" });
      return;
    }

    const data = {
      ...aiForm,
      testRound: activeTab === 'aptitude' ? 1 : 2,
      category: activeTab === 'aptitude' ? 'aptitude' : 'technical',
      jobId: aiForm.jobId && aiForm.jobId !== 'general' ? aiForm.jobId : null
    };

    generateAIMutation.mutate(data);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      category: question.category,
      testRound: question.testRound,
      tags: question.tags.join(', '),
      driveSessionId: '',
      jobId: ''
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      deleteQuestionMutation.mutate(id);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[difficulty as keyof typeof colors]}>{difficulty}</Badge>;
  };

  const QuestionTable = ({ questions }: { questions: Question[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Question</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Correct Answer</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((question) => (
          <TableRow key={question.id}>
            <TableCell className="max-w-md">
              <div className="truncate">{question.question}</div>
              {question.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {question.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </TableCell>
            <TableCell>{getDifficultyBadge(question.difficulty)}</TableCell>
            <TableCell className="capitalize">{question.category}</TableCell>
            <TableCell>{question.options[question.correctAnswer]}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(question)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank Management</h1>
          <p className="text-gray-600 mt-2">Configure aptitude and technical MCP questions for drive recruitment</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Import className="w-4 h-4 mr-2" />
            Import Questions
          </Button>
          <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetAiForm}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Generate {activeTab === 'aptitude' ? 'Aptitude' : 'Technical'} Questions with AI
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAISubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="count">Number of Questions</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="20"
                      value={aiForm.count}
                      onChange={(e) => setAiForm({ ...aiForm, count: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ai-difficulty">Difficulty Level</Label>
                    <Select
                      value={aiForm.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => setAiForm({ ...aiForm, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ai-jobId">Job Role (Optional)</Label>
                  <Select
                    value={aiForm.jobId}
                    onValueChange={(value) => setAiForm({ ...aiForm, jobId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job for role-specific questions..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Questions</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeTab === 'aptitude' ? (
                  <div>
                    <Label htmlFor="ai-topics">Focus Topics (Optional)</Label>
                    <Input
                      id="ai-topics"
                      value={aiForm.topics}
                      onChange={(e) => setAiForm({ ...aiForm, topics: e.target.value })}
                      placeholder="e.g., logical reasoning, numerical ability, verbal comprehension"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated topics for targeted question generation</p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="ai-topics">Technical Topics (Optional)</Label>
                    <Input
                      id="ai-topics"
                      value={aiForm.topics}
                      onChange={(e) => setAiForm({ ...aiForm, topics: e.target.value })}
                      placeholder="e.g., algorithms, databases, system design, programming languages"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated technical topics for focused questions</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAIDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={generateAIMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {generateAIMutation.isPending ? (
                      <>
                        <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Questions
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? 'Edit Question' : `Add ${activeTab === 'aptitude' ? 'Aptitude' : 'Technical'} Question`}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    placeholder="Enter the question..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {questionForm.options.map((option, index) => (
                    <div key={index}>
                      <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                      <Input
                        id={`option-${index}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[index] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOptions });
                        }}
                        placeholder={`Option ${index + 1}...`}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="correctAnswer">Correct Answer</Label>
                    <Select
                      value={questionForm.correctAnswer.toString()}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, correctAnswer: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Option 1</SelectItem>
                        <SelectItem value="1">Option 2</SelectItem>
                        <SelectItem value="2">Option 3</SelectItem>
                        <SelectItem value="3">Option 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={questionForm.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => setQuestionForm({ ...questionForm, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="jobId">Job (Optional)</Label>
                    <Select
                      value={questionForm.jobId}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, jobId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id.toString()}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={questionForm.tags}
                    onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })}
                    placeholder="e.g., logic, mathematics, programming"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}>
                    {editingQuestion ? 'Update Question' : 'Create Question'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aptitude Questions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aptitudeQuestions.length}</div>
            <p className="text-xs text-muted-foreground">Round 1 questions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Technical Questions</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{technicalQuestions.length}</div>
            <p className="text-xs text-muted-foreground">Round 2 questions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <p className="text-xs text-muted-foreground">Across all rounds</p>
          </CardContent>
        </Card>
      </div>

      {/* Question Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Question Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="aptitude" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Aptitude & General Intelligence
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Technical Assessment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aptitude" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Round 1: Aptitude & General Intelligence Questions</h3>
                  <Badge variant="outline">{aptitudeQuestions.length} questions</Badge>
                </div>
                {isLoading ? (
                  <div className="text-center py-8">Loading questions...</div>
                ) : aptitudeQuestions.length > 0 ? (
                  <QuestionTable questions={aptitudeQuestions} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No aptitude questions found. Click "Add Question" to create your first question.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="technical" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Round 2: Technical Assessment Questions</h3>
                  <Badge variant="outline">{technicalQuestions.length} questions</Badge>
                </div>
                {isLoading ? (
                  <div className="text-center py-8">Loading questions...</div>
                ) : technicalQuestions.length > 0 ? (
                  <QuestionTable questions={technicalQuestions} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No technical questions found. Click "Add Question" to create your first question.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}