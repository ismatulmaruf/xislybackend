import { Schema, model, mongoose } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
      minLength: [3, "Name must be at least 5 character"],
      maxLength: [20, "Name should be less than 20 character"],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      lowercase: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      required: [true],
      trim: true,
    },
    collage: {
      type: String,
      required: [true],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [4, "Password must be at least 4 character"],
      select: false,
    },
    subscribe: {
      type: [mongoose.Schema.Types.ObjectId], // Array of ObjectId references
      ref: "Exam", // Reference to the Exam model
      default: [], // Initialize as an empty array
    },
    avatar: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    role: {
      type: String,
      default: "USER",
      enum: ["USER", "ADMIN", "INSTRUCTOR"],
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    subscription: {
      id: String,
      status: String,
    },
    examResults: [
      {
        examId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exam",
          required: true,
        },
        score: { type: Number, required: true },
        incorrectAnswersCount: { type: Number },
        totalQuestions: { type: Number, required: true },
        percentage: { type: Number, required: true },
        submittedAnswers: { type: Map, of: String, required: true }, // Store answers with question ID as key
        dateSubmitted: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods = {
  generateJWTToken: function () {
    return jwt.sign(
      { id: this._id, email: this.email, role: this.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
  },

  generatePasswordResetToken: async function () {
    const resetToken = await crypto.randomBytes(20).toString("hex");

    this.forgotPasswordToken = await crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 min from now

    return resetToken;
  },
};

export default model("User", userSchema);
