import { useState, useEffect, useRef, useCallback } from 'react';
import { api, connectSSE } from '@/lib/api';
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
  const sessionRef = useRef<WorkshopSession | null>(null);

  // Keep ref in sync so SSE callbacks can access latest session
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (sessionCode) {
      fetchSession();
    } else {
      setIsLoading(false);
    }
  }, [sessionCode]);

  // SSE subscription for real-time updates
  useEffect(() => {
    if (!session) return;

    const cleanup = connectSSE(`/api/v1/workshop/sessions/${session.id}/events`, {
      session_update: (data) => {
        setSession(data as WorkshopSession);
      },
      poll_created: (data) => {
        const poll = data as Poll;
        if (poll.is_active) {
          setActivePoll({ ...poll, options: poll.options as string[] });
        }
      },
      poll_closed: (data) => {
        const poll = data as Poll;
        setActivePoll((prev) => (prev?.id === poll.id ? null : prev));
      },
      question_added: () => {
        fetchQuestions();
      },
      question_updated: () => {
        fetchQuestions();
      },
      participant_joined: () => {
        fetchParticipantCount();
      },
    });

    return cleanup;
  }, [session?.id]);

  const fetchSession = async () => {
    if (!sessionCode) return;

    try {
      const data = await api.get<WorkshopSession>(
        `/api/v1/workshop/sessions/code/${sessionCode.toUpperCase()}`
      );
      setSession(data);
      setError(null);
      await Promise.all([
        fetchActivePollById(data.id),
        fetchQuestionsById(data.id),
        fetchParticipantCountById(data.id),
      ]);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError((err as Error).message || 'Failed to load session');
    }

    setIsLoading(false);
  };

  const fetchActivePollById = async (sessionId: string) => {
    try {
      const data = await api.get<Poll | null>(
        `/api/v1/workshop/sessions/${sessionId}/polls/active`
      );
      if (data) {
        setActivePoll({ ...data, options: data.options as string[] });
      }
    } catch {
      // no active poll
    }
  };

  const fetchQuestionsById = async (sessionId: string) => {
    try {
      const data = await api.get<Question[]>(
        `/api/v1/workshop/sessions/${sessionId}/questions`
      );
      setQuestions(data);
    } catch {
      // ignore
    }
  };

  const fetchQuestions = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    await fetchQuestionsById(s.id);
  }, []);

  const fetchParticipantCountById = async (sessionId: string) => {
    try {
      const data = await api.get<{ count: number }>(
        `/api/v1/workshop/sessions/${sessionId}/participants`
      );
      setParticipantCount(data.count);
    } catch {
      // ignore
    }
  };

  const fetchParticipantCount = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    await fetchParticipantCountById(s.id);
  }, []);

  const joinSession = async () => {
    if (!user || !session) return { error: 'Not authenticated or no session' };

    try {
      await api.post(`/api/v1/workshop/sessions/${session.id}/join`, {});
      return { error: null };
    } catch (err) {
      console.error('Error joining session:', err);
      return { error: (err as Error).message };
    }
  };

  const submitPollResponse = async (pollId: string, optionIndex: number) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      await api.post(`/api/v1/workshop/polls/${pollId}/respond`, {
        selectedOption: optionIndex,
      });
      return { error: null };
    } catch (err) {
      console.error('Error submitting poll response:', err);
      return { error: (err as Error).message };
    }
  };

  const submitQuestion = async (questionText: string) => {
    if (!user || !session) return { error: 'Not authenticated or no session' };

    try {
      await api.post(`/api/v1/workshop/sessions/${session.id}/questions`, {
        questionText,
      });
      return { error: null };
    } catch (err) {
      console.error('Error submitting question:', err);
      return { error: (err as Error).message };
    }
  };

  const upvoteQuestion = async (questionId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      await api.post(`/api/v1/workshop/questions/${questionId}/upvote`, {});
      await fetchQuestions();
      return { error: null };
    } catch (err) {
      console.error('Error upvoting question:', err);
      return { error: (err as Error).message };
    }
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
