require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Unit = require('../models/Unit');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const TreasuryTransaction = require('../models/TreasuryTransaction');
const VisitorPass = require('../models/VisitorPass');
const SocietyNotice = require('../models/SocietyNotice');

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    console.log('Clearing database...');
    // Drop all collections to clear stale indexes from prior runs
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
    }
    console.log('All collections dropped.');

    console.log('Seeding Users...');
    const defaultHash = await bcrypt.hash('password123', 10);

    const [admin, security, technician, priyaOwner, rahulTenant, anitaOwner, vikramTenant] = await User.insertMany([
      { name: 'Rajesh Sharma', email: 'admin@igloo.com', passwordHash: defaultHash, role: 'ADMIN', phone: '9876543210', isDemoUser: true },
      { name: 'Bahadur Singh', email: 'security@igloo.com', passwordHash: defaultHash, role: 'SECURITY', phone: '9876543212', isDemoUser: true },
      { name: 'Kumar', email: 'tech@igloo.com', passwordHash: defaultHash, role: 'TECHNICIAN', phone: '9876543213', isDemoUser: true },
      { name: 'Priya Patel', email: 'priya@igloo.com', passwordHash: defaultHash, role: 'RESIDENT', residentType: 'OWNER', unitNumber: 'A-101', phone: '9876543211', isDemoUser: true },
      { name: 'Rahul Sharma', email: 'rahul@igloo.com', passwordHash: defaultHash, role: 'RESIDENT', residentType: 'TENANT', unitNumber: 'A-102', phone: '9876543214', isDemoUser: true },
      { name: 'Anita Desai', email: 'anita@igloo.com', passwordHash: defaultHash, role: 'RESIDENT', residentType: 'OWNER', unitNumber: 'B-201', phone: '9876543215', isDemoUser: true },
      { name: 'Vikram Singh', email: 'vikram@igloo.com', passwordHash: defaultHash, role: 'RESIDENT', residentType: 'TENANT', unitNumber: 'B-202', phone: '9876543216', isDemoUser: true }
    ]);

    // For backwards compatibility in the script, map resident to Priya
    const resident = priyaOwner;

    console.log('Seeding Units...');
    const units = [
      { unitNumber: 'A-101', block: 'A', ownerName: 'Priya Patel', monthlyMaintenanceFee: 3500, currentDueStatus: 'PENDING' },
      { unitNumber: 'A-102', block: 'A', ownerName: 'Rahul Sharma (Tenant)', monthlyMaintenanceFee: 3500, currentDueStatus: 'PENDING' },
      { unitNumber: 'B-201', block: 'B', ownerName: 'Anita Desai', monthlyMaintenanceFee: 3500, currentDueStatus: 'PENDING' },
      { unitNumber: 'B-202', block: 'B', ownerName: 'Vikram Singh (Tenant)', monthlyMaintenanceFee: 3500, currentDueStatus: 'PENDING' }
    ];
    await Unit.insertMany(units);

    console.log('Seeding Maintenance Tickets...');
    await MaintenanceTicket.insertMany([
      { ticketId: 'TKT-1001', unitNumber: 'A-101', reportedBy: priyaOwner._id, title: 'Leaking tap in kitchen', description: 'Water is dripping constantly from the kitchen tap. The washer seems worn out.', category: 'PLUMBING', priority: 'MEDIUM', status: 'OPEN' },
      { ticketId: 'TKT-1002', unitNumber: 'A-102', reportedBy: rahulTenant._id, title: 'Sparking socket in hall', description: 'Main hall socket is sparking when appliances are plugged in. Possible short circuit.', category: 'ELECTRICAL', priority: 'HIGH', status: 'ASSIGNED', assignedTo: technician._id },
      { ticketId: 'TKT-1003', unitNumber: 'A-101', reportedBy: priyaOwner._id, title: 'AC not cooling', description: 'Living room AC is running but not cooling. May need gas refill.', category: 'APPLIANCE', priority: 'LOW', status: 'IN_PROGRESS', assignedTo: technician._id },
      { ticketId: 'TKT-1004', unitNumber: 'A-102', reportedBy: rahulTenant._id, title: 'Door hinge broken', description: 'Main entrance door hinge is loose and door is sagging.', category: 'CARPENTRY', priority: 'MEDIUM', status: 'RESOLVED', assignedTo: technician._id, resolvedAt: new Date() },
      { ticketId: 'TKT-1005', unitNumber: 'B-201', reportedBy: anitaOwner._id, title: 'Wall paint peeling', description: 'Balcony wall paint is peeling due to moisture seepage.', category: 'CIVIL', priority: 'LOW', status: 'CLOSED', assignedTo: technician._id, residentRating: 4, resolvedAt: new Date() },
      { ticketId: 'TKT-1006', unitNumber: 'COMMON', reportedBy: admin._id, title: 'Lobby light not working', description: 'Tower A ground floor lobby light has been off for 3 days.', category: 'COMMON_AREA', priority: 'MEDIUM', status: 'OPEN' }
    ]);

    console.log('Seeding Treasury Transactions...');
    await TreasuryTransaction.insertMany([
      { transactionType: 'INFLOW', category: 'MAINTENANCE_DUE', amount: 3500, description: 'Maintenance Fee - A-101', unitNumber: 'A-101', loggedBy: admin._id },
      { transactionType: 'INFLOW', category: 'MAINTENANCE_DUE', amount: 3500, description: 'Maintenance Fee - A-102', unitNumber: 'A-102', loggedBy: admin._id },
      { transactionType: 'INFLOW', category: 'MAINTENANCE_DUE', amount: 3500, description: 'Maintenance Fee - B-201', unitNumber: 'B-201', loggedBy: admin._id },
      { transactionType: 'INFLOW', category: 'CORPUS_FUND', amount: 50000, description: 'Builder corpus fund deposit for Silver Oak Heights', loggedBy: admin._id },
      { transactionType: 'OUTFLOW', category: 'SECURITY', amount: 15000, description: 'Monthly security agency salary', loggedBy: admin._id, vendorName: 'SecureCorp India' },
      { transactionType: 'OUTFLOW', category: 'WATER', amount: 14500, description: 'Emergency water tankers (3 loads) due to main motor breakdown', loggedBy: admin._id, vendorName: 'Cauvery Water Supply' },
      { transactionType: 'OUTFLOW', category: 'ELECTRICITY', amount: 12000, description: 'Common area electricity bill - August', loggedBy: admin._id },
      { transactionType: 'OUTFLOW', category: 'REPAIRS', amount: 8000, description: 'Elevator annual maintenance contract', loggedBy: admin._id, vendorName: 'Otis Elevators' },
      { transactionType: 'OUTFLOW', category: 'GARDENING', amount: 3000, description: 'Monthly garden maintenance and landscaping', loggedBy: admin._id, vendorName: 'Green Thumbs' },
      { transactionType: 'OUTFLOW', category: 'EVENTS', amount: 10000, description: 'Independence Day celebration expenses', loggedBy: admin._id }
    ]);

    console.log('Seeding Visitor Passes...');
    await VisitorPass.insertMany([
      { passCode: 'IG-7824', unitNumber: 'A-101', hostUserId: priyaOwner._id, visitorName: 'Ramesh (Plumber)', visitorPhone: '9988776655', purpose: 'SERVICE', status: 'PRE_APPROVED' },
      { passCode: 'IG-1122', unitNumber: 'A-102', hostUserId: rahulTenant._id, visitorName: 'Amazon Delivery', visitorPhone: '9988776644', purpose: 'DELIVERY', status: 'INSIDE', checkInTime: new Date(), verifiedByGuard: security._id },
      { passCode: 'IG-3344', unitNumber: 'B-201', hostUserId: anitaOwner._id, visitorName: 'Swiggy Delivery', visitorPhone: '9988776633', purpose: 'DELIVERY', status: 'COMPLETED', checkInTime: new Date(Date.now() - 3600000), checkOutTime: new Date(), verifiedByGuard: security._id },
      { passCode: 'IG-5566', unitNumber: 'B-202', hostUserId: vikramTenant._id, visitorName: 'Amit Verma Family', visitorPhone: '9988776622', purpose: 'GUEST', status: 'PRE_APPROVED' }
    ]);

    console.log('Seeding Society Notices...');
    await SocietyNotice.insertMany([
      { title: 'Annual General Meeting - Silver Oak Heights', content: 'Dear Residents,\n\nThe Annual General Meeting of Silver Oak Heights Housing Society will be held on Sunday, 15th September 2026 at 10:00 AM in the Community Hall.\n\nAgenda:\n1. Annual financial report presentation\n2. Maintenance fee revision discussion\n3. New security system proposal\n4. Garden renovation plan\n5. Open forum for resident concerns\n\nAll flat owners are requested to attend without fail. Proxy attendance forms are available at the security desk.\n\nRegards,\nRajesh Sharma\nPresident, Silver Oak Heights', category: 'GENERAL', createdBy: admin._id },
      { title: 'Water Tank Cleaning - Supply Disruption', content: 'Dear Residents,\n\nPlease note that the overhead water tank cleaning and maintenance is scheduled for Tuesday, 5th September 2026.\n\nWater supply will be affected from 10:00 AM to 4:00 PM.\n\nKindly store sufficient water for the day. Emergency water contact: Cauvery Water Supply - 9988001122.\n\nWe apologize for the inconvenience.\n\nRegards,\nSilver Oak Heights Management', category: 'MAINTENANCE', createdBy: admin._id }
    ]);

    console.log('');
    console.log('=== Database Seeding Complete ===');
    console.log('Society: Silver Oak Heights');
    console.log('Users: 4 demo personas');
    console.log('Units: 20 (Block A: 10, Block B: 10)');
    console.log('Maintenance Tickets: 6');
    console.log('Treasury Transactions: 10');
    console.log('Visitor Passes: 4 (Demo pass: IG-7824)');
    console.log('Society Notices: 2');
    console.log('================================');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

if (require.main === module) {
  seedDatabase().then(function() { process.exit(0); }).catch(function() { process.exit(1); });
}

module.exports = { seedDatabase };
