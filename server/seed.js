const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const User = require('./models/User');
const Booking = require('./models/Booking');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sarthi_bus_reservation';

const busesData = [
  {
    busName: 'CityLink Royal Club Class',
    busNumber: 'CL-KA-01-E-1001',
    type: 'Volvo Multi-axle',
    totalSeats: 40,
    rating: 4.9,
  },
  {
    busName: 'CityLink Garuda Plus Ultra',
    busNumber: 'CL-MH-02-B-2002',
    type: 'Volvo Multi-axle',
    totalSeats: 44,
    rating: 4.8,
  },
  {
    busName: 'CityLink DreamLine Luxury Sleeper',
    busNumber: 'CL-DL-03-A-3003',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.9,
  },
  {
    busName: 'CityLink Royal Rajputana Sleeper',
    busNumber: 'CL-RJ-14-S-4004',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.7,
  },
  {
    busName: 'CityLink Bengal Cruiser',
    busNumber: 'CL-WB-19-K-5005',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.6,
  },
  {
    busName: 'CityLink Deccan Flyer Express',
    busNumber: 'CL-TS-09-F-6006',
    type: 'Non-AC Seater',
    totalSeats: 36,
    rating: 4.4,
  },
  {
    busName: 'CityLink Himalayan Deluxe Liner',
    busNumber: 'CL-HP-01-H-7007',
    type: 'Non-AC Seater',
    totalSeats: 32,
    rating: 4.5,
  },
  {
    busName: 'CityLink Konkan Express Superfast',
    busNumber: 'CL-GA-07-K-8008',
    type: 'Volvo Multi-axle',
    totalSeats: 40,
    rating: 4.8,
  },
  {
    busName: 'CityLink Coastal Queen Cruiser',
    busNumber: 'CL-KL-07-C-9009',
    type: 'AC Seater',
    totalSeats: 36,
    rating: 4.7,
  },
  {
    busName: 'CityLink Southern Star Multi-Axle',
    busNumber: 'CL-TN-01-S-1010',
    type: 'AC Seater',
    totalSeats: 36,
    rating: 4.6,
  },
  {
    busName: 'CityLink Western Breeze Luxury',
    busNumber: 'CL-GJ-01-W-1111',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.8,
  },
  {
    busName: 'CityLink Metro Shuttle Express',
    busNumber: 'CL-UP-32-M-1212',
    type: 'AC Seater',
    totalSeats: 36,
    rating: 4.5,
  },
  {
    busName: 'CityLink BharatBenz Grand Sleeper',
    busNumber: 'CL-MH-12-BB-1313',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.9,
  },
  {
    busName: 'CityLink Scania Intercity Multi-Axle',
    busNumber: 'CL-KA-05-SC-1414',
    type: 'Volvo Multi-axle',
    totalSeats: 44,
    rating: 4.9,
  },
  {
    busName: 'CityLink GreenLine Electric Shuttle',
    busNumber: 'CL-DL-01-EV-1515',
    type: 'AC Seater',
    totalSeats: 36,
    rating: 4.8,
  },
  {
    busName: 'CityLink Maratha Falcon Express',
    busNumber: 'CL-MH-14-MF-1616',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.7,
  },
  {
    busName: 'CityLink Golden Temple Superliner',
    busNumber: 'CL-PB-02-GT-1717',
    type: 'Volvo Multi-axle',
    totalSeats: 40,
    rating: 4.8,
  },
  {
    busName: 'CityLink Coromandel Coastliner',
    busNumber: 'CL-TN-09-CC-1818',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.7,
  },
  {
    busName: 'CityLink Kalinga Pride Express',
    busNumber: 'CL-OD-02-KP-1919',
    type: 'AC Seater',
    totalSeats: 36,
    rating: 4.6,
  },
  {
    busName: 'CityLink Northeast Highway Liner',
    busNumber: 'CL-AS-01-NE-2020',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.6,
  },
  {
    busName: 'CityLink Ganga Yamuna Express',
    busNumber: 'CL-UP-78-GY-2121',
    type: 'Non-AC Seater',
    totalSeats: 36,
    rating: 4.3,
  },
  {
    busName: 'CityLink Pink City Starline',
    busNumber: 'CL-RJ-45-PC-2222',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.8,
  },
  {
    busName: 'CityLink Nilgiri Hills Panorama',
    busNumber: 'CL-TN-43-NH-2323',
    type: 'AC Seater',
    totalSeats: 32,
    rating: 4.7,
  },
  {
    busName: 'CityLink Malabar Coastliner Sleeper',
    busNumber: 'CL-KL-11-MC-2424',
    type: 'AC Sleeper',
    totalSeats: 32,
    rating: 4.8,
  },
];

// Helper to generate dates relative to current execution time
const getDateWithOffset = (daysOffset, hours, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// Route template definitions across major Indian tourist, business & interstate corridors
const routeTemplates = [
  // 1. Kolkata <-> Digha
  {
    source: 'Kolkata',
    destination: 'Digha',
    duration: '4h 15m',
    fare: 380,
    busIdx: 4, // Bengal Cruiser
    times: [
      { hours: 6, minutes: 30 },
      { hours: 10, minutes: 0 },
      { hours: 14, minutes: 15 },
      { hours: 22, minutes: 30 },
    ],
  },
  {
    source: 'Digha',
    destination: 'Kolkata',
    duration: '4h 15m',
    fare: 380,
    busIdx: 4,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 13, minutes: 0 },
      { hours: 17, minutes: 30 },
      { hours: 21, minutes: 45 },
    ],
  },

  // 2. Kolkata <-> Siliguri (Darjeeling Gateway)
  {
    source: 'Kolkata',
    destination: 'Siliguri',
    duration: '11h 30m',
    fare: 1150,
    busIdx: 19, // Northeast Highway Liner
    times: [
      { hours: 18, minutes: 30 },
      { hours: 20, minutes: 0 },
      { hours: 21, minutes: 30 },
    ],
  },
  {
    source: 'Siliguri',
    destination: 'Kolkata',
    duration: '11h 30m',
    fare: 1150,
    busIdx: 19,
    times: [
      { hours: 18, minutes: 0 },
      { hours: 19, minutes: 30 },
      { hours: 21, minutes: 0 },
    ],
  },

  // 3. Kolkata <-> Puri
  {
    source: 'Kolkata',
    destination: 'Puri',
    duration: '9h 45m',
    fare: 890,
    busIdx: 18, // Kalinga Pride Express
    times: [
      { hours: 20, minutes: 0 },
      { hours: 21, minutes: 45 },
    ],
  },
  {
    source: 'Puri',
    destination: 'Kolkata',
    duration: '9h 45m',
    fare: 890,
    busIdx: 18,
    times: [
      { hours: 19, minutes: 30 },
      { hours: 21, minutes: 15 },
    ],
  },

  // 4. Kolkata <-> Ranchi
  {
    source: 'Kolkata',
    destination: 'Ranchi',
    duration: '8h 15m',
    fare: 750,
    busIdx: 4,
    times: [
      { hours: 8, minutes: 0 },
      { hours: 21, minutes: 0 },
    ],
  },
  {
    source: 'Ranchi',
    destination: 'Kolkata',
    duration: '8h 15m',
    fare: 750,
    busIdx: 4,
    times: [
      { hours: 8, minutes: 30 },
      { hours: 21, minutes: 30 },
    ],
  },

  // 5. Delhi <-> Manali
  {
    source: 'Delhi',
    destination: 'Manali',
    duration: '12h 30m',
    fare: 1350,
    busIdx: 2, // DreamLine Luxury Sleeper
    times: [
      { hours: 17, minutes: 30 },
      { hours: 19, minutes: 0 },
      { hours: 21, minutes: 15 },
    ],
  },
  {
    source: 'Manali',
    destination: 'Delhi',
    duration: '13h 00m',
    fare: 1350,
    busIdx: 6, // Himalayan Deluxe Liner
    times: [
      { hours: 16, minutes: 30 },
      { hours: 18, minutes: 0 },
      { hours: 20, minutes: 0 },
    ],
  },

  // 6. Delhi <-> Shimla
  {
    source: 'Delhi',
    destination: 'Shimla',
    duration: '8h 00m',
    fare: 850,
    busIdx: 6,
    times: [
      { hours: 6, minutes: 0 },
      { hours: 21, minutes: 0 },
      { hours: 22, minutes: 30 },
    ],
  },
  {
    source: 'Shimla',
    destination: 'Delhi',
    duration: '8h 00m',
    fare: 850,
    busIdx: 6,
    times: [
      { hours: 8, minutes: 30 },
      { hours: 20, minutes: 30 },
      { hours: 22, minutes: 0 },
    ],
  },

  // 7. Delhi <-> Jaipur
  {
    source: 'Delhi',
    destination: 'Jaipur',
    duration: '5h 15m',
    fare: 620,
    busIdx: 0, // Royal Club Class
    times: [
      { hours: 6, minutes: 0 },
      { hours: 9, minutes: 30 },
      { hours: 14, minutes: 0 },
      { hours: 18, minutes: 30 },
      { hours: 23, minutes: 0 },
    ],
  },
  {
    source: 'Jaipur',
    destination: 'Delhi',
    duration: '5h 15m',
    fare: 620,
    busIdx: 0,
    times: [
      { hours: 6, minutes: 30 },
      { hours: 11, minutes: 0 },
      { hours: 15, minutes: 30 },
      { hours: 19, minutes: 0 },
      { hours: 23, minutes: 30 },
    ],
  },

  // 8. Delhi <-> Dehradun
  {
    source: 'Delhi',
    destination: 'Dehradun',
    duration: '5h 30m',
    fare: 680,
    busIdx: 2,
    times: [
      { hours: 6, minutes: 30 },
      { hours: 13, minutes: 0 },
      { hours: 22, minutes: 0 },
    ],
  },
  {
    source: 'Dehradun',
    destination: 'Delhi',
    duration: '5h 30m',
    fare: 680,
    busIdx: 2,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 14, minutes: 30 },
      { hours: 21, minutes: 45 },
    ],
  },

  // 9. Delhi <-> Chandigarh
  {
    source: 'Delhi',
    destination: 'Chandigarh',
    duration: '4h 30m',
    fare: 520,
    busIdx: 14, // GreenLine Electric Shuttle
    times: [
      { hours: 6, minutes: 0 },
      { hours: 10, minutes: 30 },
      { hours: 15, minutes: 0 },
      { hours: 19, minutes: 30 },
    ],
  },
  {
    source: 'Chandigarh',
    destination: 'Delhi',
    duration: '4h 30m',
    fare: 520,
    busIdx: 14,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 12, minutes: 0 },
      { hours: 16, minutes: 30 },
      { hours: 20, minutes: 45 },
    ],
  },

  // 10. Delhi <-> Lucknow
  {
    source: 'Delhi',
    destination: 'Lucknow',
    duration: '7h 30m',
    fare: 920,
    busIdx: 11, // Metro Shuttle Express
    times: [
      { hours: 7, minutes: 30 },
      { hours: 21, minutes: 0 },
      { hours: 22, minutes: 30 },
    ],
  },
  {
    source: 'Lucknow',
    destination: 'Delhi',
    duration: '7h 30m',
    fare: 920,
    busIdx: 11,
    times: [
      { hours: 8, minutes: 0 },
      { hours: 20, minutes: 30 },
      { hours: 22, minutes: 0 },
    ],
  },

  // 11. Mumbai <-> Pune
  {
    source: 'Mumbai',
    destination: 'Pune',
    duration: '3h 30m',
    fare: 450,
    busIdx: 1, // Garuda Plus Ultra
    times: [
      { hours: 6, minutes: 0 },
      { hours: 8, minutes: 30 },
      { hours: 12, minutes: 0 },
      { hours: 15, minutes: 30 },
      { hours: 18, minutes: 0 },
      { hours: 21, minutes: 30 },
    ],
  },
  {
    source: 'Pune',
    destination: 'Mumbai',
    duration: '3h 30m',
    fare: 450,
    busIdx: 1,
    times: [
      { hours: 6, minutes: 30 },
      { hours: 9, minutes: 0 },
      { hours: 13, minutes: 0 },
      { hours: 16, minutes: 30 },
      { hours: 19, minutes: 0 },
      { hours: 22, minutes: 0 },
    ],
  },

  // 12. Mumbai <-> Goa
  {
    source: 'Mumbai',
    destination: 'Goa',
    duration: '11h 45m',
    fare: 1550,
    busIdx: 7, // Konkan Express Superfast
    times: [
      { hours: 17, minutes: 30 },
      { hours: 19, minutes: 0 },
      { hours: 21, minutes: 0 },
    ],
  },
  {
    source: 'Goa',
    destination: 'Mumbai',
    duration: '11h 45m',
    fare: 1550,
    busIdx: 7,
    times: [
      { hours: 17, minutes: 0 },
      { hours: 18, minutes: 45 },
      { hours: 20, minutes: 30 },
    ],
  },

  // 13. Mumbai <-> Ahmedabad
  {
    source: 'Mumbai',
    destination: 'Ahmedabad',
    duration: '8h 30m',
    fare: 980,
    busIdx: 10, // Western Breeze
    times: [
      { hours: 8, minutes: 0 },
      { hours: 20, minutes: 30 },
      { hours: 22, minutes: 15 },
    ],
  },
  {
    source: 'Ahmedabad',
    destination: 'Mumbai',
    duration: '8h 30m',
    fare: 980,
    busIdx: 10,
    times: [
      { hours: 7, minutes: 30 },
      { hours: 21, minutes: 0 },
      { hours: 22, minutes: 30 },
    ],
  },

  // 14. Mumbai <-> Surat
  {
    source: 'Mumbai',
    destination: 'Surat',
    duration: '5h 15m',
    fare: 560,
    busIdx: 10,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 14, minutes: 0 },
      { hours: 19, minutes: 30 },
    ],
  },
  {
    source: 'Surat',
    destination: 'Mumbai',
    duration: '5h 15m',
    fare: 560,
    busIdx: 10,
    times: [
      { hours: 6, minutes: 45 },
      { hours: 13, minutes: 30 },
      { hours: 18, minutes: 15 },
    ],
  },

  // 15. Mumbai <-> Nashik
  {
    source: 'Mumbai',
    destination: 'Nashik',
    duration: '4h 00m',
    fare: 420,
    busIdx: 15, // Maratha Falcon
    times: [
      { hours: 6, minutes: 30 },
      { hours: 11, minutes: 0 },
      { hours: 17, minutes: 0 },
    ],
  },
  {
    source: 'Nashik',
    destination: 'Mumbai',
    duration: '4h 00m',
    fare: 420,
    busIdx: 15,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 13, minutes: 0 },
      { hours: 18, minutes: 30 },
    ],
  },

  // 16. Bangalore <-> Hyderabad
  {
    source: 'Bangalore',
    destination: 'Hyderabad',
    duration: '9h 15m',
    fare: 1150,
    busIdx: 0, // Royal Club Class
    times: [
      { hours: 8, minutes: 0 },
      { hours: 20, minutes: 30 },
      { hours: 22, minutes: 0 },
      { hours: 23, minutes: 15 },
    ],
  },
  {
    source: 'Hyderabad',
    destination: 'Bangalore',
    duration: '9h 15m',
    fare: 1150,
    busIdx: 5, // Deccan Flyer
    times: [
      { hours: 8, minutes: 30 },
      { hours: 20, minutes: 0 },
      { hours: 21, minutes: 45 },
      { hours: 23, minutes: 0 },
    ],
  },

  // 17. Bangalore <-> Chennai
  {
    source: 'Bangalore',
    destination: 'Chennai',
    duration: '6h 00m',
    fare: 680,
    busIdx: 9, // Southern Star
    times: [
      { hours: 6, minutes: 0 },
      { hours: 10, minutes: 30 },
      { hours: 15, minutes: 0 },
      { hours: 22, minutes: 0 },
      { hours: 23, minutes: 30 },
    ],
  },
  {
    source: 'Chennai',
    destination: 'Bangalore',
    duration: '6h 00m',
    fare: 680,
    busIdx: 9,
    times: [
      { hours: 6, minutes: 30 },
      { hours: 11, minutes: 0 },
      { hours: 16, minutes: 0 },
      { hours: 21, minutes: 45 },
      { hours: 23, minutes: 15 },
    ],
  },

  // 18. Bangalore <-> Goa
  {
    source: 'Bangalore',
    destination: 'Goa',
    duration: '11h 30m',
    fare: 1420,
    busIdx: 13, // Scania Intercity
    times: [
      { hours: 18, minutes: 30 },
      { hours: 20, minutes: 45 },
      { hours: 22, minutes: 0 },
    ],
  },
  {
    source: 'Goa',
    destination: 'Bangalore',
    duration: '11h 30m',
    fare: 1420,
    busIdx: 13,
    times: [
      { hours: 18, minutes: 0 },
      { hours: 20, minutes: 15 },
      { hours: 21, minutes: 30 },
    ],
  },

  // 19. Bangalore <-> Kochi
  {
    source: 'Bangalore',
    destination: 'Kochi',
    duration: '10h 30m',
    fare: 1450,
    busIdx: 8, // Coastal Queen
    times: [
      { hours: 19, minutes: 30 },
      { hours: 21, minutes: 0 },
      { hours: 22, minutes: 30 },
    ],
  },
  {
    source: 'Kochi',
    destination: 'Bangalore',
    duration: '10h 30m',
    fare: 1450,
    busIdx: 23, // Malabar Coastliner
    times: [
      { hours: 19, minutes: 0 },
      { hours: 20, minutes: 30 },
      { hours: 22, minutes: 0 },
    ],
  },

  // 20. Bangalore <-> Coimbatore
  {
    source: 'Bangalore',
    destination: 'Coimbatore',
    duration: '6h 30m',
    fare: 720,
    busIdx: 8,
    times: [
      { hours: 7, minutes: 30 },
      { hours: 14, minutes: 0 },
      { hours: 22, minutes: 15 },
    ],
  },
  {
    source: 'Coimbatore',
    destination: 'Bangalore',
    duration: '6h 30m',
    fare: 720,
    busIdx: 8,
    times: [
      { hours: 8, minutes: 0 },
      { hours: 15, minutes: 0 },
      { hours: 22, minutes: 45 },
    ],
  },

  // 21. Bangalore <-> Mysore
  {
    source: 'Bangalore',
    destination: 'Mysore',
    duration: '2h 45m',
    fare: 320,
    busIdx: 14, // Electric
    times: [
      { hours: 6, minutes: 30 },
      { hours: 9, minutes: 0 },
      { hours: 13, minutes: 30 },
      { hours: 17, minutes: 0 },
      { hours: 20, minutes: 30 },
    ],
  },
  {
    source: 'Mysore',
    destination: 'Bangalore',
    duration: '2h 45m',
    fare: 320,
    busIdx: 14,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 10, minutes: 0 },
      { hours: 14, minutes: 30 },
      { hours: 18, minutes: 0 },
      { hours: 21, minutes: 0 },
    ],
  },

  // 22. Chennai <-> Pondicherry
  {
    source: 'Chennai',
    destination: 'Pondicherry',
    duration: '3h 45m',
    fare: 390,
    busIdx: 17, // Coromandel Coastliner
    times: [
      { hours: 6, minutes: 45 },
      { hours: 11, minutes: 15 },
      { hours: 16, minutes: 30 },
      { hours: 19, minutes: 0 },
    ],
  },
  {
    source: 'Pondicherry',
    destination: 'Chennai',
    duration: '3h 45m',
    fare: 390,
    busIdx: 17,
    times: [
      { hours: 7, minutes: 15 },
      { hours: 12, minutes: 0 },
      { hours: 17, minutes: 15 },
      { hours: 20, minutes: 0 },
    ],
  },

  // 23. Jaipur <-> Udaipur
  {
    source: 'Jaipur',
    destination: 'Udaipur',
    duration: '7h 20m',
    fare: 750,
    busIdx: 3, // Royal Rajputana
    times: [
      { hours: 9, minutes: 30 },
      { hours: 21, minutes: 0 },
      { hours: 22, minutes: 30 },
    ],
  },
  {
    source: 'Udaipur',
    destination: 'Jaipur',
    duration: '7h 20m',
    fare: 750,
    busIdx: 3,
    times: [
      { hours: 10, minutes: 0 },
      { hours: 21, minutes: 30 },
      { hours: 23, minutes: 0 },
    ],
  },

  // 24. Ahmedabad <-> Surat
  {
    source: 'Ahmedabad',
    destination: 'Surat',
    duration: '4h 50m',
    fare: 420,
    busIdx: 10,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 12, minutes: 30 },
      { hours: 17, minutes: 45 },
      { hours: 22, minutes: 0 },
    ],
  },
  {
    source: 'Surat',
    destination: 'Ahmedabad',
    duration: '4h 50m',
    fare: 420,
    busIdx: 10,
    times: [
      { hours: 7, minutes: 30 },
      { hours: 13, minutes: 0 },
      { hours: 18, minutes: 15 },
      { hours: 22, minutes: 30 },
    ],
  },

  // 25. Ahmedabad <-> Vadodara
  {
    source: 'Ahmedabad',
    destination: 'Vadodara',
    duration: '2h 15m',
    fare: 260,
    busIdx: 14,
    times: [
      { hours: 6, minutes: 30 },
      { hours: 11, minutes: 0 },
      { hours: 16, minutes: 0 },
      { hours: 20, minutes: 30 },
    ],
  },
  {
    source: 'Vadodara',
    destination: 'Ahmedabad',
    duration: '2h 15m',
    fare: 260,
    busIdx: 14,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 12, minutes: 0 },
      { hours: 17, minutes: 30 },
      { hours: 21, minutes: 0 },
    ],
  },

  // 26. Lucknow <-> Varanasi
  {
    source: 'Lucknow',
    destination: 'Varanasi',
    duration: '5h 40m',
    fare: 580,
    busIdx: 11,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 13, minutes: 30 },
      { hours: 20, minutes: 0 },
    ],
  },
  {
    source: 'Varanasi',
    destination: 'Lucknow',
    duration: '5h 40m',
    fare: 580,
    busIdx: 11,
    times: [
      { hours: 7, minutes: 30 },
      { hours: 14, minutes: 0 },
      { hours: 20, minutes: 30 },
    ],
  },

  // 27. Indore <-> Bhopal
  {
    source: 'Indore',
    destination: 'Bhopal',
    duration: '3h 40m',
    fare: 350,
    busIdx: 11,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 12, minutes: 30 },
      { hours: 17, minutes: 30 },
    ],
  },
  {
    source: 'Bhopal',
    destination: 'Indore',
    duration: '3h 40m',
    fare: 350,
    busIdx: 11,
    times: [
      { hours: 7, minutes: 30 },
      { hours: 13, minutes: 0 },
      { hours: 18, minutes: 0 },
    ],
  },

  // 28. Patna <-> Ranchi
  {
    source: 'Patna',
    destination: 'Ranchi',
    duration: '7h 15m',
    fare: 620,
    busIdx: 4,
    times: [
      { hours: 8, minutes: 0 },
      { hours: 21, minutes: 0 },
    ],
  },
  {
    source: 'Ranchi',
    destination: 'Patna',
    duration: '7h 15m',
    fare: 620,
    busIdx: 4,
    times: [
      { hours: 8, minutes: 30 },
      { hours: 21, minutes: 30 },
    ],
  },

  // 29. Pune <-> Nagpur
  {
    source: 'Pune',
    destination: 'Nagpur',
    duration: '12h 00m',
    fare: 1250,
    busIdx: 12, // BharatBenz
    times: [
      { hours: 17, minutes: 30 },
      { hours: 19, minutes: 45 },
    ],
  },
  {
    source: 'Nagpur',
    destination: 'Pune',
    duration: '12h 00m',
    fare: 1250,
    busIdx: 12,
    times: [
      { hours: 17, minutes: 0 },
      { hours: 19, minutes: 15 },
    ],
  },

  // 30. Bhubaneswar <-> Puri
  {
    source: 'Bhubaneswar',
    destination: 'Puri',
    duration: '1h 45m',
    fare: 220,
    busIdx: 18,
    times: [
      { hours: 7, minutes: 30 },
      { hours: 11, minutes: 0 },
      { hours: 15, minutes: 30 },
      { hours: 19, minutes: 0 },
    ],
  },
  {
    source: 'Puri',
    destination: 'Bhubaneswar',
    duration: '1h 45m',
    fare: 220,
    busIdx: 18,
    times: [
      { hours: 8, minutes: 30 },
      { hours: 12, minutes: 30 },
      { hours: 16, minutes: 45 },
      { hours: 20, minutes: 15 },
    ],
  },

  // 31. Hyderabad <-> Vijayawada
  {
    source: 'Hyderabad',
    destination: 'Vijayawada',
    duration: '5h 10m',
    fare: 540,
    busIdx: 5,
    times: [
      { hours: 6, minutes: 30 },
      { hours: 13, minutes: 0 },
      { hours: 21, minutes: 30 },
    ],
  },
  {
    source: 'Vijayawada',
    destination: 'Hyderabad',
    duration: '5h 10m',
    fare: 540,
    busIdx: 5,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 14, minutes: 0 },
      { hours: 22, minutes: 0 },
    ],
  },

  // 32. Hyderabad <-> Visakhapatnam
  {
    source: 'Hyderabad',
    destination: 'Visakhapatnam',
    duration: '11h 30m',
    fare: 1320,
    busIdx: 0,
    times: [
      { hours: 18, minutes: 0 },
      { hours: 20, minutes: 30 },
    ],
  },
  {
    source: 'Visakhapatnam',
    destination: 'Hyderabad',
    duration: '11h 30m',
    fare: 1320,
    busIdx: 0,
    times: [
      { hours: 18, minutes: 30 },
      { hours: 21, minutes: 0 },
    ],
  },

  // 33. Chandigarh <-> Shimla
  {
    source: 'Chandigarh',
    destination: 'Shimla',
    duration: '3h 50m',
    fare: 480,
    busIdx: 6,
    times: [
      { hours: 7, minutes: 0 },
      { hours: 11, minutes: 30 },
      { hours: 16, minutes: 0 },
    ],
  },
  {
    source: 'Shimla',
    destination: 'Chandigarh',
    duration: '3h 50m',
    fare: 480,
    busIdx: 6,
    times: [
      { hours: 8, minutes: 0 },
      { hours: 13, minutes: 0 },
      { hours: 17, minutes: 30 },
    ],
  },

  // 34. Guwahati <-> Shillong
  {
    source: 'Guwahati',
    destination: 'Shillong',
    duration: '3h 15m',
    fare: 360,
    busIdx: 19,
    times: [
      { hours: 7, minutes: 30 },
      { hours: 11, minutes: 0 },
      { hours: 15, minutes: 0 },
    ],
  },
  {
    source: 'Shillong',
    destination: 'Guwahati',
    duration: '3h 15m',
    fare: 360,
    busIdx: 19,
    times: [
      { hours: 8, minutes: 0 },
      { hours: 12, minutes: 0 },
      { hours: 16, minutes: 0 },
    ],
  },

  // 35. Raipur <-> Nagpur
  {
    source: 'Raipur',
    destination: 'Nagpur',
    duration: '5h 45m',
    fare: 610,
    busIdx: 12,
    times: [
      { hours: 8, minutes: 0 },
      { hours: 16, minutes: 30 },
      { hours: 22, minutes: 0 },
    ],
  },
  {
    source: 'Nagpur',
    destination: 'Raipur',
    duration: '5h 45m',
    fare: 610,
    busIdx: 12,
    times: [
      { hours: 7, minutes: 30 },
      { hours: 15, minutes: 0 },
      { hours: 21, minutes: 30 },
    ],
  },
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    console.log('Cleaning existing bookings, routes, and buses...');
    await Booking.deleteMany({});
    await Route.deleteMany({});
    await Bus.deleteMany({});

    console.log(`Inserting ${busesData.length} premium fleet buses...`);
    const createdBuses = await Bus.insertMany(busesData);
    console.log(`✓ Inserted ${createdBuses.length} buses successfully.`);

    // Generate multi-day departures spanning today (Day 0) to Day 28 (4 full weeks)
    const routesToInsert = [];
    const DAYS_TO_SEED = 28;

    for (const tmpl of routeTemplates) {
      const busId = createdBuses[tmpl.busIdx % createdBuses.length]._id;

      for (let dayOffset = 0; dayOffset <= DAYS_TO_SEED; dayOffset++) {
        for (const time of tmpl.times) {
          routesToInsert.push({
            bus: busId,
            source: tmpl.source,
            destination: tmpl.destination,
            departureTime: getDateWithOffset(dayOffset, time.hours, time.minutes),
            duration: tmpl.duration,
            fare: tmpl.fare,
          });
        }
      }
    }

    console.log(`Generating & inserting ${routesToInsert.length} route schedules across ${DAYS_TO_SEED + 1} days...`);
    const createdRoutes = await Route.insertMany(routesToInsert);
    console.log(`✓ Successfully seeded ${createdRoutes.length} scheduled routes into the database!`);

    // Ensure default demo accounts exist
    let adminUser = await User.findOne({ email: 'admin@citylink.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'CityLink Administrator',
        email: 'admin@citylink.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✓ Created Demo Admin user: admin@citylink.com (password: admin123)');
    } else {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('✓ Verified Demo Admin user: admin@citylink.com');
    }

    let demoUser = await User.findOne({ email: 'user@citylink.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Passenger',
        email: 'user@citylink.com',
        password: 'user123',
        role: 'user',
      });
      console.log('✓ Created Demo Passenger: user@citylink.com (password: user123)');
    }

    // Seed a few demo bookings so seat maps show realistic occupancy
    const sampleRoute = createdRoutes[0];
    if (sampleRoute && demoUser) {
      await Booking.create({
        user: demoUser._id,
        route: sampleRoute._id,
        seats: [1, 2],
        passengerName: 'Demo Passenger',
        passengerPhone: '9876543210',
        totalFare: sampleRoute.fare * 2,
        isCouple: true,
        passengers: [
          { name: 'Demo Passenger', gender: 'male' },
          { name: 'Co-Passenger', gender: 'female' },
        ],
        status: 'confirmed',
      });
      console.log('✓ Created sample demo booking with couple seats locked.');
    }

    console.log('\n=========================================================');
    console.log(`  🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!`);
    console.log('=========================================================');
    console.log(`  • Buses in Fleet:     ${createdBuses.length}`);
    console.log(`  • City Pairs:         ${routeTemplates.length}`);
    console.log(`  • Total Active Trips: ${createdRoutes.length} (Next 4 Weeks)`);
    console.log(`  • Admin Login:        admin@citylink.com / admin123`);
    console.log(`  • Demo User Login:    user@citylink.com  / user123`);
    console.log('=========================================================\n');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedDatabase();
