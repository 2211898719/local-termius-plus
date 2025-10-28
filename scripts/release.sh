#!/bin/bash

# Release script for local-termius-plus
# This script reads version from package.json and creates a git tag

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting release process...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    exit 1
fi

# Extract version from package.json
VERSION=$(node -p "require('./package.json').version")

if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Error: Could not read version from package.json${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Current version: ${VERSION}${NC}"

# Check if tag already exists
TAG_NAME="v${VERSION}"
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Tag $TAG_NAME already exists${NC}"
    echo -e "${YELLOW}💡 To update the tag, delete it first: git tag -d $TAG_NAME && git push origin :refs/tags/$TAG_NAME${NC}"
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Error: You have uncommitted changes${NC}"
    echo -e "${YELLOW}💡 Please commit or stash your changes before releasing${NC}"
    git status --short
    exit 1
fi

# Check if we're on main/master branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo -e "${YELLOW}⚠️  Warning: You're not on main/master branch (current: $CURRENT_BRANCH)${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Release cancelled${NC}"
        exit 1
    fi
fi

# Confirm release
echo -e "${YELLOW}📋 Release Summary:${NC}"
echo -e "  Version: ${VERSION}"
echo -e "  Tag: ${TAG_NAME}"
echo -e "  Branch: ${CURRENT_BRANCH}"
echo

read -p "Create release tag and push to origin? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Release cancelled${NC}"
    exit 1
fi

# Create and push tag
echo -e "${GREEN}🏷️  Creating tag $TAG_NAME...${NC}"
git tag -a "$TAG_NAME" -m "Release $TAG_NAME"

echo -e "${GREEN}📤 Pushing tag to origin...${NC}"
git push origin "$TAG_NAME"

echo -e "${GREEN}✅ Release $TAG_NAME created and pushed successfully!${NC}"
echo -e "${YELLOW}🎉 GitHub Actions will now build and publish the release${NC}"
echo -e "${YELLOW}📱 Check the Actions tab in your GitHub repository${NC}"

# Optional: Show recent commits for release notes
echo
echo -e "${YELLOW}📝 Recent commits (for release notes):${NC}"
git log --oneline -10
