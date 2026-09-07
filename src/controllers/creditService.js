// import Agency from "../models/AgenciesSchema.js";
// import { getIO } from "../socket.js";

// export const deductAgencyCredits = async (agencyId, amount = 5) => {
//   const agency = await Agency.findOneAndUpdate(
//     {
//       _id: agencyId,

//       credits: {
//         $gte: amount,
//       },
//     },

//     {
//       $inc: {
//         credits: -amount,
//       },
//     },

//     {
//       new: true,
//     },
//   );

//   if (!agency) {
//     const checkAgency = await Agency.findById(agencyId);

//     if (!checkAgency) {
//       throw new Error("Agency not found");
//     }

//     throw new Error("Insufficient credits");
//   }

 
//   try {
//     const io = getIO();

//     console.log("EMIT AGENCY ROOM:", agency._id.toString());

//     io.to(agency._id.toString()).emit("agencyCreditUpdated", {
//       credits: agency.credits,
//     });
//   } catch (error) {
//     console.log("Socket Emit Error:", error.message);
//   }

//   return agency;
// };



import Agency from "../models/AgenciesSchema.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";
import { getIO } from "../socket.js";

/**
 * Generic credit deduction
 *
 * Supports:
 * Agency
 * MasterEmployer
 */
export const deductCredits = async ({
  refid,
  refModel,
  amount = 5,
}) => {
  if (!refid) {
    throw new Error("Reference ID is required");
  }

  if (!refModel) {
    throw new Error("Reference model is required");
  }

  let Model;

  // Decide which model should be used
  if (refModel === "Agency") {
    Model = Agency;
  } else if (refModel === "MasterEmployer") {
    Model = MasterEmployer;
  } else {
    throw new Error(`Unsupported reference model: ${refModel}`);
  }

  // Deduct credits atomically
  const account = await Model.findOneAndUpdate(
    {
      _id: refid,
      credits: {
        $gte: amount,
      },
    },
    {
      $inc: {
        credits: -amount,
      },
    },
    {
      new: true,
    },
  );

  // Account not found OR insufficient credits
  if (!account) {
    const checkAccount = await Model.findById(refid);

    if (!checkAccount) {
      throw new Error(`${refModel} not found`);
    }

    throw new Error("Insufficient credits");
  }

  // Socket update
  try {
    const io = getIO();

    console.log(
      `EMIT ${refModel} ROOM:`,
      account._id.toString(),
    );

    if (refModel === "Agency") {
      io.to(account._id.toString()).emit("agencyCreditUpdated", {
        credits: account.credits,
      });
    }

    if (refModel === "MasterEmployer") {
      io.to(account._id.toString()).emit("masterEmployerCreditUpdated", {
        credits: account.credits,
      });
    }
  } catch (error) {
    console.log("Socket Emit Error:", error.message);
  }

  return account;
};


/**
 * OLD Agency function
 *
 * Existing code will continue working.
 */
export const deductAgencyCredits = async (agencyId, amount = 5) => {
  return deductCredits({
    refid: agencyId,
    refModel: "Agency",
    amount,
  });
};


/**
 * MasterEmployer credit deduction
 */
export const deductMasterEmployerCredits = async (
  masterEmployerId,
  amount = 5,
) => {
  return deductCredits({
    refid: masterEmployerId,
    refModel: "MasterEmployer",
    amount,
  });
};
