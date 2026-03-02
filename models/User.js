const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username là bắt buộc"],
        unique: true,
        trim: true,
        maxlength: [50, "Username không được vượt quá 50 ký tự"],
    },
    password_hash: {
        type: String,
        required: [true, "Mật khẩu là bắt buộc"],
    },
    full_name: {
        type: String,
        required: [true, "Họ và tên là bắt buộc"],
        trim: true,
        maxlength: [100, "Họ và tên không được vượt quá 100 ký tự"],
    },
    email: {
        type: String,
        required: [true, "Email là bắt buộc"],
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: [100, "Email không được vượt quá 100 ký tự"],
        match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    role: {
        type: String,
        required: [true, "Vai trò là bắt buộc"],
        enum: {
            values: ["SUPER_ADMIN", "WARD_ADMIN"],
            message: "Vai trò phải là SUPER_ADMIN hoặc WARD_ADMIN",
        },
    },
    ward_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdministrativeUnit",
        default: null, // NULL nếu SUPER_ADMIN
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    last_login: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
}, );

userSchema.index({
    role: 1
});
userSchema.index({
    ward_id: 1
});
userSchema.index({
    is_active: 1
});

userSchema.pre("validate", function() {
    if (this.role === "SUPER_ADMIN" && this.ward_id) {
        this.ward_id = null;
    }
});

userSchema.statics.findByEmailOrUsername = function(email, username) {
    return this.findOne({
        $or: [{
                email: (email || "").toLowerCase().trim()
            },
            {
                username: (username || "").trim()
            },
        ],
    });
};

module.exports = mongoose.model("User", userSchema);