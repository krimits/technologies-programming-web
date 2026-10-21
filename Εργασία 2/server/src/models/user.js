import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    // select: false -> το password δεν επιστρέφεται ποτέ από ένα query
    // (όπως το δείχνει το populate/lean). Για το login το ζητάμε ρητά.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['Admin', 'User'], default: 'User' },
    registrationDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

/** Το αντικείμενο που στέλνεται στον client (χωρίς κωδικό). */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  const { _id, firstName, lastName, email, role, registrationDate, createdAt } = this.toObject();
  return {
    id: String(_id),
    firstName,
    lastName,
    email,
    role,
    registrationDate,
    createdAt
  };
};

export const User = mongoose.model('User', userSchema);
