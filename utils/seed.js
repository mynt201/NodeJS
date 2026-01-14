const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        console.log('🌱 Checking for existing admin user...');

        // Kiểm tra xem đã có admin chưa
        const existingAdmin = await User.findOne({ role: 'admin' });

        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            return;
        }

        console.log('📝 Creating default admin user...');

        // Tạo admin mặc định
        const adminData = {
            username: 'admin',
            email: 'admin@floodrisk.com',
            password: 'admin123', // Mật khẩu mặc định
            role: 'admin',
            fullName: 'System Administrator',
            phone: '+84-123-456-789',
            address: 'TP.HCM, Việt Nam',
            isActive: true
        };

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);

        const admin = new User({
            ...adminData,
            password: hashedPassword
        });

        await admin.save();

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@floodrisk.com');
        console.log('👤 Username: admin');
        console.log('🔑 Password: admin123');
        console.log('⚠️  Please change the default password after first login!');

    } catch (error) {
        console.error('❌ Error seeding admin user:', error.message);
        // Don't throw error to prevent server from crashing
        console.log('⚠️  Continuing without seeding admin user');
    }
};

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Chạy seeding cho admin
        await seedAdmin();

        console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        throw error;
    }
};

module.exports = {
    seedAdmin,
    seedDatabase
};