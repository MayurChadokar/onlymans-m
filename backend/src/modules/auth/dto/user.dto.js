class UserDTO {
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.role = user.role;
    this.isVerified = user.isVerified;
    this.createdAt = user.createdAt;
  }
}

module.exports = UserDTO;
