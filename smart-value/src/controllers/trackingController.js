const TrackingService = require('../services/trackingService');
const { renderLandingPage } = require('../views/landingPage');

/**
 * Controller handling tracking redirects, landing page rendering, and API requests.
 */
class TrackingController {
  /**
   * Landing page & API handler for /info/home/ (and /info/home)
   * 
   * - If called by fetch / AJAX / Postman (Accept: application/json or ?format=json):
   *   Returns JSON: { status, destinationUrl, isFallback, targetPlatform, denyReason }
   * 
   * - If called as standard browser navigation:
   *   - Invalid/Empty P2: 302 Redirect to Valuerise
   *   - Valid P2: Renders HTML page with Routeclk tracking URL
   */
  static handleLandingPage(req, res) {
    try {
      const result = TrackingService.resolveDestination(req.query);
      const isJsonRequest = 
        req.xhr || 
        req.headers.accept?.includes('application/json') || 
        req.query.format === 'json';

      // 1. If API / JSON requested (e.g. from Frontend fetch or Postman)
      if (isJsonRequest) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.json({
          status: 'success',
          destinationUrl: result.destinationUrl,
          isFallback: result.isFallback,
          targetPlatform: result.targetPlatform,
          denyReason: result.denyReason,
        });
      }

      // 2. If Browser Navigation & Rule Denied -> Redirect immediately to Valuerise
      if (result.isFallback) {
        return res.redirect(302, result.destinationUrl);
      }

      // 3. If Browser Navigation & Rule Allowed -> Render HTML Landing Page
      const html = renderLandingPage(result.destinationUrl);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(html);
    } catch (error) {
      console.error('Error handling /info/home request:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
      });
    }
  }

  /**
   * Direct HTTP 302 redirect handler for clicks.
   * Route: GET /click or GET /r
   */
  static handleRedirect(req, res) {
    try {
      const result = TrackingService.resolveDestination(req.query);
      return res.redirect(302, result.destinationUrl);
    } catch (error) {
      console.error('Error handling redirect:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error resolving redirect',
      });
    }
  }

  /**
   * JSON REST API endpoint for frontend apps to fetch dynamic destination URLs.
   * Route: GET /api/v1/tracking/resolve
   */
  static handleResolveApi(req, res) {
    try {
      const result = TrackingService.resolveDestination(req.query);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.json({
        status: 'success',
        destinationUrl: result.destinationUrl,
        isFallback: result.isFallback,
        targetPlatform: result.targetPlatform,
        denyReason: result.denyReason,
      });
    } catch (error) {
      console.error('Error resolving destination URL:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error resolving destination URL',
      });
    }
  }

  /**
   * Health check endpoint.
   * Route: GET /health
   */
  static handleHealth(req, res) {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}

module.exports = TrackingController;
