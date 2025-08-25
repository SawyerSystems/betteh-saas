#!/bin/bash

# Script to ensure the 'media' bucket exists in Supabase storage

# This requires the Supabase CLI to be installed and authenticated
# You can run this manually after setting up the Supabase CLI

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI is not installed. Please install it first."
  echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
  exit 1
fi

# Create the media bucket if it doesn't exist
echo "Creating 'media' bucket in Supabase storage..."
supabase storage create bucket media --public

# Set CORS policies for the bucket
echo "Setting CORS policies for the media bucket..."
supabase storage update bucket media --cors-allowed-origins "*" --cors-allowed-methods "GET,POST,PUT,DELETE,OPTIONS" --cors-allowed-headers "*"

echo "Media bucket setup completed."
