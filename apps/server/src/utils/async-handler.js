/**
 * Wrapper async pour routes Express.
 * Evite les try/catch repetitifs — les erreurs sont
 * propagees automatiquement au global error handler.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
