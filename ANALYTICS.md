# Analytics Implementation

This project uses **Plausible Analytics** for privacy-focused, GDPR-compliant tracking.

## Setup

The analytics are implemented via the `plausible-tracker` NPM package and configured in `/src/plugins/analytics.js`.

### Configuration

- **Domain**: `greenbuttonadvisor.com`
- **Mode**: Production only (disabled in development)
- **Privacy**: No cookies, no personal data collection

## Tracked Events

### Core User Actions
- **File Upload**: CSV upload method and success/failure
- **Plans Selected**: Which plans were chosen and how
- **Smart Recommendations Used**: EV status and recommendation count
- **Comparison Completed**: Savings amount and usage metrics
- **Onboarding Completed**: Flow completion data

### Technical Events
- **Error Encountered**: Component errors for debugging
- **Onboarding Step**: Navigation through the wizard

## Usage in Components

```javascript
import { inject } from 'vue'

// In component setup
const analytics = inject('analytics')

// Track custom events
analytics?.track('Custom Event', {
  property1: 'value1',
  property2: 123
})

// Use predefined tracking methods
analytics?.trackPlanSelection({
  plan1: 'TOU-DR1',
  plan2: 'EV-TOU-5',
  method: 'recommendation'
})
```

## Development

- Analytics are **disabled** in development mode
- Events are logged to console in development for debugging
- Use `import.meta.env.PROD` to check production mode

## Privacy Features

- **No personal data**: Only usage patterns and plan choices
- **Data sanitization**: Automatic truncation of long strings
- **GDPR compliant**: No cookies or cross-site tracking
- **Client-side only**: Energy usage data never leaves the browser

## Dashboard

View analytics at: https://plausible.io/greenbuttonadvisor.com

## Events Reference

| Event | Properties | Description |
|-------|------------|-------------|
| `File Upload` | method, fileSize, success | User uploads CSV data |
| `Plans Selected` | plan1, plan2, method, hasEV | User selects plans to compare |
| `Smart Recommendations Used` | hasEV, count, autoSelected | User uses recommendation feature |
| `Comparison Completed` | totalSavings, monthsAnalyzed, totalUsage, cheaperPlan | Comparison results shown |
| `Onboarding Completed` | hasPlans, hasData, method | User completes onboarding flow |
| `Error Encountered` | errorType, component, severity | Technical errors for debugging |

All monetary values are rounded to whole dollars to protect privacy while maintaining useful analytics.