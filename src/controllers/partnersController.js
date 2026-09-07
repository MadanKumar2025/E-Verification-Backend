import Partner from "../models/partnersSchema.js";

// CREATE PARTNER
export const createPartner = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const partner = await Partner.create({
      image: req.file.path,
      isActive: isActive !== undefined ? isActive === "true" : true,
    });

    return res.status(201).json({
      success: true,
      message: "Partner created successfully",
      data: {
        id: partner._id,
        image: partner.image,
        isActive: partner.isActive,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create Partner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create partner",
    });
  }
};

// GET ALL PARTNERS
export const getPartners = async (req, res) => {
  try {
    const partnerList = await Partner.find().sort({
      createdAt: -1,
    });

    const data = partnerList.map((partner) => ({
      id: partner._id,
      image: partner.image || null,
      isActive: partner.isActive,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Partners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Partners",
    });
  }
};

// GET PARTNER BY ID
export const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: partner._id,
        image: partner.image || null,
        isActive: partner.isActive,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Partner By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Partner",
    });
  }
};

// UPDATE PARTNER ACTIVE STATUS
export const updatePartnerActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const activeStatus =
      typeof isActive === "string"
        ? isActive === "true"
        : isActive;

    if (typeof activeStatus !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const partner = await Partner.findByIdAndUpdate(
      id,
      {
        isActive: activeStatus,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Partner active status updated successfully",
      data: {
        id: partner._id,
        image: partner.image || null,
        isActive: partner.isActive,
        updatedAt: partner.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update Partner Active Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error updating Partner active status",
    });
  }
};

// UPDATE PARTNER
export const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Update image only if new image is uploaded
    if (req.file) {
      partner.image = req.file.path;
    }

    // Update active status if provided
    if (isActive !== undefined) {
      partner.isActive =
        typeof isActive === "string"
          ? isActive === "true"
          : isActive;
    }

    await partner.save();

    return res.status(200).json({
      success: true,
      message: "Partner updated successfully",
      data: {
        id: partner._id,
        image: partner.image || null,
        isActive: partner.isActive,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update Partner Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error updating Partner",
    });
  }
};


export const getPartnersWeb = async (req, res) => {
  try {
    const partnerList = await Partner.find().sort({
      createdAt: -1,
    });

    const data = partnerList.map((partner) => ({
      id: partner._id,
      image: partner.image || null,
      isActive: partner.isActive,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Partners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Partners",
    });
  }
};