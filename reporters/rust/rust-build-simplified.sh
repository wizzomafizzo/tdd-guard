#!/usr/bin/env bash
# Build script for TDD Guard Rust Reporter

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Check for Rust
if ! command -v cargo &> /dev/null; then
    print_error "Cargo not found. Please install Rust: https://rustup.rs/"
    exit 1
fi
print_success "Rust toolchain found"

# Check Rust version
rust_version=$(rustc --version | cut -d' ' -f2)
if [ "$(printf '%s\n' "1.70.0" "$rust_version" | sort -V | head -n1)" = "1.70.0" ]; then
    print_success "Rust version $rust_version meets requirements"
else
    print_error "Rust version $rust_version is below 1.70.0"
    exit 1
fi

# Build
print_info "Building TDD Guard Rust Reporter..."
cargo build --release
print_success "Build completed"

# Test
print_info "Running tests..."
cargo test
print_success "Tests passed"

# Optional: Install
read -p "Install tdd-guard-rust? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cargo install --path .
    print_success "Installation complete"
    echo
    echo "Usage:"
    echo "  tdd-guard-rust --project-root /path/to/project"
else
    print_info "Skipped installation"
fi