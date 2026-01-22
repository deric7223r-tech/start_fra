import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { WorkshopProgress } from '@/types/workshop';

export function useWorkshopProgress(sessionId?: string | null) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<WorkshopProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setProgress(null);
      setIsLoading(false);
    }
  }, [user, sessionId]);

  const fetchProgress = async () => {
    if (!user) return;

    const query = supabase
      .from('workshop_progress')
      .select('*')
      .eq('user_id', user.id);

    if (sessionId) {
      query.eq('session_id', sessionId);
    } else {
      query.is('session_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching progress:', error);
    }

    if (data) {
      setProgress({
        ...data,
        completed_sections: data.completed_sections || [],
        quiz_scores: (data.quiz_scores as Record<string, number>) || {},
        scenario_choices: (data.scenario_choices as Record<string, string>) || {},
      });
    } else {
      // Create initial progress record
      const { data: newProgress, error: createError } = await supabase
        .from('workshop_progress')
        .insert({
          user_id: user.id,
          session_id: sessionId || null,
          current_section: 0,
          completed_sections: [],
          quiz_scores: {},
          scenario_choices: {},
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating progress:', createError);
      } else {
        setProgress({
          ...newProgress,
          completed_sections: newProgress.completed_sections || [],
          quiz_scores: (newProgress.quiz_scores as Record<string, number>) || {},
          scenario_choices: (newProgress.scenario_choices as Record<string, string>) || {},
        });
      }
    }
    
    setIsLoading(false);
  };

  const updateSection = async (sectionId: number) => {
    if (!user || !progress) return;

    const { error } = await supabase
      .from('workshop_progress')
      .update({ current_section: sectionId })
      .eq('id', progress.id);

    if (error) {
      console.error('Error updating section:', error);
    } else {
      setProgress(prev => prev ? { ...prev, current_section: sectionId } : null);
    }
  };

  const completeSection = async (sectionId: number) => {
    if (!user || !progress) return;

    const newCompletedSections = progress.completed_sections.includes(sectionId)
      ? progress.completed_sections
      : [...progress.completed_sections, sectionId];

    const { error } = await supabase
      .from('workshop_progress')
      .update({ completed_sections: newCompletedSections })
      .eq('id', progress.id);

    if (error) {
      console.error('Error completing section:', error);
    } else {
      setProgress(prev => prev ? { ...prev, completed_sections: newCompletedSections } : null);
    }
  };

  const saveQuizScore = async (sectionId: number, score: number) => {
    if (!user || !progress) return;

    const newScores = { ...progress.quiz_scores, [sectionId.toString()]: score };

    const { error } = await supabase
      .from('workshop_progress')
      .update({ quiz_scores: newScores })
      .eq('id', progress.id);

    if (error) {
      console.error('Error saving quiz score:', error);
    } else {
      setProgress(prev => prev ? { ...prev, quiz_scores: newScores } : null);
    }
  };

  const saveScenarioChoice = async (stepId: string, choiceId: string) => {
    if (!user || !progress) return;

    const newChoices = { ...progress.scenario_choices, [stepId]: choiceId };

    const { error } = await supabase
      .from('workshop_progress')
      .update({ scenario_choices: newChoices })
      .eq('id', progress.id);

    if (error) {
      console.error('Error saving scenario choice:', error);
    } else {
      setProgress(prev => prev ? { ...prev, scenario_choices: newChoices } : null);
    }
  };

  const markComplete = async () => {
    if (!user || !progress) return;

    const { error } = await supabase
      .from('workshop_progress')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', progress.id);

    if (error) {
      console.error('Error marking complete:', error);
    } else {
      setProgress(prev => prev ? { ...prev, completed_at: new Date().toISOString() } : null);
    }
  };

  return {
    progress,
    isLoading,
    updateSection,
    completeSection,
    saveQuizScore,
    saveScenarioChoice,
    markComplete,
    refreshProgress: fetchProgress,
  };
}