import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppState } from '../hooks/useAppState';
import { ThoughtEntry } from '../types';
import { isInReflectionMode, startReflectionMode } from '../storage';
import ThoughtInput from '../components/ThoughtInput';
import EvidenceGathering from '../components/EvidenceGathering';
import BalancedPerspective from '../components/BalancedPerspective';
import Completion from '../components/Completion';

type ReflectionStep = 'thought' | 'evidence' | 'perspective' | 'completion';

export default function ReflectPage() {
  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ReflectionStep>('thought');

  const [aiReflection, setAiReflection] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (state.reflectionModeUntil && isInReflectionMode(state.reflectionModeUntil)) {
      navigate('/', { replace: true });
    }
  }, [navigate, state.reflectionModeUntil]);

  useEffect(() => {
    if (!state.currentEntry && !(state.reflectionModeUntil && isInReflectionMode(state.reflectionModeUntil))) {
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentEntry: {
            id: Date.now().toString(),
            createdAt: Date.now(),
          },
        };
      });
    }
  }, [state.currentEntry, state.reflectionModeUntil, setState]);

  const handleThoughtSubmit = (thought: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentEntry: { ...prev.currentEntry, thought },
      };
    });
    setCurrentStep('evidence');
  };

  const handleEvidenceSubmit = (evidence: string[]) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentEntry: { ...prev.currentEntry, evidence },
      };
    });
    setCurrentStep('perspective');
  };

  const handlePerspectiveComplete = async (balancedPerspective: string) => {
    const thought = state.currentEntry?.thought || '';
    const evidence = state.currentEntry?.evidence || [];

    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentEntry: { ...prev.currentEntry, balancedPerspective },
      };
    });

    setCurrentStep('completion');
    setLoadingAi(true);
    setAiError('');
    setAiReflection('');

    try {
      const response = await fetch('/api/ai-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thought,
          evidence,
          balancedPerspective,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI failed');
      }

      setAiReflection(data.aiReflection);
    } catch (error) {
      setAiError('AI reflection could not be generated, but your balanced perspective is still saved.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleReflectionComplete = () => {
    const completedEntry: ThoughtEntry = {
      id: state.currentEntry?.id || Date.now().toString(),
      thought: state.currentEntry?.thought || '',
      evidence: state.currentEntry?.evidence || [],
      balancedPerspective: state.currentEntry?.balancedPerspective || '',
      createdAt: state.currentEntry?.createdAt || Date.now(),
      completedAt: Date.now(),
    };

    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        completedThoughts: [...prev.completedThoughts, completedEntry],
        currentEntry: null,
        reflectionModeUntil: startReflectionMode(),
        reflectionModeDismissed: false,
      };
    });

    navigate('/');
  };

  const handleBackFromThought = () => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, currentEntry: null };
    });
    navigate('/');
  };

  const handleBackToThought = () => {
    setCurrentStep('thought');
  };

  const handleBackToEvidence = () => {
    setCurrentStep('evidence');
  };

  if (state.reflectionModeUntil && isInReflectionMode(state.reflectionModeUntil)) {
    return null;
  }

  switch (currentStep) {
    case 'thought':
      return (
        <ThoughtInput
          initialThought={state.currentEntry?.thought}
          onContinue={handleThoughtSubmit}
          onBack={handleBackFromThought}
        />
      );

    case 'evidence':
      return (
        <EvidenceGathering
          thought={state.currentEntry?.thought || ''}
          initialEvidence={state.currentEntry?.evidence}
          onContinue={handleEvidenceSubmit}
          onBack={handleBackToThought}
        />
      );

    case 'perspective':
      return (
        <BalancedPerspective
          thought={state.currentEntry?.thought || ''}
          evidence={state.currentEntry?.evidence || []}
          initialPerspective={state.currentEntry?.balancedPerspective}
          onComplete={handlePerspectiveComplete}
          onBack={handleBackToEvidence}
        />
      );

    case 'completion':
      return (
        <Completion
          perspective={state.currentEntry?.balancedPerspective || ''}
          aiReflection={aiReflection}
          loadingAi={loadingAi}
          aiError={aiError}
          onContinue={handleReflectionComplete}
        />
      );
  }
}