#!/usr/bin/env tsx
/**
 * Script to update all edge functions to use new environment variable names
 * Replaces SUPABASE_URL/SUPABASE_ANON_KEY with createSupabaseClient()
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FUNCTIONS_DIR = path.join(__dirname, '..', 'supabase', 'functions')

interface UpdateResult {
  file: string
  updated: boolean
  error?: string
}

function updateFile(filePath: string): UpdateResult {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let updated = false

    // Check if file needs updating
    if (!content.includes('SUPABASE_URL') && !content.includes('SUPABASE_ANON_KEY')) {
      return { file: filePath, updated: false }
    }

    // Remove createClient import if it exists and is only used for this
    if (content.includes('import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"')) {
      // Check if createClient is used elsewhere
      const createClientMatches = content.match(/createClient/g) || []
      if (createClientMatches.length <= 1) {
        // Only used once, safe to remove
        content = content.replace(
          /import { createClient } from "https:\/\/esm.sh\/@supabase\/supabase-js@2\.39\.3";\n?/g,
          ''
        )
        updated = true
      }
    }

    // Update import from auth.ts to include createSupabaseClient
    if (content.includes('from "../../_shared/auth.ts"') || content.includes('from "../_shared/auth.ts"')) {
      const authImportMatch = content.match(/import {([^}]+)} from ["']\.\.\/_shared\/auth\.ts["'];?/g)
      if (authImportMatch) {
        authImportMatch.forEach(match => {
          if (!match.includes('createSupabaseClient')) {
            const newMatch = match.replace('} from', ', createSupabaseClient } from')
            content = content.replace(match, newMatch)
            updated = true
          }
        })
      }
    }

    // Replace the pattern: const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    if (content.includes('const supabaseUrl = Deno.env.get("SUPABASE_URL")!')) {
      content = content.replace(
        /const supabaseUrl = Deno\.env\.get\("SUPABASE_URL"\)!;\s*\n\s*const supabaseAnonKey = Deno\.env\.get\("SUPABASE_ANON_KEY"\)!;\s*\n\s*const supabase = createClient\(supabaseUrl, supabaseAnonKey\);/g,
        'const supabase = createSupabaseClient();'
      )
      updated = true
    }

    // Also handle cases where they might be on separate lines with different spacing
    content = content.replace(
      /const supabaseUrl\s*=\s*Deno\.env\.get\("SUPABASE_URL"\)!;[\s\n]*const supabaseAnonKey\s*=\s*Deno\.env\.get\("SUPABASE_ANON_KEY"\)!;[\s\n]*const supabase\s*=\s*createClient\(supabaseUrl,\s*supabaseAnonKey\);/g,
      'const supabase = createSupabaseClient();'
    )

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { file: filePath, updated: true }
    }

    return { file: filePath, updated: false }
  } catch (error) {
    return {
      file: filePath,
      updated: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function findIndexFiles(dir: string): string[] {
  const files: string[] = []
  
  function walkDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        // Skip _shared directory
        if (entry.name !== '_shared') {
          walkDir(fullPath)
        }
      } else if (entry.name === 'index.ts') {
        files.push(fullPath)
      }
    }
  }
  
  walkDir(dir)
  return files
}

async function main() {
  console.log('🔄 Updating edge functions to use new environment variable names...\n')
  
  const indexFiles = findIndexFiles(FUNCTIONS_DIR)
  console.log(`Found ${indexFiles.length} edge function files\n`)
  
  const results: UpdateResult[] = []
  
  for (const file of indexFiles) {
    const result = updateFile(file)
    results.push(result)
    
    if (result.updated) {
      console.log(`✅ Updated: ${path.relative(FUNCTIONS_DIR, file)}`)
    } else if (result.error) {
      console.log(`❌ Error: ${path.relative(FUNCTIONS_DIR, file)} - ${result.error}`)
    }
  }
  
  const updatedCount = results.filter(r => r.updated).length
  const errorCount = results.filter(r => r.error).length
  
  console.log(`\n📊 Summary:`)
  console.log(`   Updated: ${updatedCount}`)
  console.log(`   Skipped: ${results.length - updatedCount - errorCount}`)
  console.log(`   Errors: ${errorCount}`)
  
  if (updatedCount > 0) {
    console.log(`\n✅ Successfully updated ${updatedCount} edge function(s)!`)
  }
}

main().catch(console.error)

