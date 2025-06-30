import Plausible from 'plausible-tracker'

class Analytics {
  constructor() {
    this.enabled = import.meta.env.PROD
    this.plausible = null
    this.events = []
    
    this.init()
  }

  init() {
    if (!this.enabled) {
      console.log('Analytics: Development mode - tracking disabled')
      return
    }

    try {
      this.plausible = Plausible({
        domain: 'greenbuttonadvisor.com',
        trackLocalhost: false,
        apiHost: 'https://plausible.io'
      })
      
      // Track initial page view
      this.trackPageView()
      
      console.log('Analytics: Plausible initialized')
    } catch (error) {
      console.warn('Analytics: Failed to initialize Plausible', error)
    }
  }

  track(eventName, properties = {}) {
    // Always log in development for debugging
    if (!this.enabled) {
      console.log('Analytics (dev):', eventName, properties)
      return
    }

    try {
      if (this.plausible) {
        this.plausible.trackEvent(eventName, {
          props: this.sanitizeProperties(properties)
        })
      }
    } catch (error) {
      console.warn('Analytics: Failed to track event', eventName, error)
    }
  }

  trackPageView(path = null) {
    if (!this.enabled) {
      console.log('Analytics (dev): Page view', path || window.location.pathname)
      return
    }

    try {
      if (this.plausible) {
        if (path) {
          this.plausible.trackPageview({
            url: `${window.location.origin}${path}`
          })
        } else {
          this.plausible.trackPageview()
        }
      }
    } catch (error) {
      console.warn('Analytics: Failed to track page view', error)
    }
  }

  // Sanitize properties to ensure they're safe for tracking
  sanitizeProperties(properties) {
    const sanitized = {}
    
    for (const [key, value] of Object.entries(properties)) {
      // Only include safe data types and avoid PII
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        // Truncate long strings to prevent bloated events
        if (typeof value === 'string' && value.length > 100) {
          sanitized[key] = value.substring(0, 100) + '...'
        } else {
          sanitized[key] = value
        }
      }
    }
    
    return sanitized
  }

  // Specific tracking methods for your app
  trackFileUpload(fileInfo) {
    this.track('File Upload', {
      method: fileInfo.method || 'unknown',
      fileSize: fileInfo.size ? Math.round(fileInfo.size / 1024) + 'KB' : 'unknown',
      success: fileInfo.success !== false
    })
  }

  trackPlanSelection(planInfo) {
    this.track('Plans Selected', {
      plan1: planInfo.plan1,
      plan2: planInfo.plan2,
      method: planInfo.method || 'manual', // 'manual' or 'recommendation'
      hasEV: planInfo.hasEV || false
    })
  }

  trackRecommendationUsed(recInfo) {
    this.track('Smart Recommendations Used', {
      hasEV: recInfo.hasEV || false,
      recommendationCount: recInfo.count || 0,
      autoSelected: recInfo.autoSelected || false
    })
  }

  trackComparisonCompleted(comparisonInfo) {
    this.track('Comparison Completed', {
      totalSavings: comparisonInfo.totalSavings ? Math.round(parseFloat(comparisonInfo.totalSavings)) : 0,
      monthsAnalyzed: comparisonInfo.monthsAnalyzed || 0,
      totalUsage: comparisonInfo.totalKWh ? Math.round(parseFloat(comparisonInfo.totalKWh)) : 0,
      cheaperPlan: comparisonInfo.cheaperPlan || 'unknown'
    })
  }

  trackOnboardingStep(stepInfo) {
    this.track('Onboarding Step', {
      step: stepInfo.step,
      direction: stepInfo.direction || 'forward',
      timeOnStep: stepInfo.timeOnStep || null
    })
  }

  trackError(errorInfo) {
    this.track('Error Encountered', {
      errorType: errorInfo.type || 'unknown',
      component: errorInfo.component || 'unknown',
      severity: errorInfo.severity || 'medium'
    })
  }
}

// Create singleton instance
export const analytics = new Analytics()

// Vue plugin
export default {
  install(app) {
    app.config.globalProperties.$analytics = analytics
    app.provide('analytics', analytics)
  }
}