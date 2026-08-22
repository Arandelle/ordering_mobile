// types/branch.ts
export type Location = {
  type: "Point";
  coordinates: [number, number] // [longitude, latitude] - GeoJSON format
}

export type BranchAddress = {
  line1: string;
  city: string;
  cityCode: string;
  barangayCode: string;
  province: string;
};

export type BranchCodOverride = "global" | "enabled" | "disabled";

/** A designated barangay for free delivery (no minimum spend) at a specific branch. */
export type DesignatedBarangay = {
  barangayCode: string;
  barangayName: string;
};

export type Branch = {
  _id: string;
  name: string;
  code: string;
  address: BranchAddress;
  location: Location,
  deliveryRadiusKm: number | null;
  designatedBarangays: DesignatedBarangay[];
  isActive: boolean;
  openingSoon: boolean;
  maxActiveOrders: number | null;
  maxReservationsPerHour: number | null;
  maxReservationsPerDay: number | null;
  isBusy: boolean;
  codEnabled: BranchCodOverride;
  createdAt?: string;
  updatedAt?: string;
};

export type BranchFormData = {
  name: string;
  address: {
    line1: string;
    city: string;
    cityCode: string;
    barangayCode: string;
    province: string;
  };
  location?: {
    latitude: string;
    longitude: string
  }
  deliveryRadiusKm: number | null;
  designatedBarangays: DesignatedBarangay[];
  openingSoon: boolean;
  isBusy: boolean;
  codEnabled: BranchCodOverride;
  maxActiveOrders: number | null;
  maxReservationsPerHour: number | null;
  maxReservationsPerDay: number | null;
};

export type BranchFormErrors = Partial<Record<keyof BranchFormData | "location" | "address", string>>;
