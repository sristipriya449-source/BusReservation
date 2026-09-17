const Bus = require('../models/Bus');
const Route = require('../models/Route');

const escapeRegex = (str) => str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createBus = async (req, res) => {
  try {
    const { busName, busNumber, type, totalSeats, rating } = req.body;
    if (!busName || !busNumber || !type) {
      return res.status(400).json({ message: 'Please provide busName, busNumber, and type' });
    }
    const bus = await Bus.create({
      busName: busName.trim(),
      busNumber: busNumber.trim().toUpperCase(),
      type: type.trim(),
      totalSeats: Number(totalSeats) || 32,
      rating: rating ? Number(rating) : 4.5,
    });
    res.status(201).json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateBus = async (req, res) => {
  try {
    const { busName, busNumber, type, totalSeats, rating } = req.body;
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    if (busName) bus.busName = busName.trim();
    if (busNumber) bus.busNumber = busNumber.trim().toUpperCase();
    if (type) bus.type = type.trim();
    if (totalSeats) bus.totalSeats = Number(totalSeats);
    if (rating !== undefined) bus.rating = Number(rating);

    await bus.save();
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createRoute = async (req, res) => {
  try {
    const { bus, source, destination, departureTime, duration, fare } = req.body;
    if (!bus || !source || !destination || !departureTime || !duration || fare === undefined) {
      return res.status(400).json({ message: 'Please provide all route details' });
    }
    const route = await Route.create({
      bus,
      source: source.trim(),
      destination: destination.trim(),
      departureTime,
      duration: duration.trim(),
      fare: Number(fare),
    });
    const populated = await Route.findById(route._id).populate('bus');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate('bus').sort({ departureTime: 1 });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRoute = async (req, res) => {
  try {
    const { bus, source, destination, departureTime, duration, fare } = req.body;
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (bus) route.bus = bus;
    if (source) route.source = source.trim();
    if (destination) route.destination = destination.trim();
    if (departureTime) route.departureTime = departureTime;
    if (duration) route.duration = duration.trim();
    if (fare !== undefined && fare !== null) route.fare = Number(fare);

    await route.save();
    const updated = await Route.findById(route._id).populate('bus');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: 'Route deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const searchRoutes = async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    const query = {};
    if (source && source.trim()) {
      query.source = new RegExp(`^${escapeRegex(source)}$`, 'i');
    }
    if (destination && destination.trim()) {
      query.destination = new RegExp(`^${escapeRegex(destination)}$`, 'i');
    }
    if (date && date.trim()) {
      const parts = date.trim().split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const start = new Date(year, month, day, 0, 0, 0, 0);
        const end = new Date(year, month, day, 23, 59, 59, 999);
        const utcStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        const utcEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
        const minStart = new Date(Math.min(start.getTime(), utcStart.getTime()));
        const maxEnd = new Date(Math.max(end.getTime(), utcEnd.getTime()));
        query.departureTime = { $gte: minStart, $lte: maxEnd };
      }
    }
    const routes = await Route.find(query).populate('bus').sort({ departureTime: 1 });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPopularRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate('bus').limit(6).sort({ createdAt: -1 });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBus,
  getBuses,
  updateBus,
  deleteBus,
  createRoute,
  getAllRoutes,
  updateRoute,
  deleteRoute,
  searchRoutes,
  getPopularRoutes,
};
