import Agency from "../models/AgenciesSchema.js";

export const deductAgencyCredits = async (agencyId, amount = 5) => {
  const agency = await Agency.findById(agencyId);

  if (!agency) {
    throw new Error("Agency not found");
  }

  if (agency.credits < amount) {
    throw new Error("Insufficient credits");
  }

  agency.credits -= amount;
  await agency.save();

  return agency;
};