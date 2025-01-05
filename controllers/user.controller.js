import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import AppError from "../utils/error.utils.js";
// import sendEmail from "../utils/sendEmail.js";

const cookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  secure: true,
  sameSite: "none",
};

// Register
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, collage } = req.body;

    // Check if user misses any fields
    if (!fullName || !email || !password || !phone || !collage) {
      return next(new AppError("All fields are required", 400));
    }

    // Check if the user already exists
    const userExist = await userModel.findOne({ email });
    if (userExist) {
      return next(new AppError("Email already exists, please login", 400));
    }

    // Save user in the database and log the user in
    const user = await userModel.create({
      fullName,
      email,
      password,
      phone,
      collage,
    });

    if (!user) {
      return next(
        new AppError("User registration failed, please try again", 400)
      );
    }

    await user.save();

    user.password = undefined;

    const token = await user.generateJWTToken();

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // check if user miss any field
    if (!email || !password) {
      return next(new AppError("All fields are required", 400));
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return next(new AppError("Email or Password does not match", 400));
    }

    const token = await user.generateJWTToken();

    user.password = undefined;

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "User loggedin successfully",
      user,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// logout
const logout = async (req, res, next) => {
  try {
    res.cookie("token", null, {
      secure: true,
      maxAge: 0,
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "User loggedout successfully",
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// getProfile
const getProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await userModel.findById(id);

    res.status(200).json({
      success: true,
      message: "User details",
      user,
    });
  } catch (e) {
    return next(new AppError("Failed to fetch user profile", 500));
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userModel.find({}).select("-examResults"); // Exclude examResults field

    res.status(200).json({
      success: true,
      message: "All users",
      users,
    });
  } catch (e) {
    return next(new AppError("Failed to fetch users", 500));
  }
};

const getAllUserswithResult = async (req, res, next) => {
  try {
    const users = await userModel.find({}); // Exclude examResults field

    res.status(200).json({
      success: true,
      message: "All users",
      users,
    });
  } catch (e) {
    return next(new AppError("Failed to fetch users", 500));
  }
};

const addSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { courseId } = req.body;

    const user = await userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { subscribe: courseId } },
        { new: true }
      )
      .select("-examResults"); // Exclude the examResults field

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Subscription added successfully",
      user,
    });
  } catch (e) {
    return next(new AppError("Failed to add subscription", 500));
  }
};

const removeSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params; // User ID from the logged-in user
    const { courseId } = req.body; // Course ID to remove from the subscribe array

    if (!courseId) {
      return next(new AppError("Course ID is required", 400));
    }

    const user = await userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { subscribe: courseId } }, // Remove courseId from the subscribe array
        { new: true }
      )
      .select("-examResults"); // Exclude the examResults field

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Subscription removed successfully",
    });
  } catch (e) {
    return next(new AppError("Failed to remove subscription", 500));
  }
};

// forgot password
// const forgotPassword = async (req, res, next) => {
//   const { email } = req.body;
//   // check if user does'nt pass email
//   if (!email) {
//     return next(new AppError("Email is required", 400));
//   }

//   const user = await userModel.findOne({ email });
//   // check if user not registered with the email
//   if (!user) {
//     return next(new AppError("Email not registered", 400));
//   }

//   const resetToken = await user.generatePasswordResetToken();

//   await user.save();

//   const resetPasswordURL = `${process.env.CLIENT_URL}/user/profile/reset-password/${resetToken}`;

//   const subject = "Reset Password";
//   const message = `You can reset your password by clicking ${resetPasswordURL} Reset your password</$>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.\n If you have not requested this, kindly ignore.`;

//   try {
//     await sendEmail(email, subject, message);

//     res.status(200).json({
//       success: true,
//       message: `Reset password token has been sent to ${email}`,
//     });
//   } catch (e) {
//     user.forgotPasswordExpiry = undefined;
//     user.forgotPasswordToken = undefined;
//     await user.save();
//     return next(new AppError(e.message, 500));
//   }
// };

// reset password
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;

    const { password } = req.body;

    const forgotPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await userModel.findOne({
      forgotPasswordToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new AppError("Token is invalid or expired, please try again", 400)
      );
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// change password
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!oldPassword || !newPassword) {
      return next(new AppError("All fields are requared", 400));
    }

    const user = await userModel.findById(id).select("+password");

    if (!user) {
      return next(new AppError("User does not exist", 400));
    }

    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return next(new AppError("Invalid Old Password", 400));
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// update profile
const updateUser = async (req, res, next) => {
  try {
    const { fullName, collage, phone } = req.body;
    const { id } = req.user;

    // console.log(fullName);

    const user = await userModel.findById(id);

    if (!user) {
      return next(new AppError("user does not exist", 400));
    }

    if (fullName) {
      user.fullName = fullName;
    }
    if (phone) {
      user.phone = phone;
    }
    if (collage) {
      user.collage = collage;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User update successfully",
      user,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const makeAdorIN = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["USER", "ADMIN", "INSTRUCTOR"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  try {
    const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      message: "Role updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteUserAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Delete the user
    await userModel.findByIdAndDelete(userId);

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  register,
  login,
  logout,
  getProfile,
  // forgotPassword,
  resetPassword,
  changePassword,
  updateUser,
  getAllUsers,
  addSubscription,
  removeSubscription,
  makeAdorIN,
  deleteUserAdmin,
  getAllUserswithResult,
};
