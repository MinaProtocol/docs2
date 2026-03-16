#!/usr/bin/env node

/**
 * Script to validate Docker images referenced in MDX files
 * Checks if images exist on Docker Hub (minaprotocol) and GCR (gcr.io)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const DOCKER_HUB_API = 'https://hub.docker.com/v2/repositories';
const GCR_API = 'https://gcr.io/v2';

// Regular expressions to find Docker images
const DOCKER_IMAGE_PATTERNS = [
  // Matches: gcr.io/project/image-name:tag (must be first to capture full path)
  /gcr\.io\/[a-z0-9-_.]+\/[a-z0-9-_.]+:[a-z0-9-_.]+/gi,
  // Matches: minaprotocol/image-name:tag
  /minaprotocol\/[a-z0-9-_.]+:[a-z0-9-_.]+/gi,
  // Matches: image: 'something/...' or image: "something/..."
  /image:\s*['"]([^'"]+)['"]/gi,
];

// Store found images
const dockerImages = new Set();
const imageLocations = new Map(); // Track where each image was found

/**
 * Recursively find all MDX files in a directory
 */
function findMdxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (item !== 'node_modules' && !item.startsWith('.')) {
        files.push(...findMdxFiles(fullPath));
      }
    } else if (item.endsWith('.mdx') || item.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check if image reference contains template placeholders or is malformed
 */
function hasTemplatePlaceholders(imageRef) {
  // Check for common placeholder patterns: {var}, <var>, $var, ${var}, [var]
  if (/[{<$\[]/.test(imageRef)) {
    return true;
  }

  // Check for trailing dashes or incomplete tags (e.g., "image:tag-")
  if (/:.*-$/.test(imageRef)) {
    return true;
  }

  return false;
}

/**
 * Extract Docker images from file content
 */
function extractDockerImages(filePath, content) {
  const relPath = path.relative(DOCS_DIR, filePath);

  DOCKER_IMAGE_PATTERNS.forEach(pattern => {
    const matches = content.matchAll(pattern);

    for (const match of matches) {
      let imageRef = null;

      // Handle different pattern match groups
      if (match[0].includes('image:')) {
        // Extract from YAML-like syntax (has capture group)
        imageRef = match[1];
      } else {
        // Direct match - full image reference
        imageRef = match[0];
      }

      if (imageRef) {
        // Skip images with template placeholders
        if (hasTemplatePlaceholders(imageRef)) {
          continue;
        }

        dockerImages.add(imageRef);

        if (!imageLocations.has(imageRef)) {
          imageLocations.set(imageRef, []);
        }
        imageLocations.get(imageRef).push(relPath);
      }
    }
  });
}

/**
 * Make HTTPS request
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Check if Docker Hub image exists
 */
async function checkDockerHubImage(imageName, tag) {
  try {
    const url = `${DOCKER_HUB_API}/${imageName}/tags/${tag}`;
    const response = await httpsRequest(url);

    return {
      exists: response.statusCode === 200,
      statusCode: response.statusCode,
      registry: 'Docker Hub'
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
      registry: 'Docker Hub'
    };
  }
}

/**
 * Check if GCR image exists using manifest API
 */
async function checkGcrImage(imagePath, tag) {
  try {
    // GCR uses Docker Registry HTTP API V2
    const url = `${GCR_API}/${imagePath}/manifests/${tag}`;
    const response = await httpsRequest(url, {
      headers: {
        'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
      }
    });

    return {
      exists: response.statusCode === 200 || response.statusCode === 307,
      statusCode: response.statusCode,
      registry: 'GCR'
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
      registry: 'GCR'
    };
  }
}

/**
 * Parse image reference into components
 */
function parseImageRef(imageRef) {
  // Remove quotes if present
  imageRef = imageRef.replace(/['"]/g, '');

  if (imageRef.startsWith('gcr.io/')) {
    // GCR image: gcr.io/project/image:tag
    const parts = imageRef.replace('gcr.io/', '').split(':');
    return {
      type: 'gcr',
      imagePath: parts[0],
      tag: parts[1] || 'latest'
    };
  } else if (imageRef.includes('/')) {
    // Docker Hub with namespace: namespace/image:tag
    const parts = imageRef.split(':');
    const imageName = parts[0];
    const tag = parts[1] || 'latest';

    return {
      type: 'dockerhub',
      imageName,
      tag
    };
  } else {
    // Official Docker Hub image: image:tag
    const parts = imageRef.split(':');
    return {
      type: 'dockerhub',
      imageName: `library/${parts[0]}`,
      tag: parts[1] || 'latest'
    };
  }
}

/**
 * Validate a Docker image
 */
async function validateImage(imageRef) {
  const parsed = parseImageRef(imageRef);

  if (parsed.type === 'gcr') {
    return await checkGcrImage(parsed.imagePath, parsed.tag);
  } else {
    return await checkDockerHubImage(parsed.imageName, parsed.tag);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning MDX files for Docker images...\n');

  // Find all MDX files
  const mdxFiles = findMdxFiles(DOCS_DIR);
  console.log(`Found ${mdxFiles.length} MDX/MD files\n`);

  // Extract Docker images from files
  for (const file of mdxFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    extractDockerImages(file, content);
  }

  console.log(`Found ${dockerImages.size} unique Docker images\n`);
  console.log('=' .repeat(80));
  console.log('\n📋 Docker Images Found:\n');

  // Display all found images
  const sortedImages = Array.from(dockerImages).sort();
  sortedImages.forEach(image => {
    const locations = imageLocations.get(image);
    console.log(`\n• ${image}`);
    console.log(`  Found in ${locations.length} file(s):`);
    locations.slice(0, 3).forEach(loc => console.log(`    - ${loc}`));
    if (locations.length > 3) {
      console.log(`    ... and ${locations.length - 3} more`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 Validating images...\n');

  // Validate images
  const results = [];
  let validCount = 0;
  let invalidCount = 0;
  let errorCount = 0;

  for (const imageRef of sortedImages) {
    process.stdout.write(`Checking ${imageRef}... `);

    const result = await validateImage(imageRef);
    results.push({ imageRef, ...result });

    if (result.exists) {
      console.log('✅ EXISTS');
      validCount++;
    } else if (result.error) {
      console.log(`⚠️  ERROR: ${result.error}`);
      errorCount++;
    } else {
      console.log(`❌ NOT FOUND (${result.statusCode})`);
      invalidCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log(`Total images found: ${dockerImages.size}`);
  console.log(`✅ Valid images: ${validCount}`);
  console.log(`❌ Invalid images: ${invalidCount}`);
  console.log(`⚠️  Errors: ${errorCount}`);

  // List invalid images with locations
  if (invalidCount > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\n❌ INVALID IMAGES:\n');

    results
      .filter(r => !r.exists && !r.error)
      .forEach(({ imageRef }) => {
        console.log(`\n${imageRef}`);
        console.log(`  Registry: ${results.find(r => r.imageRef === imageRef).registry}`);
        console.log(`  Found in:`);
        imageLocations.get(imageRef).forEach(loc => {
          console.log(`    - ${loc}`);
        });
      });
  }

  // List images with errors (timeouts, network issues, etc.)
  if (errorCount > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️  IMAGES WITH VALIDATION ERRORS:\n');
    console.log('These images could not be validated due to network or API issues.');
    console.log('They may still exist, but verification failed.\n');

    results
      .filter(r => r.error)
      .forEach(({ imageRef, error, registry }) => {
        console.log(`\n${imageRef}`);
        console.log(`  Registry: ${registry}`);
        console.log(`  Error: ${error}`);
        console.log(`  Found in:`);
        imageLocations.get(imageRef).forEach(loc => {
          console.log(`    - ${loc}`);
        });
      });
  }

  // Exit with error code if invalid images found
  if (invalidCount > 0) {
    console.log('\n⚠️  Some images could not be validated!');
    process.exit(1);
  } else if (errorCount > 0) {
    console.log('\n⚠️  All images appear valid, but some had validation errors.');
    console.log('Please check the images with errors manually.');
    process.exit(0);
  } else {
    console.log('\n✅ All images validated successfully!');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { findMdxFiles, extractDockerImages, validateImage };
