const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      default: '// Welcome to CollabCode!\n// Start typing to collaborate in real-time.\n\nconsole.log("Hello, World!");\n',
    },
    language: {
      type: String,
      default: 'javascript',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', RoomSchema);
