const { z } = require("zod");
const { RoomType, Room, Reservation, AuditLog } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { quoteStay, calendarNights } = require("../lib/availability");
const { publish } = require("../sockets");
const { parseDay, dayKey } = require("../lib/dates");

const router = require("express").Router();
const desk = ["admin", "manager", "receptionist"];
const managers = ["admin", "manager"];

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const roomTypeSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  baseRate: z.number().positive(),
  maxAdults: z.number().int().positive(),
  maxChildren: z.number().int().min(0).default(0),
  bedType: z.string().trim().min(2),
  amenities: z.array(z.string()).optional(),
  image: z.string().optional(),
  gallery: z.array(z.string()).optional(),
});

const roomSchema = z.object({
  roomNumber: z.string().trim().min(1),
  roomTypeId: z.string().trim().min(1),
  floor: z.number().int().optional(),
  features: z.array(z.string()).optional(),
});

router.get("/room-types", async (req, res, next) => {
  try {
    const filter = req.query.all === "1" ? {} : { active: true };
    const types = await RoomType.find(filter).sort({ baseRate: 1 });
    res.json({
      roomTypes: types.map((type) => ({
        id: String(type._id),
        name: type.name,
        slug: type.slug,
        description: type.description,
        baseRate: type.baseRate / 100,
        maxAdults: type.maxAdults,
        maxChildren: type.maxChildren,
        bedType: type.bedType,
        amenities: type.amenities,
        image: type.image,
        gallery: type.gallery || [],
        active: type.active !== false,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/room-types", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const body = roomTypeSchema.parse(req.body);
    const slug = slugify(body.name);
    const exists = await RoomType.findOne({ slug });
    if (exists) {
      const error = new Error("A room type with this name already exists.");
      error.status = 409;
      throw error;
    }
    const type = await RoomType.create({
      ...body,
      slug,
      baseRate: Math.round(body.baseRate * 100),
      amenities: body.amenities || [],
      gallery: body.gallery || (body.image ? [body.image] : []),
      active: true,
    });
    await AuditLog.create({ actorUserId: req.user._id, action: "room_type.create", entityType: "roomType", entityId: String(type._id), after: { name: type.name } });
    res.status(201).json({ roomType: { id: type._id, name: type.name, slug: type.slug, baseRate: type.baseRate / 100 } });
  } catch (error) {
    next(error);
  }
});

router.patch("/room-types/:id", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const type = await RoomType.findById(req.params.id);
    if (!type) {
      const error = new Error("Room type not found.");
      error.status = 404;
      throw error;
    }
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2) {
        const error = new Error("Room type name is too short.");
        error.status = 400;
        throw error;
      }
      const slug = slugify(name);
      const clash = await RoomType.findOne({ slug, _id: { $ne: type._id } });
      if (clash) {
        const error = new Error("A room type with this name already exists.");
        error.status = 409;
        throw error;
      }
      type.name = name;
      type.slug = slug;
    }
    if (req.body.description !== undefined) type.description = req.body.description;
    if (req.body.baseRate !== undefined) type.baseRate = Math.round(Number(req.body.baseRate) * 100);
    if (req.body.maxAdults !== undefined) type.maxAdults = Number(req.body.maxAdults);
    if (req.body.maxChildren !== undefined) type.maxChildren = Number(req.body.maxChildren);
    if (req.body.bedType !== undefined) type.bedType = req.body.bedType;
    if (Array.isArray(req.body.amenities)) type.amenities = req.body.amenities;
    if (req.body.image !== undefined) type.image = req.body.image;
    if (Array.isArray(req.body.gallery)) type.gallery = req.body.gallery;
    if (req.body.active !== undefined) type.active = Boolean(req.body.active);
    await type.save();
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "room_type.update",
      entityType: "roomType",
      entityId: String(type._id),
      after: { name: type.name, active: type.active, baseRate: type.baseRate },
    });
    publish("room");
    res.json({
      roomType: {
        id: type._id,
        name: type.name,
        slug: type.slug,
        description: type.description,
        baseRate: type.baseRate / 100,
        maxAdults: type.maxAdults,
        maxChildren: type.maxChildren,
        bedType: type.bedType,
        amenities: type.amenities,
        image: type.image,
        gallery: type.gallery || [],
        active: type.active,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/rooms", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const body = roomSchema.parse(req.body);
    const type = await RoomType.findById(body.roomTypeId);
    if (!type) {
      const error = new Error("Room type not found.");
      error.status = 404;
      throw error;
    }
    const room = await Room.create({
      roomNumber: body.roomNumber,
      roomTypeId: type._id,
      floor: body.floor,
      features: body.features || [],
      status: "available",
    });
    await AuditLog.create({ actorUserId: req.user._id, action: "room.create", entityType: "room", entityId: String(room._id), after: { roomNumber: room.roomNumber } });
    res.status(201).json({ room: { id: room._id, roomNumber: room.roomNumber, floor: room.floor, status: room.status, roomType: type.name } });
  } catch (error) {
    if (error.code === 11000) {
      error.status = 409;
      error.message = "That room number is already in use.";
    }
    next(error);
  }
});

router.get("/rooms", requireAuth, requireRole(...desk, "housekeeping", "maintenance"), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.active === "false") filter.active = false;
    else if (req.query.all !== "1") filter.active = { $ne: false };
    const rooms = await Room.find(filter).populate("roomTypeId").sort({ roomNumber: 1 });
    res.json({
      rooms: rooms.map((room) => ({
        id: String(room._id),
        roomNumber: room.roomNumber,
        floor: room.floor,
        status: room.status,
        active: room.active !== false,
        roomType: room.roomTypeId?.name,
        roomTypeId: room.roomTypeId?._id ? String(room.roomTypeId._id) : "",
        features: room.features || [],
        maintenanceNote: room.maintenanceNote || "",
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/rooms/:id/status", requireAuth, requireRole(...desk, "housekeeping", "maintenance"), async (req, res, next) => {
  try {
    const allowed = ["available", "reserved", "occupied", "cleaning", "maintenance", "out_of_service"];
    if (!allowed.includes(req.body.status)) {
      const error = new Error("Unknown room status.");
      error.status = 400;
      throw error;
    }
    const room = await Room.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!room) {
      const error = new Error("Room not found.");
      error.status = 404;
      throw error;
    }
    publish("room");
    res.json({ room });
  } catch (error) {
    next(error);
  }
});

router.patch("/rooms/:id", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      const error = new Error("Room not found.");
      error.status = 404;
      throw error;
    }
    if (req.body.active === false || req.body.status === "out_of_service") {
      const inHouse = await Reservation.findOne({ roomId: room._id, status: "checked_in" });
      if (inHouse) {
        const error = new Error("Check the guest out before taking this room offline.");
        error.status = 400;
        throw error;
      }
    }
    if (req.body.roomNumber !== undefined) room.roomNumber = String(req.body.roomNumber).trim();
    if (req.body.roomTypeId !== undefined) {
      const type = await RoomType.findById(req.body.roomTypeId);
      if (!type) {
        const error = new Error("Room type not found.");
        error.status = 404;
        throw error;
      }
      room.roomTypeId = type._id;
    }
    if (req.body.floor !== undefined) room.floor = Number(req.body.floor);
    if (Array.isArray(req.body.features)) room.features = req.body.features;
    if (req.body.active !== undefined) room.active = Boolean(req.body.active);
    if (req.body.maintenanceNote !== undefined) room.maintenanceNote = req.body.maintenanceNote;
    if (req.body.status) room.status = req.body.status;
    if (req.body.active === false && !req.body.status) room.status = "out_of_service";
    await room.save();
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "room.update",
      entityType: "room",
      entityId: String(room._id),
      after: { roomNumber: room.roomNumber, active: room.active, status: room.status },
    });
    publish("room");
    const populated = await Room.findById(room._id).populate("roomTypeId");
    res.json({
      room: {
        id: populated._id,
        roomNumber: populated.roomNumber,
        floor: populated.floor,
        status: populated.status,
        active: populated.active !== false,
        roomType: populated.roomTypeId?.name,
        roomTypeId: populated.roomTypeId?._id,
        features: populated.features || [],
        maintenanceNote: populated.maintenanceNote || "",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      error.status = 409;
      error.message = "That room number is already in use.";
    }
    next(error);
  }
});

router.get("/availability", async (req, res, next) => {
  try {
    // Calendar: from + to → nightly { price, available } (reserved nights sold out).
    if (req.query.from && req.query.to) {
      const calendar = await calendarNights({
        roomType: req.query.roomType,
        from: req.query.from,
        to: req.query.to,
        ignoreReservationId: req.query.ignoreReservationId || undefined,
        roomId: req.query.roomId || undefined,
      });
      return res.json(calendar);
    }

    const checkIn = parseDay(req.query.checkIn);
    const checkOut = parseDay(req.query.checkOut);
    const quote = await quoteStay({
      roomType: req.query.roomType,
      checkIn,
      checkOut,
      adults: Number(req.query.adults || 1),
      children: Number(req.query.children || 0),
    });
    res.json({
      available: quote.openRooms.length > 0,
      openRooms: quote.openRooms.length,
      nights: quote.nights,
      nightlyRate: quote.nightlyRate / 100,
      taxes: quote.taxes / 100,
      total: quote.totalAmount / 100,
      checkIn: dayKey(checkIn),
      checkOut: dayKey(checkOut),
      roomType: quote.roomType.name,
      message: quote.openRooms.length
        ? `${quote.openRooms.length} ${quote.roomType.name} open for ${quote.nights} nights.`
        : `No ${quote.roomType.name} is free for those dates.`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
