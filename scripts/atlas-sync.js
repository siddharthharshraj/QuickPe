#!/usr/bin/env node

/**
 * QuickPe MongoDB Atlas Sync Script
 * Syncs local QuickPe database with MongoDB Atlas for production deployment
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCAL_URI = 'mongodb://localhost:27017/quickpe';
const ATLAS_URI = process.env.MONGODB_ATLAS_URI || 'mongodb+srv://quickpe-app:<password>@quickpe-cluster.xxxxx.mongodb.net/quickpe?retryWrites=true&w=majority';

// Collections to sync
const COLLECTIONS = [
    'users',
    'transactions', 
    'notifications',
    'auditlogs',
    'accounts',
    'featureflags',
    'addmoneylimits',
    'tradejournals',
    'tradejournallogs',
    'userscripts',
    'transactionscripts'
];

class AtlasSync {
    constructor() {
        this.localClient = null;
        this.atlasClient = null;
    }

    async connect() {
        console.log('🔗 Connecting to databases...');
        
        try {
            // Connect to local MongoDB
            this.localClient = new MongoClient(LOCAL_URI);
            await this.localClient.connect();
            console.log('✅ Connected to local MongoDB');

            // Connect to Atlas (if URI is provided)
            if (ATLAS_URI && !ATLAS_URI.includes('<password>')) {
                this.atlasClient = new MongoClient(ATLAS_URI);
                await this.atlasClient.connect();
                console.log('✅ Connected to MongoDB Atlas');
            } else {
                console.log('⚠️  Atlas URI not configured. Set MONGODB_ATLAS_URI environment variable.');
            }
        } catch (error) {
            console.error('❌ Connection failed:', error.message);
            throw error;
        }
    }

    async analyzeLocalData() {
        console.log('\n📊 Analyzing local QuickPe database...');
        
        const db = this.localClient.db('quickpe');
        const analysis = {
            totalCollections: 0,
            totalDocuments: 0,
            collections: {}
        };

        for (const collectionName of COLLECTIONS) {
            try {
                const collection = db.collection(collectionName);
                const count = await collection.countDocuments();
                
                if (count > 0) {
                    analysis.collections[collectionName] = {
                        documents: count,
                        sampleDoc: await collection.findOne({})
                    };
                    analysis.totalDocuments += count;
                    analysis.totalCollections++;
                    
                    console.log(`  📁 ${collectionName}: ${count} documents`);
                }
            } catch (error) {
                console.log(`  ⚠️  ${collectionName}: Collection not found`);
            }
        }

        console.log(`\n📈 Total: ${analysis.totalCollections} collections, ${analysis.totalDocuments} documents`);
        return analysis;
    }

    async exportToAtlas() {
        if (!this.atlasClient) {
            console.log('⚠️  Atlas connection not available. Skipping export.');
            return;
        }

        console.log('\n🚀 Syncing to MongoDB Atlas...');
        
        const localDb = this.localClient.db('quickpe');
        const atlasDb = this.atlasClient.db('quickpe');

        for (const collectionName of COLLECTIONS) {
            try {
                const localCollection = localDb.collection(collectionName);
                const atlasCollection = atlasDb.collection(collectionName);
                
                const localCount = await localCollection.countDocuments();
                if (localCount === 0) continue;

                console.log(`  📤 Syncing ${collectionName}...`);
                
                // Clear Atlas collection
                await atlasCollection.deleteMany({});
                
                // Export all documents
                const documents = await localCollection.find({}).toArray();
                if (documents.length > 0) {
                    await atlasCollection.insertMany(documents);
                    console.log(`    ✅ Synced ${documents.length} documents`);
                }
            } catch (error) {
                console.error(`    ❌ Failed to sync ${collectionName}:`, error.message);
            }
        }
    }

    async createBackup() {
        console.log('\n💾 Creating local backup...');
        
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `quickpe-backup-${timestamp}`);

        try {
            const { exec } = await import('child_process');
            const util = await import('util');
            const execPromise = util.promisify(exec);

            await execPromise(`mongodump --db quickpe --out "${backupPath}"`);
            console.log(`✅ Backup created: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error('❌ Backup failed:', error.message);
            throw error;
        }
    }

    async generateAtlasConfig() {
        console.log('\n⚙️  Generating Atlas configuration...');
        
        const config = {
            local: {
                uri: LOCAL_URI,
                database: 'quickpe'
            },
            atlas: {
                uri: ATLAS_URI,
                database: 'quickpe',
                cluster: 'quickpe-cluster',
                region: 'us-east-1' // Adjust as needed
            },
            collections: COLLECTIONS,
            syncOptions: {
                batchSize: 1000,
                retryWrites: true,
                writeConcern: { w: 'majority' }
            }
        };

        const configPath = path.join(__dirname, '../config/atlas-config.json');
        const configDir = path.dirname(configPath);
        
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`✅ Configuration saved: ${configPath}`);
        
        return config;
    }

    async disconnect() {
        if (this.localClient) {
            await this.localClient.close();
            console.log('🔌 Disconnected from local MongoDB');
        }
        
        if (this.atlasClient) {
            await this.atlasClient.close();
            console.log('🔌 Disconnected from MongoDB Atlas');
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 QuickPe MongoDB Atlas Sync Tool');
    console.log('=====================================\n');

    const sync = new AtlasSync();
    
    try {
        await sync.connect();
        
        // Analyze local data
        const analysis = await sync.analyzeLocalData();
        
        // Create backup
        await sync.createBackup();
        
        // Generate Atlas configuration
        await sync.generateAtlasConfig();
        
        // Sync to Atlas (if available)
        await sync.exportToAtlas();
        
        console.log('\n🎉 Sync process completed successfully!');
        console.log('\n📝 Next Steps:');
        console.log('1. Set up MongoDB Atlas cluster');
        console.log('2. Update MONGODB_ATLAS_URI environment variable');
        console.log('3. Run this script again to sync data');
        console.log('4. Update production .env with Atlas URI');
        
    } catch (error) {
        console.error('\n❌ Sync failed:', error.message);
        process.exit(1);
    } finally {
        await sync.disconnect();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { AtlasSync };
