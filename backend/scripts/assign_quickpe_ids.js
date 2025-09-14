import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../db.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * Generate a unique QuickPe ID in format QPK-XXXXXXXX
 */
function generateQuickPeId() {
    return 'QPK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Sanitize name for email generation
 */
function sanitizeName(name) {
    if (!name) return '';
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/(^\.|\.$)/g, '')
        .substring(0, 20); // Limit length
}

/**
 * Generate unique @quickpe.com email with collision handling
 */
async function generateUniqueEmail(baseName, userId) {
    const sanitized = sanitizeName(baseName);
    const baseEmail = sanitized ? `${sanitized}@quickpe.com` : `user${userId}@quickpe.com`;
    
    let email = baseEmail;
    let suffix = 0;
    
    while (true) {
        const existing = await User.findOne({ 
            email: email, 
            _id: { $ne: userId } 
        });
        
        if (!existing) break;
        
        suffix += 1;
        const namePart = sanitized || `user${userId}`;
        email = `${namePart}+${suffix}@quickpe.com`;
    }
    
    return email;
}

/**
 * Generate unique QuickPe ID with collision handling
 */
async function generateUniqueQuickPeId() {
    let quickpeId;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        quickpeId = generateQuickPeId();
        const existing = await User.findOne({ quickpeId });
        
        if (!existing) break;
        
        attempts++;
    }
    
    if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique QuickPe ID after maximum attempts');
    }
    
    return quickpeId;
}

/**
 * Main assignment function
 */
async function assignQuickPeIds(dryRun = false) {
    console.log(`🚀 Starting QuickPe ID assignment ${dryRun ? '(DRY RUN)' : '(LIVE RUN)'}`);
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Get all users
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users to process`);
        
        const results = [];
        let processed = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const user of users) {
            try {
                processed++;
                const userEmail = user.email || user.username;
                console.log(`Processing user ${processed}/${users.length}: ${userEmail}`);
                
                // Skip if user already has a QuickPe ID
                if (user.quickpeId) {
                    console.log(`⏭️  User ${userEmail} already has QuickPe ID: ${user.quickpeId}`);
                    results.push({
                        user_id: user._id.toString(),
                        old_email: userEmail,
                        new_email: userEmail,
                        quickpe_id: user.quickpeId,
                        status: 'skipped',
                        reason: 'already_has_quickpe_id'
                    });
                    skipped++;
                    continue;
                }
                
                // Skip if user already has @quickpe.com email
                if (userEmail && userEmail.endsWith('@quickpe.com')) {
                    console.log(`⏭️  User ${userEmail} already has @quickpe.com email`);
                    
                    // Generate QuickPe ID for existing @quickpe.com users
                    const quickpeId = await generateUniqueQuickPeId();
                    
                    if (!dryRun) {
                        await User.findByIdAndUpdate(user._id, {
                            quickpeId,
                            legacy_email: userEmail
                        });
                    }
                    
                    results.push({
                        user_id: user._id.toString(),
                        old_email: userEmail,
                        new_email: userEmail,
                        quickpe_id: quickpeId,
                        status: 'quickpe_id_added',
                        reason: 'existing_quickpe_email'
                    });
                    continue;
                }
                
                // Generate new QuickPe ID
                const quickpeId = await generateUniqueQuickPeId();
                
                // Generate new email based on user's name or current email
                const baseName = user.firstName || user.lastName || 
                    (userEmail ? userEmail.split('@')[0] : '') || `user${user._id}`;
                const newEmail = await generateUniqueEmail(baseName, user._id);
                
                // Store result
                const result = {
                    user_id: user._id.toString(),
                    old_email: userEmail,
                    new_email: newEmail,
                    quickpe_id: quickpeId,
                    status: 'success'
                };
                
                // Update user if not dry run
                if (!dryRun) {
                    await User.findByIdAndUpdate(user._id, {
                        legacy_email: userEmail,
                        username: newEmail,
                        quickpeId
                    });
                    console.log(`✅ Updated user: ${userEmail} -> ${newEmail} (${quickpeId})`);
                } else {
                    console.log(`🔍 Would update: ${userEmail} -> ${newEmail} (${quickpeId})`);
                }
                
                results.push(result);
                
            } catch (error) {
                console.error(`❌ Error processing user ${user.email}:`, error.message);
                errors++;
                
                results.push({
                    user_id: user._id.toString(),
                    old_email: user.email,
                    new_email: null,
                    quickpe_id: null,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        // Generate output
        const output = {
            generated_at: new Date().toISOString(),
            dry_run: dryRun,
            summary: {
                total_users: users.length,
                processed,
                skipped,
                errors,
                success: processed - skipped - errors
            },
            results
        };
        
        // Ensure artifacts directory exists
        const artifactsDir = path.join(__dirname, '../../artifacts');
        if (!fs.existsSync(artifactsDir)) {
            fs.mkdirSync(artifactsDir, { recursive: true });
        }
        
        // Write results to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `quickpe_assignment_results_${timestamp}.json`;
        const filepath = path.join(artifactsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
        
        console.log('\n📊 SUMMARY:');
        console.log(`Total users: ${users.length}`);
        console.log(`Processed: ${processed}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Errors: ${errors}`);
        console.log(`Success: ${processed - skipped - errors}`);
        console.log(`\n📄 Results written to: ${filepath}`);
        
        return output;
        
    } catch (error) {
        console.error('💥 Fatal error:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const dryRun = process.argv.includes('--dry-run');
    const help = process.argv.includes('--help') || process.argv.includes('-h');
    
    if (help) {
        console.log(`
QuickPe ID Assignment Script

Usage:
  node assign_quickpe_ids.js [options]

Options:
  --dry-run    Run in dry-run mode (no database changes)
  --help, -h   Show this help message

Examples:
  node assign_quickpe_ids.js --dry-run    # Test run
  node assign_quickpe_ids.js              # Live run
        `);
        process.exit(0);
    }
    
    assignQuickPeIds(dryRun)
        .then(() => {
            console.log('✅ Assignment completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Assignment failed:', error);
            process.exit(1);
        });
}

export { assignQuickPeIds };
