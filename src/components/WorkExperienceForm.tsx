import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus } from 'lucide-react';
import {
  COMPANIES,
  JOB_TITLES,
  type WorkExperienceEntry,
  type WorkExperienceFormData,
} from '@/constants/workExperience';
import { cn } from '@/lib/utils';

interface WorkExperienceFormProps {
  onSubmit: (experience: WorkExperienceEntry) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: WorkExperienceEntry | null;
}

export const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = null,
}) => {
  // Company selection state
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companySearchValue, setCompanySearchValue] = useState('');
  
  // Job selection state
  const [jobOpen, setJobOpen] = useState(false);
  const [jobSearchValue, setJobSearchValue] = useState('');

  // Form state
  const [formData, setFormData] = useState<WorkExperienceFormData>({
    company: initialData?.company.name || '',
    companyIsCustom: initialData?.company.isCustom || false,
    customCompany: initialData?.company.isCustom ? initialData.company.name : '',
    job: initialData?.job.title || '',
    jobIsCustom: initialData?.job.isCustom || false,
    customJob: initialData?.job.isCustom ? initialData.job.title : '',
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
    isCurrent: initialData?.isCurrent || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    return COMPANIES.filter(company =>
      company.toLowerCase().includes(companySearchValue.toLowerCase())
    );
  }, [companySearchValue]);

  // Filter job titles based on search
  const filteredJobs = useMemo(() => {
    return JOB_TITLES.filter(title =>
      title.toLowerCase().includes(jobSearchValue.toLowerCase())
    );
  }, [jobSearchValue]);

  const handleInputChange = (field: keyof WorkExperienceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCompanySelect = (company: string) => {
    setFormData(prev => ({
      ...prev,
      company,
      companyIsCustom: false,
      customCompany: '',
    }));
    setCompanyOpen(false);
    setCompanySearchValue('');
  };

  const handleCustomCompany = (value: string) => {
    setFormData(prev => ({
      ...prev,
      customCompany: value,
      company: value,
      companyIsCustom: true,
    }));
  };

  const handleJobSelect = (job: string) => {
    setFormData(prev => ({
      ...prev,
      job,
      jobIsCustom: false,
      customJob: '',
    }));
    setJobOpen(false);
    setJobSearchValue('');
  };

  const handleCustomJob = (value: string) => {
    setFormData(prev => ({
      ...prev,
      customJob: value,
      job: value,
      jobIsCustom: true,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    if (!formData.job.trim()) {
      newErrors.job = 'Job title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.isCurrent && !formData.endDate) {
      newErrors.endDate = 'End date is required (or mark as current)';
    }

    if (formData.startDate && formData.endDate && !formData.isCurrent) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const experience: WorkExperienceEntry = {
      ...(initialData?._id && { _id: initialData._id }),
      company: {
        name: formData.company,
        isCustom: formData.companyIsCustom,
      },
      job: {
        title: formData.job,
        isCustom: formData.jobIsCustom,
      },
      startDate: new Date(formData.startDate),
      endDate: formData.isCurrent ? null : (formData.endDate ? new Date(formData.endDate) : null),
      isCurrent: formData.isCurrent,
    };

    onSubmit(experience);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Work Experience' : 'Add Work Experience'}</CardTitle>
        <CardDescription>
          {initialData
            ? 'Update your work experience information'
            : 'Add a new work experience to your profile'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label>Company *</Label>
            {!formData.companyIsCustom ? (
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                  >
                    {formData.company || 'Select a company...'}
                    <span className="ml-2">⌄</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[min(100vw-2rem,400px)]" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search companies..."
                      value={companySearchValue}
                      onValueChange={setCompanySearchValue}
                    />
                    <CommandEmpty>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          No company found. Click below to add a custom company.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleCustomCompany(companySearchValue)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add "{companySearchValue}"
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {filteredCompanies.map(company => (
                        <CommandItem
                          key={company}
                          value={company}
                          onSelect={() => handleCompanySelect(company)}
                        >
                          {company}
                        </CommandItem>
                      ))}
                      <CommandItem
                        value="custom"
                        onSelect={() => {
                          setFormData(prev => ({
                            ...prev,
                            companyIsCustom: true,
                            company: '',
                            customCompany: '',
                          }));
                          setCompanyOpen(false);
                          setCompanySearchValue('');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Custom Company
                      </CommandItem>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Enter company name"
                  value={formData.customCompany}
                  onChange={e => handleCustomCompany(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      companyIsCustom: false,
                      company: '',
                      customCompany: '',
                    }));
                    setCompanySearchValue('');
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Choose from list
                </Button>
              </div>
            )}
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company}</p>
            )}
          </div>

          {/* Job Title Selection */}
          <div className="space-y-2">
            <Label>Job Title *</Label>
            {!formData.jobIsCustom ? (
              <Popover open={jobOpen} onOpenChange={setJobOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                  >
                    {formData.job || 'Select a job title...'}
                    <span className="ml-2">⌄</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[min(100vw-2rem,400px)]" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search job titles..."
                      value={jobSearchValue}
                      onValueChange={setJobSearchValue}
                    />
                    <CommandEmpty>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          No job title found. Click below to add a custom job.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleCustomJob(jobSearchValue)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add "{jobSearchValue}"
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {filteredJobs.map(job => (
                        <CommandItem
                          key={job}
                          value={job}
                          onSelect={() => handleJobSelect(job)}
                        >
                          {job}
                        </CommandItem>
                      ))}
                      <CommandItem
                        value="custom"
                        onSelect={() => {
                          setFormData(prev => ({
                            ...prev,
                            jobIsCustom: true,
                            job: '',
                            customJob: '',
                          }));
                          setJobOpen(false);
                          setJobSearchValue('');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Custom Job Title
                      </CommandItem>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Enter job title"
                  value={formData.customJob}
                  onChange={e => handleCustomJob(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      jobIsCustom: false,
                      job: '',
                      customJob: '',
                    }));
                    setJobSearchValue('');
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Choose from list
                </Button>
              </div>
            )}
            {errors.job && (
              <p className="text-sm text-destructive">{errors.job}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={e => handleInputChange('startDate', e.target.value)}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date
                {formData.isCurrent && ' (Current)'}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={e => handleInputChange('endDate', e.target.value)}
                disabled={formData.isCurrent}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Currently Working Here */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCurrent"
              checked={formData.isCurrent}
              onCheckedChange={checked =>
                handleInputChange('isCurrent', checked)
              }
            />
            <Label htmlFor="isCurrent" className="font-normal cursor-pointer">
              I currently work here
            </Label>
          </div>
        </CardContent>

        {/* Buttons */}
        <div className="px-6 py-4 border-t bg-muted/50 flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : initialData
              ? 'Update Experience'
              : 'Add Experience'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default WorkExperienceForm;
