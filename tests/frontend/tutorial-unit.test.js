/**
 * Unit Tests for Tutorial/Onboarding Components
 * Tests individual components and hooks in isolation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingFlow } from '../../client/src/components/onboarding/onboarding-flow';
import { InteractiveTooltip, useOnboarding } from '../../client/src/components/ui/tooltip-interactive';

// Mock dependencies
vi.mock('wouter', () => ({
  useLocation: () => ['/'],
}));

vi.mock('../../client/src/lib/auth', () => ({
  useAuthStore: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => children,
}));

describe('useOnboarding Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const TestComponent = () => {
      const { isOnboardingActive, hasSeenOnboarding } = useOnboarding();
      return (
        <div>
          <span data-testid="active">{isOnboardingActive.toString()}</span>
          <span data-testid="seen">{hasSeenOnboarding.toString()}</span>
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('active')).toHaveTextContent('false');
    expect(screen.getByTestId('seen')).toHaveTextContent('false');
  });

  it('should start onboarding when startOnboarding is called', () => {
    const TestComponent = () => {
      const { isOnboardingActive, startOnboarding } = useOnboarding();
      return (
        <div>
          <span data-testid="active">{isOnboardingActive.toString()}</span>
          <button onClick={startOnboarding} data-testid="start-btn">
            Start
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('start-btn'));
    
    expect(screen.getByTestId('active')).toHaveTextContent('true');
  });

  it('should complete onboarding and set localStorage', () => {
    const TestComponent = () => {
      const { isOnboardingActive, hasSeenOnboarding, startOnboarding, completeOnboarding } = useOnboarding();
      return (
        <div>
          <span data-testid="active">{isOnboardingActive.toString()}</span>
          <span data-testid="seen">{hasSeenOnboarding.toString()}</span>
          <button onClick={startOnboarding} data-testid="start-btn">Start</button>
          <button onClick={completeOnboarding} data-testid="complete-btn">Complete</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('start-btn'));
    fireEvent.click(screen.getByTestId('complete-btn'));
    
    expect(screen.getByTestId('active')).toHaveTextContent('false');
    expect(screen.getByTestId('seen')).toHaveTextContent('true');
    expect(localStorage.getItem('hasSeenOnboarding')).toBe('true');
  });

  it('should skip onboarding and set localStorage', () => {
    const TestComponent = () => {
      const { isOnboardingActive, hasSeenOnboarding, startOnboarding, skipOnboarding } = useOnboarding();
      return (
        <div>
          <span data-testid="active">{isOnboardingActive.toString()}</span>
          <span data-testid="seen">{hasSeenOnboarding.toString()}</span>
          <button onClick={startOnboarding} data-testid="start-btn">Start</button>
          <button onClick={skipOnboarding} data-testid="skip-btn">Skip</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('start-btn'));
    fireEvent.click(screen.getByTestId('skip-btn'));
    
    expect(screen.getByTestId('active')).toHaveTextContent('false');
    expect(screen.getByTestId('seen')).toHaveTextContent('true');
    expect(localStorage.getItem('hasSeenOnboarding')).toBe('true');
  });

  it('should reset onboarding state', () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    
    const TestComponent = () => {
      const { isOnboardingActive, hasSeenOnboarding, resetOnboarding } = useOnboarding();
      return (
        <div>
          <span data-testid="active">{isOnboardingActive.toString()}</span>
          <span data-testid="seen">{hasSeenOnboarding.toString()}</span>
          <button onClick={resetOnboarding} data-testid="reset-btn">Reset</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('reset-btn'));
    
    expect(screen.getByTestId('active')).toHaveTextContent('true');
    expect(screen.getByTestId('seen')).toHaveTextContent('false');
    expect(localStorage.getItem('hasSeenOnboarding')).toBeNull();
  });
});

describe('InteractiveTooltip Component', () => {
  const mockSteps = [
    {
      id: 'step1',
      target: '[data-testid="test-element"]',
      title: 'Step 1',
      content: 'This is step 1',
      position: 'bottom'
    },
    {
      id: 'step2',
      target: '[data-testid="test-element-2"]',
      title: 'Step 2',
      content: 'This is step 2',
      position: 'top'
    }
  ];

  beforeEach(() => {
    // Create test elements in DOM
    const testElement = document.createElement('div');
    testElement.setAttribute('data-testid', 'test-element');
    testElement.style.position = 'absolute';
    testElement.style.top = '100px';
    testElement.style.left = '100px';
    testElement.style.width = '100px';
    testElement.style.height = '50px';
    document.body.appendChild(testElement);

    const testElement2 = document.createElement('div');
    testElement2.setAttribute('data-testid', 'test-element-2');
    testElement2.style.position = 'absolute';
    testElement2.style.top = '200px';
    testElement2.style.left = '200px';
    testElement2.style.width = '100px';
    testElement2.style.height = '50px';
    document.body.appendChild(testElement2);
  });

  afterEach(() => {
    // Clean up test elements
    const elements = document.querySelectorAll('[data-testid^="test-element"]');
    elements.forEach(el => el.remove());
  });

  it('should render tooltip with correct content', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <InteractiveTooltip
        steps={mockSteps}
        isActive={true}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('This is step 1')).toBeInTheDocument();
    expect(screen.getByText('Passo 1 de 2')).toBeInTheDocument();
  });

  it('should show progress correctly', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <InteractiveTooltip
        steps={mockSteps}
        isActive={true}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    );

    expect(screen.getByText('Passo 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should advance to next step when next button is clicked', async () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <InteractiveTooltip
        steps={mockSteps}
        isActive={true}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    );

    fireEvent.click(screen.getByText('Próximo'));

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('This is step 2')).toBeInTheDocument();
    });
  });

  it('should call onComplete when completing tutorial', async () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <InteractiveTooltip
        steps={mockSteps}
        isActive={true}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    );

    // Go to last step
    fireEvent.click(screen.getByText('Próximo'));

    await waitFor(() => {
      expect(screen.getByText('Concluir')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Concluir'));

    expect(onComplete).toHaveBeenCalled();
  });

  it('should call onSkip when skip button is clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <InteractiveTooltip
        steps={mockSteps}
        isActive={true}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    );

    fireEvent.click(screen.getByText('Pular tutorial'));

    expect(onSkip).toHaveBeenCalled();
  });

  it('should show previous button on steps after first', async () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <InteractiveTooltip
        steps={mockSteps}
        isActive={true}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    );

    // Initially no previous button
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();

    // Go to next step
    fireEvent.click(screen.getByText('Próximo'));

    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });
  });

  it('should go back to previous step when previous button is clicked', async () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(
      <InteractiveTooltip
        steps={mockSteps}
        isActive={true}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    );

    // Go to next step
    fireEvent.click(screen.getByText('Próximo'));

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });

    // Go back
    fireEvent.click(screen.getByText('Anterior'));

    await waitFor(() => {
      expect(screen.getByText('Step 1')).toBeInTheDocument();
    });
  });
});

describe('OnboardingFlow Component', () => {
  it('should render for home page when onboarding is active', () => {
    // Mock the useOnboarding hook to return active state
    vi.mock('../../client/src/components/ui/tooltip-interactive', () => ({
      useOnboarding: () => ({
        isOnboardingActive: true,
        completeOnboarding: vi.fn(),
        skipOnboarding: vi.fn(),
      }),
      InteractiveTooltip: ({ steps, isActive }) => (
        isActive ? <div data-testid="onboarding-tooltip">Onboarding Active</div> : null
      ),
    }));

    render(<OnboardingFlow page="home" />);

    expect(screen.getByTestId('onboarding-tooltip')).toBeInTheDocument();
  });

  it('should not render when onboarding is not active', () => {
    // Mock the useOnboarding hook to return inactive state
    vi.mock('../../client/src/components/ui/tooltip-interactive', () => ({
      useOnboarding: () => ({
        isOnboardingActive: false,
        completeOnboarding: vi.fn(),
        skipOnboarding: vi.fn(),
      }),
      InteractiveTooltip: ({ steps, isActive }) => (
        isActive ? <div data-testid="onboarding-tooltip">Onboarding Active</div> : null
      ),
    }));

    render(<OnboardingFlow page="home" />);

    expect(screen.queryByTestId('onboarding-tooltip')).not.toBeInTheDocument();
  });

  it('should use custom steps when provided', () => {
    const customSteps = [
      {
        id: 'custom1',
        target: 'body',
        title: 'Custom Step',
        content: 'Custom content',
        position: 'center'
      }
    ];

    // Mock the useOnboarding hook
    vi.mock('../../client/src/components/ui/tooltip-interactive', () => ({
      useOnboarding: () => ({
        isOnboardingActive: true,
        completeOnboarding: vi.fn(),
        skipOnboarding: vi.fn(),
      }),
      InteractiveTooltip: ({ steps }) => (
        <div data-testid="custom-tooltip">{steps[0].title}</div>
      ),
    }));

    render(<OnboardingFlow page="home" customSteps={customSteps} />);

    expect(screen.getByText('Custom Step')).toBeInTheDocument();
  });
});