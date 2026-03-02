const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({
      role: "SUPER_ADMIN",
    });

    if (existingAdmin) {
      console.log("✅ Super Admin already exists");
      return;
    }

    console.log("📝 Creating default Super Admin...");

    const plainPassword = "admin123";
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(plainPassword, salt);

    const admin = new User({
      username: "admin_thu_duc",
      email: "admin@floodrisk.com",
      password_hash,
      full_name: "System Administrator",
      role: "SUPER_ADMIN",
      ward_id: null,
      is_active: true,
    });

    await admin.save();

    console.log("✅ Super Admin created successfully!");
    console.log("📧 Email: admin@floodrisk.com");
    console.log("👤 Username: admin_thu_duc");
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change the default password after first login!");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
    // Don't throw error to prevent server from crashing
    console.log("⚠️  Continuing without seeding admin user");
  }
};

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Chạy seeding cho admin
    await seedAdmin();

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
};

module.exports = {
  seedAdmin,
  seedDatabase,
};
