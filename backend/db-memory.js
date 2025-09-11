// In-memory database for development
const { v4: uuidv4 } = require('uuid');

// In-memory storage
let users = [];
let accounts = [];

// User model
class User {
    constructor(userData) {
        this._id = uuidv4();
        this.username = userData.username;
        this.password = userData.password;
        this.firstName = userData.firstName;
        this.lastName = userData.lastName;
    }

    static async create(userData) {
        const user = new User(userData);
        users.push(user);
        return user;
    }

    static async findOne(query) {
        return users.find(user => {
            return Object.keys(query).every(key => user[key] === query[key]);
        });
    }

    static async find(query) {
        if (!query) return users;
        
        // Handle regex queries for search
        if (query.$or) {
            return users.filter(user => {
                return query.$or.some(condition => {
                    const key = Object.keys(condition)[0];
                    const regex = condition[key].$regex;
                    return user[key] && user[key].toLowerCase().includes(regex.toLowerCase());
                });
            });
        }
        
        return users.filter(user => {
            return Object.keys(query).every(key => user[key] === query[key]);
        });
    }

    static async findById(id) {
        return users.find(user => user._id === id);
    }

    static async updateOne(query, update) {
        const user = users.find(u => u._id === query.id);
        if (user) {
            Object.assign(user, update);
        }
        return user;
    }
}

// Account model
class Account {
    constructor(accountData) {
        this._id = uuidv4();
        this.userId = accountData.userId;
        this.balance = accountData.balance;
    }

    static async create(accountData) {
        const account = new Account(accountData);
        accounts.push(account);
        return account;
    }

    static async findOne(query) {
        return accounts.find(account => {
            return Object.keys(query).every(key => account[key] === query[key]);
        });
    }

    static async updateOne(query, update) {
        const account = accounts.find(a => a.userId === query.userId);
        if (account && update.$inc) {
            account.balance += update.$inc.balance;
        }
        return account;
    }
}

// Mock session for transactions
class MockSession {
    startTransaction() {
        // Mock implementation
    }
    
    async commitTransaction() {
        // Mock implementation
    }
    
    async abortTransaction() {
        // Mock implementation
    }
    
    endSession() {
        // Mock implementation
    }
}

const mongoose = {
    connect: () => Promise.resolve().then(() => console.log("Connected to in-memory database")),
    startSession: () => new MockSession(),
    Schema: class {
        constructor() {}
    }
};

module.exports = {
    User,
    Account,
    mongoose
};
