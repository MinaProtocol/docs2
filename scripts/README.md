# Docker Image Validation Script

This script validates Docker images referenced in MDX documentation files to ensure they exist on their respective registries.

## Features

- **Automatic Discovery**: Scans all MDX files in the `docs/` directory
- **Multi-Registry Support**: Validates images on both Docker Hub and Google Container Registry (GCR)
- **Pattern Matching**: Detects various Docker image reference formats:
  - Direct image references: `minaprotocol/mina-daemon:3.1.0-ae112d3-bullseye-mainnet`
  - YAML image fields: `image: 'minaprotocol/...'`
  - Docker commands: `docker pull minaprotocol/...`
  - GCR images: `gcr.io/project/image:tag`
- **Detailed Reporting**: Shows which files reference each image and validation status
- **Location Tracking**: Tracks all locations where each image is used

## Usage

### Using npm script (recommended):

```bash
npm run validate-docker-images
```

### Direct execution:

```bash
node scripts/validate-docker-images.js
```

Or make it executable:

```bash
chmod +x scripts/validate-docker-images.js
./scripts/validate-docker-images.js
```

## Output

The script provides:

1. **Discovery Phase**: Lists all found Docker images and their locations
2. **Validation Phase**: Checks each image against its registry
3. **Summary**: Shows counts of valid, invalid, and error cases
4. **Detailed Report**: Lists invalid images with their locations

### Example Output:

```
🔍 Scanning MDX files for Docker images...

Found 364 MDX/MD files

Found 17 unique Docker images

================================================================================

📋 Docker Images Found:

• minaprotocol/mina-daemon:3.1.0-ae112d3-bullseye-mainnet
  Found in 23 file(s):
    - exchange-operators/rosetta/docker-compose.mdx
    - node-developers/sandbox-node.mdx
    - node-operators/generating-a-keypair.mdx
    ... and 20 more

================================================================================

🔍 Validating images...

Checking minaprotocol/mina-daemon:3.1.0-ae112d3-bullseye-mainnet... ✅ EXISTS

================================================================================

📊 SUMMARY:

Total images found: 17
✅ Valid images: 6
❌ Invalid images: 11
⚠️  Errors: 0
```

## Exit Codes

- **0**: All images validated successfully
- **1**: One or more images failed validation

## Supported Registries

### Docker Hub
- Public images from `minaprotocol/*` namespace
- Uses Docker Hub API v2: `https://hub.docker.com/v2/repositories`
- No authentication required for public images

### Google Container Registry (GCR)
- Images from `gcr.io/o1labs-192920/*`
- Uses Docker Registry HTTP API V2

## Limitations

1. **Rate Limiting**: The script includes a 100ms delay between requests to avoid rate limiting, but excessive runs may still hit API limits.

2. **Private Registries**: Only public Docker Hub and GCR registries are supported.

## Integration with CI/CD

You can add this script to your CI pipeline to catch broken image references:

```yaml
# GitHub Actions example
- name: Validate Docker Images
  run: npm run validate-docker-images
```

```yaml
# GitLab CI example
validate-docker-images:
  script:
    - npm run validate-docker-images
```

## Troubleshooting

### Timeout errors
- Check your internet connection
- Verify the registry URLs are accessible
- Consider increasing the timeout in the script (line 108)

### False positives
- Some registries may temporarily be unavailable
- Rate limiting may cause temporary failures
- Re-run the script to confirm persistent issues

## Contributing

To modify the script:

1. **Add new registries**: Update the validation functions in `validate-docker-images.js`
2. **Adjust patterns**: Modify `DOCKER_IMAGE_PATTERNS` array to match new formats
3. **Change timeout**: Adjust the timeout value in `httpsRequest()` function

## Related Documentation

- [Docker Hub API](https://docs.docker.com/docker-hub/api/latest/)
- [Docker Registry HTTP API V2](https://docs.docker.com/registry/spec/api/)
- [Google Container Registry](https://cloud.google.com/container-registry/docs)
