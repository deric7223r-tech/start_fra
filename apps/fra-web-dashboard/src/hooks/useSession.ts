import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { WorkshopSession, Poll, Question } from '@/types/workshop';

export function useSession(sessionCode?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<WorkshopSession | null>(null);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionCode) {
      fetchSession();
    } else {
      setIsLoading(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    if (!session) return;

    // Subscribe to session updates
    const sessionChannel = supabase
      .channel(`session-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workshop_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSession(payload.new as WorkshopSession);
          }
        }
      )
      .subscribe();

    // Subscribe to poll updates
    const pollChannel = supabase
      .channel(`polls-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const poll = payload.new as Poll;
            if (poll.is_active) {
              setActivePoll({
                ...poll,
                options: poll.options as string[],
              });
            } else if (activePoll?.id === poll.id) {
              setActivePoll(null);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to question updates
    const questionChannel = supabase
      .channel(`questions-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    // Subscribe to participant updates
    const participantChannel = supabase
      .channel(`participants-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          fetchParticipantCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(pollChannel);
      supabase.removeChannel(questionChannel);
      supabase.removeChannel(participantChannel);
    };
  }, [session?.id]);

  const fetchSession = async () => {
    if (!sessionCode) return;

    const { data, error } = await supabase
      .from('workshop_sessions')
      .select('*')
      .eq('session_code', sessionCode.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      setError('Failed to load session');
    } else if (!data) {
      setError('Session not found');
    } else {
      setSession(data);
      setError(null);
      await Promise.all([
        fetchActivePoll(data.id),
        fetchQuestions(),
        fetchParticipantCount(),
      ]);
    }
    
    setIsLoading(false);
  };

  const fetchActivePoll = async (sessionId: string) => {
    const { data } = await supabase
      .from('polls')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setActivePoll({
        ...data,
        options: data.options as string[],
      });
    }
  };

  const fetchQuestions = async () => {
    if (!session) return;

    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', session.id)
      .order('upvotes', { ascending: false });

    if (data) {
      setQuestions(data);
    }
  };

  const fetchParticipantCount = async () => {
    if (!session) return;

    const { count } = await supabase
      .from('session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);

    setParticipantCount(count || 0);
  };

  const joinSession = async () => {
    if (!user || !session) return { error: 'Not authenticated or no session' };

    const { error } = await supabase
      .from('session_participants')
      .upsert({
        session_id: session.id,
        user_id: user.id,
      });

    if (error) {
      console.error('Error joining session:', error);
      return { error: error.message };
    }

    return { error: null };
  };

  const submitPollResponse = async (pollId: string, optionIndex: number) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('poll_responses')
      .upsert({
        poll_id: pollId,
        user_id: user.id,
        selected_option: optionIndex,
      });

    if (error) {
      console.error('Error submitting poll response:', error);
      return { error: error.message };
    }

    return { error: null };
  };

  const submitQuestion = async (questionText: string) => {
    if (!user || !session) return { error: 'Not authenticated or no session' };

    const { error } = await supabase
      .from('questions')
      .insert({
        session_id: session.id,
        user_id: user.id,
        question_text: questionText,
      });

    if (error) {
      console.error('Error submitting question:', error);
      return { error: error.message };
    }

    return { error: null };
  };

  const upvoteQuestion = async (questionId: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Check if already upvoted
    const { data: existing } = await supabase
      .from('question_upvotes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Remove upvote
      await supabase
        .from('question_upvotes')
        .delete()
        .eq('id', existing.id);
    } else {
      // Add upvote
      await supabase
        .from('question_upvotes')
        .insert({
          question_id: questionId,
          user_id: user.id,
        });
    }

    await fetchQuestions();
    return { error: null };
  };

  return {
    session,
    activePoll,
    questions,
    participantCount,
    isLoading,
    error,
    joinSession,
    submitPollResponse,
    submitQuestion,
    upvoteQuestion,
    refreshSession: fetchSession,
  };
}