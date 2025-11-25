// Simple in-memory store for NovaStake demo backend

const users = [];
const wallets = [];
const stakes = [];
const transactions = [];
const verificationCodes = new Map();

module.exports = {
  users,
  wallets,
  stakes,
  transactions,
  verificationCodes,
};
