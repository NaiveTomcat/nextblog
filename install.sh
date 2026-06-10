#!/bin/bash

set -xe

unset YARN_ENABLE_INTERACTIVE

# Install dependencies
yarn set version stable
yarn install
