#!/bin/bash

# Build Rust to WASM
wasm-pack build --target web --out-name wasm --out-dir ./docs/pkg

