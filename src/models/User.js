const { supabase } = require('../config/supabase');
const bcrypt = require('bcrypt');
const validator = require('validator');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.password = userData.password;
    this.firstName = userData.first_name || userData.firstName;
    this.lastName = userData.last_name || userData.lastName;
    this.isEmailVerified = userData.is_email_verified ?? false;
    this.resetPasswordToken = userData.reset_password_token;
    this.resetPasswordExpires = userData.reset_password_expires;
    this.lastLogin = userData.last_login;
    this.isActive = userData.is_active ?? true;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  // Validation methods
  static validateEmail(email) {
    if (!email) throw new Error('Email is required');
    if (!validator.isEmail(email)) throw new Error('Please provide a valid email');
    return email.toLowerCase();
  }

  static validatePassword(password) {
    if (!password) throw new Error('Password is required');
    if (password.length < 8) throw new Error('Password must be at least 8 characters long');
    return password;
  }

  static validateName(name, fieldName) {
    if (!name) throw new Error(`${fieldName} is required`);
    if (name.length > 50) throw new Error(`${fieldName} cannot exceed 50 characters`);
    return name.trim();
  }

  // Static methods for database operations
  static async create(userData) {
    // Validate input
    const email = this.validateEmail(userData.email);
    const password = this.validatePassword(userData.password);
    const firstName = this.validateName(userData.firstName, 'First name');
    const lastName = this.validateName(userData.lastName, 'Last name');

    // Hash password (TO BE IMPLEMENTED)
    // const hashedPassword = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        password, // Will be: hashedPassword when implemented
        first_name: firstName,
        last_name: lastName,
        is_email_verified: false,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('User with this email already exists');
      }
      throw error;
    }

    return new User(data);
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return new User(data);
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return new User(data);
  }

  // Instance methods
  async save() {
    const updateData = {
      email: this.email,
      first_name: this.firstName,
      last_name: this.lastName,
      is_email_verified: this.isEmailVerified,
      reset_password_token: this.resetPasswordToken,
      reset_password_expires: this.resetPasswordExpires,
      last_login: this.lastLogin,
      is_active: this.isActive
    };

    if (this.password) {
      updateData.password = this.password;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', this.id)
      .select()
      .single();

    if (error) throw error;

    return new User(data);
  }

  // Compare password method (TO BE IMPLEMENTED)
  async comparePassword(candidatePassword) {
    // return bcrypt.compare(candidatePassword, this.password);
    // For now, just compare directly (INSECURE - implement bcrypt)
    return candidatePassword === this.password;
  }

  // Virtual getter for full name
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Convert to JSON (exclude sensitive fields)
  toJSON() {
    const obj = { ...this };
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
  }
}

module.exports = User;
