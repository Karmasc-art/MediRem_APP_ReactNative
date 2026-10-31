export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  AddMedicine: { medicineId?: number } | undefined;
  MedicineDetails: { medicineId: number };
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Medicines: undefined;
  History: undefined;
  Profile: undefined;
};