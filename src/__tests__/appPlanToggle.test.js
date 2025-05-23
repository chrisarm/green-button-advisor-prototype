import { describe, it, expect } from 'vitest'

describe('App Plan Toggle Logic', () => {
  // This simulates the handlePlanToggle function logic from App.vue
  const simulateHandlePlanToggle = (currentSelected, planType, setSelectedPlans) => {
    const isSelected = currentSelected.includes(planType);
    
    if (isSelected) {
      // Remove from selection
      const newSelection = currentSelected.filter(p => p !== planType);
      if (newSelection.length === 2) {
        setSelectedPlans(newSelection);
      } else if (newSelection.length === 1) {
        // Only one plan left selected - keep it selected but don't force a second plan
        setSelectedPlans([newSelection[0]]);
      } else {
        // No plans selected - reset to empty selection
        setSelectedPlans([]);
      }
    } else {
      // Add to selection
      if (currentSelected.length === 0) {
        // First plan selected
        setSelectedPlans([planType]);
      } else if (currentSelected.length === 1) {
        // Second plan selected - now we have a valid comparison
        setSelectedPlans([...currentSelected, planType]);
      } else {
        // Already have 2 plans - replace the first one with the new selection
        setSelectedPlans([planType, currentSelected[1]]);
      }
    }
  };

  it('should allow deselecting TOU-DR1 from default selection', () => {
    let selectedPlans = ['TOU-DR1', 'EV-TOU-5'];
    const setSelectedPlans = (plans) => { selectedPlans = plans; };
    
    // User clicks on TOU-DR1 to deselect it
    simulateHandlePlanToggle(selectedPlans, 'TOU-DR1', setSelectedPlans);
    
    expect(selectedPlans).toEqual(['EV-TOU-5']);
  });

  it('should allow deselecting EV-TOU-5 from default selection', () => {
    let selectedPlans = ['TOU-DR1', 'EV-TOU-5'];
    const setSelectedPlans = (plans) => { selectedPlans = plans; };
    
    // User clicks on EV-TOU-5 to deselect it
    simulateHandlePlanToggle(selectedPlans, 'EV-TOU-5', setSelectedPlans);
    
    expect(selectedPlans).toEqual(['TOU-DR1']);
  });

  it('should allow selecting a third plan when 2 are already selected (replaces first)', () => {
    let selectedPlans = ['TOU-DR1', 'EV-TOU-5'];
    const setSelectedPlans = (plans) => { selectedPlans = plans; };
    
    // User clicks on DR (should replace TOU-DR1)
    simulateHandlePlanToggle(selectedPlans, 'DR', setSelectedPlans);
    
    expect(selectedPlans).toEqual(['DR', 'EV-TOU-5']);
  });

  it('should handle the complete deselection workflow', () => {
    let selectedPlans = ['TOU-DR1', 'EV-TOU-5'];
    const setSelectedPlans = (plans) => { selectedPlans = plans; };
    
    // Deselect TOU-DR1
    simulateHandlePlanToggle(selectedPlans, 'TOU-DR1', setSelectedPlans);
    expect(selectedPlans).toEqual(['EV-TOU-5']);
    
    // Deselect EV-TOU-5
    simulateHandlePlanToggle(selectedPlans, 'EV-TOU-5', setSelectedPlans);
    expect(selectedPlans).toEqual([]);
  });

  it('should handle selecting plans from empty state', () => {
    let selectedPlans = [];
    const setSelectedPlans = (plans) => { selectedPlans = plans; };
    
    // Select first plan
    simulateHandlePlanToggle(selectedPlans, 'DR', setSelectedPlans);
    expect(selectedPlans).toEqual(['DR']);
    
    // Select second plan
    simulateHandlePlanToggle(selectedPlans, 'TOU-DR2', setSelectedPlans);
    expect(selectedPlans).toEqual(['DR', 'TOU-DR2']);
  });

  it('should handle the user workflow: deselect one, select another', () => {
    let selectedPlans = ['TOU-DR1', 'EV-TOU-5'];
    const setSelectedPlans = (plans) => { selectedPlans = plans; };
    
    // User wants to compare DR vs EV-TOU-5 instead
    // Step 1: Deselect TOU-DR1
    simulateHandlePlanToggle(selectedPlans, 'TOU-DR1', setSelectedPlans);
    expect(selectedPlans).toEqual(['EV-TOU-5']);
    
    // Step 2: Select DR
    simulateHandlePlanToggle(selectedPlans, 'DR', setSelectedPlans);
    expect(selectedPlans).toEqual(['EV-TOU-5', 'DR']);
  });

  it('should handle toggling the same plan multiple times', () => {
    let selectedPlans = ['TOU-DR1'];
    const setSelectedPlans = (plans) => { selectedPlans = plans; };
    
    // Toggle EV-TOU-5 on
    simulateHandlePlanToggle(selectedPlans, 'EV-TOU-5', setSelectedPlans);
    expect(selectedPlans).toEqual(['TOU-DR1', 'EV-TOU-5']);
    
    // Toggle EV-TOU-5 off
    simulateHandlePlanToggle(selectedPlans, 'EV-TOU-5', setSelectedPlans);
    expect(selectedPlans).toEqual(['TOU-DR1']);
    
    // Toggle EV-TOU-5 on again
    simulateHandlePlanToggle(selectedPlans, 'EV-TOU-5', setSelectedPlans);
    expect(selectedPlans).toEqual(['TOU-DR1', 'EV-TOU-5']);
  });
})