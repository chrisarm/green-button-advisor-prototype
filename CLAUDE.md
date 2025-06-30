# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run all tests (Vitest)
npm test:coverage    # Run tests with coverage report
```

## Architecture Overview

**Framework Stack:**
- Vue 3 with Composition API
- Vite for build tooling
- Vitest for testing with jsdom environment
- Client-side energy tariff calculations for privacy

**Core Business Logic Pattern:**
The application uses a composables-based architecture where business logic is separated from UI components:

- `/src/composables/useMultiPlanCalculator.js` - Main comparison engine comparing exactly 2 SDGE plans
- `/src/utils/sdgeTariffs.js` - Core tariff calculation engine with 2025 SDGE rates and seasonal logic
- `/src/utils/csvParser.js` - Green Button CSV parsing with validation

**Application Flow:**
Single-page application with conditional rendering based on user selections. Main flow: Plan Selection → File Upload → Results Comparison with Chart.js visualizations.

## Key Technical Patterns

**Energy Tariff System:**
- Supports 5 SDGE residential plans: DR (tiered), TOU-DR1, TOU-DR2, TOU-DR-P, EV-TOU-5 (time-of-use)
- Complex seasonal detection (summer: June-October, winter: November-May)
- Handles baseline credits, monthly charges, and time period classifications
- All calculations happen client-side using reactive Vue 3 state

**Data Processing Pipeline:**
1. CSV upload → PapaParse validation → date/time parsing with timezone handling
2. Seasonal and time period classification (Peak, Off-Peak, Super Off-Peak)
3. Multi-plan cost calculations with aggregation into daily/monthly summaries
4. Chart data preparation for comparative visualization

**State Management:**
- No external state management library
- Composables encapsulate related reactive state and logic
- Uses Vue 3 refs/reactive for local component state
- Props/emit pattern for parent-child communication

## Testing Approach

**Test Organization:**
- Integration tests: `/src/__tests__/` - Full application workflows
- Component tests: `/src/components/__tests__/` - UI behavior
- Composable tests: `/src/composables/__tests__/` - Business logic
- Utility tests: `/src/utils/__tests__/` - Core calculations

**Testing Patterns:**
- Vitest with Vue Test Utils for component testing
- Comprehensive coverage of tariff calculations and edge cases
- Sample data validation and error handling scenarios

## Key Files for Development

**Core Business Logic:**
- `src/utils/sdgeTariffs.js` - Rate calculations, plan definitions, seasonal logic
- `src/composables/useMultiPlanCalculator.js` - Main comparison engine and state
- `src/App.vue` - Application orchestrator and user flow

**Adding New Plans:**
Update the `SDGE_PLANS` object in `sdgeTariffs.js` with rate structures, then add to plan selection UI in `PlanSelector.vue`.

**Common Calculations:**
All rate calculations use the pattern: base rate + time-of-use multipliers + baseline credits - monthly charges. Seasonal detection drives rate selection within each plan type.