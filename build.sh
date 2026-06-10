#!/bin/bash

set -xe

unset YARN_ENABLE_INTERACTIVE

# Build the project
yarn docs:build