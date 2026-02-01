import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit2, Trash2, Building2, Briefcase, Calendar } from 'lucide-react';
import { type WorkExperienceEntry } from '@/constants/workExperience';

interface WorkExperienceListProps {
  experiences: WorkExperienceEntry[];
  onEdit: (experience: WorkExperienceEntry) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

export const WorkExperienceList: React.FC<WorkExperienceListProps> = ({
  experiences,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  if (!experiences || experiences.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8">
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No work experiences added yet.</p>
            <p className="text-sm text-muted-foreground">
              Add your first work experience to showcase your professional background.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {experiences.map((experience, index) => (
          <Card key={experience._id || index} className="overflow-hidden">
            <CardContent className="pt-6">
              {/* Header with company and job */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {experience.company.name}
                    </h3>
                    {experience.company.isCustom && (
                      <Badge variant="secondary" className="ml-2">
                        Custom
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">
                      {experience.job.title}
                    </span>
                    {experience.job.isCustom && (
                      <Badge variant="outline" className="ml-2">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(experience)}
                    disabled={isLoading}
                    title="Edit experience"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(experience._id || `${index}`)}
                    disabled={isLoading}
                    title="Delete experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Date range */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(experience.startDate)}
                  {' — '}
                  {experience.isCurrent
                    ? 'Present'
                    : experience.endDate
                    ? formatDate(experience.endDate)
                    : 'Unknown'}
                </span>
              </div>

              {/* Current indicator */}
              {experience.isCurrent && (
                <div className="mt-3">
                  <Badge className="bg-green-600 hover:bg-green-700">
                    Current Position
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Experience?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your work experience will be permanently deleted
              from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WorkExperienceList;
