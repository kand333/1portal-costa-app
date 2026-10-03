/** Indicators of the ADMIN dashboard (`GET /api/admin/dashboard`). Counts include unpublished properties. */
export type AdminDashboardStats = {
  properties: {
    total: number;
    published: number;
    forSale: number;
    forRent: number;
  };
  users: number;
  inquiries: number;
};
