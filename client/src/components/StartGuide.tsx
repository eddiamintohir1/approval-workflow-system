import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuideStep {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
  position: "top" | "bottom" | "left" | "right";
}

const guideSteps: GuideStep[] = [
  {
    id: 1,
    title: "Dashboard Overview",
    description: "View all your workflows at a glance. See statistics for Total Workflows, Draft, In Progress, Completed, and Rejected workflows.",
    targetSelector: "[data-guide='stats-cards']",
    position: "bottom",
  },
  {
    id: 2,
    title: "Create New Workflow",
    description: "Click here to create a new workflow from available templates. Choose from MAF, PR, Reimbursement, and Budget workflows.",
    targetSelector: "[data-guide='new-workflow-btn']",
    position: "bottom",
  },
  {
    id: 3,
    title: "Quick Assign",
    description: "Department heads can quickly assign workflows to staff members. Select a template and assign it to a team member in one click.",
    targetSelector: "[data-guide='quick-assign-btn']",
    position: "bottom",
  },
  {
    id: 4,
    title: "Search Workflows",
    description: "Search for workflows by ID or title. Use this to quickly find specific workflows you're looking for.",
    targetSelector: "[data-guide='search-input']",
    position: "bottom",
  },
  {
    id: 5,
    title: "Filter by Status",
    description: "Filter workflows by their status: All Status, Draft, In Progress, Completed, or Rejected.",
    targetSelector: "[data-guide='status-filter']",
    position: "bottom",
  },
  {
    id: 6,
    title: "Filter by Type",
    description: "Filter workflows by type: MAF, PR, Reimbursement, or Budget to see specific workflow categories.",
    targetSelector: "[data-guide='type-filter']",
    position: "bottom",
  },
  {
    id: 7,
    title: "Filter by Department",
    description: "Filter workflows by department: PPIC, Purchasing, GA, Finance, and more.",
    targetSelector: "[data-guide='department-filter']",
    position: "bottom",
  },
  {
    id: 8,
    title: "Date Range Filter",
    description: "Filter workflows by date range. Select From Date and To Date to view workflows created within a specific period.",
    targetSelector: "[data-guide='date-filters']",
    position: "bottom",
  },
  {
    id: 9,
    title: "Workflow Cards",
    description: "Each workflow card shows the type, ID, status, title, description, department, and creation date. Click on a card to view full details.",
    targetSelector: "[data-guide='workflow-list']",
    position: "top",
  },
  {
    id: 10,
    title: "Pin Workflows",
    description: "Click the star icon to pin important workflows to the top of your list for quick access.",
    targetSelector: "[data-guide='pin-btn']",
    position: "left",
  },
];

interface StartGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StartGuide({ isOpen, onClose }: StartGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setHighlightedElement(null);
      return;
    }

    const step = guideSteps[currentStep];
    if (!step) return;

    // Find the target element
    const element = document.querySelector(step.targetSelector) as HTMLElement;
    if (element) {
      setHighlightedElement(element);
      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const currentGuideStep = guideSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === guideSteps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setHighlightedElement(null);
    onClose();
  };

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!highlightedElement) return {};

    const rect = highlightedElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 20;

    switch (currentGuideStep.position) {
      case "top":
        return {
          top: rect.top - tooltipHeight - offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
      case "bottom":
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
      case "left":
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - offset,
        };
      case "right":
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + offset,
        };
      default:
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <>
      {/* Overlay with semi-transparent background */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={handleClose}
      />

      {/* Highlight box around target element */}
      {highlightedElement && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 4,
            left: highlightedElement.getBoundingClientRect().left - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
            border: "3px solid #ef4444",
            borderRadius: "8px",
            boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.4)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      )}

      {/* Tooltip with step information */}
      <div
        className="fixed z-[10000] bg-white rounded-lg shadow-2xl p-6 w-80"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white text-sm font-bold">
                {currentStep + 1}
              </div>
              <h3 className="font-semibold text-lg text-gray-900">
                {currentGuideStep.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {currentGuideStep.description}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            Step {currentStep + 1} of {guideSteps.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {isLastStep ? (
              <Button size="sm" onClick={handleClose} className="bg-red-500 hover:bg-red-600">
                Finish
              </Button>
            ) : (
              <Button size="sm" onClick={handleNext} className="bg-red-500 hover:bg-red-600">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
}
