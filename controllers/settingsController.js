const Settings = require('../models/Settings');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne({ user_id: req.user._id });

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.createDefaultSettings(req.user._id);
        }

        res.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving settings'
        });
    }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Validate risk thresholds
        if (updateData.riskThresholds) {
            const thresholds = updateData.riskThresholds;
            const validOrder = thresholds.veryLow < thresholds.low &&
                thresholds.low < thresholds.medium &&
                thresholds.medium < thresholds.high &&
                thresholds.high < thresholds.veryHigh;

            if (!validOrder) {
                return res.status(400).json({
                    success: false,
                    error: 'Risk thresholds must be in ascending order'
                });
            }
        }

        let settings = await Settings.findOne({ user_id: req.user._id });

        if (settings) {
            settings = await Settings.findOneAndUpdate({ user_id: req.user._id },
                updateData, { new: true, runValidators: true }
            );
        } else {
            settings = await Settings.create({
                user_id: req.user._id,
                ...updateData
            });
        }

        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Update settings error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error updating settings'
        });
    }
};

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private
const resetSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne({ user_id: req.user._id });

        if (settings) {
            await settings.resetToDefaults();
            settings = await Settings.findOne({ user_id: req.user._id });
        } else {
            settings = await Settings.createDefaultSettings(req.user._id);
        }

        res.json({
            success: true,
            message: 'Settings reset to defaults',
            settings
        });
    } catch (error) {
        console.error('Reset settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error resetting settings'
        });
    }
};

// @desc    Update notification settings
// @route   PUT /api/settings/notifications
// @access  Private
const updateNotifications = async (req, res) => {
    try {
        const { type, settings: notificationSettings } = req.body;

        if (!type || !notificationSettings) {
            return res.status(400).json({
                success: false,
                error: 'Notification type and settings are required'
            });
        }

        let userSettings = await Settings.findOne({ user_id: req.user._id });

        if (!userSettings) {
            userSettings = await Settings.createDefaultSettings(req.user._id);
        }

        await userSettings.updateNotifications(type, notificationSettings);

        res.json({
            success: true,
            message: 'Notification settings updated successfully',
            settings: userSettings
        });
    } catch (error) {
        console.error('Update notifications error:', error);

        if (error.message.includes('Invalid notification type')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error updating notification settings'
        });
    }
};

// @desc    Get system-wide settings statistics (Admin only)
// @route   GET /api/settings/stats
// @access  Private/Admin
const getSystemStats = async (req, res) => {
    try {
        const stats = await Settings.getSystemStats();

        res.json({
            success: true,
            systemStats: stats[0] || {
                totalUsers: 0,
                activeUsers: 0,
                themeStats: {},
                languageStats: {},
                notificationsEnabled: 0
            }
        });
    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving system statistics'
        });
    }
};

// @desc    Get default settings template
// @route   GET /api/settings/defaults
// @access  Public
const getDefaults = async (req, res) => {
    try {
        // Create a temporary settings object to get default values
        const defaultSettings = new Settings();
        const defaults = {};

        // Get default values from schema
        Object.keys(Settings.schema.paths).forEach(path => {
            const schemaPath = Settings.schema.paths[path];
            if (schemaPath.defaultValue !== undefined && schemaPath.defaultValue !== null) {
                const pathParts = path.split('.');
                if (pathParts.length === 1) {
                    defaults[path] = schemaPath.defaultValue;
                } else {
                    // Handle nested paths
                    let current = defaults;
                    for (let i = 0; i < pathParts.length - 1; i++) {
                        if (!current[pathParts[i]]) current[pathParts[i]] = {};
                        current = current[pathParts[i]];
                    }
                    current[pathParts[pathParts.length - 1]] = schemaPath.defaultValue;
                }
            }
        });

        res.json({
            success: true,
            defaults
        });
    } catch (error) {
        console.error('Get defaults error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error retrieving default settings'
        });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    resetSettings,
    updateNotifications,
    getSystemStats,
    getDefaults
};