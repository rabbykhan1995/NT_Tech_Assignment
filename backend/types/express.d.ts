declare global {
  namespace Express {
    interface Request {
      // Decoded token principal attached by authMiddleware. May be a staff
      // token (super_admin/location/staff) or an ecommerce user token.
      payload?: any;
      // Set by the onboarding middleware after a valid onboarding_token check.
      tenantOnboardingID?: number;
      // Set by checkSubscription middleware → প্যাকেজের features payload
      tenantFeatures?: Record<string, any>;
    }
  }
}

export {};