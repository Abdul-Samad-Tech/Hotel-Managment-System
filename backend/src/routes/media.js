const multer = require("multer");
const { MediaAsset, AuditLog, RoomType } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadImageBuffer, cloudinaryConfigured } = require("../lib/cloudinary");

const router = require("express").Router();
const managers = ["admin", "manager"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function serialize(asset) {
  return {
    id: asset._id,
    key: asset.key,
    category: asset.category,
    url: asset.url,
    alt: asset.alt || "",
    label: asset.label || "",
    group: asset.group || "",
    tall: Boolean(asset.tall),
    sortOrder: asset.sortOrder || 0,
    active: asset.active !== false,
    storage: asset.storage || "url",
    roomTypeSlug: asset.roomTypeSlug || "",
  };
}

/** Public catalog of active site images (dining, experiences, gallery, hero, rooms). */
router.get("/content/media", async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.category) filter.category = String(req.query.category);
    const assets = await MediaAsset.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.json({
      media: assets.map(serialize),
      cloudinary: cloudinaryConfigured(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/media", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.all !== "1") filter.active = { $ne: false };
    const assets = await MediaAsset.find(filter).sort({ category: 1, sortOrder: 1, createdAt: 1 });
    res.json({ media: assets.map(serialize), cloudinary: cloudinaryConfigured() });
  } catch (error) {
    next(error);
  }
});

router.post("/media", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.url && !body.key) {
      const error = new Error("Provide an image URL (or upload a file).");
      error.status = 400;
      throw error;
    }
    const asset = await MediaAsset.create({
      key: body.key || `${body.category || "site"}-${Date.now()}`,
      category: body.category || "gallery",
      url: body.url,
      alt: body.alt || "",
      label: body.label || "",
      group: body.group || "",
      tall: Boolean(body.tall),
      sortOrder: Number(body.sortOrder) || 0,
      active: body.active !== false,
      storage: body.storage || "url",
      roomTypeSlug: body.roomTypeSlug || "",
      updatedBy: req.user._id,
    });
    if (asset.category === "rooms" && asset.roomTypeSlug && asset.url) {
      await RoomType.updateOne({ slug: asset.roomTypeSlug }, { $set: { image: asset.url } });
    }
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "media.create",
      entityType: "media",
      entityId: String(asset._id),
      after: { key: asset.key, category: asset.category },
    });
    res.status(201).json({ media: serialize(asset) });
  } catch (error) {
    next(error);
  }
});

router.post("/media/upload", requireAuth, requireRole(...managers), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      const error = new Error("Choose an image file to upload.");
      error.status = 400;
      throw error;
    }
    const uploaded = await uploadImageBuffer(req.file.buffer, {
      folder: `azure-bay/${req.body.category || "gallery"}`,
      filename: req.file.originalname,
    });
    const asset = await MediaAsset.create({
      key: req.body.key || `${req.body.category || "site"}-${Date.now()}`,
      category: req.body.category || "gallery",
      url: uploaded.url,
      publicId: uploaded.publicId,
      storage: uploaded.storage,
      alt: req.body.alt || "",
      label: req.body.label || req.file.originalname,
      group: req.body.group || "",
      tall: req.body.tall === "true" || req.body.tall === true,
      sortOrder: Number(req.body.sortOrder) || 0,
      active: true,
      roomTypeSlug: req.body.roomTypeSlug || "",
      updatedBy: req.user._id,
    });
    if (asset.category === "rooms" && asset.roomTypeSlug) {
      await RoomType.updateOne({ slug: asset.roomTypeSlug }, { $set: { image: asset.url } });
    }
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "media.upload",
      entityType: "media",
      entityId: String(asset._id),
      after: { key: asset.key, storage: asset.storage },
    });
    res.status(201).json({ media: serialize(asset) });
  } catch (error) {
    next(error);
  }
});

router.patch("/media/:id", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) {
      const error = new Error("Media asset not found.");
      error.status = 404;
      throw error;
    }
    ["url", "alt", "label", "group", "category", "key", "roomTypeSlug"].forEach((field) => {
      if (req.body[field] !== undefined) asset[field] = req.body[field];
    });
    if (req.body.tall !== undefined) asset.tall = Boolean(req.body.tall);
    if (req.body.sortOrder !== undefined) asset.sortOrder = Number(req.body.sortOrder);
    if (req.body.active !== undefined) asset.active = Boolean(req.body.active);
    asset.updatedBy = req.user._id;
    await asset.save();
    if (asset.category === "rooms" && asset.roomTypeSlug && asset.url) {
      await RoomType.updateOne({ slug: asset.roomTypeSlug }, { $set: { image: asset.url } });
    }
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "media.update",
      entityType: "media",
      entityId: String(asset._id),
      after: { active: asset.active, url: asset.url },
    });
    res.json({ media: serialize(asset) });
  } catch (error) {
    next(error);
  }
});

router.delete("/media/:id", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const asset = await MediaAsset.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!asset) {
      const error = new Error("Media asset not found.");
      error.status = 404;
      throw error;
    }
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "media.deactivate",
      entityType: "media",
      entityId: String(asset._id),
    });
    res.json({ media: serialize(asset) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
