/**
 * Tests for MiniLesson component
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import MiniLesson from '../components/MiniLesson';

// Mock fetch
global.fetch = jest.fn();

const mockLesson = {
  capability_id: 1,
  capability_name: 'Treble Clef',
  domain: 'Music Theory',
  steps: [
    {
      step_type: 'LISTEN',
      content: 'Listen to this example.',
      instruction: 'Hear how this sounds.',
      audio_url: '/audio/test.mp3',
    },
    {
      step_type: 'EXPLAIN',
      content: 'The treble clef is used for higher pitched instruments.',
      instruction: 'Read this explanation.',
      prompt: 'The treble clef is used for higher pitched instruments.',
    },
    {
      step_type: 'VISUAL',
      content: 'See the clef shape.',
      instruction: 'Look at this visual.',
      visual_url: '/images/treble-clef.png',
    },
    {
      step_type: 'TRY_IT',
      content: 'Try identifying the clef.',
      instruction: 'Practice this yourself.',
      prompt: 'Try identifying the clef.',
    },
    {
      step_type: 'QUIZ',
      content: 'Which clef is this?',
      instruction: 'Answer this question.',
      quiz_options: JSON.stringify(['Treble Clef', 'Bass Clef', 'Alto Clef']),
      quiz_answer: 'Treble Clef',
    },
  ],
};

describe('MiniLesson', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLesson),
    });
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching', async () => {
      // Slow fetch
      fetch.mockImplementationOnce(() => new Promise(() => {}));

      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText(/Loading lesson/i)).toBeTruthy();
    });

    it('fetches lesson on mount', async () => {
      render(
        <MiniLesson
          capabilityId={123}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/capabilities/123/lesson')
        );
      });
    });
  });

  describe('Error handling', () => {
    it('displays error when fetch fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });
    });

    it('displays error when HTTP error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });
    });

    it('shows retry button on error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText(/Retry/i)).toBeTruthy();
      });
    });
  });

  describe('Step navigation', () => {
    it('displays capability name', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        // Capability name is in "Learning: Treble Clef" text
        expect(getByText(/Learning.*Treble Clef/)).toBeTruthy();
      });
    });

    it('starts at first step (Listen)', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        // Should show Listen step label
        expect(getByText('Listen')).toBeTruthy();
      });
    });

    it('displays step instruction', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText(/Hear how this sounds/i)).toBeTruthy();
      });
    });

    it('advances to next step with Next button', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText('Listen')).toBeTruthy();
      });

      // Find and press Next button
      fireEvent.press(getByText(/Next/i));

      await waitFor(() => {
        // Should advance to EXPLAIN step (labeled as "Learn")
        expect(getByText('Learn')).toBeTruthy();
      });
    });

    it('goes back to previous step with Back button', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText('Listen')).toBeTruthy();
      });

      // Advance to step 2
      fireEvent.press(getByText(/Next/i));

      await waitFor(() => {
        expect(getByText('Learn')).toBeTruthy();
      });

      // Go back
      fireEvent.press(getByText(/Back/i));

      await waitFor(() => {
        expect(getByText('Listen')).toBeTruthy();
      });
    });
  });

  describe('Different step types', () => {
    it('renders LISTEN step with play button', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText(/Play Audio/i)).toBeTruthy();
      });
    });

    it('renders EXPLAIN step with explanation', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText('Listen')).toBeTruthy();
      });

      // Navigate to EXPLAIN step
      fireEvent.press(getByText(/Next/i));

      await waitFor(() => {
        expect(getByText('Learn')).toBeTruthy();
        expect(getByText(/treble clef is used/i)).toBeTruthy();
      });
    });

    it('renders VISUAL step with notation placeholder', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText('Listen')).toBeTruthy();
      });

      // Navigate through LISTEN and EXPLAIN to VISUAL
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('Learn')).toBeTruthy());
      
      fireEvent.press(getByText(/Next/i));

      await waitFor(() => {
        expect(getByText('See It')).toBeTruthy();
      });
    });

    it('renders TRY_IT step', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getByText('Listen')).toBeTruthy();
      });

      // Navigate to TRY_IT step
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('Learn')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('See It')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));

      await waitFor(() => {
        expect(getByText('Try It')).toBeTruthy();
      });
    });
  });

  describe('Quiz functionality', () => {
    const navigateToQuiz = async (getByText) => {
      await waitFor(() => expect(getByText('Listen')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('Learn')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('See It')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('Try It')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));
    };

    it('displays quiz options', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await navigateToQuiz(getByText);

      await waitFor(() => {
        expect(getByText('Quick Check')).toBeTruthy();
        expect(getByText('Treble Clef')).toBeTruthy();
        expect(getByText('Bass Clef')).toBeTruthy();
        expect(getByText('Alto Clef')).toBeTruthy();
      });
    });

    it('allows selecting correct quiz answer', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await navigateToQuiz(getByText);

      await waitFor(() => {
        expect(getByText('Treble Clef')).toBeTruthy();
      });

      // Select correct answer
      fireEvent.press(getByText('Treble Clef'));

      await waitFor(() => {
        expect(getByText(/Correct/i)).toBeTruthy();
      });
    });

    it('shows incorrect feedback for wrong answer', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await navigateToQuiz(getByText);

      await waitFor(() => {
        expect(getByText('Bass Clef')).toBeTruthy();
      });

      // Select wrong answer
      fireEvent.press(getByText('Bass Clef'));

      await waitFor(() => {
        expect(getByText(/Not quite/i)).toBeTruthy();
      });
    });

    it('submits quiz result to server', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await navigateToQuiz(getByText);

      await waitFor(() => {
        expect(getByText('Treble Clef')).toBeTruthy();
      });

      fetch.mockClear();
      fetch.mockResolvedValueOnce({ ok: true });

      fireEvent.press(getByText('Treble Clef'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/quiz-result'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('passed'),
          })
        );
      });
    });
  });

  describe('Completion', () => {
    it('calls onComplete when finishing lesson', async () => {
      const onComplete = jest.fn();
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={onComplete}
          onCancel={jest.fn()}
        />
      );

      // Navigate to quiz
      await waitFor(() => expect(getByText('Listen')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('Learn')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('See It')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));
      await waitFor(() => expect(getByText('Try It')).toBeTruthy());
      fireEvent.press(getByText(/Next/i));

      await waitFor(() => {
        expect(getByText('Treble Clef')).toBeTruthy();
      });

      // Answer quiz
      fireEvent.press(getByText('Treble Clef'));

      await waitFor(() => {
        expect(getByText(/Correct/i)).toBeTruthy();
      });

      // Complete lesson
      fireEvent.press(getByText(/Done|Complete|Finish/i));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Cancellation', () => {
    it('calls onCancel when skip button pressed', async () => {
      const onCancel = jest.fn();
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={onCancel}
        />
      );

      await waitFor(() => {
        expect(getByText('Listen')).toBeTruthy();
      });

      // Press "Skip for now" button
      fireEvent.press(getByText(/Skip for now/i));

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Progress tracking', () => {
    it('shows progress through steps', async () => {
      const { getByText } = render(
        <MiniLesson
          capabilityId={1}
          onComplete={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Progress is indicated by step dots/indicators
      await waitFor(() => {
        expect(getByText('Listen')).toBeTruthy();
      });

      // After navigating, step indicator should update
      fireEvent.press(getByText(/Next/i));

      await waitFor(() => {
        expect(getByText('Learn')).toBeTruthy();
      });
    });
  });
});
