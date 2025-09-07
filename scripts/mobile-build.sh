#!/bin/bash

# Script to handle mobile builds by temporarily moving API routes

if [ "$1" = "pre" ]; then
    echo "Preparing for mobile build - moving API routes..."
    if [ -d "app/api" ]; then
        mv app/api /tmp/api_backup_printmate
        echo "API routes moved to backup"
    fi
elif [ "$1" = "post" ]; then
    echo "Restoring API routes after mobile build..."
    if [ -d "/tmp/api_backup_printmate" ]; then
        mv /tmp/api_backup_printmate app/api
        echo "API routes restored"
    fi
else
    echo "Usage: $0 [pre|post]"
    exit 1
fi