const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const { Admin } = require('./models/User');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected to "event-management" database for seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Seed Admin User
const seedAdmin = async () => {
  try {
    // Delete existing admin user if exists
    await User.deleteOne({ email: 'admin@felicity.com' });
    console.log('Existing admin user deleted (if any)');

    // Create new Admin user using the Admin discriminator model
    // The password will be automatically hashed by the pre-save hook on baseUserSchema
    const admin = await Admin.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@felicity.com',
      password: 'admin123', // Will be hashed by pre-save hook
      accountStatus: 'active',
    });

    console.log('✅ Admin successfully seeded into "event-management" database!');
    console.log('=====================================');
    console.log('Admin Credentials:');
    console.log('  Email:    admin@felicity.com');
    console.log('  Password: admin123');
    console.log('  Role:     Admin');
    console.log('=====================================');
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

// Run the seed
const runSeed = async () => {
  await connectDB();
  await seedAdmin();
};

runSeed();
