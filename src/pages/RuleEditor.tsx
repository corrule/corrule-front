import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { RuleStatus } from '@/constants/enums';
import type { Rule } from '@/types';

const queryLanguages = ['SIGMA', 'KQL', 'SPL', 'YARA', 'SURICATA', 'SNORT', 'LUCENE', 'ESQL', 'SQL', 'XQL', 'CUSTOM'];
const vendors = ['ELASTIC', 'SPLUNK', 'MICROSOFT_SENTINEL', 'CHRONICLE', 'QRADAR', 'ARCSIGHT', 'SUMO_LOGIC', 'PALO_ALTO_XDR', 'PALO_ALTO_XSIAM', 'GENERIC'];
const categories = ['DETECTION', 'HUNTING', 'CORRELATION', 'ENRICHMENT', 'RESPONSE', 'MONITORING', 'FORENSICS'];
const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const mitreTactics = [
  'reconnaissance',
  'resource-development',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-and-control',
  'exfiltration',
  'impact',
];

interface FormData {
  title: string;
  description: string;
  version: string;
  queryLanguage: string;
  vendor: string;
  category: string;
  severity: string;
  ruleContent: {
    query: string;
    parameters?: Record<string, any>;
  };
  tags: string[];
  mitreAttack: {
    tactics: string[];
    techniques: string[];
  };
}

export default function RuleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(id ? true : false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rule, setRule] = useState<Rule | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tacticInput, setTacticInput] = useState('');
  const [techniqueInput, setTechniqueInput] = useState('');
  const [forkData, setForkData] = useState<{ originalRuleId: string; originalRule: Rule; isFork: boolean } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    version: '1.0.0',
    queryLanguage: 'SIGMA',
    vendor: 'GENERIC',
    category: 'DETECTION',
    severity: 'MEDIUM',
    ruleContent: { query: '' },
    tags: [],
    mitreAttack: {
      tactics: [],
      techniques: [],
    },
  });

  // Load existing rule if editing, or check for fork data from sessionStorage
  useEffect(() => {
    if (id) {
      loadRule();
    } else {
      // Check if this is a fork operation
      const storedForkData = sessionStorage.getItem('forkData');
      if (storedForkData) {
        try {
          const parsedForkData = JSON.parse(storedForkData);
          setForkData(parsedForkData);
          // Load the original rule data into the form
          const originalRule = parsedForkData.originalRule;
          setFormData({
            title: `${originalRule.title} (Fork)`,
            description: originalRule.description || '',
            version: typeof originalRule.version === 'string' ? originalRule.version : (originalRule.version as any)?.current || '1.0.0',
            queryLanguage: originalRule.queryLanguage || 'SIGMA',
            vendor: originalRule.vendor || 'GENERIC',
            category: originalRule.category || 'DETECTION',
            severity: originalRule.severity || 'MEDIUM',
            ruleContent: originalRule.ruleContent || { query: '' },
            tags: originalRule.tags || [],
            mitreAttack: {
              tactics: originalRule.mitreAttack?.tactics || [],
              techniques: originalRule.mitreAttack?.techniques || [],
            },
          });
        } catch (err) {
          console.error('Failed to parse fork data from sessionStorage:', err);
        }
      }
    }
  }, [id]);

  const loadRule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getRule(id!);
      // API returns { rule, hasPurchased }
      const ruleData = response.rule;
      setRule(ruleData);
      setFormData({
        title: ruleData.title || '',
        description: ruleData.description || '',
        version: typeof ruleData.version === 'string' ? ruleData.version : (ruleData.version as any)?.current || '1.0.0',
        queryLanguage: ruleData.queryLanguage || 'SIGMA',
        vendor: ruleData.vendor || 'GENERIC',
        category: ruleData.category || 'DETECTION',
        severity: ruleData.severity || 'MEDIUM',
        ruleContent: ruleData.ruleContent || { query: '' },
        tags: ruleData.tags || [],
        mitreAttack: {
          tactics: ruleData.mitreAttack?.tactics || [],
          techniques: ruleData.mitreAttack?.techniques || [],
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load rule';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRuleContentChange = (query: string) => {
    setFormData(prev => ({
      ...prev,
      ruleContent: { ...prev.ruleContent, query },
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleAddTactic = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tacticInput.trim()) {
      e.preventDefault();
      const newTactic = tacticInput.trim();
      if (!formData.mitreAttack.tactics.includes(newTactic)) {
        setFormData(prev => ({
          ...prev,
          mitreAttack: {
            ...prev.mitreAttack,
            tactics: [...prev.mitreAttack.tactics, newTactic],
          },
        }));
      }
      setTacticInput('');
    }
  };

  const handleRemoveTactic = (tactic: string) => {
    setFormData(prev => ({
      ...prev,
      mitreAttack: {
        ...prev.mitreAttack,
        tactics: prev.mitreAttack.tactics.filter(t => t !== tactic),
      },
    }));
  };

  const handleAddTechnique = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && techniqueInput.trim()) {
      e.preventDefault();
      const newTechnique = techniqueInput.trim();
      if (!formData.mitreAttack.techniques.includes(newTechnique)) {
        setFormData(prev => ({
          ...prev,
          mitreAttack: {
            ...prev.mitreAttack,
            techniques: [...prev.mitreAttack.techniques, newTechnique],
          },
        }));
      }
      setTechniqueInput('');
    }
  };

  const handleRemoveTechnique = (technique: string) => {
    setFormData(prev => ({
      ...prev,
      mitreAttack: {
        ...prev.mitreAttack,
        techniques: prev.mitreAttack.techniques.filter(t => t !== technique),
      },
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return false;
    }
    if (formData.title.length < 5 || formData.title.length > 200) {
      toast({ title: 'Error', description: 'Title must be 5-200 characters', variant: 'destructive' });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Error', description: 'Description is required', variant: 'destructive' });
      return false;
    }
    if (formData.description.length < 20 || formData.description.length > 2000) {
      toast({ title: 'Error', description: 'Description must be 20-2000 characters', variant: 'destructive' });
      return false;
    }
    if (!formData.version.trim()) {
      toast({ title: 'Error', description: 'Version is required', variant: 'destructive' });
      return false;
    }
    if (!/^\d+\.\d+\.\d+/.test(formData.version)) {
      toast({ title: 'Error', description: 'Version must be in format X.Y.Z (e.g., 1.0.0)', variant: 'destructive' });
      return false;
    }
    if (!formData.ruleContent.query.trim()) {
      toast({ title: 'Error', description: 'Rule content (query) is required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSave = async (asDraft: boolean = true) => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload: Partial<Rule> = {
        title: formData.title,
        description: formData.description,
        version: {
          current: formData.version,
          changelog: [],
        },
        queryLanguage: formData.queryLanguage,
        vendor: formData.vendor,
        category: formData.category,
        severity: formData.severity as any,
        ruleContent: formData.ruleContent,
        tags: formData.tags,
        mitreAttack: formData.mitreAttack,
        status: RuleStatus.DRAFT,
      };

      if (id && rule) {
        // Editing an existing rule
        await api.updateRule(id, payload);
        toast({ title: 'Success', description: 'Rule updated successfully' });
        navigate('/my-rules');
      } else if (forkData && forkData.isFork) {
        // Creating a fork - call the fork API with the original rule ID
        try {
          const forkedRule = await api.forkRule(forkData.originalRuleId);
          
          // Now update the forked rule with the user's customizations
          if (forkedRule && forkedRule._id) {
            await api.updateRule(forkedRule._id, payload);
            toast({ title: 'Success', description: 'Fork created successfully!' });
          }
          
          // Clear the fork data from sessionStorage
          sessionStorage.removeItem('forkData');
          setForkData(null);
          navigate('/my-rules');
        } catch (forkError) {
          const forkMessage = forkError instanceof Error ? forkError.message : 'Failed to fork rule';
          toast({ title: 'Fork Error', description: forkMessage, variant: 'destructive' });
        }
      } else {
        // Creating a new rule
        await api.createRule(payload);
        toast({ title: 'Success', description: 'Rule created successfully' });
        navigate('/my-rules');
      }
    } catch (err) {
      // Check if error has validation errors array
      if (err instanceof Error && 'response' in err) {
        const response = (err as any).response;
        if (response?.data?.errors && Array.isArray(response.data.errors)) {
          // Show each validation error
          response.data.errors.forEach((error: any) => {
            toast({
              title: 'Validation Error',
              description: error.msg || error.message || 'Invalid input',
              variant: 'destructive',
            });
          });
        } else {
          const message = err instanceof Error ? err.message : 'Failed to save rule';
          toast({ title: 'Error', description: message, variant: 'destructive' });
        }
      } else {
        const message = err instanceof Error ? err.message : 'Failed to save rule';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Clear fork data from cache when user cancels
    if (forkData) {
      sessionStorage.removeItem('forkData');
      setForkData(null);
    }
    navigate(-1);
  };

  if (!user) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>You must be logged in to create or edit rules</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading rule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <Button variant="ghost" onClick={handleCancel} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {id ? 'Edit Rule' : forkData ? 'Fork Rule' : 'Create New Rule'}
          </h1>
          <p className="text-muted-foreground">
            {id ? 'Update your security detection rule' : forkData ? 'Customize your fork and click "Save as Draft" to save it' : 'Create a new security detection rule'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {forkData && (
          <Alert className="mb-8 bg-blue-500/10 border-blue-500/20 text-blue-700">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              You are forking <strong>{forkData.originalRule.title}</strong> by <strong>{forkData.originalRule.author?.username}</strong>. Customize the rule and click "Save as Draft" to create your fork.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-8 bg-blue-500/10 border-blue-500/20 text-blue-700">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Note:</strong> All rules start in <strong>Draft</strong> status. Save your rule, then go to <strong>My Rules</strong> and click the <strong>Submit</strong> button to publish it for review and set visibility/pricing options.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Rule Content</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Title, description, and basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="e.g., Detect PowerShell Suspicious Script"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea
                    placeholder="Describe what this rule detects and why it's important..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/2000 characters
                  </p>
                </div>

                {/* Version */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Version * (SemVer format)</label>
                  <Input
                    placeholder="e.g., 1.0.0"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must follow semantic versioning (X.Y.Z format). Increment on updates.
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add tag and press Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-xs hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rule Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rule Content</CardTitle>
                <CardDescription>The actual detection query or pattern</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Query Language */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Query Language *</label>
                  <Select
                    value={formData.queryLanguage}
                    onValueChange={(value) => handleInputChange('queryLanguage', value)}
                  >
                    <SelectTrigger className="bg-slate-950">
                      <SelectValue placeholder="Select query language" />
                    </SelectTrigger>
                    <SelectContent>
                      {queryLanguages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rule Query */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Query/Pattern *</label>
                  <Textarea
                    placeholder="Paste your rule content here..."
                    value={formData.ruleContent.query}
                    onChange={(e) => handleRuleContentChange(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports YAML, JSON, and other formats depending on query language
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Vendor, category, severity, and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vendor */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vendor</label>
                    <Select
                      value={formData.vendor}
                      onValueChange={(value) => handleInputChange('vendor', value)}
                    >
                      <SelectTrigger className="bg-slate-950">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(v => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="bg-slate-950">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Severity */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Severity</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.severity}
                      onChange={(e) => handleInputChange('severity', e.target.value)}
                    >
                      {severities.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MITRE ATT&CK Coverage */}
            <Card>
              <CardHeader>
                <CardTitle>MITRE ATT&CK Coverage</CardTitle>
                <CardDescription>Add tactics and techniques your rule detects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tactics */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tactics</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter tactic and press Enter (e.g., Execution, Persistence)..."
                        value={tacticInput}
                        onChange={(e) => setTacticInput(e.target.value)}
                        onKeyDown={handleAddTactic}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.mitreAttack.tactics.map(tactic => (
                        <Badge key={tactic} variant="secondary" className="cursor-pointer">
                          {tactic}
                          <button
                            onClick={() => handleRemoveTactic(tactic)}
                            className="ml-2 text-xs hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                      {mitreTactics.map(tactic => (
                        <Badge
                          key={tactic}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => {
                            if (!formData.mitreAttack.tactics.includes(tactic)) {
                              setFormData(prev => ({
                                ...prev,
                                mitreAttack: {
                                  ...prev.mitreAttack,
                                  tactics: [...prev.mitreAttack.tactics, tactic],
                                },
                              }));
                            }
                          }}
                        >
                          {tactic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Techniques */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Techniques</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter technique and press Enter (e.g., T1059, Command and Scripting Interpreter)..."
                      value={techniqueInput}
                      onChange={(e) => setTechniqueInput(e.target.value)}
                      onKeyDown={handleAddTechnique}
                    />
                    <div className="flex flex-wrap gap-2">
                      {formData.mitreAttack.techniques.map(technique => (
                        <Badge key={technique} variant="secondary" className="cursor-pointer">
                          {technique}
                          <button
                            onClick={() => handleRemoveTechnique(technique)}
                            className="ml-2 text-xs hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add technique IDs (e.g., T1059) or technique names that this rule can detect
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
